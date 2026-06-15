import { describe, expect, it } from 'vitest';
import type { AppData, Match, StandingRow } from '../types';
import { getJapanScenarioSummary, getNextJapanMatch } from './japanScenario';

const match = (id: string, homeTeamId: string, awayTeamId: string, overrides: Partial<Match> = {}): Match => ({
  id,
  homeTeamId,
  awayTeamId,
  homeScore: null,
  awayScore: null,
  played: false,
  date: '2026-06-20',
  kickoffTimeJST: '12:00',
  groupId: 'F',
  stage: 'group',
  ...overrides,
});

const standing = (teamId: string): StandingRow => ({
  teamId,
  played: 0,
  won: 0,
  draw: 0,
  lost: 0,
  goalsFor: 0,
  goalsAgainst: 0,
  goalDiff: 0,
  points: 0,
});

const statusFinishedJapanMatch = { ...match('status-finished-japan', 'JPN', 'NED'), status: 'finished' };
const upcomingJapanMatch = match('upcoming-japan', 'TUN', 'JPN', { date: '2026-06-21' });
const statusFinishedGroupMatch = { ...match('status-finished-group', 'SWE', 'NED'), status: 'finished' };
const upcomingGroupMatch = match('upcoming-group', 'SWE', 'TUN', { date: '2026-06-22' });

const data: AppData = {
  teams: [
    { id: 'JPN', name: 'Japan', group: 'F', fifaRank: 1 },
    { id: 'NED', name: 'Netherlands', group: 'F', fifaRank: 2 },
    { id: 'SWE', name: 'Sweden', group: 'F', fifaRank: 3 },
    { id: 'TUN', name: 'Tunisia', group: 'F', fifaRank: 4 },
  ],
  groups: [{ id: 'F', teamIds: ['JPN', 'NED', 'SWE', 'TUN'] }],
  matches: [statusFinishedJapanMatch, upcomingJapanMatch, statusFinishedGroupMatch, upcomingGroupMatch],
  config: {},
};

describe('Japan scenario display-finished handling', () => {
  it('excludes status-only finished matches from the next Japan match', () => {
    expect(getNextJapanMatch([statusFinishedJapanMatch, upcomingJapanMatch])?.id).toBe('upcoming-japan');
  });

  it('excludes status-only finished matches from remaining and watch-group matches', () => {
    const summary = getJapanScenarioSummary(data, [{ groupId: 'F', rows: data.teams.map((team) => standing(team.id)) }]);

    expect(summary.remainingMatches).toBe(1);
    expect(summary.nextMatch?.id).toBe('upcoming-japan');
    expect(summary.watchGroupMatches.map((item) => item.id)).toEqual(['upcoming-group']);
  });
});
