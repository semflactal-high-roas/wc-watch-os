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
  it('claims standings reflection only when played is true', () => {
    expect(getFinishedMatchResultMessage(match({ played: true, homeScore: 2, awayScore: 2 }))).toContain('結果が反映されています');
  });

  it('explains that a status-only finished result is awaiting manual update', () => {
    const statusFinishedMatch = { ...match(), status: 'finished' };

    expect(getFinishedMatchResultMessage(statusFinishedMatch)).toBe('試合は終了扱いですが、結果は手動更新後に順位表・3位通過ラインへ反映されます。');
  });

  it('returns no finished-result message for an upcoming match', () => {
    expect(getFinishedMatchResultMessage(match())).toBeNull();
  });
});
