import { describe, expect, it } from 'vitest';
import { formatViewingDecisionTime, getViewingDecisionLabel } from './viewingDecision';

describe('viewing decision display', () => {
  it('maps internal importance labels to viewer decisions', () => {
    expect(getViewingDecisionLabel('S')).toBe('起きて見るべき');
    expect(getViewingDecisionLabel('A')).toBe('結果だけ必ず確認');
    expect(getViewingDecisionLabel('B')).toBe('ハイライトで十分');
    expect(getViewingDecisionLabel('C')).toBe('寝ていい');
  });

  it('shows an early next-day kickoff as tonight after a working-day evening', () => {
    const now = new Date('2026-06-12T11:00:00Z'); // 20:00 JST
    expect(formatViewingDecisionTime({ date: '2026-06-13', kickoffTimeJST: '01:00' }, now)).toBe('今夜25:00');
  });

  it('shows a next-day morning kickoff as tomorrow morning before evening', () => {
    const now = new Date('2026-06-12T06:00:00Z'); // 15:00 JST
    expect(formatViewingDecisionTime({ date: '2026-06-13', kickoffTimeJST: '04:00' }, now)).toBe('明朝4:00');
  });
});
