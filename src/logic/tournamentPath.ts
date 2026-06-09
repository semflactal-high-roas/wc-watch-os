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

export type ProvisionalTournamentTree = {
  status: 'unofficial_provisional_beta';
  officialRound32SlotsConfirmed: false;
  rounds: Record<TournamentRound, BracketMatch[]>;
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

const groupIds = 'ABCDEFGHIJKL'.split('');

// TODO(要確認): repo内に公式R32枠定義がないため、これは画面と接続ロジックを確認するための仮配置。
// 公式枠が確認できたら、この定数だけを出典確認済みの定義へ差し替える。
export const PROVISIONAL_R32_SLOT_DEFINITIONS: Round32Definition[] = [
  ...groupIds.slice(0, 8).map((groupId, index) => ({
    id: `R32-${String(index + 1).padStart(2, '0')}`,
    homeSlot: { type: 'group_winner' as const, groupId },
    awaySlot: { type: 'third_place' as const, unresolved: true as const },
  })),
  ...groupIds.slice(8).map((groupId, index) => ({
    id: `R32-${String(index + 9).padStart(2, '0')}`,
    homeSlot: { type: 'group_winner' as const, groupId },
    awaySlot: { type: 'group_runner_up' as const, groupId: groupIds[index] ?? '' },
  })),
  ...groupIds.slice(4).reduce<Round32Definition[]>((definitions, groupId, index, remainingGroups) => {
    if (index % 2 !== 0) return definitions;
    const opponentGroupId = remainingGroups[index + 1];
    if (!opponentGroupId) return definitions;
    definitions.push({
      id: `R32-${String(definitions.length + 13).padStart(2, '0')}`,
      homeSlot: { type: 'group_runner_up', groupId },
      awaySlot: { type: 'group_runner_up', groupId: opponentGroupId },
    });
    return definitions;
  }, []),
];

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
  prefix: string,
  sourceMatches: BracketMatch[],
): BracketMatch[] => {
  const matches: BracketMatch[] = [];

  for (let index = 0; index < sourceMatches.length; index += 2) {
    const homeSource = sourceMatches[index];
    const awaySource = sourceMatches[index + 1];
    if (!homeSource || !awaySource) continue;

    matches.push({
      id: `${prefix}-${String(matches.length + 1).padStart(2, '0')}`,
      round,
      homeSlot: { type: 'winner', matchId: homeSource.id },
      awaySlot: { type: 'winner', matchId: awaySource.id },
      home: winnerSlot(homeSource.id),
      away: winnerSlot(awaySource.id),
      isOfficialSlotConfirmed: false,
      isFavoritePath: homeSource.isFavoritePath || awaySource.isFavoritePath,
      note: '接続順は仮配置です。公式枠は要確認です。',
    });
  }

  return matches;
};

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
      isOfficialSlotConfirmed: false,
      isFavoritePath: Boolean(mainFavoriteTeamId && (home.teamId === mainFavoriteTeamId || away.teamId === mainFavoriteTeamId)),
      note: 'repo内で公式R32枠を確認できていないため、この対戦枠は要確認です。',
    };
  });

  const round16 = buildWinnerRound('round16', 'R16', round32);
  const quarterfinal = buildWinnerRound('quarterfinal', 'QF', round16);
  const semifinal = buildWinnerRound('semifinal', 'SF', quarterfinal);
  const final = buildWinnerRound('final', 'F', semifinal);
  const allRounds = [...round32, ...round16, ...quarterfinal, ...semifinal, ...final];
  const favoriteMatchIds = allRounds.filter((match) => match.isFavoritePath).map((match) => match.id);

  return {
    status: 'unofficial_provisional_beta',
    officialRound32SlotsConfirmed: false,
    rounds: { round32, round16, quarterfinal, semifinal, final },
    favoritePath: mainFavoriteTeamId && favoriteMatchIds.length > 0 ? { teamId: mainFavoriteTeamId, matchIds: favoriteMatchIds } : null,
  };
};
