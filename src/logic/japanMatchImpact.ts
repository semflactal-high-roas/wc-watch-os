import type { Match, Team } from '../types';

export type JapanMatchImpactItem = {
  label: string;
  text: string;
};

const japanTeamId = 'JPN';

const matchIncludesJapan = (match: Match): boolean => {
  return match.homeTeamId === japanTeamId || match.awayTeamId === japanTeamId;
};

const teamName = (teams: Team[], teamId: string): string => {
  return teams.find((team) => team.id === teamId)?.name ?? teamId;
};

export const getJapanOpponentName = (match: Match, teams: Team[]): string => {
  if (!matchIncludesJapan(match)) return '';
  const opponentId = match.homeTeamId === japanTeamId ? match.awayTeamId : match.homeTeamId;
  return teamName(teams, opponentId);
};

export const getJapanMatchImpactItems = (match: Match, teams: Team[]): JapanMatchImpactItem[] => {
  if (!matchIncludesJapan(match)) return [];

  if (match.played) {
    return [{ label: '結果', text: '結果反映済み' }];
  }

  const opponentName = getJapanOpponentName(match, teams);
  const opponentPrefix = opponentName ? `${opponentName}戦: ` : '';

  if (match.stage !== 'group') {
    return [
      { label: '勝利', text: `${opponentPrefix}次ラウンドへ進出` },
      { label: '90分終了時同点', text: `${opponentPrefix}延長戦・PK戦で勝者を決定` },
      { label: '敗戦', text: `${opponentPrefix}大会終了` },
    ];
  }

  return [
    { label: '勝利', text: `${opponentPrefix}グループステージ結果として勝利を記録` },
    { label: '引分', text: `${opponentPrefix}グループステージ結果として引き分けを記録` },
    { label: '敗戦', text: `${opponentPrefix}グループステージ結果として敗戦を記録` },
  ];
};

export const getJapanMatchImpactSummary = (match: Match, teams: Team[]): string => {
  return getJapanMatchImpactItems(match, teams)
    .map((item) => `${item.label}: ${item.text}`)
    .join(' / ');
};
