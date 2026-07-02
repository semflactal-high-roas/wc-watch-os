import { describe, expect, it } from 'vitest';
import type { Match, Team } from '../types';
import { FIXED_R32_SLOT_DEFINITIONS } from './tournamentPath';
import { buildGeneratedKnockoutScheduleMatches, mergeGeneratedKnockoutScheduleMatches } from './knockoutScheduleMatches';

const teams: Team[] = [
  { id: 'RSA', name: 'South Africa', group: 'A', fifaRank: 59, flagEmoji: '🇿🇦' },
  { id: 'CAN', name: 'Canada', group: 'B', fifaRank: 48, flagEmoji: '🇨🇦' },
  { id: 'BRA', name: 'Brazil', group: 'C', fifaRank: 5, flagEmoji: '🇧🇷' },
  { id: 'JPN', name: 'Japan', group: 'F', fifaRank: 18, flagEmoji: '🇯🇵' },
  { id: 'GER', name: 'Germany', group: 'C', fifaRank: 10, flagEmoji: '🇩🇪' },
  { id: 'PAR', name: 'Paraguay', group: 'D', fifaRank: 44, flagEmoji: '🇵🇾' },
  { id: 'NED', name: 'Netherlands', group: 'F', fifaRank: 7, flagEmoji: '🇳🇱' },
  { id: 'MAR', name: 'Morocco', group: 'C', fifaRank: 14, flagEmoji: '🇲🇦' },
  { id: 'CIV', name: "Côte d'Ivoire", group: 'E', fifaRank: 41, flagEmoji: '🇨🇮' },
  { id: 'NOR', name: 'Norway', group: 'I', fifaRank: 27, flagEmoji: '🇳🇴' },
  { id: 'FRA', name: 'France', group: 'I', fifaRank: 3, flagEmoji: '🇫🇷' },
  { id: 'SWE', name: 'Sweden', group: 'F', fifaRank: 43, flagEmoji: '🇸🇪' },
  { id: 'MEX', name: 'Mexico', group: 'A', fifaRank: 13, flagEmoji: '🇲🇽' },
  { id: 'ECU', name: 'Ecuador', group: 'E', fifaRank: 24, flagEmoji: '🇪🇨' },
  { id: 'ENG', name: 'England', group: 'L', fifaRank: 4, flagEmoji: '🏴' },
  { id: 'COD', name: 'DR Congo', group: 'K', fifaRank: 60, flagEmoji: '🇨🇩' },
  { id: 'BEL', name: 'Belgium', group: 'G', fifaRank: 8, flagEmoji: '🇧🇪' },
  { id: 'SEN', name: 'Senegal', group: 'I', fifaRank: 19, flagEmoji: '🇸🇳' },
  { id: 'USA', name: 'United States', group: 'B', fifaRank: 16, flagEmoji: '🇺🇸' },
  { id: 'BIH', name: 'Bosnia and Herzegovina', group: 'B', fifaRank: 71, flagEmoji: '🇧🇦' },
  { id: 'ESP', name: 'Spain', group: 'D', fifaRank: 2, flagEmoji: '🇪🇸' },
  { id: 'AUT', name: 'Austria', group: 'F', fifaRank: 22, flagEmoji: '🇦🇹' },
  { id: 'POR', name: 'Portugal', group: 'K', fifaRank: 6, flagEmoji: '🇵🇹' },
  { id: 'CRO', name: 'Croatia', group: 'L', fifaRank: 12, flagEmoji: '🇭🇷' },
  { id: 'SUI', name: 'Switzerland', group: 'B', fifaRank: 20, flagEmoji: '🇨🇭' },
  { id: 'ALG', name: 'Algeria', group: 'G', fifaRank: 37, flagEmoji: '🇩🇿' },
  { id: 'AUS', name: 'Australia', group: 'G', fifaRank: 26, flagEmoji: '🇦🇺' },
  { id: 'EGY', name: 'Egypt', group: 'H', fifaRank: 31, flagEmoji: '🇪🇬' },
  { id: 'ARG', name: 'Argentina', group: 'J', fifaRank: 1, flagEmoji: '🇦🇷' },
  { id: 'CPV', name: 'Cape Verde', group: 'D', fifaRank: 70, flagEmoji: '🇨🇻' },
  { id: 'COL', name: 'Colombia', group: 'H', fifaRank: 9, flagEmoji: '🇨🇴' },
  { id: 'GHA', name: 'Ghana', group: 'L', fifaRank: 62, flagEmoji: '🇬🇭' },
];

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

const latestResults: Record<string, Partial<Match>> = {
  'R32-01': { homeScore: 0, awayScore: 1, played: true },
  'R32-02': { homeScore: 2, awayScore: 1, played: true },
  'R32-03': {
    homeScore: 1,
    awayScore: 1,
    homePenaltyScore: 3,
    awayPenaltyScore: 4,
    winnerTeamId: 'PAR',
    decidedBy: 'penalties',
    played: true,
  },
  'R32-04': {
    homeScore: 1,
    awayScore: 1,
    homePenaltyScore: 2,
    awayPenaltyScore: 3,
    winnerTeamId: 'MAR',
    decidedBy: 'penalties',
    played: true,
  },
  'R32-05': { homeScore: 1, awayScore: 2, played: true },
  'R32-06': { homeScore: 3, awayScore: 0, played: true },
  'R32-07': { homeScore: 2, awayScore: 0, played: true },
  'R32-08': { homeScore: 2, awayScore: 1, played: true },
  'R32-09': { homeScore: 3, awayScore: 2, played: true },
  'R32-10': { homeScore: 2, awayScore: 0, played: true },
};

const matches: Match[] = FIXED_R32_SLOT_DEFINITIONS.map((definition) =>
  round32Match(definition.id, definition.homeTeamId, definition.awayTeamId, latestResults[definition.id] ?? {}),
);

describe('generated knockout schedule matches', () => {
  it('creates R16 and later scheduled matches without adding TBD teams', () => {
    const generated = buildGeneratedKnockoutScheduleMatches(matches, teams);

    expect(generated).toHaveLength(16);
    expect(generated.find((match) => match.id === 'R16-01')).toMatchObject({
      homeTeamId: 'CAN',
      awayTeamId: 'MAR',
      homeDisplayName: 'Canada 🇨🇦',
      awayDisplayName: 'Morocco 🇲🇦',
      date: '2026-07-05',
      kickoffTimeJST: '02:00',
      stage: 'round_of_16',
      played: false,
    });
    expect(generated.find((match) => match.id === 'R16-05')).toMatchObject({
      homeTeamId: '',
      awayTeamId: '',
      homeDisplayName: 'Portugal 🇵🇹 vs Croatia 🇭🇷 の勝者',
      awayDisplayName: 'Spain 🇪🇸 vs Austria 🇦🇹 の勝者',
      date: '2026-07-07',
      kickoffTimeJST: '04:00',
      stage: 'round_of_16',
      played: false,
    });
    expect(generated.find((match) => match.id === 'QF-01')).toMatchObject({
      homeDisplayName: 'Paraguay 🇵🇾 vs France 🇫🇷 の勝者',
      awayDisplayName: 'Canada 🇨🇦 vs Morocco 🇲🇦 の勝者',
      date: '2026-07-10',
      kickoffTimeJST: '05:00',
      stage: 'quarter_final',
    });
    expect(generated.find((match) => match.id === '3P-01')).toMatchObject({
      homeDisplayName: 'SF-01の敗者',
      awayDisplayName: 'SF-02の敗者',
      date: '2026-07-19',
      kickoffTimeJST: '06:00',
      stage: 'third_place',
    });
    expect(generated.find((match) => match.id === 'F-01')).toMatchObject({
      homeDisplayName: 'SF-01の勝者',
      awayDisplayName: 'SF-02の勝者',
      date: '2026-07-20',
      kickoffTimeJST: '04:00',
      stage: 'final',
    });
  });

  it('does not duplicate a knockout schedule match that already exists in match data', () => {
    const existingR16: Match = {
      id: 'R16-01',
      homeTeamId: 'CAN',
      awayTeamId: 'MAR',
      homeScore: null,
      awayScore: null,
      played: false,
      date: '2026-07-05',
      kickoffTimeJST: '02:00',
      stage: 'round_of_16',
    };

    const merged = mergeGeneratedKnockoutScheduleMatches([...matches, existingR16], teams);

    expect(merged.filter((match) => match.id === 'R16-01')).toHaveLength(1);
  });
});
