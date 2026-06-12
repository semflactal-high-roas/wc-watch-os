import { describe, expect, it } from 'vitest';
import type { Match } from '../types';
import { filterUpcomingMatches, isPastMatch, isTodayMatch, isTomorrowMatch, toJstDateKey } from './dateFilters';

const match = (id: string, date: string, played = false): Match => ({
  id,
  homeTeamId: 'AAA',
  awayTeamId: 'BBB',
  homeScore: played ? 1 : null,
  awayScore: played ? 0 : null,
  played,
  date,
  kickoffTimeJST: '12:00',
  groupId: 'A',
  stage: 'group',
});

describe('JST date filters', () => {
  const jstAfterMidnight = new Date('2026-06-11T15:30:00Z');

  it('uses the Japan date around JST midnight', () => {
    expect(toJstDateKey(jstAfterMidnight)).toBe('2026-06-12');
    expect(isTodayMatch(match('today', '2026-06-12'), jstAfterMidnight)).toBe(true);
    expect(isTomorrowMatch(match('tomorrow', '2026-06-13'), jstAfterMidnight)).toBe(true);
    expect(isPastMatch(match('past', '2026-06-11'), jstAfterMidnight)).toBe(true);
  });

  it('filters upcoming matches from the current JST date', () => {
    const matches = [
      match('past', '2026-06-11'),
      match('today', '2026-06-12'),
      match('tomorrow', '2026-06-13'),
      match('played', '2026-06-12', true),
    ];

    expect(filterUpcomingMatches(matches, jstAfterMidnight).map((item) => item.id)).toEqual(['today', 'tomorrow']);
  });
});
