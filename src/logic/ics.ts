import type { Match, Team } from '../types';

type MatchIcsOptions = {
  importanceLabel?: string;
  importanceScore?: number;
  reasonTags?: string[];
};

type MatchWithDisplayNames = Match & {
  homeDisplayName?: string;
  awayDisplayName?: string;
};

const teamName = (teams: Team[], teamId: string): string => {
  return teams.find((team) => team.id === teamId)?.name ?? teamId;
};

const pad = (value: number): string => String(value).padStart(2, '0');

const formatIcsDateTime = (date: Date): string => {
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
};

const parseJstDateTime = (date: string, kickoffTimeJST: string): Date => {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = kickoffTimeJST.split(':').map(Number);

  return new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1, (hour ?? 0) - 9, minute ?? 0, 0));
};

const escapeIcsText = (value: string): string => {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
};

const foldIcsLine = (line: string): string => {
  if (line.length <= 73) return line;

  const chunks: string[] = [];
  let remaining = line;
  while (remaining.length > 73) {
    chunks.push(remaining.slice(0, 73));
    remaining = remaining.slice(73);
  }
  chunks.push(remaining);

  return chunks.map((chunk, index) => (index === 0 ? chunk : ` ${chunk}`)).join('\r\n');
};

const makeLine = (key: string, value: string): string => foldIcsLine(`${key}:${escapeIcsText(value)}`);

export const createMatchIcsEvent = (match: Match, teams: Team[], options: MatchIcsOptions = {}): string => {
  const displayMatch = match as MatchWithDisplayNames;
  const homeTeam = displayMatch.homeDisplayName ?? teamName(teams, match.homeTeamId);
  const awayTeam = displayMatch.awayDisplayName ?? teamName(teams, match.awayTeamId);
  const start = parseJstDateTime(match.date, match.kickoffTimeJST);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const now = new Date();
  const stage = match.stage === 'group' && match.groupId ? `Group ${match.groupId}` : match.stage;
  const title = `W杯観戦: ${homeTeam} vs ${awayTeam}`;
  const description = [
    `stage: ${stage}`,
    match.groupId ? `groupId: ${match.groupId}` : '',
    options.importanceLabel ? `importanceLabel: ${options.importanceLabel}` : '',
    typeof options.importanceScore === 'number' ? `importanceScore: ${options.importanceScore}` : '',
    options.reasonTags && options.reasonTags.length > 0 ? `reasonTags: ${options.reasonTags.join(', ')}` : '',
    '今日見るべきW杯 - 観戦OS から追加した予定です。',
  ].filter(Boolean).join('\n');

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//wc-watch-os//match-reminder//JA',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    makeLine('UID', `wc-watch-os-${match.id}@semflactal-high-roas.github.io`),
    `DTSTAMP:${formatIcsDateTime(now)}`,
    `DTSTART:${formatIcsDateTime(start)}`,
    `DTEND:${formatIcsDateTime(end)}`,
    makeLine('SUMMARY', title),
    makeLine('DESCRIPTION', description),
    makeLine('LOCATION', '今日見るべきW杯 - 観戦OS'),
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    makeLine('DESCRIPTION', `${title} まで30分です`),
    'TRIGGER:-PT30M',
    'END:VALARM',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    makeLine('DESCRIPTION', `${title} まで5分です`),
    'TRIGGER:-PT5M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return `${lines.join('\r\n')}\r\n`;
};

export const downloadIcsFile = (filename: string, content: string): void => {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};
