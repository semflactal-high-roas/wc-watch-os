import type { Match, MatchStage, Team } from '../types';

export type RecommendationPreferenceInput = {
  mainFavoriteTeamId: string;
  selectedTeamIds: string[];
};

const japanTeamId = 'JPN';

const stageLabels: Record<MatchStage, string> = {
  group: 'グループステージ',
  round_of_32: 'ラウンド32',
  round_of_16: 'ラウンド16',
  quarter_final: '準々決勝',
  semi_final: '準決勝',
  third_place: '3位決定戦',
  final: '決勝',
};

const matchIncludesTeam = (match: Match, teamId: string): boolean => {
  return match.homeTeamId === teamId || match.awayTeamId === teamId;
};

const isSupportedTeamMatch = (match: Match, preferences: RecommendationPreferenceInput): boolean => {
  const supportedTeamIds = [preferences.mainFavoriteTeamId, ...preferences.selectedTeamIds].filter(Boolean);
  return supportedTeamIds.some((teamId) => matchIncludesTeam(match, teamId));
};

const teamGroup = (teams: Team[], teamId: string): string => {
  return teams.find((team) => team.id === teamId)?.group ?? '';
};

export const getRecommendationTitle = (isFallback: boolean): string => {
  return isFallback ? '次に見るべき試合' : '今日のおすすめ';
};

export const getMatchContextLabel = (match: Match): string => {
  if (match.stage === 'group' && match.groupId) return `Group ${match.groupId}`;
  return stageLabels[match.stage];
};

export const getRecommendationReason = (
  match: Match,
  teams: Team[],
  preferences: RecommendationPreferenceInput = { mainFavoriteTeamId: '', selectedTeamIds: [] },
): string => {
  if (matchIncludesTeam(match, japanTeamId)) {
    return '日本代表が関係する試合です。勝点を取れるかでグループ突破の見方が変わります。';
  }

  if (isSupportedTeamMatch(match, preferences)) {
    return '応援する国が関係する試合です。順位表と突破条件に影響します。';
  }

  const homeGroup = teamGroup(teams, match.homeTeamId);
  const awayGroup = teamGroup(teams, match.awayTeamId);
  if (match.groupId === 'F' || homeGroup === 'F' || awayGroup === 'F') {
    return '日本と同じ組の試合です。勝点配分が日本代表の突破条件に影響します。';
  }

  if (match.stage === 'group') {
    return 'グループ順位と3位通過ラインを見るうえで重要な試合です。';
  }

  return '今後のラウンドや他会場結果を見るうえで参考になる試合です。';
};
