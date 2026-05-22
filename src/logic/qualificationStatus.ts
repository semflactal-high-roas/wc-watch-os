import type {
  Group,
  Match,
  QualificationStatus,
  QualificationSummary,
  StandingRow,
  Team,
  TeamGroupContext,
} from '../types';

type GroupStanding = {
  groupId: string;
  rows: StandingRow[];
};

const statusLabels: Record<QualificationStatus, string> = {
  safe: '突破圏内',
  borderline: 'ボーダー付近',
  danger: '敗退危険',
  eliminated: '敗退濃厚',
  qualified: '突破確定相当',
  unknown: '判定保留',
};

const matchIncludesTeam = (match: Match, teamId: string): boolean => {
  return match.homeTeamId === teamId || match.awayTeamId === teamId;
};

export const getTeamGroupContext = (
  teamId: string,
  groups: Group[],
  standings: GroupStanding[],
  matches: Match[],
): TeamGroupContext | null => {
  const group = groups.find((candidate) => candidate.teamIds.includes(teamId));
  if (!group) return null;

  const groupStanding = standings.find((candidate) => candidate.groupId === group.id);
  const groupRankIndex = groupStanding?.rows.findIndex((row) => row.teamId === teamId) ?? -1;
  const standing = groupRankIndex >= 0 ? groupStanding?.rows[groupRankIndex] ?? null : null;
  const groupMatches = matches.filter(
    (match) => group.teamIds.includes(match.homeTeamId) && group.teamIds.includes(match.awayTeamId),
  );
  const remainingMatches = groupMatches.filter((match) => !match.played && matchIncludesTeam(match, teamId)).length;
  const groupMatchesRemaining = groupMatches.filter((match) => !match.played).length;

  return {
    groupId: group.id,
    groupRank: groupRankIndex >= 0 ? groupRankIndex + 1 : null,
    standing,
    remainingMatches,
    groupMatchesRemaining,
  };
};

const getThirdPlaceRank = (teamId: string, thirdPlaceRanking: StandingRow[]): number | null => {
  const index = thirdPlaceRanking.findIndex((row) => row.teamId === teamId);
  return index >= 0 ? index + 1 : null;
};

const buildSummary = (
  context: TeamGroupContext,
  status: QualificationStatus,
  thirdPlaceRank: number | null,
): string => {
  const rankText = context.groupRank ? `現在${context.groupRank}位。` : '現在順位は判定保留。';
  const remainingText = context.remainingMatches === 0 ? '全試合消化済み。' : `残り${context.remainingMatches}試合。`;

  if (status === 'qualified') {
    return `${rankText}${remainingText}MVP判定では突破圏内にかなり近い状況です。`;
  }

  if (status === 'safe') {
    return `${rankText}${remainingText}自力突破圏内ですが、残り試合次第で変動します。`;
  }

  if (status === 'borderline') {
    const thirdText = thirdPlaceRank ? `3位ランキング${thirdPlaceRank}位。` : '';
    return `${rankText}${thirdText}${remainingText}3位通過ライン付近のため、他グループ結果待ちです。`;
  }

  if (status === 'danger') {
    return `${rankText}${remainingText}勝点の積み上げが必要です。`;
  }

  if (status === 'eliminated') {
    return `${rankText}${remainingText}現時点では通過圏外です。`;
  }

  return `${rankText}${remainingText}判定に必要な情報がまだ不足しています。`;
};

export const calculateQualificationStatus = (
  teamId: string,
  groups: Group[],
  standings: GroupStanding[],
  matches: Match[],
  thirdPlaceRanking: StandingRow[],
): QualificationStatus => {
  const context = getTeamGroupContext(teamId, groups, standings, matches);
  if (!context || !context.standing || !context.groupRank) return 'unknown';

  const thirdPlaceRank = getThirdPlaceRank(teamId, thirdPlaceRanking);
  const allTeamMatchesComplete = context.remainingMatches === 0;
  const allGroupMatchesComplete = context.groupMatchesRemaining === 0;

  if (context.groupRank <= 2) {
    return allGroupMatchesComplete ? 'qualified' : 'safe';
  }

  if (context.groupRank === 3) {
    if (thirdPlaceRank !== null && thirdPlaceRank <= 8) {
      return allGroupMatchesComplete ? 'qualified' : 'safe';
    }

    if (thirdPlaceRank !== null && thirdPlaceRank <= 10) {
      return allTeamMatchesComplete ? 'eliminated' : 'borderline';
    }

    return allTeamMatchesComplete ? 'eliminated' : 'borderline';
  }

  if (context.groupRank >= 4) {
    return allTeamMatchesComplete ? 'eliminated' : 'danger';
  }

  return 'unknown';
};

export const getQualificationSummary = (
  teamId: string,
  teams: Team[],
  groups: Group[],
  standings: GroupStanding[],
  matches: Match[],
  thirdPlaceRanking: StandingRow[],
): QualificationSummary => {
  const team = teams.find((candidate) => candidate.id === teamId);
  const context = getTeamGroupContext(teamId, groups, standings, matches);
  const status = calculateQualificationStatus(teamId, groups, standings, matches, thirdPlaceRanking);
  const thirdPlaceRank = getThirdPlaceRank(teamId, thirdPlaceRanking);

  return {
    teamId,
    teamName: team?.name ?? teamId,
    status,
    statusLabel: statusLabels[status],
    summary: context
      ? buildSummary(context, status, thirdPlaceRank)
      : 'グループ情報が見つからないため、判定を保留しています。',
    context,
    thirdPlaceRank,
  };
};
