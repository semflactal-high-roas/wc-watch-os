import type { Match } from '../types';

export type ScheduleDisplayState = 'upcoming' | 'started_awaiting_result' | 'finished';

export type ScheduleMatchGroups<T extends Match = Match> = Record<ScheduleDisplayState, T[]>;

const displayStateLabels: Record<ScheduleDisplayState, string> = {
  upcoming: '開始前',
  started_awaiting_result: '開始済み / 結果待ち',
  finished: '終了済み',
};

const getKickoffTime = (match: Pick<Match, 'date' | 'kickoffTimeJST'>): number => {
  return new Date(`${match.date}T${match.kickoffTimeJST}:00+09:00`).getTime();
};

export const classifyScheduleMatch = (match: Match, now: Date = new Date()): ScheduleDisplayState => {
  if (match.played) return 'finished';
  if (getKickoffTime(match) <= now.getTime()) return 'started_awaiting_result';
  return 'upcoming';
};

export const getScheduleDisplayStateLabel = (state: ScheduleDisplayState): string => {
  return displayStateLabels[state];
};

export const getScheduleMatchStatusLabel = (match: Match, now: Date = new Date()): string => {
  return getScheduleDisplayStateLabel(classifyScheduleMatch(match, now));
};

export const groupScheduleMatchesByDisplayState = <T extends Match>(
  matches: T[],
  now: Date = new Date(),
): ScheduleMatchGroups<T> => {
  return matches.reduce<ScheduleMatchGroups<T>>(
    (groups, match) => {
      groups[classifyScheduleMatch(match, now)].push(match);
      return groups;
    },
    {
      upcoming: [],
      started_awaiting_result: [],
      finished: [],
    },
  );
};
