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
): MatchWithImportance => {
  const importanceScore = overrides.importanceScore ?? 70;
  const importanceLabel = overrides.importanceLabel ?? 'A';
  return {
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
    importanceScore,
    importanceRank: 1,
    importanceLabel,
    preMatchImportanceScore: overrides.preMatchImportanceScore ?? importanceScore,
    preMatchImportanceLabel: overrides.preMatchImportanceLabel ?? importanceLabel,
    reasonTags: [],
    ...overrides,
  };
};

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

  it('excludes a match at the exact kickoff time from upcoming watch matches', () => {
    const kickoffNow = new Date('2026-06-12T09:00:00Z');
    const sections = getHomeMatchSections([
      match('kickoff-now'),
      match('still-upcoming', { kickoffTimeJST: '18:01' }),
    ], preferences, kickoffNow);

    expect(sections.upcomingWatchMatches.map((item) => item.id)).toEqual(['still-upcoming']);
  });

  it('excludes a status-finished match from upcoming watch matches without changing the match schema', () => {
    const statusFinishedMatch = { ...match('status-finished', { kickoffTimeJST: '11:00' }), status: 'finished' };
    const sections = getHomeMatchSections([statusFinishedMatch], preferences, now);

    expect(sections.upcomingWatchMatches).toEqual([]);
    expect(sections.recentFinishedImportantMatches.map((item) => item.id)).toEqual(['status-finished']);
  });

  it('shows only important or tracked finished matches in recent results', () => {
    const sections = getHomeMatchSections([
      match('important', { played: true, kickoffTimeJST: '11:00', importanceLabel: 'A' }),
      match('tracked', { played: true, kickoffTimeJST: '11:00', homeTeamId: 'NED', importanceLabel: 'C' }),
      match('low', { played: true, kickoffTimeJST: '11:00', importanceLabel: 'C' }),
    ], preferences, now);

    expect(sections.recentFinishedImportantMatches.map((item) => item.id)).toEqual(['important', 'tracked']);
  });

  it('includes tomorrow morning matches within the next 36 hours and prioritizes at most three', () => {
    const sections = getHomeMatchSections([
      match('low', { importanceScore: 30, importanceLabel: 'C' }),
      match('highest', { importanceScore: 100, importanceLabel: 'S' }),
      match('middle', { importanceScore: 50, importanceLabel: 'B' }),
      match('high', { importanceScore: 80, importanceLabel: 'S' }),
      match('tomorrow-morning', { date: '2026-06-13', kickoffTimeJST: '04:00', importanceScore: 90, importanceLabel: 'S' }),
    ], preferences, now);

    expect(sections.upcomingWatchMatches.map((item) => item.id)).toEqual(['highest', 'tomorrow-morning', 'high']);
  });

  it('excludes an unstarted match beyond the 36-hour viewing decision window', () => {
    const sections = getHomeMatchSections([
      match('inside-window', { date: '2026-06-13', kickoffTimeJST: '23:59' }),
      match('outside-window', { date: '2026-06-14', kickoffTimeJST: '00:01' }),
    ], preferences, now);

    expect(sections.upcomingWatchMatches.map((item) => item.id)).toEqual(['inside-window']);
  });

  it('returns at most three important or tracked finished matches for recent results', () => {
    const sections = getHomeMatchSections([
      match('result-1', { played: true, kickoffTimeJST: '11:00', importanceScore: 100, importanceLabel: 'S' }),
      match('result-2', { played: true, kickoffTimeJST: '11:00', importanceScore: 90, importanceLabel: 'S' }),
      match('result-3', { played: true, kickoffTimeJST: '11:00', importanceScore: 80, importanceLabel: 'S' }),
      match('result-4', { played: true, kickoffTimeJST: '11:00', importanceScore: 70, importanceLabel: 'A' }),
    ], preferences, now);

    expect(sections.recentFinishedImportantMatches.map((item) => item.id)).toEqual(['result-1', 'result-2', 'result-3']);
  });

  it('includes an important finished match from the last 24 hours but excludes older results', () => {
    const resultNow = new Date('2026-06-13T03:00:00Z'); // 12:00 JST
    const sections = getHomeMatchSections([
      match('recent-result', { played: true, date: '2026-06-12', kickoffTimeJST: '13:00', importanceLabel: 'A' }),
      match('old-result', { played: true, date: '2026-06-12', kickoffTimeJST: '11:59', importanceLabel: 'A' }),
    ], preferences, resultNow);

    expect(sections.recentFinishedImportantMatches.map((item) => item.id)).toEqual(['recent-result']);
  });

  it('keeps a recent pre-match important result after display importance falls to C across JST midnight', () => {
    const resultNow = new Date('2026-06-13T03:00:00Z'); // 12:00 JST
    const sections = getHomeMatchSections([
      match('recent-final', {
        played: true,
        date: '2026-06-12',
        kickoffTimeJST: '13:00',
        stage: 'final',
        importanceScore: 0,
        importanceLabel: 'C',
        preMatchImportanceScore: 90,
        preMatchImportanceLabel: 'S',
      }),
    ], preferences, resultNow);

    expect(sections.recentFinishedImportantMatches.map((item) => item.id)).toEqual(['recent-final']);
  });

  it('continues to exclude an unrelated low-importance recent result', () => {
    const resultNow = new Date('2026-06-13T03:00:00Z'); // 12:00 JST
    const sections = getHomeMatchSections([
      match('low-result', {
        played: true,
        date: '2026-06-12',
        kickoffTimeJST: '13:00',
        importanceScore: -50,
        importanceLabel: 'C',
        preMatchImportanceScore: 40,
        preMatchImportanceLabel: 'B',
      }),
    ], preferences, resultNow);

    expect(sections.recentFinishedImportantMatches).toEqual([]);
  });

  it('returns at most three next featured matches when the 36-hour window has no upcoming match', () => {
    const sections = getHomeMatchSections([
      match('next-1', { date: '2026-06-14' }),
      match('next-2', { date: '2026-06-15', homeTeamId: 'JPN', importanceLabel: 'C' }),
      match('next-3', { date: '2026-06-16' }),
      match('next-4', { date: '2026-06-17' }),
      match('not-featured', { date: '2026-06-14', importanceLabel: 'C', importanceScore: 30 }),
    ], preferences, now);

    expect(sections.nextFeaturedMatches.map((item) => item.id)).toEqual(['next-1', 'next-2', 'next-3']);
  });

  it('returns next featured matches when every near-term match has already finished', () => {
    const sections = getHomeMatchSections([
      match('finished-today', { played: true, kickoffTimeJST: '11:00' }),
      match('next', { date: '2026-06-14' }),
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
