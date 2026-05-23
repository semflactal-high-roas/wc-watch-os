import type { AppData, Group, Match, MatchStage, Team } from '../types';

const validStages = new Set<MatchStage>([
  'group',
  'round_of_32',
  'round_of_16',
  'quarter_final',
  'semi_final',
  'third_place',
  'final',
]);

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const kickoffTimePattern = /^\d{2}:\d{2}$/;

const isRealDate = (value: string): boolean => {
  if (!datePattern.test(value)) return false;

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === (month ?? 1) - 1 &&
    date.getUTCDate() === day
  );
};

const isValidKickoffTime = (value: string): boolean => {
  if (!kickoffTimePattern.test(value)) return false;

  const [hour, minute] = value.split(':').map(Number);
  return typeof hour === 'number' && typeof minute === 'number' && hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
};

const findDuplicateIds = (ids: string[]): string[] => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  ids.forEach((id) => {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  });

  return [...duplicates];
};

const validateTeams = (teams: Team[]): string[] => {
  const errors: string[] = [];
  const duplicateTeamIds = findDuplicateIds(teams.map((team) => team.id));

  duplicateTeamIds.forEach((teamId) => {
    errors.push(`teams.json: team id "${teamId}" is duplicated.`);
  });

  return errors;
};

const validateGroups = (groups: Group[], teamIds: Set<string>): string[] => {
  const errors: string[] = [];

  groups.forEach((group) => {
    group.teamIds.forEach((teamId) => {
      if (!teamIds.has(teamId)) {
        errors.push(`groups.json: group "${group.id}" includes unknown teamId "${teamId}".`);
      }
    });
  });

  return errors;
};

const validateMatchScores = (match: Match): string[] => {
  const errors: string[] = [];
  const hasHomeScore = typeof match.homeScore === 'number';
  const hasAwayScore = typeof match.awayScore === 'number';

  if (match.played && (!hasHomeScore || !hasAwayScore)) {
    errors.push(`matches.json: match "${match.id}" is played but homeScore / awayScore are not both numbers.`);
  }

  if (!match.played) {
    const homeScoreIsValid = match.homeScore === null || hasHomeScore;
    const awayScoreIsValid = match.awayScore === null || hasAwayScore;

    if (!homeScoreIsValid || !awayScoreIsValid) {
      errors.push(`matches.json: match "${match.id}" is not played but homeScore / awayScore must be numbers or null.`);
    }
  }

  return errors;
};

const validateMatches = (matches: Match[], teamIds: Set<string>, groupIds: Set<string>): string[] => {
  const errors: string[] = [];

  matches.forEach((match) => {
    if (!teamIds.has(match.homeTeamId)) {
      errors.push(`matches.json: match "${match.id}" has unknown homeTeamId "${match.homeTeamId}".`);
    }

    if (!teamIds.has(match.awayTeamId)) {
      errors.push(`matches.json: match "${match.id}" has unknown awayTeamId "${match.awayTeamId}".`);
    }

    if (!isRealDate(match.date)) {
      errors.push(`matches.json: match "${match.id}" has invalid date "${match.date}". Use YYYY-MM-DD.`);
    }

    if (!isValidKickoffTime(match.kickoffTimeJST)) {
      errors.push(`matches.json: match "${match.id}" has invalid kickoffTimeJST "${match.kickoffTimeJST}". Use HH:mm.`);
    }

    if (!validStages.has(match.stage)) {
      errors.push(`matches.json: match "${match.id}" has invalid stage "${match.stage}".`);
    }

    if (match.stage === 'group' && !match.groupId) {
      errors.push(`matches.json: match "${match.id}" is group stage but groupId is missing.`);
    }

    if (match.groupId && !groupIds.has(match.groupId)) {
      errors.push(`matches.json: match "${match.id}" has unknown groupId "${match.groupId}".`);
    }

    errors.push(...validateMatchScores(match));
  });

  return errors;
};

export const validateAppData = (data: AppData): string[] => {
  const teamIds = new Set(data.teams.map((team) => team.id));
  const groupIds = new Set(data.groups.map((group) => group.id));

  return [
    ...validateTeams(data.teams),
    ...validateGroups(data.groups, teamIds),
    ...validateMatches(data.matches, teamIds, groupIds),
  ];
};
