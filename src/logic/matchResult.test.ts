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
  { id: 'BRA', name: 'Brazil', group: 'C', fifaRank: 5 },
  { id: 'JPN', name: 'Japan', group: 'F', fifaRank: 18 },
  { id: 'GER', name: 'Germany', group: 'C', fifaRank: 10 },
  { id: 'PAR', name: 'Paraguay', group: 'D', fifaRank: 44 },
  { id: 'NED', name: 'Netherlands', group: 'F', fifaRank: 7 },
  { id: 'MAR', name: 'Morocco', group: 'C', fifaRank: 14 },
  { id: 'NOR', name: 'Norway', group: 'I', fifaRank: 27 },
  { id: 'CIV', name: 'Ivory Coast', group: 'E', fifaRank: 41 },
  { id: 'FRA', name: 'France', group: 'I', fifaRank: 3 },
  { id: 'SWE', name: 'Sweden', group: 'F', fifaRank: 43 },
  { id: 'MEX', name: 'Mexico', group: 'A', fifaRank: 13 },
  { id: 'ECU', name: 'Ecuador', group: 'E', fifaRank: 24 },
  { id: 'ENG', name: 'England', group: 'L', fifaRank: 4 },
  { id: 'COD', name: 'DR Congo', group: 'K', fifaRank: 60 },
  { id: 'BEL', name: 'Belgium', group: 'G', fifaRank: 8 },
  { id: 'SEN', name: 'Senegal', group: 'I', fifaRank: 19 },
  { id: 'USA', name: 'United States', group: 'B', fifaRank: 16 },
  { id: 'BIH', name: 'Bosnia and Herzegovina', group: 'B', fifaRank: 71 },
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

  it('resolves regular knockout winners without penalty fields', () => {
    const regularResults: Array<[Partial<Match>, string, string]> = [
      [{ id: 'R32-02', homeTeamId: 'BRA', awayTeamId: 'JPN', homeScore: 2, awayScore: 1 }, 'BRA', 'Brazil がR16進出'],
      [{ id: 'R32-05', homeTeamId: 'CIV', awayTeamId: 'NOR', homeScore: 1, awayScore: 2 }, 'NOR', 'Norway がR16進出'],
      [{ id: 'R32-06', homeTeamId: 'FRA', awayTeamId: 'SWE', homeScore: 3, awayScore: 0 }, 'FRA', 'France がR16進出'],
      [{ id: 'R32-07', homeTeamId: 'MEX', awayTeamId: 'ECU', homeScore: 2, awayScore: 0 }, 'MEX', 'Mexico がR16進出'],
      [{ id: 'R32-08', homeTeamId: 'ENG', awayTeamId: 'COD', homeScore: 2, awayScore: 1 }, 'ENG', 'England がR16進出'],
      [{ id: 'R32-09', homeTeamId: 'BEL', awayTeamId: 'SEN', homeScore: 3, awayScore: 2 }, 'BEL', 'Belgium がR16進出'],
      [{ id: 'R32-10', homeTeamId: 'USA', awayTeamId: 'BIH', homeScore: 2, awayScore: 0 }, 'USA', 'United States がR16進出'],
    ];

    for (const [overrides, winnerTeamId, advancementLabel] of regularResults) {
      const regularMatch = match({
        homePenaltyScore: undefined,
        awayPenaltyScore: undefined,
        winnerTeamId: undefined,
        decidedBy: undefined,
        ...overrides,
      });

      expect(getMatchWinnerTeamId(regularMatch)).toBe(winnerTeamId);
      expect(getKnockoutAdvancementLabel(regularMatch, teams)).toBe(advancementLabel);
    }
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
