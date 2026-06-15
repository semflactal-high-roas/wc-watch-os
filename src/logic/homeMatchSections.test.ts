import { describe, expect, it } from 'vitest';
import type { MatchWithImportance, UserPreferenceInput } from './matchImportance';
import { getHomeMatchSections } from './homeMatchSections';

const preferences: UserPreferenceInput = {
  mainFavoriteTeamId: 'NED',
  selectedTeamIds: ['BRA'],
};

const match = (
  id: string,
  overrides: Partial<MatchWithImportance> = {},
): MatchWithImportance => ({
  id,
  homeTeamId: 'AAA',
  awayTeamId: 'BBB',
  homeScore: null,
  awayScore: null,
  played: false,
  date: '2026-06-12',
  kickoffTimeJST: '18:00',
  groupId: 'A',
  stage: 'group',
  importanceScore: 70,
  importanceRank: 1,
  importanceLabel: 'A',
  reasonTags: [],
  ...overrides,
});

const now = new Date('2026-06-12T03:00:00Z');

describe('getHomeMatchSections', () => {
  it('excludes played and already-started matches from upcoming watch matches', () => {
    const sections = getHomeMatchSections([
      match('upcoming'),
      match('played', { played: true, homeScore: 1, awayScore: 0 }),
      match('started', { kickoffTimeJST: '11:00' }),
    ], preferences, now);

    expect(sections.upcomingWatchMatches.map((item) => item.id)).toEqual(['upcoming']);
  });

  it('excludes a status-finished match from upcoming watch matches without changing the match schema', () => {
    const statusFinishedMatch = { ...match('status-finished'), status: 'finished' };
    const sections = getHomeMatchSections([statusFinishedMatch], preferences, now);

    expect(sections.upcomingWatchMatches).toEqual([]);
    expect(sections.todayFinishedImportantMatches.map((item) => item.id)).toEqual(['status-finished']);
  });

  it('shows only important or tracked finished matches in today results', () => {
    const sections = getHomeMatchSections([
      match('important', { played: true, importanceLabel: 'A' }),
      match('tracked', { played: true, homeTeamId: 'NED', importanceLabel: 'C' }),
      match('low', { played: true, importanceLabel: 'C' }),
    ], preferences, now);

    expect(sections.todayFinishedImportantMatches.map((item) => item.id)).toEqual(['important', 'tracked']);
  });

  it('prioritizes upcoming watch matches by importance and returns at most three', () => {
    const sections = getHomeMatchSections([
      match('low', { importanceScore: 30, importanceLabel: 'C' }),
      match('highest', { importanceScore: 100, importanceLabel: 'S' }),
      match('middle', { importanceScore: 50, importanceLabel: 'B' }),
      match('high', { importanceScore: 80, importanceLabel: 'S' }),
    ], preferences, now);

    expect(sections.upcomingWatchMatches.map((item) => item.id)).toEqual(['highest', 'high', 'middle']);
  });

  it('returns at most three important or tracked finished matches for today results', () => {
    const sections = getHomeMatchSections([
      match('result-1', { played: true, importanceScore: 100, importanceLabel: 'S' }),
      match('result-2', { played: true, importanceScore: 90, importanceLabel: 'S' }),
      match('result-3', { played: true, importanceScore: 80, importanceLabel: 'S' }),
      match('result-4', { played: true, importanceScore: 70, importanceLabel: 'A' }),
    ], preferences, now);

    expect(sections.todayFinishedImportantMatches.map((item) => item.id)).toEqual(['result-1', 'result-2', 'result-3']);
  });

  it('returns at most three next featured matches when today has no upcoming match', () => {
    const sections = getHomeMatchSections([
      match('next-1', { date: '2026-06-13' }),
      match('next-2', { date: '2026-06-14', homeTeamId: 'JPN', importanceLabel: 'C' }),
      match('next-3', { date: '2026-06-15' }),
      match('next-4', { date: '2026-06-16' }),
      match('not-featured', { date: '2026-06-13', importanceLabel: 'C' }),
    ], preferences, now);

    expect(sections.nextFeaturedMatches.map((item) => item.id)).toEqual(['next-1', 'next-2', 'next-3']);
  });

  it('returns next featured matches when every match today has already finished', () => {
    const sections = getHomeMatchSections([
      match('finished-today', { played: true }),
      match('next', { date: '2026-06-13' }),
    ], preferences, now);

    expect(sections.nextFeaturedMatches.map((item) => item.id)).toEqual(['next']);
  });

  it('does not return next featured matches while an upcoming match exists today', () => {
    const sections = getHomeMatchSections([
      match('today'),
      match('next', { date: '2026-06-13' }),
    ], preferences, now);

    expect(sections.nextFeaturedMatches).toEqual([]);
  });

  it('marks the tournament finished only when every match is played', () => {
    expect(getHomeMatchSections([match('done', { played: true })], preferences, now).tournamentFinished).toBe(true);
    expect(getHomeMatchSections([match('remaining')], preferences, now).tournamentFinished).toBe(false);
  });
});
