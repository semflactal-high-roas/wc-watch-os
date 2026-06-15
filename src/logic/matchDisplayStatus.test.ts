import { describe, expect, it } from 'vitest';
import type { Match } from '../types';
import { getFinishedMatchResultMessage } from './matchDisplayStatus';

const match = (overrides: Partial<Match> = {}): Match => ({
  id: 'G-F-01',
  homeTeamId: 'NED',
  awayTeamId: 'JPN',
  homeScore: null,
  awayScore: null,
  played: false,
  date: '2026-06-15',
  kickoffTimeJST: '05:00',
  groupId: 'F',
  stage: 'group',
  ...overrides,
});

describe('finished match result message', () => {
  it('claims standings reflection for a played group-stage match', () => {
    expect(getFinishedMatchResultMessage(match({ played: true, homeScore: 2, awayScore: 2 }))).toBe(
      '終了した試合です。現在の順位表・3位通過ラインに結果が反映されています。',
    );
  });

  it('explains that a status-only finished group-stage result is awaiting manual standings update', () => {
    const statusFinishedMatch = { ...match(), status: 'finished' };

    expect(getFinishedMatchResultMessage(statusFinishedMatch)).toBe('試合は終了扱いですが、結果は手動更新後に順位表・3位通過ラインへ反映されます。');
  });

  it('does not claim standings reflection for a played knockout match', () => {
    const message = getFinishedMatchResultMessage(match({ stage: 'round_of_16', played: true, homeScore: 2, awayScore: 1 }));

    expect(message).not.toContain('順位表');
    expect(message).not.toContain('3位通過ライン');
  });

  it('explains that knockout winners are not propagated by the provisional bracket', () => {
    expect(getFinishedMatchResultMessage(match({ stage: 'round_of_16', played: true, homeScore: 2, awayScore: 1 }))).toBe(
      '終了したノックアウトステージの試合です。現在の暫定トーナメント表βでは、勝者の次ラウンド反映は未対応です。',
    );
  });

  it('does not claim standings reflection for a status-only finished knockout match', () => {
    const message = getFinishedMatchResultMessage({ ...match({ stage: 'round_of_16' }), status: 'finished' });

    expect(message).toBe(
      '試合は終了扱いですが、結果は手動更新後に確認できます。現在の暫定トーナメント表βでは、勝者の次ラウンド反映は未対応です。',
    );
    expect(message).not.toContain('順位表');
    expect(message).not.toContain('3位通過ライン');
  });

  it('returns no finished-result message for an upcoming match', () => {
    expect(getFinishedMatchResultMessage(match())).toBeNull();
  });
});
