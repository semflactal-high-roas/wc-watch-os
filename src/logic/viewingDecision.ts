import type { Match } from '../types';
import type { MatchImportanceLabel } from './matchImportance';

const jstOffsetMs = 9 * 60 * 60 * 1000;
const dayMs = 24 * 60 * 60 * 1000;

const getJstParts = (date: Date): { dateKey: string; hour: number } => {
  const jst = new Date(date.getTime() + jstOffsetMs);
  return {
    dateKey: `${jst.getUTCFullYear()}-${String(jst.getUTCMonth() + 1).padStart(2, '0')}-${String(jst.getUTCDate()).padStart(2, '0')}`,
    hour: jst.getUTCHours(),
  };
};

const getDateDistance = (fromDateKey: string, toDateKey: string): number => {
  return Math.round((Date.parse(`${toDateKey}T00:00:00Z`) - Date.parse(`${fromDateKey}T00:00:00Z`)) / dayMs);
};

export const getViewingDecisionLabel = (label: MatchImportanceLabel): string => {
  if (label === 'S') return '起きて見るべき';
  if (label === 'A') return '結果だけ必ず確認';
  if (label === 'B') return 'ハイライトで十分';
  return '寝ていい';
};

export const formatViewingDecisionTime = (match: Pick<Match, 'date' | 'kickoffTimeJST'>, now: Date = new Date()): string => {
  const { dateKey: todayKey, hour: nowHour } = getJstParts(now);
  const dateDistance = getDateDistance(todayKey, match.date);
  const [hourText, minute = '00'] = match.kickoffTimeJST.split(':');
  const hour = Number(hourText);

  if (!Number.isFinite(hour)) return `${match.date} ${match.kickoffTimeJST}`;

  if (dateDistance === 0) {
    if (hour <= 10) return `今朝${hour}:${minute}`;
    if (hour >= 18) return `今夜${hour}:${minute}`;
    return `今日${hour}:${minute}`;
  }

  if (dateDistance === 1) {
    if (hour <= 2 && nowHour >= 17) return `今夜${hour + 24}:${minute}`;
    if (hour <= 10) return `明朝${hour}:${minute}`;
    return `明日${hour}:${minute}`;
  }

  const [, month, day] = match.date.split('-');
  return `${Number(month)}/${Number(day)} ${match.kickoffTimeJST}`;
};
