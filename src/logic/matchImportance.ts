import { isPastMatch, isTodayMatch, isTomorrowMatch } from './dateFilters';
import type { Group, Match, MatchStage, Team } from '../types';
import { isFinishedMatchForDisplay } from './matchDisplayStatus';

export type UserPreferenceInput = {
  mainFavoriteTeamId: string;
  selectedTeamIds: string[];
};

export type MatchImportanceLabel = 'S' | 'A' | 'B' | 'C';

export type MatchWithImportance = Match & {
  importanceScore: number;
  importanceRank: number;
  importanceLabel: MatchImportanceLabel;
  preMatchImportanceScore: number;
  preMatchImportanceLabel: MatchImportanceLabel;
  reasonTags: string[];
};

type ScoredImportance = Pick<MatchWithImportance, 'importanceScore' | 'importanceLabel' | 'reasonTags'>;
type ImportanceTiming = 'current' | 'pre_match';

const knockoutStageScores: Partial<Record<MatchStage, number>> = {
  round_of_32: 20,
  round_of_16: 20,
  quarter_final: 30,
  semi_final: 40,
  third_place: 20,
  final: 50,
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
    match.groupId ?? findTeamGroup(teams, match.homeTeamId),
    match.groupId ?? findTeamGroup(teams, match.awayTeamId),
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
  today: Date,
  timing: ImportanceTiming = 'current',
): ScoredImportance => {
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
    reasonTags.push('応援する国の試合');
  }

  if (selectedTeamIds.some((teamId) => matchIncludesTeam(match, teamId))) {
    importanceScore += 30;
    reasonTags.push('一緒に追いかける国の試合');
  }

  if (timing === 'pre_match') {
    importanceScore += 10;
    reasonTags.push('これから');
  } else {
    if (isFinishedMatchForDisplay(match)) {
      importanceScore -= 20;
      reasonTags.push('終了');
    } else {
      importanceScore += 10;
      reasonTags.push('これから');
    }
  }

  if (timing === 'pre_match') {
    importanceScore += 30;
    reasonTags.push('試合当日');
  } else {
    if (isTodayMatch(match, today)) {
      importanceScore += 30;
      reasonTags.push('今日');
    } else if (isTomorrowMatch(match, today)) {
      importanceScore += 15;
      reasonTags.push('明日');
    } else if (isPastMatch(match, today)) {
      importanceScore -= 30;
      reasonTags.push('過去日程');
    }
  }

  if (targetTeamIds.length > 0 && match.stage === 'group' && isSameGroupMatch(match, teams, groups, targetTeamIds)) {
    importanceScore += 20;
    reasonTags.push('応援する国のグループ関連');
  }

  const stageScore = knockoutStageScores[match.stage] ?? 0;
  if (stageScore > 0) {
    importanceScore += stageScore;
    reasonTags.push(match.stage === 'final' ? '決勝' : '決勝トーナメント');
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
  today: Date = new Date(),
): MatchWithImportance[] => {
  return matches
    .map((match) => {
      const currentImportance = scoreMatch(match, teams, groups, preferences, today);
      const preMatchImportance = scoreMatch(match, teams, groups, preferences, today, 'pre_match');
      return {
        ...match,
        ...currentImportance,
        preMatchImportanceScore: preMatchImportance.importanceScore,
        preMatchImportanceLabel: preMatchImportance.importanceLabel,
        importanceRank: 0,
      };
    })
    .sort(
      (a, b) =>
        b.importanceScore - a.importanceScore ||
        a.date.localeCompare(b.date) ||
        a.kickoffTimeJST.localeCompare(b.kickoffTimeJST) ||
        a.id.localeCompare(b.id),
    )
    .map((match, index) => ({ ...match, importanceRank: index + 1 }));
};
