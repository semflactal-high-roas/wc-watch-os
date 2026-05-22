export type Team = {
  id: string;
  name: string;
  group: string;
  fifaRank: number;
};

export type MatchStage =
  | 'group'
  | 'round_of_32'
  | 'round_of_16'
  | 'quarter_final'
  | 'semi_final'
  | 'third_place'
  | 'final';

export type Match = {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  played: boolean;
  date: string;
  kickoffTimeJST: string;
  groupId?: string;
  stage: MatchStage;
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

export type QualificationStatus =
  | 'safe'
  | 'borderline'
  | 'danger'
  | 'eliminated'
  | 'qualified'
  | 'unknown';

export type TeamGroupContext = {
  groupId: string;
  groupRank: number | null;
  standing: StandingRow | null;
  remainingMatches: number;
  groupMatchesRemaining: number;
};

export type QualificationSummary = {
  teamId: string;
  teamName: string;
  status: QualificationStatus;
  statusLabel: string;
  summary: string;
  context: TeamGroupContext | null;
  thirdPlaceRank: number | null;
};

export type AppData = {
  teams: Team[];
  groups: Group[];
  matches: Match[];
};
