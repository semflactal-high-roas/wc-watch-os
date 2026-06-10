import type { Group, Match, StandingRow } from '../types';

export type TournamentRound = 'round32' | 'round16' | 'quarterfinal' | 'semifinal' | 'final';

export type BracketSlot =
  | { type: 'group_winner'; groupId: string }
  | { type: 'group_runner_up'; groupId: string }
  | { type: 'third_place'; candidateGroupIds?: string[]; unresolved: true }
  | { type: 'winner'; matchId: string };

export type ResolvedBracketSlot = {
  sourceLabel: string;
  teamId: string | null;
  isProvisional: boolean;
  isUnresolved: boolean;
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

export type ProvisionalTournamentTree = {
  status: 'unofficial_provisional_beta';
  officialRound32SlotsConfirmed: boolean;
  rounds: Record<TournamentRound, BracketMatch[]>;
  blocks: TournamentBlock[];
  semifinalConnections: SemifinalConnection[];
  finalConnection: BracketMatch;
  favoritePath: FavoriteTournamentPath;
};

type GroupStanding = {
  groupId: string;
  rows: StandingRow[];
};

type BuildProvisionalTournamentTreeInput = {
  standingsByGroup: GroupStanding[];
  groups: Group[];
  matches: Match[];
  mainFavoriteTeamId?: string;
};

type Round32Definition = {
  id: string;
  homeSlot: Exclude<BracketSlot, { type: 'winner' }>;
  awaySlot: Exclude<BracketSlot, { type: 'winner' }>;
};

type WinnerRoundDefinition = {
  id: string;
  homeMatchId: string;
  awayMatchId: string;
};

const thirdPlace = (candidateGroupIds: string[]): Exclude<BracketSlot, { type: 'winner' }> => ({
  type: 'third_place',
  candidateGroupIds,
  unresolved: true,
});

// FIFAの公式scheduleにあるMatch 73〜88の枠順。3位通過チームの正式な割り当ては未実装。
export const PROVISIONAL_R32_SLOT_DEFINITIONS: Round32Definition[] = [
  { id: 'R32-73', homeSlot: { type: 'group_runner_up', groupId: 'A' }, awaySlot: { type: 'group_runner_up', groupId: 'B' } },
  { id: 'R32-74', homeSlot: { type: 'group_winner', groupId: 'E' }, awaySlot: thirdPlace(['A', 'B', 'C', 'D', 'F']) },
  { id: 'R32-75', homeSlot: { type: 'group_winner', groupId: 'F' }, awaySlot: { type: 'group_runner_up', groupId: 'C' } },
  { id: 'R32-76', homeSlot: { type: 'group_winner', groupId: 'C' }, awaySlot: { type: 'group_runner_up', groupId: 'F' } },
  { id: 'R32-77', homeSlot: { type: 'group_winner', groupId: 'I' }, awaySlot: thirdPlace(['C', 'D', 'F', 'G', 'H']) },
  { id: 'R32-78', homeSlot: { type: 'group_runner_up', groupId: 'E' }, awaySlot: { type: 'group_runner_up', groupId: 'I' } },
  { id: 'R32-79', homeSlot: { type: 'group_winner', groupId: 'A' }, awaySlot: thirdPlace(['C', 'E', 'F', 'H', 'I']) },
  { id: 'R32-80', homeSlot: { type: 'group_winner', groupId: 'L' }, awaySlot: thirdPlace(['E', 'H', 'I', 'J', 'K']) },
  { id: 'R32-81', homeSlot: { type: 'group_winner', groupId: 'D' }, awaySlot: thirdPlace(['B', 'E', 'F', 'I', 'J']) },
  { id: 'R32-82', homeSlot: { type: 'group_winner', groupId: 'G' }, awaySlot: thirdPlace(['A', 'E', 'H', 'I', 'J']) },
  { id: 'R32-83', homeSlot: { type: 'group_runner_up', groupId: 'K' }, awaySlot: { type: 'group_runner_up', groupId: 'L' } },
  { id: 'R32-84', homeSlot: { type: 'group_winner', groupId: 'H' }, awaySlot: { type: 'group_runner_up', groupId: 'J' } },
  { id: 'R32-85', homeSlot: { type: 'group_winner', groupId: 'B' }, awaySlot: thirdPlace(['E', 'F', 'G', 'I', 'J']) },
  { id: 'R32-86', homeSlot: { type: 'group_winner', groupId: 'J' }, awaySlot: { type: 'group_runner_up', groupId: 'H' } },
  { id: 'R32-87', homeSlot: { type: 'group_winner', groupId: 'K' }, awaySlot: thirdPlace(['D', 'E', 'I', 'J', 'L']) },
  { id: 'R32-88', homeSlot: { type: 'group_runner_up', groupId: 'D' }, awaySlot: { type: 'group_runner_up', groupId: 'G' } },
];

export const OFFICIAL_R16_CONNECTIONS: WinnerRoundDefinition[] = [
  { id: 'R16-89', homeMatchId: 'R32-74', awayMatchId: 'R32-77' },
  { id: 'R16-90', homeMatchId: 'R32-73', awayMatchId: 'R32-75' },
  { id: 'R16-91', homeMatchId: 'R32-76', awayMatchId: 'R32-78' },
  { id: 'R16-92', homeMatchId: 'R32-79', awayMatchId: 'R32-80' },
  { id: 'R16-93', homeMatchId: 'R32-83', awayMatchId: 'R32-84' },
  { id: 'R16-94', homeMatchId: 'R32-81', awayMatchId: 'R32-82' },
  { id: 'R16-95', homeMatchId: 'R32-86', awayMatchId: 'R32-88' },
  { id: 'R16-96', homeMatchId: 'R32-85', awayMatchId: 'R32-87' },
];

export const OFFICIAL_QUARTERFINAL_CONNECTIONS: WinnerRoundDefinition[] = [
  { id: 'QF-97', homeMatchId: 'R16-89', awayMatchId: 'R16-90' },
  { id: 'QF-98', homeMatchId: 'R16-93', awayMatchId: 'R16-94' },
  { id: 'QF-99', homeMatchId: 'R16-91', awayMatchId: 'R16-92' },
  { id: 'QF-100', homeMatchId: 'R16-95', awayMatchId: 'R16-96' },
];

export const OFFICIAL_SEMIFINAL_CONNECTIONS: WinnerRoundDefinition[] = [
  { id: 'SF-101', homeMatchId: 'QF-97', awayMatchId: 'QF-98' },
  { id: 'SF-102', homeMatchId: 'QF-99', awayMatchId: 'QF-100' },
];

export const OFFICIAL_FINAL_CONNECTION: WinnerRoundDefinition = {
  id: 'F-104',
  homeMatchId: 'SF-101',
  awayMatchId: 'SF-102',
};

const groupMatchesAreComplete = (group: Group, matches: Match[]): boolean => {
  const groupMatches = matches.filter(
    (match) =>
      match.stage === 'group' &&
      (match.groupId === group.id ||
        (group.teamIds.includes(match.homeTeamId) && group.teamIds.includes(match.awayTeamId))),
  );

  return groupMatches.length > 0 && groupMatches.every((match) => match.played);
};

const unresolvedThirdPlace = (): ResolvedBracketSlot => ({
  sourceLabel: '3位通過枠 / 未確定',
  teamId: null,
  isProvisional: true,
  isUnresolved: true,
});

const resolveRound32Slot = (
  slot: Exclude<BracketSlot, { type: 'winner' }>,
  standingsByGroup: GroupStanding[],
  groupCompletion: Map<string, boolean>,
): ResolvedBracketSlot => {
  if (slot.type === 'third_place') return unresolvedThirdPlace();

  const rankIndex = slot.type === 'group_winner' ? 0 : 1;
  const rankLabel = rankIndex + 1;
  const standing = standingsByGroup.find((candidate) => candidate.groupId === slot.groupId);

  return {
    sourceLabel: `Group ${slot.groupId} 現在${rankLabel}位`,
    teamId: standing?.rows[rankIndex]?.teamId ?? null,
    isProvisional: !groupCompletion.get(slot.groupId),
    isUnresolved: !standing?.rows[rankIndex],
  };
};

const winnerSlot = (matchId: string): ResolvedBracketSlot => ({
  sourceLabel: `Match ${matchId} の勝者`,
  teamId: null,
  isProvisional: true,
  isUnresolved: true,
});

const buildWinnerRound = (
  round: Exclude<TournamentRound, 'round32'>,
  sourceMatches: BracketMatch[],
  definitions: WinnerRoundDefinition[],
): BracketMatch[] => {
  const sourceById = new Map(sourceMatches.map((match) => [match.id, match]));

  return definitions.map((definition) => {
    const homeSource = sourceById.get(definition.homeMatchId);
    const awaySource = sourceById.get(definition.awayMatchId);
    if (!homeSource || !awaySource) {
      throw new Error(`Official tournament connection references an unknown match: ${definition.id}`);
    }

    return {
      id: definition.id,
      round,
      homeSlot: { type: 'winner', matchId: homeSource.id },
      awaySlot: { type: 'winner', matchId: awaySource.id },
      home: winnerSlot(homeSource.id),
      away: winnerSlot(awaySource.id),
      isOfficialSlotConfirmed: true,
      isFavoritePath: homeSource.isFavoritePath || awaySource.isFavoritePath,
    };
  });
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

export const buildProvisionalTournamentTree = ({
  standingsByGroup,
  groups,
  matches,
  mainFavoriteTeamId = '',
}: BuildProvisionalTournamentTreeInput): ProvisionalTournamentTree => {
  const groupCompletion = new Map(groups.map((group) => [group.id, groupMatchesAreComplete(group, matches)]));

  const round32 = PROVISIONAL_R32_SLOT_DEFINITIONS.map<BracketMatch>((definition) => {
    const home = resolveRound32Slot(definition.homeSlot, standingsByGroup, groupCompletion);
    const away = resolveRound32Slot(definition.awaySlot, standingsByGroup, groupCompletion);

    return {
      ...definition,
      round: 'round32',
      home,
      away,
      isOfficialSlotConfirmed: true,
      isFavoritePath: Boolean(mainFavoriteTeamId && (home.teamId === mainFavoriteTeamId || away.teamId === mainFavoriteTeamId)),
      note: definition.homeSlot.type === 'third_place' || definition.awaySlot.type === 'third_place'
        ? '3位通過枠の正式な割り当ては未確定です。'
        : undefined,
    };
  });

  const round16 = buildWinnerRound('round16', round32, OFFICIAL_R16_CONNECTIONS);
  const quarterfinal = buildWinnerRound('quarterfinal', round16, OFFICIAL_QUARTERFINAL_CONNECTIONS);
  const semifinal = buildWinnerRound('semifinal', quarterfinal, OFFICIAL_SEMIFINAL_CONNECTIONS);
  const final = buildWinnerRound('final', semifinal, [OFFICIAL_FINAL_CONNECTION]);
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
  const finalConnection = final[0];
  if (!finalConnection) throw new Error('Provisional tournament tree requires a final match.');
  const allRounds = [...round32, ...round16, ...quarterfinal, ...semifinal, ...final];
  const favoriteMatchIds = allRounds.filter((match) => match.isFavoritePath).map((match) => match.id);

  return {
    status: 'unofficial_provisional_beta',
    officialRound32SlotsConfirmed: true,
    rounds: { round32, round16, quarterfinal, semifinal, final },
    blocks,
    semifinalConnections,
    finalConnection,
    favoritePath: mainFavoriteTeamId && favoriteMatchIds.length > 0 ? { teamId: mainFavoriteTeamId, matchIds: favoriteMatchIds } : null,
  };
};
