import type { Match, StandingRow } from '../types';

export const computeGroupStandings = (teamIds: string[], matches: Match[]): StandingRow[] => {
  const rows: Record<string, StandingRow> = Object.fromEntries(
    teamIds.map((teamId) => [
      teamId,
      {
        teamId,
        played: 0,
        won: 0,
        draw: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDiff: 0,
        points: 0,
      },
    ]),
  );

  for (const m of matches) {
    if (!m.played || m.homeScore === null || m.awayScore === null) continue;
    if (!(m.homeTeamId in rows) || !(m.awayTeamId in rows)) continue;

    const home = rows[m.homeTeamId];
    const away = rows[m.awayTeamId];
    home.played += 1;
    away.played += 1;
    home.goalsFor += m.homeScore;
    home.goalsAgainst += m.awayScore;
    away.goalsFor += m.awayScore;
    away.goalsAgainst += m.homeScore;

    if (m.homeScore > m.awayScore) {
      home.won += 1;
      away.lost += 1;
      home.points += 3;
    } else if (m.homeScore < m.awayScore) {
      away.won += 1;
      home.lost += 1;
      away.points += 3;
    } else {
      home.draw += 1;
      away.draw += 1;
      home.points += 1;
      away.points += 1;
    }
  }

  return Object.values(rows)
    .map((r) => ({ ...r, goalDiff: r.goalsFor - r.goalsAgainst }))
    .sort((a, b) => b.points - a.points || b.goalDiff - a.goalDiff || b.goalsFor - a.goalsFor);
};
