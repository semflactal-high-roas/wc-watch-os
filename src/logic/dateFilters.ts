import type { Match } from '../types';

const toDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

export const isTodayMatch = (match: Match, today: Date): boolean => {
  return match.date === toDateKey(today);
};

export const isTomorrowMatch = (match: Match, today: Date): boolean => {
  return match.date === toDateKey(addDays(today, 1));
};

export const filterTodayMatches = <T extends Match>(matches: T[], today: Date): T[] => {
  return matches.filter((match) => isTodayMatch(match, today));
};

export const filterUpcomingMatches = <T extends Match>(matches: T[], today: Date): T[] => {
  const todayKey = toDateKey(today);
  return matches
    .filter((match) => !match.played && match.date >= todayKey)
    .sort((a, b) => a.date.localeCompare(b.date) || a.kickoffTimeJST.localeCompare(b.kickoffTimeJST));
};

export const isPastMatch = (match: Match, today: Date): boolean => {
  return match.date < toDateKey(today);
};
