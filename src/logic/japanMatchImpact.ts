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

  return [
    { label: '勝利', text: `${opponentPrefix}勝点3を積み上げ、2位以内通過に近づく` },
    { label: '引分', text: `${opponentPrefix}勝点1は取れるが、他会場結果の影響が大きくなる` },
    { label: '敗戦', text: `${opponentPrefix}勝点を積めず、3位通過ラインや他会場依存が強まる` },
  ];
};

export const getJapanMatchImpactSummary = (match: Match, teams: Team[]): string => {
  return getJapanMatchImpactItems(match, teams)
    .map((item) => `${item.label}: ${item.text}`)
    .join(' / ');
};
