import type { StandingRow } from '../types';

export const rankThirdPlaceTeams = (thirdPlacedRows: StandingRow[]): StandingRow[] => {
  return [...thirdPlacedRows].sort(
    (a, b) => b.points - a.points || b.goalDiff - a.goalDiff || b.goalsFor - a.goalsFor,
  );
};
