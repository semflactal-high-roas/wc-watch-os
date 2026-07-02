import { formatMatchDateTime } from './dateTimeDisplay';
import { formatKickoffWithTimeOfDay } from './timeOfDayLabel';
import type { Match, Team } from '../types';

const appUrl = 'https://semflactal-high-roas.github.io/wc-watch-os/';

const formatTeamName = (teams: Team[], teamId: string): string => {
  const team = teams.find((candidate) => candidate.id === teamId);
  if (!team) return teamId;
  return team.flagEmoji ? `${team.name} ${team.flagEmoji}` : team.name;
};

const formatMatchStage = (match: Match): string => {
  if (match.stage === 'group' && match.groupId) return `Group ${match.groupId}`;
  return match.stage;
};

export type MatchShareOptions = {
  importanceLabel?: string;
  recommendationReason?: string;
};

type MatchWithDisplayNames = Match & {
  homeDisplayName?: string;
  awayDisplayName?: string;
};

export const buildMatchShareText = (match: Match, teams: Team[], options: MatchShareOptions = {}): string => {
  const displayMatch = match as MatchWithDisplayNames;
  const homeTeam = displayMatch.homeDisplayName ?? formatTeamName(teams, match.homeTeamId);
  const awayTeam = displayMatch.awayDisplayName ?? formatTeamName(teams, match.awayTeamId);
  const matchup = `${homeTeam} vs ${awayTeam}`;
  const kickoffLabel = formatKickoffWithTimeOfDay(match.kickoffTimeJST);
  const importance = options.importanceLabel ? ` / 重要度 ${options.importanceLabel}` : '';

  return [
    '⚽ W杯 観戦ナビ',
    matchup,
    `${formatMatchDateTime(match)}（${kickoffLabel}）`,
    `${formatMatchStage(match)}${importance}`,
    '',
    options.recommendationReason ?? '日本時間で見る価値を整理した試合です。',
    '',
    appUrl,
    '#W杯観戦ナビ',
  ].join('\n');
};

const copyWithTextareaFallback = (text: string): boolean => {
  if (typeof document === 'undefined') return false;

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.top = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    return document.execCommand('copy');
  } finally {
    document.body.removeChild(textarea);
  }
};

export const copyTextToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    return copyWithTextareaFallback(text);
  }

  return copyWithTextareaFallback(text);
};
