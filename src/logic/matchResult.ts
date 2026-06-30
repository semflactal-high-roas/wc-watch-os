import type { Match, MatchDecision, MatchStage, Team } from '../types';

export type MatchScoreLike = {
  played?: boolean;
  homeScore?: number | null;
  awayScore?: number | null;
  homePenaltyScore?: number;
  awayPenaltyScore?: number;
};

export type MatchWinnerLike = MatchScoreLike & Pick<Match, 'homeTeamId' | 'awayTeamId'> & {
  winnerTeamId?: string;
  decidedBy?: MatchDecision;
  stage?: MatchStage;
};

const teamName = (teams: Team[], teamId: string): string => {
  return teams.find((team) => team.id === teamId)?.name ?? teamId;
};

export const hasPenaltyShootout = (match: MatchScoreLike & { decidedBy?: MatchDecision }): boolean => {
  return (
    match.decidedBy === 'penalties' ||
    (typeof match.homePenaltyScore === 'number' && typeof match.awayPenaltyScore === 'number')
  );
};

export const getPenaltyScoreText = (match: MatchScoreLike): string | null => {
  if (typeof match.homePenaltyScore !== 'number' || typeof match.awayPenaltyScore !== 'number') {
    return null;
  }

  return `${match.homePenaltyScore}-${match.awayPenaltyScore}`;
};

export const formatMatchScore = (match: MatchScoreLike, options: { compact?: boolean } = {}): string | null => {
  if (!match.played || match.homeScore == null || match.awayScore == null) return null;

  const separator = options.compact ? '-' : ' - ';
  const baseScore = `${match.homeScore}${separator}${match.awayScore}`;
  const penaltyScore = getPenaltyScoreText(match);

  return penaltyScore ? `${baseScore} (PK ${penaltyScore})` : baseScore;
};

export const getMatchWinnerTeamId = (match: MatchWinnerLike): string | null => {
  if (!match.played || match.homeScore == null || match.awayScore == null) return null;
  if (match.winnerTeamId) return match.winnerTeamId;

  if (match.homeScore > match.awayScore) return match.homeTeamId;
  if (match.homeScore < match.awayScore) return match.awayTeamId;

  if (typeof match.homePenaltyScore === 'number' && typeof match.awayPenaltyScore === 'number') {
    if (match.homePenaltyScore > match.awayPenaltyScore) return match.homeTeamId;
    if (match.homePenaltyScore < match.awayPenaltyScore) return match.awayTeamId;
  }

  return null;
};

export const getMatchLoserTeamId = (match: MatchWinnerLike): string | null => {
  const winnerTeamId = getMatchWinnerTeamId(match);
  if (!winnerTeamId) return null;
  if (winnerTeamId === match.homeTeamId) return match.awayTeamId;
  if (winnerTeamId === match.awayTeamId) return match.homeTeamId;
  return null;
};

export const getKnockoutAdvancementLabel = (match: MatchWinnerLike, teams: Team[]): string | null => {
  if (match.stage === 'group') return null;

  const winnerTeamId = getMatchWinnerTeamId(match);
  if (!winnerTeamId) return null;

  if (match.stage === 'final') {
    return `${teamName(teams, winnerTeamId)} が優勝`;
  }

  if (match.stage === 'round_of_32') {
    return `${teamName(teams, winnerTeamId)} がR16進出`;
  }

  return `${teamName(teams, winnerTeamId)} が次ラウンド進出`;
};
