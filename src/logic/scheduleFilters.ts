import { filterTodayMatches, filterUpcomingMatches } from './dateFilters';
import type { Match, Team } from '../types';

export type ScheduleFilterId = 'today_next' | 'japan' | 'supported' | 'japan_group' | 'all';

export type SchedulePreferenceInput = {
  mainFavoriteTeamId: string;
  selectedTeamIds: string[];
};

export type ScheduleFilterOption = {
  id: ScheduleFilterId;
  label: string;
  count: number;
};

export type ScheduleFilterResult = {
  matches: Match[];
  message?: string;
};

const japanTeamId = 'JPN';

const sortMatchesByKickoff = <T extends Match>(matches: T[]): T[] => {
  return [...matches].sort(
    (a, b) =>
      Number(a.played) - Number(b.played) ||
      a.date.localeCompare(b.date) ||
      a.kickoffTimeJST.localeCompare(b.kickoffTimeJST) ||
      a.id.localeCompare(b.id),
  );
};

const matchIncludesTeam = (match: Match, teamId: string): boolean => {
  return match.homeTeamId === teamId || match.awayTeamId === teamId;
};

const getSupportedTeamIds = (preferences: SchedulePreferenceInput): string[] => {
  return [...new Set([preferences.mainFavoriteTeamId, ...preferences.selectedTeamIds].filter(Boolean))];
};

const getJapanGroupId = (teams: Team[]): string => {
  return teams.find((team) => team.id === japanTeamId)?.group ?? '';
};

export const getTodayOrNextMatches = (matches: Match[], today: Date = new Date()): ScheduleFilterResult & { isFallback: boolean } => {
  const todayMatches = sortMatchesByKickoff(filterTodayMatches(matches, today));
  if (todayMatches.length > 0) return { matches: todayMatches, isFallback: false };

  const upcomingMatches = sortMatchesByKickoff(filterUpcomingMatches(matches, today));
  const nextMatch = upcomingMatches[0];
  if (!nextMatch) return { matches: [], isFallback: true };

  return {
    matches: upcomingMatches.filter((match) => match.date === nextMatch.date),
    isFallback: true,
    message: '今日の対象試合がないため、次の開催日の試合を表示しています。',
  };
};

export const filterScheduleMatches = (
  matches: Match[],
  teams: Team[],
  preferences: SchedulePreferenceInput,
  filterId: ScheduleFilterId,
  today: Date = new Date(),
): ScheduleFilterResult => {
  if (filterId === 'today_next') {
    const result = getTodayOrNextMatches(matches, today);
    return { matches: result.matches, message: result.message };
  }

  if (filterId === 'japan') {
    return { matches: sortMatchesByKickoff(matches.filter((match) => matchIncludesTeam(match, japanTeamId))) };
  }

  if (filterId === 'supported') {
    const supportedTeamIds = getSupportedTeamIds(preferences);
    if (supportedTeamIds.length === 0) {
      return {
        matches: [],
        message: '応援する国が未設定です。設定画面で応援する国を選ぶと、関連試合を絞り込めます。',
      };
    }

    return {
      matches: sortMatchesByKickoff(matches.filter((match) => supportedTeamIds.some((teamId) => matchIncludesTeam(match, teamId)))),
    };
  }

  if (filterId === 'japan_group') {
    const japanGroupId = getJapanGroupId(teams);
    return {
      matches: sortMatchesByKickoff(matches.filter((match) => match.groupId === japanGroupId)),
    };
  }

  return { matches: sortMatchesByKickoff(matches) };
};

export const getScheduleFilterOptions = (
  matches: Match[],
  teams: Team[],
  preferences: SchedulePreferenceInput,
  today: Date = new Date(),
): ScheduleFilterOption[] => {
  const filterIds: { id: ScheduleFilterId; label: string }[] = [
    { id: 'today_next', label: '今日・次の試合' },
    { id: 'japan', label: '日本代表' },
    { id: 'supported', label: '応援する国' },
    { id: 'japan_group', label: '日本のグループ' },
    { id: 'all', label: 'すべて' },
  ];

  return filterIds.map((option) => ({
    ...option,
    count: filterScheduleMatches(matches, teams, preferences, option.id, today).matches.length,
  }));
};
