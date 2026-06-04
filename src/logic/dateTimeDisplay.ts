import type { Match } from '../types';

const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
const datePattern = /^(\d{4})-(\d{2})-(\d{2})$/;

const parseDateParts = (date: string): { year: number; month: number; day: number } | null => {
  const match = date.match(datePattern);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) {
    return null;
  }

  return { year, month, day };
};

export const getJapaneseWeekdayLabel = (date: string): string => {
  const parts = parseDateParts(date);
  if (!parts) return '';

  const weekdayIndex = new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();
  return weekdays[weekdayIndex] ?? '';
};

export const formatJstDateWithWeekday = (date: string): string => {
  const weekday = getJapaneseWeekdayLabel(date);
  return weekday ? `${date}（${weekday}）` : date;
};

export const formatCompactJstDateWithWeekday = (date: string): string => {
  const parts = parseDateParts(date);
  if (!parts) return date;

  const weekday = getJapaneseWeekdayLabel(date);
  return `${parts.month}/${parts.day}${weekday ? `（${weekday}）` : ''}`;
};

export const formatMatchDateTime = (match: Match): string => {
  return `${formatJstDateWithWeekday(match.date)}${match.kickoffTimeJST} 日本時間`;
};

export const formatCompactMatchDateTime = (match: Match): string => {
  return `${formatCompactJstDateWithWeekday(match.date)}${match.kickoffTimeJST} 日本時間`;
};
