import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const dataDir = path.join(repoRoot, 'public', 'data');

const validStages = new Set([
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

const readJson = async (fileName) => {
  const filePath = path.join(dataDir, fileName);
  const raw = await readFile(filePath, 'utf8');

  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`${fileName}: invalid JSON. ${error.message}`);
  }
};

const isRealDate = (value) => {
  if (typeof value !== 'string' || !datePattern.test(value)) return false;

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

const isValidKickoffTime = (value) => {
  if (typeof value !== 'string' || !kickoffTimePattern.test(value)) return false;

  const [hour, minute] = value.split(':').map(Number);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
};

const findDuplicateIds = (ids) => {
  const seen = new Set();
  const duplicates = new Set();

  ids.forEach((id) => {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  });

  return [...duplicates];
};

const formatId = (value) => (typeof value === 'string' && value.length > 0 ? value : '<missing id>');

const validateTeams = (teams) => {
  const errors = [];

  if (!Array.isArray(teams)) return ['teams.json: root value must be an array.'];

  const duplicateTeamIds = findDuplicateIds(teams.map((team) => team?.id).filter(Boolean));
  duplicateTeamIds.forEach((teamId) => {
    errors.push(`teams.json: team id "${teamId}" is duplicated.`);
  });

  teams.forEach((team, index) => {
    if (!team || typeof team !== 'object') {
      errors.push(`teams.json: item ${index + 1} must be an object.`);
      return;
    }

    if (typeof team.id !== 'string' || team.id.length === 0) {
      errors.push(`teams.json: item ${index + 1} has missing id.`);
    }

    if (typeof team.group !== 'string' || team.group.length === 0) {
      errors.push(`teams.json: team "${formatId(team.id)}" has missing group.`);
    }
  });

  return errors;
};

const validateGroups = (groups, teamIds) => {
  const errors = [];

  if (!Array.isArray(groups)) return ['groups.json: root value must be an array.'];

  groups.forEach((group, index) => {
    if (!group || typeof group !== 'object') {
      errors.push(`groups.json: item ${index + 1} must be an object.`);
      return;
    }

    if (typeof group.id !== 'string' || group.id.length === 0) {
      errors.push(`groups.json: item ${index + 1} has missing id.`);
    }

    if (!Array.isArray(group.teamIds)) {
      errors.push(`groups.json: group "${formatId(group.id)}" must have teamIds array.`);
      return;
    }

    group.teamIds.forEach((teamId) => {
      if (!teamIds.has(teamId)) {
        errors.push(`groups.json: group "${formatId(group.id)}" includes unknown teamId "${teamId}".`);
      }
    });
  });

  return errors;
};

const validateMatchScores = (match) => {
  const errors = [];
  const matchId = formatId(match.id);
  const hasHomeScore = typeof match.homeScore === 'number';
  const hasAwayScore = typeof match.awayScore === 'number';

  if (match.played === true && (!hasHomeScore || !hasAwayScore)) {
    errors.push(`matches.json: match "${matchId}" is played but homeScore / awayScore are not both numbers.`);
  }

  if (match.played === false) {
    const homeScoreIsValid = match.homeScore === null || hasHomeScore;
    const awayScoreIsValid = match.awayScore === null || hasAwayScore;

    if (!homeScoreIsValid || !awayScoreIsValid) {
      errors.push(`matches.json: match "${matchId}" is not played but homeScore / awayScore must be numbers or null.`);
    }
  }

  if (typeof match.played !== 'boolean') {
    errors.push(`matches.json: match "${matchId}" has invalid played value. Use true or false.`);
  }

  return errors;
};

const validateMatches = (matches, teams, groups) => {
  const errors = [];

  if (!Array.isArray(matches)) return ['matches.json: root value must be an array.'];

  const teamById = new Map(teams.map((team) => [team.id, team]));
  const teamIds = new Set(teamById.keys());
  const groupIds = new Set(groups.map((group) => group.id));
  const groupById = new Map(groups.map((group) => [group.id, group]));
  const duplicateMatchIds = findDuplicateIds(matches.map((match) => match?.id).filter(Boolean));

  duplicateMatchIds.forEach((matchId) => {
    errors.push(`matches.json: match id "${matchId}" is duplicated.`);
  });

  matches.forEach((match, index) => {
    if (!match || typeof match !== 'object') {
      errors.push(`matches.json: item ${index + 1} must be an object.`);
      return;
    }

    const matchId = formatId(match.id);
    const homeTeam = teamById.get(match.homeTeamId);
    const awayTeam = teamById.get(match.awayTeamId);

    if (typeof match.id !== 'string' || match.id.length === 0) {
      errors.push(`matches.json: item ${index + 1} has missing id.`);
    }

    if (!teamIds.has(match.homeTeamId)) {
      errors.push(`matches.json: match "${matchId}" has unknown homeTeamId "${match.homeTeamId}".`);
    }

    if (!teamIds.has(match.awayTeamId)) {
      errors.push(`matches.json: match "${matchId}" has unknown awayTeamId "${match.awayTeamId}".`);
    }

    if (match.homeTeamId === match.awayTeamId) {
      errors.push(`matches.json: match "${matchId}" has the same homeTeamId and awayTeamId "${match.homeTeamId}".`);
    }

    if (!isRealDate(match.date)) {
      errors.push(`matches.json: match "${matchId}" has invalid date "${match.date}". Use YYYY-MM-DD.`);
    }

    if (!isValidKickoffTime(match.kickoffTimeJST)) {
      errors.push(`matches.json: match "${matchId}" has invalid kickoffTimeJST "${match.kickoffTimeJST}". Use HH:mm.`);
    }

    if (!validStages.has(match.stage)) {
      errors.push(`matches.json: match "${matchId}" has invalid stage "${match.stage}".`);
    }

    if (match.stage === 'group' && !match.groupId) {
      errors.push(`matches.json: match "${matchId}" is group stage but groupId is missing.`);
    }

    if (match.groupId && !groupIds.has(match.groupId)) {
      errors.push(`matches.json: match "${matchId}" has unknown groupId "${match.groupId}".`);
    }

    if (match.stage === 'group' && match.groupId && groupIds.has(match.groupId)) {
      const group = groupById.get(match.groupId);
      const homeTeamInGroup = group?.teamIds.includes(match.homeTeamId) ?? false;
      const awayTeamInGroup = group?.teamIds.includes(match.awayTeamId) ?? false;

      if (homeTeam && homeTeam.group !== match.groupId) {
        errors.push(
          `matches.json: match "${matchId}" groupId "${match.groupId}" conflicts with home team "${match.homeTeamId}" group "${homeTeam.group}".`,
        );
      }

      if (awayTeam && awayTeam.group !== match.groupId) {
        errors.push(
          `matches.json: match "${matchId}" groupId "${match.groupId}" conflicts with away team "${match.awayTeamId}" group "${awayTeam.group}".`,
        );
      }

      if (!homeTeamInGroup) {
        errors.push(`matches.json: match "${matchId}" homeTeamId "${match.homeTeamId}" is not listed in groups.json group "${match.groupId}".`);
      }

      if (!awayTeamInGroup) {
        errors.push(`matches.json: match "${matchId}" awayTeamId "${match.awayTeamId}" is not listed in groups.json group "${match.groupId}".`);
      }
    }

    errors.push(...validateMatchScores(match));
  });

  return errors;
};

const validateAppData = ({ teams, groups, matches }) => {
  const safeTeams = Array.isArray(teams) ? teams : [];
  const safeGroups = Array.isArray(groups) ? groups : [];
  const teamIds = new Set(safeTeams.map((team) => team.id));

  return [
    ...validateTeams(teams),
    ...validateGroups(groups, teamIds),
    ...validateMatches(matches, safeTeams, safeGroups),
  ];
};

const main = async () => {
  const data = {
    teams: await readJson('teams.json'),
    groups: await readJson('groups.json'),
    matches: await readJson('matches.json'),
  };

  const errors = validateAppData(data);

  if (errors.length > 0) {
    console.error(`Data validation failed with ${errors.length} error(s):`);
    errors.forEach((error) => console.error(`- ${error}`));
    process.exitCode = 1;
    return;
  }

  console.log('Data validation passed: teams.json, groups.json, and matches.json are consistent.');
};

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
