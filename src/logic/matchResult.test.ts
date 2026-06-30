import { describe, expect, it } from 'vitest';
import type { Match, Team } from '../types';
import {
  formatMatchScore,
  getKnockoutAdvancementLabel,
  getMatchWinnerTeamId,
  getPenaltyScoreText,
  hasPenaltyShootout,
} from './matchResult';

const teams: Team[] = [
  { id: 'GER', name: 'Germany', group: 'C', fifaRank: 10 },
  { id: 'PAR', name: 'Paraguay', group: 'D', fifaRank: 44 },
  { id: 'NED', name: 'Netherlands', group: 'F', fifaRank: 7 },
  { id: 'MAR', name: 'Morocco', group: 'C', fifaRank: 14 },
];

const match = (overrides: Partial<Match> = {}): Match => ({
  id: 'R32-03',
  homeTeamId: 'GER',
  awayTeamId: 'PAR',
  homeScore: 1,
  awayScore: 1,
  homePenaltyScore: 3,
  awayPenaltyScore: 4,
  winnerTeamId: 'PAR',
  decidedBy: 'penalties',
  played: true,
  date: '2026-06-30',
  kickoffTimeJST: '05:30',
  stage: 'round_of_32',
  ...overrides,
});

describe('match result helpers', () => {
  it('formats penalty shootout scores without hiding the 90-minute score', () => {
    expect(formatMatchScore(match())).toBe('1 - 1 (PK 3-4)');
    expect(formatMatchScore(match(), { compact: true })).toBe('1-1 (PK 3-4)');
    expect(getPenaltyScoreText(match())).toBe('3-4');
  });

  it('uses winnerTeamId to resolve a tied knockout match decided by penalties', () => {
    expect(getMatchWinnerTeamId(match())).toBe('PAR');
    expect(hasPenaltyShootout(match())).toBe(true);
  });

  it('can resolve the penalty winner from PK scores when winnerTeamId is absent', () => {
    expect(getMatchWinnerTeamId(match({ winnerTeamId: undefined }))).toBe('PAR');
  });

  it('returns an advancement label for the confirmed R32 winner', () => {
    expect(getKnockoutAdvancementLabel(match(), teams)).toBe('Paraguay がR16進出');
    expect(getKnockoutAdvancementLabel(match({
      id: 'R32-04',
      homeTeamId: 'NED',
      awayTeamId: 'MAR',
      homePenaltyScore: 2,
      awayPenaltyScore: 3,
      winnerTeamId: 'MAR',
    }), teams)).toBe('Morocco がR16進出');
  });

  it('does not invent a winner for an unplayed knockout match', () => {
    expect(getMatchWinnerTeamId(match({
      homeScore: null,
      awayScore: null,
      homePenaltyScore: undefined,
      awayPenaltyScore: undefined,
      winnerTeamId: undefined,
      decidedBy: undefined,
      played: false,
    }))).toBeNull();
  });
});
