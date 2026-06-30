export type Team = {
  id: string;
  name: string;
  group: string;
  fifaRank: number;
  flagEmoji?: string;
};

export type MatchStage =
  | 'group'
  | 'round_of_32'
  | 'round_of_16'
  | 'quarter_final'
  | 'semi_final'
  | 'third_place'
  | 'final';

export type MatchDecision = 'regular' | 'extra_time' | 'penalties';

export type Match = {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  homePenaltyScore?: number;
  awayPenaltyScore?: number;
  winnerTeamId?: string;
  decidedBy?: MatchDecision;
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

export type AppConfig = {
  tournament?: string;
  season?: number;
  version?: string;
  appName?: string;
  lastUpdated?: string;
  scheduleSourceName?: string;
  scheduleSourceUrl?: string;
  dataNote?: string;
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
  config: AppConfig;
};
