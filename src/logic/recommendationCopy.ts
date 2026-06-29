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

const isKnockoutMatch = (match: Match): boolean => match.stage !== 'group';

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
  if (isKnockoutMatch(match)) {
    if (matchIncludesTeam(match, japanTeamId)) {
      return '日本代表が関係するノックアウト戦です。勝者が次ラウンドへ進む一発勝負です。';
    }

    if (isSupportedTeamMatch(match, preferences)) {
      return '応援する国が関係するノックアウト戦です。勝てば次ラウンドへ進み、敗れれば大会終了です。';
    }

    if (match.id === 'R32-04') {
      return '勝者がR16でCanadaと対戦し、次ラウンドのカードが決まる試合です。';
    }

    if (match.stage === 'round_of_32') {
      return '勝者がラウンド16へ進む一発勝負です。次ラウンドの対戦カードが決まります。';
    }

    if (match.stage === 'final') {
      return '優勝チームが決まる決勝です。勝敗予想ではなく、確定カードとして確認できます。';
    }

    if (match.stage === 'third_place') {
      return '大会の最終順位を決める一発勝負です。';
    }

    return '勝者枠が次ラウンドへ接続するノックアウト戦です。';
  }

  if (matchIncludesTeam(match, japanTeamId)) {
    return '日本代表が関係したグループステージの試合です。結果と記録を確認できます。';
  }

  if (isSupportedTeamMatch(match, preferences)) {
    return '応援する国が関係したグループステージの試合です。結果と記録を確認できます。';
  }

  const homeGroup = teamGroup(teams, match.homeTeamId);
  const awayGroup = teamGroup(teams, match.awayTeamId);
  if (match.groupId === 'F' || homeGroup === 'F' || awayGroup === 'F') {
    return '日本のグループに属するチームの試合です。グループステージの記録として確認できます。';
  }

  if (match.stage === 'group') {
    return 'グループステージの記録として確認できます。';
  }

  return '次ラウンドの組み合わせを確認するうえで参考になる試合です。';
};
