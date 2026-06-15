import type { Match } from '../types';

type MatchWithOptionalStatus = Match & {
  status?: string;
};

export const isFinishedMatchForDisplay = (match: MatchWithOptionalStatus): boolean => {
  return match.played || match.status === 'finished';
};
