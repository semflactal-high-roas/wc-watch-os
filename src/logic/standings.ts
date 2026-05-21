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

  for (const match of matches) {
    if (!match.played || match.homeScore === null || match.awayScore === null) continue;
    if (!(match.homeTeamId in rows) || !(match.awayTeamId in rows)) continue;

    const home = rows[match.homeTeamId];
    const away = rows[match.awayTeamId];

    if (!home || !away) continue;

    home.played += 1;
    away.played += 1;
    home.goalsFor += match.homeScore;
    home.goalsAgainst += match.awayScore;
    away.goalsFor += match.awayScore;
    away.goalsAgainst += match.homeScore;

    if (match.homeScore > match.awayScore) {
      home.won += 1;
      away.lost += 1;
      home.points += 3;
    } else if (match.homeScore < match.awayScore) {
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
    .map((row) => ({ ...row, goalDiff: row.goalsFor - row.goalsAgainst }))
    .sort((a, b) => b.points - a.points || b.goalDiff - a.goalDiff || b.goalsFor - a.goalsFor);
};
