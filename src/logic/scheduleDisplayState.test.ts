import { describe, expect, it } from 'vitest';
import type { Match } from '../types';
import { classifyScheduleMatch, groupScheduleMatchesByDisplayState } from './scheduleDisplayState';

const match = (id: string, overrides: Partial<Match> = {}): Match => ({
  id,
  homeTeamId: 'AAA',
  awayTeamId: 'BBB',
  homeScore: null,
  awayScore: null,
  played: false,
  date: '2026-06-14',
  kickoffTimeJST: '18:00',
  groupId: 'A',
  stage: 'group',
  ...overrides,
});

const now = new Date('2026-06-14T06:00:00Z'); // 15:00 JST

describe('schedule display state', () => {
  it('classifies an unplayed match before kickoff as upcoming', () => {
    expect(classifyScheduleMatch(match('upcoming'), now)).toBe('upcoming');
  });

  it('classifies an unplayed match after kickoff as started and awaiting result', () => {
    expect(classifyScheduleMatch(match('started', { kickoffTimeJST: '14:00' }), now)).toBe('started_awaiting_result');
  });

  it('prioritizes played over kickoff time', () => {
    expect(classifyScheduleMatch(match('finished', { played: true, kickoffTimeJST: '18:00' }), now)).toBe('finished');
  });

  it('groups every match without leaving an already-started match in upcoming', () => {
    const matches = [
      match('upcoming'),
      match('started', { kickoffTimeJST: '14:00' }),
      match('finished', { played: true, homeScore: 1, awayScore: 0 }),
    ];

    const groups = groupScheduleMatchesByDisplayState(matches, now);

    expect(groups.upcoming.map((item) => item.id)).toEqual(['upcoming']);
    expect(groups.started_awaiting_result.map((item) => item.id)).toEqual(['started']);
    expect(groups.finished.map((item) => item.id)).toEqual(['finished']);
    expect(Object.values(groups).flat()).toHaveLength(matches.length);
  });
});
