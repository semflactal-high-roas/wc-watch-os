import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const dataDir = path.join(repoRoot, 'public', 'data');

const expectedGroupIds = 'ABCDEFGHIJKL'.split('');
const expectedGroupIdSet = new Set(expectedGroupIds);
const expectedTeamsPerGroup = 4;
const expectedMatchesPerGroup = 6;
const expectedGroupStageMatches = expectedGroupIds.length * expectedMatchesPerGroup;

const validStages = new Set([
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
const groupMatchIdPattern = /^G-([A-L])-0([1-6])$/;
const httpsUrlPattern = /^https:\/\/.+/;

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

const fixtureKey = (teamIdA, teamIdB) => [teamIdA, teamIdB].sort().join('|');
const formatFixture = (teamIdA, teamIdB) => [teamIdA, teamIdB].sort().join(' vs ');

const validateConfig = (config) => {
  const errors = [];

  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    return ['config.json: root value must be an object.'];
  }

  if (typeof config.appName !== 'string' || config.appName.trim().length === 0) {
    errors.push('config.json: appName must be a non-empty string.');
  }

  if (!isRealDate(config.lastUpdated)) {
    errors.push(`config.json: lastUpdated must be YYYY-MM-DD, found ${config.lastUpdated}.`);
  }

  if (typeof config.scheduleSourceName !== 'string' || config.scheduleSourceName.trim().length === 0) {
    errors.push('config.json: scheduleSourceName must be a non-empty string.');
  }

  if (typeof config.scheduleSourceUrl !== 'string' || !httpsUrlPattern.test(config.scheduleSourceUrl)) {
    errors.push('config.json: scheduleSourceUrl must start with https://.');
  }

  return errors;
};

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

const validateGroups = (groups, teams) => {
  const errors = [];

  if (!Array.isArray(groups)) return ['groups.json: root value must be an array.'];

  const teamById = new Map(teams.map((team) => [team.id, team]));
  const groupById = new Map(groups.map((group) => [group?.id, group]));
  const duplicateGroupIds = findDuplicateIds(groups.map((group) => group?.id).filter(Boolean));

  duplicateGroupIds.forEach((groupId) => {
    errors.push(`groups.json: group id "${groupId}" is duplicated.`);
  });

  if (groups.length !== expectedGroupIds.length) {
    errors.push(`groups.json: must contain ${expectedGroupIds.length} groups A-L, found ${groups.length}.`);
  }

  expectedGroupIds.forEach((groupId) => {
    if (!groupById.has(groupId)) {
      errors.push(`groups.json: missing Group ${groupId}.`);
    }
  });

  groups.forEach((group, index) => {
    if (!group || typeof group !== 'object') {
      errors.push(`groups.json: item ${index + 1} must be an object.`);
      return;
    }

    const groupId = formatId(group.id);

    if (typeof group.id !== 'string' || group.id.length === 0) {
      errors.push(`groups.json: item ${index + 1} has missing id.`);
    } else if (!expectedGroupIdSet.has(group.id)) {
      errors.push(`groups.json: group "${group.id}" is invalid. Expected groupId A-L.`);
    }

    if (!Array.isArray(group.teamIds)) {
      errors.push(`groups.json: group "${groupId}" must have teamIds array.`);
      return;
    }

    if (group.teamIds.length !== expectedTeamsPerGroup) {
      errors.push(`Group ${groupId} must have ${expectedTeamsPerGroup} teamIds, found ${group.teamIds.length}.`);
    }

    const duplicateTeamIds = findDuplicateIds(group.teamIds);
    duplicateTeamIds.forEach((teamId) => {
      errors.push(`groups.json: group "${groupId}" has duplicate teamId "${teamId}".`);
    });

    group.teamIds.forEach((teamId) => {
      const team = teamById.get(teamId);

      if (!team) {
        errors.push(`groups.json: group "${groupId}" includes unknown teamId "${teamId}".`);
        return;
      }

      if (team.group !== group.id) {
        errors.push(`groups.json: team "${teamId}" is listed in Group ${groupId} but teams.json group is "${team.group}".`);
      }
    });
  });

  teams.forEach((team) => {
    if (!team?.id || !team?.group || !expectedGroupIdSet.has(team.group)) return;

    const group = groupById.get(team.group);
    if (group && Array.isArray(group.teamIds) && !group.teamIds.includes(team.id)) {
      errors.push(`teams.json: team "${team.id}" has group "${team.group}" but is missing from groups.json Group ${team.group}.`);
    }
  });

  return errors;
};

const validateMatchScores = (match) => {
  const errors = [];
  const matchId = formatId(match.id);
  const hasHomeScore = typeof match.homeScore === 'number';
  const hasAwayScore = typeof match.awayScore === 'number';
  const hasHomePenaltyScore = typeof match.homePenaltyScore === 'number';
  const hasAwayPenaltyScore = typeof match.awayPenaltyScore === 'number';
  const hasPenaltyScore = hasHomePenaltyScore || hasAwayPenaltyScore;

  if (match.played === true && (!hasHomeScore || !hasAwayScore)) {
    errors.push(`Match ${matchId} is played but homeScore / awayScore are not both numbers.`);
  }

  if (match.played === false && (match.homeScore !== null || match.awayScore !== null)) {
    errors.push(`Match ${matchId} is not played, so homeScore / awayScore must both be null.`);
  }

  if (match.played === false && (hasPenaltyScore || match.winnerTeamId || match.decidedBy)) {
    errors.push(`Match ${matchId} is not played, so penalty scores, winnerTeamId, and decidedBy must be omitted.`);
  }

  if (typeof match.played !== 'boolean') {
    errors.push(`Match ${matchId} has invalid played value. Use true or false.`);
  }

  if (match.decidedBy !== undefined && !validDecidedBy.has(match.decidedBy)) {
    errors.push(`Match ${matchId} has invalid decidedBy: ${match.decidedBy}.`);
  }

  if (match.homePenaltyScore !== undefined && !hasHomePenaltyScore) {
    errors.push(`Match ${matchId} has invalid homePenaltyScore. Use a number or omit the field.`);
  }

  if (match.awayPenaltyScore !== undefined && !hasAwayPenaltyScore) {
    errors.push(`Match ${matchId} has invalid awayPenaltyScore. Use a number or omit the field.`);
  }

  if (hasPenaltyScore && (!hasHomePenaltyScore || !hasAwayPenaltyScore)) {
    errors.push(`Match ${matchId} must include both homePenaltyScore and awayPenaltyScore for a penalty shootout.`);
  }

  if (hasPenaltyScore && match.decidedBy !== 'penalties') {
    errors.push(`Match ${matchId} has penalty scores but decidedBy is not "penalties".`);
  }

  if (match.decidedBy === 'penalties') {
    if (match.stage === 'group') {
      errors.push(`Match ${matchId} cannot use decidedBy "penalties" in the group stage.`);
    }

    if (typeof match.winnerTeamId !== 'string' || match.winnerTeamId.length === 0) {
      errors.push(`Match ${matchId} is decided by penalties but winnerTeamId is missing.`);
    }

    if (!hasHomeScore || !hasAwayScore || match.homeScore !== match.awayScore) {
      errors.push(`Match ${matchId} is decided by penalties but homeScore / awayScore are not tied numbers.`);
    }

    if (!hasHomePenaltyScore || !hasAwayPenaltyScore) {
      errors.push(`Match ${matchId} is decided by penalties but penalty scores are missing.`);
    } else if (match.homePenaltyScore === match.awayPenaltyScore) {
      errors.push(`Match ${matchId} has tied penalty scores.`);
    }
  }

  return errors;
};

const validateRoundRobinFixtures = (group, groupMatches) => {
  const errors = [];
  const groupId = formatId(group.id);

  if (!Array.isArray(group.teamIds) || group.teamIds.length !== expectedTeamsPerGroup) {
    return errors;
  }

  const expectedFixtures = new Map();
  for (let i = 0; i < group.teamIds.length; i += 1) {
    for (let j = i + 1; j < group.teamIds.length; j += 1) {
      const homeTeamId = group.teamIds[i];
      const awayTeamId = group.teamIds[j];
      expectedFixtures.set(fixtureKey(homeTeamId, awayTeamId), formatFixture(homeTeamId, awayTeamId));
    }
  }

  const seenFixtures = new Map();
  groupMatches.forEach((match) => {
    if (!group.teamIds.includes(match.homeTeamId) || !group.teamIds.includes(match.awayTeamId) || match.homeTeamId === match.awayTeamId) {
      return;
    }

    const key = fixtureKey(match.homeTeamId, match.awayTeamId);
    const label = formatFixture(match.homeTeamId, match.awayTeamId);

    if (seenFixtures.has(key)) {
      errors.push(`Duplicate fixture in Group ${groupId}: ${label}`);
      return;
    }

    seenFixtures.set(key, match.id);
  });

  expectedFixtures.forEach((label, key) => {
    if (!seenFixtures.has(key)) {
      errors.push(`Missing fixture in Group ${groupId}: ${label}`);
    }
  });

  return errors;
};

const validateGroupStageShape = (matches, groups) => {
  const errors = [];
  const groupMatches = matches.filter((match) => match?.stage === 'group');
  const groupById = new Map(groups.map((group) => [group.id, group]));

  if (groupMatches.length !== expectedGroupStageMatches) {
    errors.push(`matches.json: stage "group" must have ${expectedGroupStageMatches} matches, found ${groupMatches.length}.`);
  }

  expectedGroupIds.forEach((groupId) => {
    const matchesInGroup = groupMatches.filter((match) => match.groupId === groupId);

    if (matchesInGroup.length !== expectedMatchesPerGroup) {
      errors.push(`Group ${groupId} must have ${expectedMatchesPerGroup} group-stage matches, found ${matchesInGroup.length}.`);
    }

    for (let i = 1; i <= expectedMatchesPerGroup; i += 1) {
      const expectedMatchId = `G-${groupId}-0${i}`;
      if (!matchesInGroup.some((match) => match.id === expectedMatchId)) {
        errors.push(`Group ${groupId} is missing matchId ${expectedMatchId}.`);
      }
    }

    const group = groupById.get(groupId);
    if (group) {
      errors.push(...validateRoundRobinFixtures(group, matchesInGroup));
    }
  });

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
      errors.push(`Match ${matchId} has unknown homeTeamId: ${match.homeTeamId}`);
    }

    if (!teamIds.has(match.awayTeamId)) {
      errors.push(`Match ${matchId} has unknown awayTeamId: ${match.awayTeamId}`);
    }

    if (match.winnerTeamId !== undefined) {
      if (!teamIds.has(match.winnerTeamId)) {
        errors.push(`Match ${matchId} has unknown winnerTeamId: ${match.winnerTeamId}`);
      } else if (![match.homeTeamId, match.awayTeamId].includes(match.winnerTeamId)) {
        errors.push(`Match ${matchId} winnerTeamId must be either homeTeamId or awayTeamId.`);
      }
    }

    if (match.homeTeamId === match.awayTeamId) {
      errors.push(`Match ${matchId} has the same homeTeamId and awayTeamId: ${match.homeTeamId}`);
    }

    if (!isRealDate(match.date)) {
      errors.push(`Match ${matchId} has invalid date: ${match.date}`);
    }

    if (!isValidKickoffTime(match.kickoffTimeJST)) {
      errors.push(`Match ${matchId} has invalid kickoffTimeJST: ${match.kickoffTimeJST}`);
    }

    if (!validStages.has(match.stage)) {
      errors.push(`Match ${matchId} has invalid stage: ${match.stage}`);
    }

    if (match.stage === 'group') {
      if (!match.groupId) {
        errors.push(`Match ${matchId} is group stage but groupId is missing.`);
      }

      const matchIdParts = typeof match.id === 'string' ? match.id.match(groupMatchIdPattern) : null;
      if (!matchIdParts) {
        errors.push(`Match ${matchId} has invalid group-stage matchId. Expected G-{groupId}-01 through G-{groupId}-06.`);
      } else if (match.groupId && matchIdParts[1] !== match.groupId) {
        errors.push(`Match ${matchId} groupId mismatch: matchId says ${matchIdParts[1]} but groupId is ${match.groupId}.`);
      }
    }

    if (match.groupId && !groupIds.has(match.groupId)) {
      errors.push(`Match ${matchId} has unknown groupId: ${match.groupId}`);
    }

    if (match.stage === 'group' && match.groupId && groupIds.has(match.groupId)) {
      const group = groupById.get(match.groupId);
      const homeTeamInGroup = group?.teamIds.includes(match.homeTeamId) ?? false;
      const awayTeamInGroup = group?.teamIds.includes(match.awayTeamId) ?? false;

      if (homeTeam && homeTeam.group !== match.groupId) {
        errors.push(`Match ${matchId} has team ${match.homeTeamId} but ${match.homeTeamId} is in Group ${homeTeam.group}, not Group ${match.groupId}.`);
      }

      if (awayTeam && awayTeam.group !== match.groupId) {
        errors.push(`Match ${matchId} has team ${match.awayTeamId} but ${match.awayTeamId} is in Group ${awayTeam.group}, not Group ${match.groupId}.`);
      }

      if (!homeTeamInGroup) {
        errors.push(`Match ${matchId} has team ${match.homeTeamId} but ${match.homeTeamId} is not in Group ${match.groupId}.`);
      }

      if (!awayTeamInGroup) {
        errors.push(`Match ${matchId} has team ${match.awayTeamId} but ${match.awayTeamId} is not in Group ${match.groupId}.`);
      }
    }

    errors.push(...validateMatchScores(match));

    if (match.played === true && match.winnerTeamId) {
      if (match.decidedBy === 'penalties' && typeof match.homePenaltyScore === 'number' && typeof match.awayPenaltyScore === 'number') {
        const penaltyWinnerTeamId = match.homePenaltyScore > match.awayPenaltyScore ? match.homeTeamId : match.awayTeamId;
        if (match.winnerTeamId !== penaltyWinnerTeamId) {
          errors.push(`Match ${matchId} winnerTeamId does not match the penalty score winner.`);
        }
      } else if (typeof match.homeScore === 'number' && typeof match.awayScore === 'number' && match.homeScore !== match.awayScore) {
        const scoreWinnerTeamId = match.homeScore > match.awayScore ? match.homeTeamId : match.awayTeamId;
        if (match.winnerTeamId !== scoreWinnerTeamId) {
          errors.push(`Match ${matchId} winnerTeamId does not match the score winner.`);
        }
      } else if (match.decidedBy !== 'penalties') {
        errors.push(`Match ${matchId} has winnerTeamId but no deterministic score or penalty winner.`);
      }
    }
  });

  errors.push(...validateGroupStageShape(matches, groups));

  return errors;
};

const validateAppData = ({ teams, groups, matches, config }) => {
  const safeTeams = Array.isArray(teams) ? teams : [];
  const safeGroups = Array.isArray(groups) ? groups : [];

  return [
    ...validateConfig(config),
    ...validateTeams(teams),
    ...validateGroups(groups, safeTeams),
    ...validateMatches(matches, safeTeams, safeGroups),
  ];
};

const getValidationSummary = ({ teams, groups, matches, config }) => {
  const groupMatches = Array.isArray(matches) ? matches.filter((match) => match?.stage === 'group') : [];

  return [
    `teams: ${Array.isArray(teams) ? teams.length : 0}`,
    `groups: ${Array.isArray(groups) ? groups.length : 0}`,
    `group-stage matches: ${groupMatches.length}`,
    `config appName: ${config?.appName ?? '<missing>'}`,
    `schedule source: ${config?.scheduleSourceName ?? '<missing>'}`,
    `each group has ${expectedTeamsPerGroup} teams`,
    `each group has ${expectedMatchesPerGroup} matches`,
    'all group fixtures are complete round-robin pairs',
  ];
};

const main = async () => {
  const data = {
    config: await readJson('config.json'),
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

  console.log('Data validation passed:');
  getValidationSummary(data).forEach((line) => console.log(`* ${line}`));
};

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
