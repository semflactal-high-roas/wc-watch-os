import type { Group, Match, MatchDecision, StandingRow } from '../types';

export type TournamentRound = 'round32' | 'round16' | 'quarterfinal' | 'semifinal' | 'third_place' | 'final';

export type BracketSlot =
  | { type: 'team'; teamId: string }
  | { type: 'winner'; matchId: string }
  | { type: 'loser'; matchId: string };

export type SlotRelation = 'winner' | 'loser';

export type ResolvedBracketSlot = {
  sourceLabel: string;
  teamId: string | null;
  isProvisional: boolean;
  isUnresolved: boolean;
  sourceMatchId?: string;
  relation?: SlotRelation;
  candidateTeamIds?: string[];
};

export type BracketMatch = {
  id: string;
  round: TournamentRound;
  homeSlot: BracketSlot;
  awaySlot: BracketSlot;
  home: ResolvedBracketSlot;
  away: ResolvedBracketSlot;
  isOfficialSlotConfirmed: boolean;
  isFavoritePath: boolean;
  date?: string;
  kickoffTimeJST?: string;
  homeScore?: number | null;
  awayScore?: number | null;
  homePenaltyScore?: number;
  awayPenaltyScore?: number;
  winnerTeamId?: string;
  decidedBy?: MatchDecision;
  played?: boolean;
  note?: string;
};

export type FavoriteTournamentPath = {
  teamId: string;
  matchIds: string[];
} | null;

export type TournamentBlockId = 'A' | 'B' | 'C' | 'D';

export type TournamentBlock = {
  id: TournamentBlockId;
  label: string;
  round32: BracketMatch[];
  round16: BracketMatch[];
  quarterfinal: BracketMatch;
  semifinalId: string;
  isFavoriteBlock: boolean;
};

export type SemifinalConnection = {
  match: BracketMatch;
  blockIds: [TournamentBlockId, TournamentBlockId];
  isFavoriteConnection: boolean;
};

export type TournamentTree = {
  status: 'fixed_knockout_bracket';
  officialRound32SlotsConfirmed: boolean;
  rounds: Record<TournamentRound, BracketMatch[]>;
  blocks: TournamentBlock[];
  semifinalConnections: SemifinalConnection[];
  thirdPlaceConnection: BracketMatch;
  finalConnection: BracketMatch;
  favoritePath: FavoriteTournamentPath;
};

export type ProvisionalTournamentTree = TournamentTree;

type GroupStanding = {
  groupId: string;
  rows: StandingRow[];
};

type BuildTournamentTreeInput = {
  standingsByGroup?: GroupStanding[];
  groups?: Group[];
  matches: Match[];
  mainFavoriteTeamId?: string;
};

type Round32Definition = {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
};

type WinnerRoundDefinition = {
  id: string;
  homeMatchId: string;
  awayMatchId: string;
};

type KnockoutScheduleDefinition = {
  id: string;
  date: string;
  kickoffTimeJST: string;
};

const teamSlot = (teamId: string): BracketSlot => ({ type: 'team', teamId });
const winnerSlot = (matchId: string): BracketSlot => ({ type: 'winner', matchId });
const loserSlot = (matchId: string): BracketSlot => ({ type: 'loser', matchId });

export const FIXED_R32_SLOT_DEFINITIONS: Round32Definition[] = [
  { id: 'R32-01', homeTeamId: 'RSA', awayTeamId: 'CAN' },
  { id: 'R32-02', homeTeamId: 'BRA', awayTeamId: 'JPN' },
  { id: 'R32-03', homeTeamId: 'GER', awayTeamId: 'PAR' },
  { id: 'R32-04', homeTeamId: 'NED', awayTeamId: 'MAR' },
  { id: 'R32-05', homeTeamId: 'CIV', awayTeamId: 'NOR' },
  { id: 'R32-06', homeTeamId: 'FRA', awayTeamId: 'SWE' },
  { id: 'R32-07', homeTeamId: 'MEX', awayTeamId: 'ECU' },
  { id: 'R32-08', homeTeamId: 'ENG', awayTeamId: 'COD' },
  { id: 'R32-09', homeTeamId: 'BEL', awayTeamId: 'SEN' },
  { id: 'R32-10', homeTeamId: 'USA', awayTeamId: 'BIH' },
  { id: 'R32-11', homeTeamId: 'ESP', awayTeamId: 'AUT' },
  { id: 'R32-12', homeTeamId: 'POR', awayTeamId: 'CRO' },
  { id: 'R32-13', homeTeamId: 'SUI', awayTeamId: 'ALG' },
  { id: 'R32-14', homeTeamId: 'AUS', awayTeamId: 'EGY' },
  { id: 'R32-15', homeTeamId: 'ARG', awayTeamId: 'CPV' },
  { id: 'R32-16', homeTeamId: 'COL', awayTeamId: 'GHA' },
];

export const FIXED_R16_CONNECTIONS: WinnerRoundDefinition[] = [
  { id: 'R16-01', homeMatchId: 'R32-01', awayMatchId: 'R32-04' },
  { id: 'R16-02', homeMatchId: 'R32-03', awayMatchId: 'R32-06' },
  { id: 'R16-03', homeMatchId: 'R32-02', awayMatchId: 'R32-05' },
  { id: 'R16-04', homeMatchId: 'R32-07', awayMatchId: 'R32-08' },
  { id: 'R16-05', homeMatchId: 'R32-12', awayMatchId: 'R32-11' },
  { id: 'R16-06', homeMatchId: 'R32-10', awayMatchId: 'R32-09' },
  { id: 'R16-07', homeMatchId: 'R32-15', awayMatchId: 'R32-14' },
  { id: 'R16-08', homeMatchId: 'R32-13', awayMatchId: 'R32-16' },
];

export const FIXED_QUARTERFINAL_CONNECTIONS: WinnerRoundDefinition[] = [
  { id: 'QF-01', homeMatchId: 'R16-02', awayMatchId: 'R16-01' },
  { id: 'QF-02', homeMatchId: 'R16-05', awayMatchId: 'R16-06' },
  { id: 'QF-03', homeMatchId: 'R16-03', awayMatchId: 'R16-04' },
  { id: 'QF-04', homeMatchId: 'R16-07', awayMatchId: 'R16-08' },
];

export const FIXED_SEMIFINAL_CONNECTIONS: WinnerRoundDefinition[] = [
  { id: 'SF-01', homeMatchId: 'QF-01', awayMatchId: 'QF-02' },
  { id: 'SF-02', homeMatchId: 'QF-03', awayMatchId: 'QF-04' },
];

export const FIXED_THIRD_PLACE_CONNECTION: WinnerRoundDefinition = {
  id: '3P-01',
  homeMatchId: 'SF-01',
  awayMatchId: 'SF-02',
};

export const FIXED_FINAL_CONNECTION: WinnerRoundDefinition = {
  id: 'F-01',
  homeMatchId: 'SF-01',
  awayMatchId: 'SF-02',
};

export const FIXED_KNOCKOUT_SCHEDULE_DEFINITIONS: KnockoutScheduleDefinition[] = [
  { id: 'R16-01', date: '2026-07-05', kickoffTimeJST: '02:00' },
  { id: 'R16-02', date: '2026-07-05', kickoffTimeJST: '06:00' },
  { id: 'R16-03', date: '2026-07-06', kickoffTimeJST: '05:00' },
  { id: 'R16-04', date: '2026-07-06', kickoffTimeJST: '09:00' },
  { id: 'R16-05', date: '2026-07-07', kickoffTimeJST: '04:00' },
  { id: 'R16-06', date: '2026-07-07', kickoffTimeJST: '09:00' },
  { id: 'R16-07', date: '2026-07-08', kickoffTimeJST: '01:00' },
  { id: 'R16-08', date: '2026-07-08', kickoffTimeJST: '05:00' },
  { id: 'QF-01', date: '2026-07-10', kickoffTimeJST: '05:00' },
  { id: 'QF-02', date: '2026-07-11', kickoffTimeJST: '04:00' },
  { id: 'QF-03', date: '2026-07-12', kickoffTimeJST: '06:00' },
  { id: 'QF-04', date: '2026-07-12', kickoffTimeJST: '10:00' },
  { id: 'SF-01', date: '2026-07-15', kickoffTimeJST: '04:00' },
  { id: 'SF-02', date: '2026-07-16', kickoffTimeJST: '04:00' },
  { id: '3P-01', date: '2026-07-19', kickoffTimeJST: '06:00' },
  { id: 'F-01', date: '2026-07-20', kickoffTimeJST: '04:00' },
];

const knockoutScheduleById = new Map(FIXED_KNOCKOUT_SCHEDULE_DEFINITIONS.map((schedule) => [schedule.id, schedule]));

const resolveTeamSlot = (teamId: string): ResolvedBracketSlot => ({
  sourceLabel: '',
  teamId,
  isProvisional: false,
  isUnresolved: false,
  candidateTeamIds: [teamId],
});

const getWinnerTeamId = (match: BracketMatch): string | null => {
  if (!match.played || match.homeScore == null || match.awayScore == null) return null;
  if (match.winnerTeamId) return match.winnerTeamId;
  if (match.homeScore === match.awayScore) return null;
  return match.homeScore > match.awayScore ? match.home.teamId : match.away.teamId;
};

const getLoserTeamId = (match: BracketMatch): string | null => {
  if (!match.played || match.homeScore == null || match.awayScore == null) return null;
  if (match.winnerTeamId) {
    if (match.winnerTeamId === match.home.teamId) return match.away.teamId;
    if (match.winnerTeamId === match.away.teamId) return match.home.teamId;
    return null;
  }
  if (match.homeScore === match.awayScore) return null;
  return match.homeScore < match.awayScore ? match.home.teamId : match.away.teamId;
};

const collectCandidateTeamIds = (match: BracketMatch): string[] => {
  const candidates = [match.home, match.away].flatMap((slot) => {
    if (slot.teamId) return [slot.teamId];
    return slot.candidateTeamIds ?? [];
  });

  return [...new Set(candidates)];
};

const resolveLinkedSlot = (sourceMatch: BracketMatch, relation: SlotRelation): ResolvedBracketSlot => {
  const decidedTeamId = relation === 'winner' ? getWinnerTeamId(sourceMatch) : getLoserTeamId(sourceMatch);
  const sourceLabel = `${sourceMatch.id}の${relation === 'winner' ? '勝者' : '敗者'}`;

  if (decidedTeamId) {
    return {
      sourceLabel,
      teamId: decidedTeamId,
      isProvisional: false,
      isUnresolved: false,
      sourceMatchId: sourceMatch.id,
      relation,
      candidateTeamIds: [decidedTeamId],
    };
  }

  return {
    sourceLabel,
    teamId: null,
    isProvisional: true,
    isUnresolved: true,
    sourceMatchId: sourceMatch.id,
    relation,
    candidateTeamIds: collectCandidateTeamIds(sourceMatch),
  };
};

const matchCanProduceTeam = (match: BracketMatch, teamId: string, relation: SlotRelation): boolean => {
  const decidedTeamId = relation === 'winner' ? getWinnerTeamId(match) : getLoserTeamId(match);
  if (decidedTeamId) return decidedTeamId === teamId;
  return collectCandidateTeamIds(match).includes(teamId);
};

const resolveSlot = (slot: BracketSlot, sourceById: Map<string, BracketMatch>): ResolvedBracketSlot => {
  if (slot.type === 'team') return resolveTeamSlot(slot.teamId);

  const source = sourceById.get(slot.matchId);
  if (!source) throw new Error(`Fixed tournament connection references an unknown match: ${slot.matchId}`);

  return resolveLinkedSlot(source, slot.type);
};

const slotCanContainFavorite = (
  slot: BracketSlot,
  sourceById: Map<string, BracketMatch>,
  favoriteTeamId: string,
): boolean => {
  if (!favoriteTeamId) return false;
  if (slot.type === 'team') return slot.teamId === favoriteTeamId;

  const source = sourceById.get(slot.matchId);
  if (!source) return false;
  return matchCanProduceTeam(source, favoriteTeamId, slot.type);
};

const attachMatchData = (match: BracketMatch, dataMatch: Match | undefined): BracketMatch => ({
  ...match,
  date: dataMatch?.date,
  kickoffTimeJST: dataMatch?.kickoffTimeJST,
  homeScore: dataMatch?.homeScore,
  awayScore: dataMatch?.awayScore,
  homePenaltyScore: dataMatch?.homePenaltyScore,
  awayPenaltyScore: dataMatch?.awayPenaltyScore,
  winnerTeamId: dataMatch?.winnerTeamId,
  decidedBy: dataMatch?.decidedBy,
  played: dataMatch?.played ?? false,
});

const attachKnockoutSchedule = (match: BracketMatch): BracketMatch => {
  const schedule = knockoutScheduleById.get(match.id);
  if (!schedule) return match;

  return {
    ...match,
    date: schedule.date,
    kickoffTimeJST: schedule.kickoffTimeJST,
  };
};

const buildRound32 = (matches: Match[], mainFavoriteTeamId: string): BracketMatch[] => {
  const dataById = new Map(matches.map((match) => [match.id, match]));

  return FIXED_R32_SLOT_DEFINITIONS.map((definition) => {
    const homeSlot = teamSlot(definition.homeTeamId);
    const awaySlot = teamSlot(definition.awayTeamId);
    const home = resolveTeamSlot(definition.homeTeamId);
    const away = resolveTeamSlot(definition.awayTeamId);
    const baseMatch: BracketMatch = {
      id: definition.id,
      round: 'round32',
      homeSlot,
      awaySlot,
      home,
      away,
      isOfficialSlotConfirmed: true,
      isFavoritePath: Boolean(mainFavoriteTeamId && [definition.homeTeamId, definition.awayTeamId].includes(mainFavoriteTeamId)),
    };

    return attachMatchData(baseMatch, dataById.get(definition.id));
  });
};

const buildWinnerRound = (
  round: Exclude<TournamentRound, 'round32' | 'third_place'>,
  sourceMatches: BracketMatch[],
  definitions: WinnerRoundDefinition[],
  mainFavoriteTeamId: string,
): BracketMatch[] => {
  const sourceById = new Map(sourceMatches.map((match) => [match.id, match]));

  return definitions.map((definition) => {
    const homeSlot = winnerSlot(definition.homeMatchId);
    const awaySlot = winnerSlot(definition.awayMatchId);
    const home = resolveSlot(homeSlot, sourceById);
    const away = resolveSlot(awaySlot, sourceById);

    return attachKnockoutSchedule({
      id: definition.id,
      round,
      homeSlot,
      awaySlot,
      home,
      away,
      isOfficialSlotConfirmed: true,
      isFavoritePath:
        slotCanContainFavorite(homeSlot, sourceById, mainFavoriteTeamId) ||
        slotCanContainFavorite(awaySlot, sourceById, mainFavoriteTeamId),
      played: false,
    });
  });
};

const buildThirdPlaceRound = (
  sourceMatches: BracketMatch[],
  definition: WinnerRoundDefinition,
  mainFavoriteTeamId: string,
): BracketMatch[] => {
  const sourceById = new Map(sourceMatches.map((match) => [match.id, match]));
  const homeSlot = loserSlot(definition.homeMatchId);
  const awaySlot = loserSlot(definition.awayMatchId);
  const home = resolveSlot(homeSlot, sourceById);
  const away = resolveSlot(awaySlot, sourceById);

  return [attachKnockoutSchedule({
    id: definition.id,
    round: 'third_place',
    homeSlot,
    awaySlot,
    home,
    away,
    isOfficialSlotConfirmed: true,
    isFavoritePath:
      slotCanContainFavorite(homeSlot, sourceById, mainFavoriteTeamId) ||
      slotCanContainFavorite(awaySlot, sourceById, mainFavoriteTeamId),
    played: false,
  })];
};

const winnerMatchIds = (match: BracketMatch): string[] =>
  [match.homeSlot, match.awaySlot].flatMap((slot) => (slot.type === 'winner' ? [slot.matchId] : []));

const matchesByIds = (matches: BracketMatch[], ids: string[]): BracketMatch[] =>
  ids.flatMap((id) => {
    const match = matches.find((candidate) => candidate.id === id);
    return match ? [match] : [];
  });

const blockIds: TournamentBlockId[] = ['A', 'B', 'C', 'D'];

const buildTournamentBlocks = (
  round32: BracketMatch[],
  round16: BracketMatch[],
  quarterfinals: BracketMatch[],
  semifinals: BracketMatch[],
): TournamentBlock[] =>
  quarterfinals.flatMap((quarterfinal, index) => {
    const id = blockIds[index];
    if (!id) return [];

    const blockRound16 = matchesByIds(round16, winnerMatchIds(quarterfinal));
    const blockRound32 = matchesByIds(round32, blockRound16.flatMap(winnerMatchIds));
    const semifinal = semifinals.find((match) => winnerMatchIds(match).includes(quarterfinal.id));
    if (!semifinal) return [];

    return [{
      id,
      label: `ブロック${id}`,
      round32: blockRound32,
      round16: blockRound16,
      quarterfinal,
      semifinalId: semifinal.id,
      isFavoriteBlock: quarterfinal.isFavoritePath,
    }];
  });

export const buildTournamentTree = ({
  matches,
  mainFavoriteTeamId = '',
}: BuildTournamentTreeInput): TournamentTree => {
  const round32 = buildRound32(matches, mainFavoriteTeamId);
  const round16 = buildWinnerRound('round16', round32, FIXED_R16_CONNECTIONS, mainFavoriteTeamId);
  const quarterfinal = buildWinnerRound('quarterfinal', round16, FIXED_QUARTERFINAL_CONNECTIONS, mainFavoriteTeamId);
  const semifinal = buildWinnerRound('semifinal', quarterfinal, FIXED_SEMIFINAL_CONNECTIONS, mainFavoriteTeamId);
  const thirdPlace = buildThirdPlaceRound(semifinal, FIXED_THIRD_PLACE_CONNECTION, mainFavoriteTeamId);
  const final = buildWinnerRound('final', semifinal, [FIXED_FINAL_CONNECTION], mainFavoriteTeamId);
  const blocks = buildTournamentBlocks(round32, round16, quarterfinal, semifinal);
  const semifinalConnections = semifinal.flatMap<SemifinalConnection>((match) => {
    const connectedBlockIds = blocks
      .filter((block) => winnerMatchIds(match).includes(block.quarterfinal.id))
      .map((block) => block.id);
    const firstBlockId = connectedBlockIds[0];
    const secondBlockId = connectedBlockIds[1];
    if (!firstBlockId || !secondBlockId) return [];

    return [{
      match,
      blockIds: [firstBlockId, secondBlockId],
      isFavoriteConnection: match.isFavoritePath,
    }];
  });
  const thirdPlaceConnection = thirdPlace[0];
  const finalConnection = final[0];
  if (!thirdPlaceConnection) throw new Error('Fixed tournament tree requires a third-place match.');
  if (!finalConnection) throw new Error('Fixed tournament tree requires a final match.');

  const allRounds = [...round32, ...round16, ...quarterfinal, ...semifinal, ...thirdPlace, ...final];
  const favoriteMatchIds = allRounds.filter((match) => match.isFavoritePath).map((match) => match.id);

  return {
    status: 'fixed_knockout_bracket',
    officialRound32SlotsConfirmed: true,
    rounds: { round32, round16, quarterfinal, semifinal, third_place: thirdPlace, final },
    blocks,
    semifinalConnections,
    thirdPlaceConnection,
    finalConnection,
    favoritePath: mainFavoriteTeamId && favoriteMatchIds.length > 0 ? { teamId: mainFavoriteTeamId, matchIds: favoriteMatchIds } : null,
  };
};

export const buildProvisionalTournamentTree = buildTournamentTree;
