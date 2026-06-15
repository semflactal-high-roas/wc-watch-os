import { describe, expect, it } from 'vitest';
import type { Group, Match, Team } from '../types';
import { rankMatchesByImportance } from './matchImportance';

const teams: Team[] = [
  { id: 'AAA', name: 'Alpha', group: 'A', fifaRank: 1 },
  { id: 'BBB', name: 'Beta', group: 'A', fifaRank: 2 },
];

const groups: Group[] = [{ id: 'A', teamIds: ['AAA', 'BBB'] }];

const final: Match = {
  id: 'F-TEST',
  homeTeamId: 'AAA',
  awayTeamId: 'BBB',
  homeScore: 1,
  awayScore: 0,
  played: true,
  date: '2026-06-12',
  kickoffTimeJST: '00:00',
  stage: 'final',
};

describe('rankMatchesByImportance JST date scoring', () => {
  it('scores a finished match on the current JST day as today', () => {
    const now = new Date('2026-06-11T15:30:00Z');
    const [ranked] = rankMatchesByImportance([final], teams, groups, { mainFavoriteTeamId: '', selectedTeamIds: [] }, now);
    expect(ranked).toBeDefined();
    if (!ranked) throw new Error('Expected ranked match');

    expect(ranked.reasonTags).toContain('今日');
    expect(ranked.importanceScore).toBe(60);
    expect(ranked.importanceLabel).toBe('A');
    expect(ranked.preMatchImportanceScore).toBe(90);
    expect(ranked.preMatchImportanceLabel).toBe('S');
  });

  it('does not tag status finished as upcoming', () => {
    const statusFinishedFinal = { ...final, played: false, status: 'finished' };
    const [ranked] = rankMatchesByImportance([statusFinishedFinal], teams, groups, { mainFavoriteTeamId: '', selectedTeamIds: [] }, new Date('2026-06-11T15:30:00Z'));
    expect(ranked).toBeDefined();
    if (!ranked) throw new Error('Expected ranked match');

    expect(ranked.reasonTags).toContain('終了');
    expect(ranked.reasonTags).not.toContain('これから');
  });

  it('preserves pre-match importance after a finished match crosses JST midnight', () => {
    const recentFinal = { ...final, date: '2026-06-12', kickoffTimeJST: '13:00' };
    const [ranked] = rankMatchesByImportance([recentFinal], teams, groups, { mainFavoriteTeamId: '', selectedTeamIds: [] }, new Date('2026-06-13T03:00:00Z'));
    expect(ranked).toBeDefined();
    if (!ranked) throw new Error('Expected ranked match');

    expect(ranked.importanceLabel).toBe('C');
    expect(ranked.preMatchImportanceLabel).toBe('S');
  });
});
