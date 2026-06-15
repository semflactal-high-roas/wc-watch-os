import type { Match } from '../types';
import { toJstDateKey } from './dateFilters';
import { isFinishedMatchForDisplay } from './matchDisplayStatus';
import type { MatchWithImportance, UserPreferenceInput } from './matchImportance';

export type HomeMatchSections = {
  upcomingWatchMatches: MatchWithImportance[];
  todayFinishedImportantMatches: MatchWithImportance[];
  nextFeaturedMatches: MatchWithImportance[];
  hasTodayMatches: boolean;
  tournamentFinished: boolean;
};

const japanTeamId = 'JPN';
const getKickoffTime = (match: Pick<Match, 'date' | 'kickoffTimeJST'>): number => {
  return new Date(`${match.date}T${match.kickoffTimeJST}:00+09:00`).getTime();
};

export const isUpcomingMatch = (match: Match, now: Date = new Date()): boolean => {
  return !isFinishedMatchForDisplay(match) && getKickoffTime(match) >= now.getTime();
};

const matchIncludesTeam = (match: MatchWithImportance, teamId: string): boolean => {
  return match.homeTeamId === teamId || match.awayTeamId === teamId;
};

const getTrackedTeamIds = (preferences: UserPreferenceInput): string[] => {
  return [...new Set([japanTeamId, preferences.mainFavoriteTeamId, ...preferences.selectedTeamIds].filter(Boolean))];
};

const isTrackedTeamMatch = (match: MatchWithImportance, trackedTeamIds: string[]): boolean => {
  return trackedTeamIds.some((teamId) => matchIncludesTeam(match, teamId));
};

const isHighImportance = (match: MatchWithImportance): boolean => {
  return match.importanceLabel === 'S' || match.importanceLabel === 'A';
};

export const getHomeMatchSections = (
  rankedMatches: MatchWithImportance[],
  preferences: UserPreferenceInput,
  now: Date = new Date(),
): HomeMatchSections => {
  const todayKey = toJstDateKey(now);
  const trackedTeamIds = getTrackedTeamIds(preferences);
  const todayMatches = rankedMatches.filter((match) => match.date === todayKey);

  const upcomingWatchMatches = todayMatches.filter((match) => isUpcomingMatch(match, now));
  const todayFinishedImportantMatches = todayMatches.filter(
    (match) => isFinishedMatchForDisplay(match) && (isHighImportance(match) || isTrackedTeamMatch(match, trackedTeamIds)),
  );
  const nextFeaturedMatches = upcomingWatchMatches.length > 0
      ? []
      : rankedMatches
      .filter((match) => isUpcomingMatch(match, now) && (isHighImportance(match) || isTrackedTeamMatch(match, trackedTeamIds)))
      .sort((a, b) => getKickoffTime(a) - getKickoffTime(b) || b.importanceScore - a.importanceScore || a.id.localeCompare(b.id))
      .slice(0, 3);

  return {
    upcomingWatchMatches,
    todayFinishedImportantMatches,
    nextFeaturedMatches,
    hasTodayMatches: todayMatches.length > 0,
    tournamentFinished: rankedMatches.length > 0 && rankedMatches.every(isFinishedMatchForDisplay),
  };
};
