import type { Match, MatchStage, Team } from '../types';
import { buildTournamentTree, type BracketMatch, type ResolvedBracketSlot, type TournamentRound } from './tournamentPath';

export type GeneratedKnockoutScheduleMatch = Match & {
  homeDisplayName: string;
  awayDisplayName: string;
  isGeneratedKnockoutSchedule: true;
};

const generatedRounds: Exclude<TournamentRound, 'round32'>[] = [
  'round16',
  'quarterfinal',
  'semifinal',
  'third_place',
  'final',
];

const stageByRound: Record<Exclude<TournamentRound, 'round32'>, MatchStage> = {
  round16: 'round_of_16',
  quarterfinal: 'quarter_final',
  semifinal: 'semi_final',
  third_place: 'third_place',
  final: 'final',
};

const teamName = (teams: Team[], teamId: string): string => {
  const team = teams.find((candidate) => candidate.id === teamId);
  if (!team) return teamId;
  return team.flagEmoji ? `${team.name} ${team.flagEmoji}` : team.name;
};

const slotDisplayName = (slot: ResolvedBracketSlot, teams: Team[]): string => {
  if (slot.teamId) return teamName(teams, slot.teamId);

  if (slot.candidateTeamIds?.length === 2) {
    const [firstTeamId, secondTeamId] = slot.candidateTeamIds;
    if (firstTeamId && secondTeamId) {
      const relationLabel = slot.relation === 'loser' ? '敗者' : '勝者';
      return `${teamName(teams, firstTeamId)} vs ${teamName(teams, secondTeamId)} の${relationLabel}`;
    }
  }

  return slot.sourceLabel;
};

const toGeneratedScheduleMatch = (match: BracketMatch, teams: Team[]): GeneratedKnockoutScheduleMatch | null => {
  const stage = stageByRound[match.round as Exclude<TournamentRound, 'round32'>];
  if (!stage || !match.date || !match.kickoffTimeJST) return null;

  return {
    id: match.id,
    homeTeamId: match.home.teamId ?? '',
    awayTeamId: match.away.teamId ?? '',
    homeDisplayName: slotDisplayName(match.home, teams),
    awayDisplayName: slotDisplayName(match.away, teams),
    homeScore: match.homeScore ?? null,
    awayScore: match.awayScore ?? null,
    homePenaltyScore: match.homePenaltyScore,
    awayPenaltyScore: match.awayPenaltyScore,
    winnerTeamId: match.winnerTeamId,
    decidedBy: match.decidedBy,
    played: match.played ?? false,
    date: match.date,
    kickoffTimeJST: match.kickoffTimeJST,
    stage,
    isGeneratedKnockoutSchedule: true,
  };
};

export const buildGeneratedKnockoutScheduleMatches = (
  matches: Match[],
  teams: Team[],
): GeneratedKnockoutScheduleMatch[] => {
  const tree = buildTournamentTree({ matches });

  return generatedRounds.flatMap((round) =>
    tree.rounds[round].flatMap((match) => {
      const generatedMatch = toGeneratedScheduleMatch(match, teams);
      return generatedMatch ? [generatedMatch] : [];
    }),
  );
};

export const mergeGeneratedKnockoutScheduleMatches = (matches: Match[], teams: Team[]): Match[] => {
  const existingIds = new Set(matches.map((match) => match.id));
  const generatedMatches = buildGeneratedKnockoutScheduleMatches(matches, teams)
    .filter((match) => !existingIds.has(match.id));

  return [...matches, ...generatedMatches];
};
