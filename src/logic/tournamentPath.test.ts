import { describe, expect, it } from 'vitest';
import type { Match } from '../types';
import {
  buildTournamentTree,
  FIXED_KNOCKOUT_SCHEDULE_DEFINITIONS,
  FIXED_R32_SLOT_DEFINITIONS,
  type BracketMatch,
  type TournamentRound,
} from './tournamentPath';

const round32Match = (
  id: string,
  homeTeamId: string,
  awayTeamId: string,
  overrides: Partial<Match> = {},
): Match => ({
  id,
  homeTeamId,
  awayTeamId,
  homeScore: null,
  awayScore: null,
  played: false,
  date: '2026-06-30',
  kickoffTimeJST: '02:00',
  stage: 'round_of_32',
  ...overrides,
});

const latestR32Results: Record<string, Partial<Match>> = {
  'R32-01': {
    homeScore: 0,
    awayScore: 1,
    played: true,
    date: '2026-06-29',
    kickoffTimeJST: '04:00',
  },
  'R32-02': {
    homeScore: 2,
    awayScore: 1,
    played: true,
  },
  'R32-03': {
    homeScore: 1,
    awayScore: 1,
    homePenaltyScore: 3,
    awayPenaltyScore: 4,
    winnerTeamId: 'PAR',
    decidedBy: 'penalties',
    played: true,
    kickoffTimeJST: '05:30',
  },
  'R32-04': {
    homeScore: 1,
    awayScore: 1,
    homePenaltyScore: 2,
    awayPenaltyScore: 3,
    winnerTeamId: 'MAR',
    decidedBy: 'penalties',
    played: true,
    kickoffTimeJST: '10:00',
  },
  'R32-05': {
    homeScore: 1,
    awayScore: 2,
    played: true,
  },
  'R32-06': {
    homeScore: 3,
    awayScore: 0,
    played: true,
  },
  'R32-07': {
    homeScore: 2,
    awayScore: 0,
    played: true,
  },
  'R32-08': {
    homeScore: 2,
    awayScore: 1,
    played: true,
  },
  'R32-09': {
    homeScore: 3,
    awayScore: 2,
    played: true,
  },
  'R32-10': {
    homeScore: 2,
    awayScore: 0,
    played: true,
  },
};

const round32Matches: Match[] = FIXED_R32_SLOT_DEFINITIONS.map((definition) =>
  round32Match(definition.id, definition.homeTeamId, definition.awayTeamId, latestR32Results[definition.id] ?? {}),
);

const buildTree = (mainFavoriteTeamId?: string) =>
  buildTournamentTree({
    matches: round32Matches,
    mainFavoriteTeamId,
  });

const sourceIds = (matches: BracketMatch[], type: 'winner' | 'loser' = 'winner'): string[] =>
  matches.flatMap((match) =>
    [match.homeSlot, match.awaySlot].flatMap((slot) => (slot.type === type ? [slot.matchId] : [])),
  );

const connections = (matches: BracketMatch[], type: 'winner' | 'loser' = 'winner') =>
  matches.map((match) => [match.id, ...sourceIds([match], type)]);

const findMatch = (matches: BracketMatch[], matchId: string): BracketMatch => {
  const match = matches.find((candidate) => candidate.id === matchId);
  if (!match) throw new Error(`Missing test match ${matchId}`);
  return match;
};

const roundOrder: TournamentRound[] = ['round32', 'round16', 'quarterfinal', 'semifinal', 'third_place', 'final'];

describe('buildTournamentTree', () => {
  it('builds the expected number of matches in every round', () => {
    const { rounds } = buildTree();

    expect(rounds.round32).toHaveLength(16);
    expect(rounds.round16).toHaveLength(8);
    expect(rounds.quarterfinal).toHaveLength(4);
    expect(rounds.semifinal).toHaveLength(2);
    expect(rounds.third_place).toHaveLength(1);
    expect(rounds.final).toHaveLength(1);
  });

  it('uses unique match ids across the fixed knockout bracket', () => {
    const { rounds } = buildTree();
    const ids = roundOrder.flatMap((round) => rounds[round].map((match) => match.id));

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps all R32 cards fixed with real team slots and no third-place placeholders', () => {
    const { round32 } = buildTree().rounds;

    expect(round32.map((match) => [match.id, match.home.teamId, match.away.teamId])).toEqual([
      ['R32-01', 'RSA', 'CAN'],
      ['R32-02', 'BRA', 'JPN'],
      ['R32-03', 'GER', 'PAR'],
      ['R32-04', 'NED', 'MAR'],
      ['R32-05', 'CIV', 'NOR'],
      ['R32-06', 'FRA', 'SWE'],
      ['R32-07', 'MEX', 'ECU'],
      ['R32-08', 'ENG', 'COD'],
      ['R32-09', 'BEL', 'SEN'],
      ['R32-10', 'USA', 'BIH'],
      ['R32-11', 'ESP', 'AUT'],
      ['R32-12', 'POR', 'CRO'],
      ['R32-13', 'SUI', 'ALG'],
      ['R32-14', 'AUS', 'EGY'],
      ['R32-15', 'ARG', 'CPV'],
      ['R32-16', 'COL', 'GHA'],
    ]);

    expect(round32.flatMap((match) => [match.home, match.away]).some((slot) => slot.sourceLabel.includes('3位通過枠'))).toBe(false);
    expect(round32.every((match) => match.homeSlot.type === 'team' && match.awaySlot.type === 'team')).toBe(true);
  });

  it('reflects Canada 1-0 South Africa and advances Canada to R16-01', () => {
    const { rounds } = buildTree();
    const r32Canada = findMatch(rounds.round32, 'R32-01');
    const r16Canada = findMatch(rounds.round16, 'R16-01');

    expect(r32Canada).toMatchObject({
      played: true,
      homeScore: 0,
      awayScore: 1,
      date: '2026-06-29',
      kickoffTimeJST: '04:00',
    });
    expect(r16Canada.home).toMatchObject({
      teamId: 'CAN',
      isProvisional: false,
      isUnresolved: false,
      sourceMatchId: 'R32-01',
      relation: 'winner',
    });
    expect(r16Canada.away).toMatchObject({
      teamId: 'MAR',
      isProvisional: false,
      isUnresolved: false,
      sourceMatchId: 'R32-04',
      relation: 'winner',
      candidateTeamIds: ['MAR'],
    });
  });

  it('reflects R32 penalty shootout winners into R16', () => {
    const { rounds } = buildTree();
    const r32Paraguay = findMatch(rounds.round32, 'R32-03');
    const r32Morocco = findMatch(rounds.round32, 'R32-04');
    const r16Paraguay = findMatch(rounds.round16, 'R16-02');
    const r16Morocco = findMatch(rounds.round16, 'R16-01');

    expect(r32Paraguay).toMatchObject({
      played: true,
      homeScore: 1,
      awayScore: 1,
      homePenaltyScore: 3,
      awayPenaltyScore: 4,
      winnerTeamId: 'PAR',
      decidedBy: 'penalties',
    });
    expect(r16Paraguay.home).toMatchObject({
      teamId: 'PAR',
      isProvisional: false,
      isUnresolved: false,
      sourceMatchId: 'R32-03',
      relation: 'winner',
    });
    expect(r16Paraguay.away).toMatchObject({
      teamId: 'FRA',
      isProvisional: false,
      isUnresolved: false,
      sourceMatchId: 'R32-06',
      relation: 'winner',
      candidateTeamIds: ['FRA'],
    });

    expect(r32Morocco).toMatchObject({
      played: true,
      homeScore: 1,
      awayScore: 1,
      homePenaltyScore: 2,
      awayPenaltyScore: 3,
      winnerTeamId: 'MAR',
      decidedBy: 'penalties',
    });
    expect(r16Morocco.home.teamId).toBe('CAN');
    expect(r16Morocco.away).toMatchObject({
      teamId: 'MAR',
      isProvisional: false,
      isUnresolved: false,
      sourceMatchId: 'R32-04',
      relation: 'winner',
    });
  });

  it('reflects latest regular-time R32 winners into R16', () => {
    const { rounds } = buildTree();

    expect(findMatch(rounds.round16, 'R16-02').away).toMatchObject({
      teamId: 'FRA',
      isProvisional: false,
      isUnresolved: false,
      sourceMatchId: 'R32-06',
      relation: 'winner',
    });
    expect(findMatch(rounds.round16, 'R16-03').home).toMatchObject({
      teamId: 'BRA',
      isProvisional: false,
      isUnresolved: false,
      sourceMatchId: 'R32-02',
      relation: 'winner',
    });
    expect(findMatch(rounds.round16, 'R16-03').away).toMatchObject({
      teamId: 'NOR',
      isProvisional: false,
      isUnresolved: false,
      sourceMatchId: 'R32-05',
      relation: 'winner',
    });
    expect(findMatch(rounds.round16, 'R16-04').home).toMatchObject({
      teamId: 'MEX',
      isProvisional: false,
      isUnresolved: false,
      sourceMatchId: 'R32-07',
      relation: 'winner',
    });
    expect(findMatch(rounds.round16, 'R16-04').away).toMatchObject({
      teamId: 'ENG',
      isProvisional: false,
      isUnresolved: false,
      sourceMatchId: 'R32-08',
      relation: 'winner',
    });
    expect(findMatch(rounds.round16, 'R16-06').home).toMatchObject({
      teamId: 'USA',
      isProvisional: false,
      isUnresolved: false,
      sourceMatchId: 'R32-10',
      relation: 'winner',
    });
    expect(findMatch(rounds.round16, 'R16-06').away).toMatchObject({
      teamId: 'BEL',
      isProvisional: false,
      isUnresolved: false,
      sourceMatchId: 'R32-09',
      relation: 'winner',
    });
  });

  it('uses the fixed winner connections from R32 through the final', () => {
    const { rounds } = buildTree();

    expect(connections(rounds.round16)).toEqual([
      ['R16-01', 'R32-01', 'R32-04'],
      ['R16-02', 'R32-03', 'R32-06'],
      ['R16-03', 'R32-02', 'R32-05'],
      ['R16-04', 'R32-07', 'R32-08'],
      ['R16-05', 'R32-12', 'R32-11'],
      ['R16-06', 'R32-10', 'R32-09'],
      ['R16-07', 'R32-15', 'R32-14'],
      ['R16-08', 'R32-13', 'R32-16'],
    ]);
    expect(connections(rounds.quarterfinal)).toEqual([
      ['QF-01', 'R16-02', 'R16-01'],
      ['QF-02', 'R16-05', 'R16-06'],
      ['QF-03', 'R16-03', 'R16-04'],
      ['QF-04', 'R16-07', 'R16-08'],
    ]);
    expect(connections(rounds.semifinal)).toEqual([
      ['SF-01', 'QF-01', 'QF-02'],
      ['SF-02', 'QF-03', 'QF-04'],
    ]);
    expect(connections(rounds.final)).toEqual([
      ['F-01', 'SF-01', 'SF-02'],
    ]);
  });

  it('attaches fixed JST kickoff schedules to R16 and later rounds', () => {
    const { rounds } = buildTree();
    const matchById = new Map(Object.values(rounds).flat().map((match) => [match.id, match]));

    for (const schedule of FIXED_KNOCKOUT_SCHEDULE_DEFINITIONS) {
      expect(matchById.get(schedule.id)).toMatchObject({
        date: schedule.date,
        kickoffTimeJST: schedule.kickoffTimeJST,
      });
    }
  });

  it('connects the third-place playoff from semifinal losers', () => {
    const { rounds } = buildTree();

    expect(connections(rounds.third_place, 'loser')).toEqual([
      ['3P-01', 'SF-01', 'SF-02'],
    ]);
  });

  it('keeps unplayed R32 winner slots connected into R16 without inventing winners', () => {
    const { rounds } = buildTree();

    expect(findMatch(rounds.round16, 'R16-05').home).toMatchObject({
      teamId: null,
      isProvisional: true,
      sourceMatchId: 'R32-12',
      relation: 'winner',
      candidateTeamIds: ['POR', 'CRO'],
    });
    expect(findMatch(rounds.round16, 'R16-07').away).toMatchObject({
      teamId: null,
      isProvisional: true,
      sourceMatchId: 'R32-14',
      relation: 'winner',
      candidateTeamIds: ['AUS', 'EGY'],
    });
  });

  it('preserves favorite path highlighting through the fixed bracket for an advancing team', () => {
    const tree = buildTree('BRA');

    expect(tree.favoritePath?.matchIds).toEqual(expect.arrayContaining([
      'R32-02',
      'R16-03',
      'QF-03',
      'SF-02',
      '3P-01',
      'F-01',
    ]));
    expect(findMatch(tree.rounds.round32, 'R32-02').isFavoritePath).toBe(true);
  });

  it('stops favorite path highlighting when the favorite is eliminated', () => {
    const tree = buildTree('JPN');

    expect(tree.favoritePath?.matchIds).toEqual(['R32-02']);
    expect(findMatch(tree.rounds.round32, 'R32-02').isFavoritePath).toBe(true);
    expect(findMatch(tree.rounds.round16, 'R16-03').isFavoritePath).toBe(false);
  });

  it('does not highlight a path when the favorite is absent from the bracket', () => {
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
});
