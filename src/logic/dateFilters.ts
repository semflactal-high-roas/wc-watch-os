import type { Match } from '../types';

const jstTimeZone = 'Asia/Tokyo';

export const toJstDateKey = (date: Date): string => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: jstTimeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '';
  return `${value('year')}-${value('month')}-${value('day')}`;
};

const addDaysToDateKey = (dateKey: string, days: number): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) return dateKey;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return next.toISOString().slice(0, 10);
};

export const isTodayMatch = (match: Match, today: Date): boolean => {
  return match.date === toJstDateKey(today);
};

export const isTomorrowMatch = (match: Match, today: Date): boolean => {
  return match.date === addDaysToDateKey(toJstDateKey(today), 1);
};

export const filterTodayMatches = <T extends Match>(matches: T[], today: Date): T[] => {
  return matches.filter((match) => isTodayMatch(match, today));
};

export const filterUpcomingMatches = <T extends Match>(matches: T[], today: Date): T[] => {
  const todayKey = toJstDateKey(today);
  return matches
    .filter((match) => !match.played && match.date >= todayKey)
    .sort((a, b) => a.date.localeCompare(b.date) || a.kickoffTimeJST.localeCompare(b.kickoffTimeJST));
};

export const isPastMatch = (match: Match, today: Date): boolean => {
  return match.date < toJstDateKey(today);
};
