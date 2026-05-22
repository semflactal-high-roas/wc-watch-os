import type { StandingRow, Team } from '../types';

export type ThirdPlaceStatus = 'advance' | 'borderline' | 'outside' | 'not_third' | 'unknown';

export type ThirdPlaceLine = {
  cutoffRank: number;
  lineTeam: StandingRow | null;
  firstOutsideTeam: StandingRow | null;
  pointsGapToOutside: number | null;
  goalDiffGapToOutside: number | null;
};

export type ThirdPlaceSummary = {
  teamId: string;
  teamName: string;
  rank: number | null;
  status: ThirdPlaceStatus;
  statusLabel: string;
  summary: string;
  row: StandingRow | null;
};

const cutoffRank = 8;

const statusLabels: Record<ThirdPlaceStatus, string> = {
  advance: '通過圏',
  borderline: 'ボーダー',
  outside: '圏外',
  not_third: '3位以外',
  unknown: '判定保留',
};

export const getThirdPlaceLine = (thirdPlaceRanking: StandingRow[]): ThirdPlaceLine => {
  const lineTeam = thirdPlaceRanking[cutoffRank - 1] ?? null;
  const firstOutsideTeam = thirdPlaceRanking[cutoffRank] ?? null;

  return {
    cutoffRank,
    lineTeam,
    firstOutsideTeam,
    pointsGapToOutside: lineTeam && firstOutsideTeam ? lineTeam.points - firstOutsideTeam.points : null,
    goalDiffGapToOutside: lineTeam && firstOutsideTeam ? lineTeam.goalDiff - firstOutsideTeam.goalDiff : null,
  };
};

export const getThirdPlaceStatus = (teamId: string, thirdPlaceRanking: StandingRow[]): ThirdPlaceStatus => {
  const index = thirdPlaceRanking.findIndex((row) => row.teamId === teamId);
  if (index < 0) return 'not_third';

  const rank = index + 1;
  if (rank < cutoffRank) return 'advance';
  if (rank === cutoffRank) return 'borderline';
  return 'outside';
};

export const getThirdPlaceSummary = (
  teamId: string,
  teams: Team[],
  thirdPlaceRanking: StandingRow[],
): ThirdPlaceSummary => {
  const team = teams.find((candidate) => candidate.id === teamId);
  const index = thirdPlaceRanking.findIndex((row) => row.teamId === teamId);
  const row = index >= 0 ? thirdPlaceRanking[index] ?? null : null;
  const rank = index >= 0 ? index + 1 : null;
  const status = getThirdPlaceStatus(teamId, thirdPlaceRanking);

  const summary = (() => {
    if (status === 'advance') return `3位ランキング${rank}位。現在は通過圏内です。`;
    if (status === 'borderline') return `3位ランキング${rank}位。現在の通過ライン上にいます。`;
    if (status === 'outside') return `3位ランキング${rank}位。現時点では通過圏外です。`;
    if (status === 'not_third') return '現在はグループ3位ではないため、3位通過ラインの対象外です。';
    return '3位通過ラインの判定を保留しています。';
  })();

  return {
    teamId,
    teamName: team?.name ?? teamId,
    rank,
    status,
    statusLabel: statusLabels[status],
    summary,
    row,
  };
};

export const getThirdPlaceRowStatus = (rank: number): ThirdPlaceStatus => {
  if (rank < cutoffRank) return 'advance';
  if (rank === cutoffRank) return 'borderline';
  return 'outside';
};

export const getThirdPlaceStatusLabel = (status: ThirdPlaceStatus): string => {
  return statusLabels[status];
};
