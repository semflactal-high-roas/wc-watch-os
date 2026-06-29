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
    messages.push('グループ全日程を消化済みです。決勝トーナメント表で次戦を確認できます。');
  } else if (remainingMatches === 3) {
    messages.push('グループステージの未消化試合があります。結果更新後に大会記録へ反映されます。');
  }

  if (japanStanding) {
    if (japanStanding.points > 0 && remainingMatches > 0) {
      messages.push('グループステージの結果は記録として確認できます。');
    }

    if (japanStanding.points === 0 && remainingMatches < 3 && remainingMatches > 0) {
      messages.push('未反映のグループステージ結果は、手動更新後に記録へ反映されます。');
    }
  }

  if (nextMatch) {
    messages.push('次戦の結果はグループステージ記録として反映されます。');
  }

  return messages.length > 0 ? messages : ['グループステージの結果と決勝トーナメント表を確認してください。'];
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
      ? [`Group ${groupId} ${rankIndex + 1}位として記録されています。`]
      : rankIndex + 1 === 3
        ? [`Group ${groupId} ${rankIndex + 1}位として記録されています。`]
        : [`Group ${groupId} ${rankIndex + 1}位として記録されています。`]
    : [];
  const nextMatchMessages = nextMatch && nextOpponentName
    ? [`次戦は ${nextOpponentName} 戦です。結果更新後に大会記録へ反映されます。`]
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
