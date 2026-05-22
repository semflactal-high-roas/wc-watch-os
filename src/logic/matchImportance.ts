import type { Group, Match, Team } from '../types';

export type UserPreferenceInput = {
  mainFavoriteTeamId: string;
  selectedTeamIds: string[];
};

export type MatchImportanceLabel = 'S' | 'A' | 'B' | 'C';

export type MatchWithImportance = Match & {
  importanceScore: number;
  importanceRank: number;
  importanceLabel: MatchImportanceLabel;
  reasonTags: string[];
};

const getImportanceLabel = (score: number): MatchImportanceLabel => {
  if (score >= 80) return 'S';
  if (score >= 60) return 'A';
  if (score >= 40) return 'B';
  return 'C';
};

const matchIncludesTeam = (match: Match, teamId: string): boolean => {
  return match.homeTeamId === teamId || match.awayTeamId === teamId;
};

const findJapanTeamId = (teams: Team[]): string => {
  return teams.find((team) => team.name === 'Japan')?.id ?? '';
};

const findTeamGroup = (teams: Team[], teamId: string): string => {
  return teams.find((team) => team.id === teamId)?.group ?? '';
};

const isSameGroupMatch = (match: Match, teams: Team[], groups: Group[], targetTeamIds: string[]): boolean => {
  const matchGroups = new Set([
    findTeamGroup(teams, match.homeTeamId),
    findTeamGroup(teams, match.awayTeamId),
  ].filter(Boolean));

  if (matchGroups.size === 0) return false;

  return targetTeamIds.some((teamId) => {
    const teamGroup = findTeamGroup(teams, teamId);
    if (teamGroup && matchGroups.has(teamGroup)) return true;

    return groups.some((group) => {
      return group.teamIds.includes(teamId) && group.teamIds.includes(match.homeTeamId) && group.teamIds.includes(match.awayTeamId);
    });
  });
};

const scoreMatch = (
  match: Match,
  teams: Team[],
  groups: Group[],
  preferences: UserPreferenceInput,
): Omit<MatchWithImportance, keyof Match | 'importanceRank'> => {
  let importanceScore = 0;
  const reasonTags: string[] = [];
  const japanTeamId = findJapanTeamId(teams);
  const selectedTeamIds = preferences.selectedTeamIds.filter(Boolean);
  const targetTeamIds = [preferences.mainFavoriteTeamId, ...selectedTeamIds, japanTeamId].filter(Boolean);

  if (japanTeamId && matchIncludesTeam(match, japanTeamId)) {
    importanceScore += 50;
    reasonTags.push('日本戦');
  }

  if (preferences.mainFavoriteTeamId && matchIncludesTeam(match, preferences.mainFavoriteTeamId)) {
    importanceScore += 40;
    reasonTags.push('推し国の試合');
  }

  if (selectedTeamIds.some((teamId) => matchIncludesTeam(match, teamId))) {
    importanceScore += 30;
    reasonTags.push('気になる国の試合');
  }

  if (match.played) {
    importanceScore -= 20;
    reasonTags.push('消化済み');
  } else {
    importanceScore += 10;
    reasonTags.push('未実施');
  }

  if (targetTeamIds.length > 0 && isSameGroupMatch(match, teams, groups, targetTeamIds)) {
    importanceScore += 20;
    reasonTags.push('推し国と同組');
  }

  return {
    importanceScore,
    importanceLabel: getImportanceLabel(importanceScore),
    reasonTags: [...new Set(reasonTags)],
  };
};

export const rankMatchesByImportance = (
  matches: Match[],
  teams: Team[],
  groups: Group[],
  preferences: UserPreferenceInput,
): MatchWithImportance[] => {
  return matches
    .map((match) => ({
      ...match,
      ...scoreMatch(match, teams, groups, preferences),
      importanceRank: 0,
    }))
    .sort((a, b) => b.importanceScore - a.importanceScore || a.id.localeCompare(b.id))
    .map((match, index) => ({ ...match, importanceRank: index + 1 }));
};
