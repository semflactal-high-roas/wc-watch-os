export type Team = {
  id: string;
  name: string;
  group: string;
  fifaRank: number;
};

export type Match = {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  played: boolean;
};

export type Group = {
  id: string;
  teamIds: string[];
};

export type StandingRow = {
  teamId: string;
  played: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
};

export type AppData = {
  teams: Team[];
  groups: Group[];
  matches: Match[];
};
