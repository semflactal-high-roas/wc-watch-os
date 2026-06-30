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
const validDecidedBy = new Set(['regular', 'extra_time', 'penalties']);

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
  const hasHomePenaltyScore = typeof match.homePenaltyScore === 'number';
  const hasAwayPenaltyScore = typeof match.awayPenaltyScore === 'number';
  const hasPenaltyScore = hasHomePenaltyScore || hasAwayPenaltyScore;

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

  if (!match.played && (hasPenaltyScore || match.winnerTeamId || match.decidedBy)) {
    errors.push(`matches.json: match "${match.id}" is not played but penalty scores, winnerTeamId, or decidedBy are set.`);
  }

  if (match.decidedBy !== undefined && !validDecidedBy.has(match.decidedBy)) {
    errors.push(`matches.json: match "${match.id}" has invalid decidedBy "${match.decidedBy}".`);
  }

  if (match.homePenaltyScore !== undefined && !hasHomePenaltyScore) {
    errors.push(`matches.json: match "${match.id}" has invalid homePenaltyScore.`);
  }

  if (match.awayPenaltyScore !== undefined && !hasAwayPenaltyScore) {
    errors.push(`matches.json: match "${match.id}" has invalid awayPenaltyScore.`);
  }

  if (hasPenaltyScore && (!hasHomePenaltyScore || !hasAwayPenaltyScore)) {
    errors.push(`matches.json: match "${match.id}" must include both penalty scores.`);
  }

  if (hasPenaltyScore && match.decidedBy !== 'penalties') {
    errors.push(`matches.json: match "${match.id}" has penalty scores but is not decidedBy "penalties".`);
  }

  if (match.decidedBy === 'penalties') {
    if (match.stage === 'group') {
      errors.push(`matches.json: match "${match.id}" cannot be decided by penalties in the group stage.`);
    }

    if (typeof match.winnerTeamId !== 'string' || match.winnerTeamId.length === 0) {
      errors.push(`matches.json: match "${match.id}" is decided by penalties but winnerTeamId is missing.`);
    }

    if (!hasHomeScore || !hasAwayScore || match.homeScore !== match.awayScore) {
      errors.push(`matches.json: match "${match.id}" is decided by penalties but homeScore / awayScore are not tied numbers.`);
    }

    if (!hasHomePenaltyScore || !hasAwayPenaltyScore) {
      errors.push(`matches.json: match "${match.id}" is decided by penalties but penalty scores are missing.`);
    } else if (match.homePenaltyScore === match.awayPenaltyScore) {
      errors.push(`matches.json: match "${match.id}" has tied penalty scores.`);
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

    if (match.winnerTeamId !== undefined) {
      if (!teamIds.has(match.winnerTeamId)) {
        errors.push(`matches.json: match "${match.id}" has unknown winnerTeamId "${match.winnerTeamId}".`);
      } else if (![match.homeTeamId, match.awayTeamId].includes(match.winnerTeamId)) {
        errors.push(`matches.json: match "${match.id}" winnerTeamId must be either homeTeamId or awayTeamId.`);
      }
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

    if (match.played && match.winnerTeamId) {
      if (match.decidedBy === 'penalties' && typeof match.homePenaltyScore === 'number' && typeof match.awayPenaltyScore === 'number') {
        const penaltyWinnerTeamId = match.homePenaltyScore > match.awayPenaltyScore ? match.homeTeamId : match.awayTeamId;
        if (match.winnerTeamId !== penaltyWinnerTeamId) {
          errors.push(`matches.json: match "${match.id}" winnerTeamId does not match the penalty score winner.`);
        }
      } else if (typeof match.homeScore === 'number' && typeof match.awayScore === 'number' && match.homeScore !== match.awayScore) {
        const scoreWinnerTeamId = match.homeScore > match.awayScore ? match.homeTeamId : match.awayTeamId;
        if (match.winnerTeamId !== scoreWinnerTeamId) {
          errors.push(`matches.json: match "${match.id}" winnerTeamId does not match the score winner.`);
        }
      } else if (match.decidedBy !== 'penalties') {
        errors.push(`matches.json: match "${match.id}" has winnerTeamId but no deterministic score or penalty winner.`);
      }
    }
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
