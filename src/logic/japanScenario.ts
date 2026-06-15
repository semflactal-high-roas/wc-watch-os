import type { AppData, Match, StandingRow, Team } from '../types';
import { isFinishedMatchForDisplay } from './matchDisplayStatus';

type GroupStanding = {
  groupId: string;
  rows: StandingRow[];
};

export type JapanScenarioSummary = {
  teamId: string;
  teamName: string;
  groupId: string;
  rank: number | null;
  points: number | null;
  goalDiff: number | null;
  remainingMatches: number;
  nextMatch: Match | null;
  nextOpponentName: string | null;
  rivals: Team[];
  messages: string[];
  watchGroupMatches: Match[];
};

const japanTeamId = 'JPN';
const japanGroupId = 'F';

const matchIncludesTeam = (match: Match, teamId: string): boolean => {
  return match.homeTeamId === teamId || match.awayTeamId === teamId;
};

const sortByKickoff = <T extends Pick<Match, 'date' | 'kickoffTimeJST' | 'id'>>(matches: T[]): T[] => {
  return [...matches].sort(
    (a, b) => a.date.localeCompare(b.date) || a.kickoffTimeJST.localeCompare(b.kickoffTimeJST) || a.id.localeCompare(b.id),
  );
};

const teamName = (teams: Team[], teamId: string): string => {
  return teams.find((team) => team.id === teamId)?.name ?? teamId;
};

export const getNextJapanMatch = (matches: Match[]): Match | null => {
  return sortByKickoff(matches.filter((match) => !isFinishedMatchForDisplay(match) && matchIncludesTeam(match, japanTeamId)))[0] ?? null;
};

export const getJapanGroupRivals = (teams: Team[]): Team[] => {
  return teams.filter((team) => team.group === japanGroupId && team.id !== japanTeamId);
};

export const getJapanScenarioMessages = (
  japanStanding: StandingRow | null,
  remainingMatches: number,
  nextMatch: Match | null,
): string[] => {
  const messages: string[] = [];

  if (remainingMatches === 0) {
    messages.push('グループ全日程を消化済みです。突破判定は順位表と3位通過ラインを確認してください。');
  } else if (remainingMatches === 3) {
    messages.push('まだ全試合が残っています。初戦の結果がグループ突破の難易度を大きく左右します。');
  }

  if (japanStanding) {
    if (japanStanding.points > 0 && remainingMatches > 0) {
      messages.push('勝点を積み上げられています。次戦でさらに勝点を取れれば、2位以内通過に近づきます。');
    }

    if (japanStanding.points === 0 && remainingMatches < 3 && remainingMatches > 0) {
      messages.push('勝点の積み上げが必要です。次戦で勝点3を取れるかが重要です。');
    }
  }

  if (nextMatch) {
    messages.push('次戦は勝てば勝点3、引き分けなら勝点1、敗戦なら他会場依存が強まります。');
  }

  return messages.length > 0 ? messages : ['現在の順位と同組の試合結果を見ながら、突破の見通しを確認してください。'];
};

export const getJapanScenarioSummary = (
  data: AppData,
  standings: GroupStanding[],
  matches: Match[] = data.matches,
): JapanScenarioSummary => {
  const japanTeam = data.teams.find((team) => team.id === japanTeamId);
  const group = data.groups.find((candidate) => candidate.id === japanGroupId || candidate.teamIds.includes(japanTeamId));
  const groupId = group?.id ?? japanGroupId;
  const groupTeamIds = group?.teamIds ?? [japanTeamId];
  const groupStanding = standings.find((candidate) => candidate.groupId === groupId);
  const rankIndex = groupStanding?.rows.findIndex((row) => row.teamId === japanTeamId) ?? -1;
  const japanStanding = rankIndex >= 0 ? groupStanding?.rows[rankIndex] ?? null : null;
  const groupMatches = matches.filter((match) => match.groupId === groupId || (groupTeamIds.includes(match.homeTeamId) && groupTeamIds.includes(match.awayTeamId)));
  const remainingMatches = groupMatches.filter((match) => !isFinishedMatchForDisplay(match) && matchIncludesTeam(match, japanTeamId)).length;
  const nextMatch = getNextJapanMatch(groupMatches);
  const nextOpponentId = nextMatch
    ? nextMatch.homeTeamId === japanTeamId
      ? nextMatch.awayTeamId
      : nextMatch.homeTeamId
    : null;
  const nextOpponentName = nextOpponentId ? teamName(data.teams, nextOpponentId) : null;
  const baseMessages = getJapanScenarioMessages(japanStanding, remainingMatches, nextMatch);
  const rankMessages = japanStanding
    ? rankIndex + 1 <= 2
      ? ['現在は自力突破圏内です。次戦で勝点を積めれば、2位以内通過に近づきます。']
      : rankIndex + 1 === 3
        ? ['現在は3位通過ラインも意識する位置です。同組の他試合と3位ランキングの両方が重要になります。']
        : ['現在は苦しい位置です。次戦で勝点3を取れるかが重要です。']
    : [];
  const nextMatchMessages = nextMatch && nextOpponentName
    ? [`次戦は ${nextOpponentName} 戦です。勝てば勝点3、引き分けなら勝点1、敗戦なら他会場依存が強まります。`]
    : [];
  const watchGroupMatches = sortByKickoff(
    groupMatches.filter((match) => !isFinishedMatchForDisplay(match) && !matchIncludesTeam(match, japanTeamId)),
  );

  return {
    teamId: japanTeamId,
    teamName: japanTeam?.name ?? 'Japan',
    groupId,
    rank: rankIndex >= 0 ? rankIndex + 1 : null,
    points: japanStanding?.points ?? null,
    goalDiff: japanStanding?.goalDiff ?? null,
    remainingMatches,
    nextMatch,
    nextOpponentName,
    rivals: getJapanGroupRivals(data.teams),
    messages: [...new Set([...baseMessages, ...rankMessages, ...nextMatchMessages])],
    watchGroupMatches,
  };
};
