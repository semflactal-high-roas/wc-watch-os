import { describe, expect, it } from 'vitest';
import type { Group, StandingRow } from '../types';
import {
  buildProvisionalTournamentTree,
  type BracketMatch,
  type TournamentRound,
} from './tournamentPath';

const groupIds = 'ABCDEFGHIJKL'.split('');

const standingRow = (teamId: string, points: number): StandingRow => ({
  teamId,
  played: 0,
  won: 0,
  draw: 0,
  lost: 0,
  goalsFor: 0,
  goalsAgainst: 0,
  goalDiff: 0,
  points,
});

const groups: Group[] = groupIds.map((groupId) => ({
  id: groupId,
  teamIds: [`${groupId}-1`, `${groupId}-2`, `${groupId}-3`, `${groupId}-4`],
}));

const standingsByGroup = groups.map((group) => ({
  groupId: group.id,
  rows: group.teamIds.map((teamId, index) => standingRow(teamId, 4 - index)),
}));

const buildTree = (mainFavoriteTeamId?: string) =>
  buildProvisionalTournamentTree({
    standingsByGroup,
    groups,
    matches: [],
    mainFavoriteTeamId,
  });

const winnerSourceIds = (matches: BracketMatch[]): string[] =>
  matches.flatMap((match) =>
    [match.homeSlot, match.awaySlot].flatMap((slot) => (slot.type === 'winner' ? [slot.matchId] : [])),
  );

const hasGroupSlot = (
  match: BracketMatch,
  type: 'group_winner' | 'group_runner_up',
  groupId: string,
): boolean => [match.homeSlot, match.awaySlot].some((slot) => slot.type === type && slot.groupId === groupId);

const hasRound32Pair = (
  matches: BracketMatch[],
  first: ['group_winner' | 'group_runner_up', string],
  second: ['group_winner' | 'group_runner_up', string],
): boolean => matches.some((match) =>
  hasGroupSlot(match, first[0], first[1]) && hasGroupSlot(match, second[0], second[1]),
);

const roundOrder: TournamentRound[] = ['round32', 'round16', 'quarterfinal', 'semifinal', 'final'];

const roundTransitions: [TournamentRound, TournamentRound][] = [
  ['round32', 'round16'],
  ['round16', 'quarterfinal'],
  ['quarterfinal', 'semifinal'],
  ['semifinal', 'final'],
];

describe('buildProvisionalTournamentTree', () => {
  it('builds the expected number of matches in every round', () => {
    const { rounds } = buildTree();

    expect(rounds.round32).toHaveLength(16);
    expect(rounds.round16).toHaveLength(8);
    expect(rounds.quarterfinal).toHaveLength(4);
    expect(rounds.semifinal).toHaveLength(2);
    expect(rounds.final).toHaveLength(1);
  });

  it('uses unique match ids and references only matches from the preceding round', () => {
    const { rounds } = buildTree();

    for (const round of roundOrder) {
      const ids = rounds[round].map((match) => match.id);
      expect(new Set(ids).size).toBe(ids.length);
    }

    for (const [precedingRound, currentRoundName] of roundTransitions) {
      const currentRound = rounds[currentRoundName];
      const precedingIds = new Set(rounds[precedingRound].map((match) => match.id));
      const sourceIds = winnerSourceIds(currentRound);

      expect(sourceIds).toHaveLength(currentRound.length * 2);
      expect(sourceIds.every((sourceId) => precedingIds.has(sourceId))).toBe(true);
    }
  });

  it('uses the official R32 group winner and runner-up pairings', () => {
    const { round32 } = buildTree().rounds;

    expect(hasRound32Pair(round32, ['group_winner', 'F'], ['group_runner_up', 'C'])).toBe(true);
    expect(hasRound32Pair(round32, ['group_runner_up', 'F'], ['group_winner', 'C'])).toBe(true);
    expect(hasRound32Pair(round32, ['group_runner_up', 'E'], ['group_runner_up', 'I'])).toBe(true);
    expect(hasRound32Pair(round32, ['group_runner_up', 'F'], ['group_runner_up', 'E'])).toBe(false);
  });

  it('uses the official winner connections from R32 through the final', () => {
    const { rounds } = buildTree();
    const connections = (matches: BracketMatch[]) =>
      matches.map((match) => [match.id, ...winnerSourceIds([match])]);

    expect(connections(rounds.round16)).toEqual([
      ['R16-89', 'R32-74', 'R32-77'],
      ['R16-90', 'R32-73', 'R32-75'],
      ['R16-91', 'R32-76', 'R32-78'],
      ['R16-92', 'R32-79', 'R32-80'],
      ['R16-93', 'R32-83', 'R32-84'],
      ['R16-94', 'R32-81', 'R32-82'],
      ['R16-95', 'R32-86', 'R32-88'],
      ['R16-96', 'R32-85', 'R32-87'],
    ]);
    expect(connections(rounds.quarterfinal)).toEqual([
      ['QF-97', 'R16-89', 'R16-90'],
      ['QF-98', 'R16-93', 'R16-94'],
      ['QF-99', 'R16-91', 'R16-92'],
      ['QF-100', 'R16-95', 'R16-96'],
    ]);
    expect(connections(rounds.semifinal)).toEqual([
      ['SF-101', 'QF-97', 'QF-98'],
      ['SF-102', 'QF-99', 'QF-100'],
    ]);
    expect(connections(rounds.final)).toEqual([
      ['F-104', 'SF-101', 'SF-102'],
    ]);
  });

  it('keeps every third-place slot unresolved without assigning a team', () => {
    const { rounds } = buildTree();
    const thirdPlaceSlots = rounds.round32.flatMap((match) =>
      [
        { definition: match.homeSlot, resolved: match.home },
        { definition: match.awaySlot, resolved: match.away },
      ].filter(({ definition }) => definition.type === 'third_place'),
    );

    expect(thirdPlaceSlots.length).toBeGreaterThan(0);
    for (const { definition, resolved } of thirdPlaceSlots) {
      expect(definition).toMatchObject({ type: 'third_place', unresolved: true });
      expect(resolved).toMatchObject({
        sourceLabel: '3位通過枠 / 未確定',
        teamId: null,
        isProvisional: true,
        isUnresolved: true,
      });
    }
  });

  it('propagates the favorite path from its R32 match through the final', () => {
    const tree = buildTree('A-1');

    for (const round of roundOrder) {
      expect(tree.rounds[round].filter((match) => match.isFavoritePath)).toHaveLength(1);
    }

    const highlightedIds = roundOrder.flatMap((round) =>
      tree.rounds[round].filter((match) => match.isFavoritePath).map((match) => match.id),
    );
    expect(tree.favoritePath).toEqual({ teamId: 'A-1', matchIds: highlightedIds });

    let precedingFavoriteMatchId = highlightedIds[0];
    expect(precedingFavoriteMatchId).toBeDefined();

    for (const [, currentRound] of roundTransitions) {
      const highlightedMatch = tree.rounds[currentRound].find((match) => match.isFavoritePath);
      expect(highlightedMatch).toBeDefined();
      expect(winnerSourceIds(highlightedMatch ? [highlightedMatch] : [])).toContain(precedingFavoriteMatchId);
      precedingFavoriteMatchId = highlightedMatch?.id;
    }
  });

  it('does not highlight a path when the favorite is absent from R32', () => {
    const tree = buildTree('not-in-round32');
    const allMatches = Object.values(tree.rounds).flat();

    expect(tree.favoritePath).toBeNull();
    expect(allMatches.every((match) => !match.isFavoritePath)).toBe(true);
  });

  it('builds four connected blocks from R32 through the quarterfinals', () => {
    const tree = buildTree();

    expect(tree.blocks).toHaveLength(4);
    for (const block of tree.blocks) {
      expect(block.round32).toHaveLength(4);
      expect(block.round16).toHaveLength(2);
      expect(block.quarterfinal).toBeDefined();
    }

    expect(tree.semifinalConnections.map((connection) => connection.blockIds)).toEqual([
      ['A', 'B'],
      ['C', 'D'],
    ]);
  });

  it('marks only the block containing the favorite as the favorite block', () => {
    const favoriteTree = buildTree('A-1');
    const noFavoriteTree = buildTree('not-in-round32');

    expect(favoriteTree.blocks.filter((block) => block.isFavoriteBlock)).toHaveLength(1);
    expect(noFavoriteTree.blocks.every((block) => !block.isFavoriteBlock)).toBe(true);
  });
});
