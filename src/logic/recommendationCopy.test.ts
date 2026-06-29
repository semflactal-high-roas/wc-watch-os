import { describe, expect, it } from 'vitest';
import type { Match, Team } from '../types';
import { getRecommendationReason } from './recommendationCopy';

const teams: Team[] = [
  { id: 'JPN', name: 'Japan', group: 'F', fifaRank: 18 },
  { id: 'BRA', name: 'Brazil', group: 'C', fifaRank: 1 },
  { id: 'NED', name: 'Netherlands', group: 'F', fifaRank: 7 },
  { id: 'MAR', name: 'Morocco', group: 'C', fifaRank: 14 },
  { id: 'CAN', name: 'Canada', group: 'B', fifaRank: 35 },
  { id: 'RSA', name: 'South Africa', group: 'A', fifaRank: 55 },
];

const match = (overrides: Partial<Match> = {}): Match => ({
  id: 'R32-02',
  homeTeamId: 'BRA',
  awayTeamId: 'JPN',
  homeScore: null,
  awayScore: null,
  played: false,
  date: '2026-06-30',
  kickoffTimeJST: '02:00',
  stage: 'round_of_32',
  ...overrides,
});

const forbiddenGroupPhaseTerms = ['勝点', 'グループ突破', '突破条件', '3位通過ライン', '同じ組'];

describe('getRecommendationReason', () => {
  it('uses knockout wording for a Japan R32 match', () => {
    const reason = getRecommendationReason(match(), teams);

    expect(reason).toContain('ノックアウト戦');
    expect(reason).toContain('勝者が次ラウンドへ進む一発勝負');
    for (const term of forbiddenGroupPhaseTerms) {
      expect(reason).not.toContain(term);
    }
  });

  it('uses a fixed next-opponent hint for Netherlands vs Morocco', () => {
    const reason = getRecommendationReason(match({ id: 'R32-04', homeTeamId: 'NED', awayTeamId: 'MAR' }), teams);

    expect(reason).toBe('勝者がR16でCanadaと対戦し、次ラウンドのカードが決まる試合です。');
    for (const term of forbiddenGroupPhaseTerms) {
      expect(reason).not.toContain(term);
    }
  });

  it('uses archive wording for a group-stage match after the fixed bracket is available', () => {
    const reason = getRecommendationReason(match({
      id: 'G-F-01',
      homeTeamId: 'NED',
      awayTeamId: 'JPN',
      groupId: 'F',
      stage: 'group',
      played: true,
      homeScore: 2,
      awayScore: 1,
    }), teams);

    expect(reason).toBe('日本代表が関係したグループステージの試合です。結果と記録を確認できます。');
    for (const term of forbiddenGroupPhaseTerms) {
      expect(reason).not.toContain(term);
    }
  });
});
