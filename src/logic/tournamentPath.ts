import type { Group, Match, StandingRow } from '../types';

export type ProvisionalTournamentSlot = {
  id: string;
  sourceLabel: string;
  teamId: string | null;
  status: 'provisional' | 'unresolved';
};

export type ProvisionalTournamentGroup = {
  groupId: string;
  isProvisional: boolean;
  slots: ProvisionalTournamentSlot[];
};

export type ProvisionalTournamentBracket = {
  status: 'unofficial_provisional_beta';
  groupSlots: ProvisionalTournamentGroup[];
  thirdPlaceSlots: ProvisionalTournamentSlot[];
};

type GroupStanding = {
  groupId: string;
  rows: StandingRow[];
};

type BuildProvisionalTournamentBracketInput = {
  standingsByGroup: GroupStanding[];
  groups: Group[];
  matches: Match[];
  qualifyCount?: number;
};

const groupMatchesAreComplete = (group: Group, matches: Match[]): boolean => {
  const groupMatches = matches.filter(
    (match) =>
      match.stage === 'group' &&
      (match.groupId === group.id ||
        (group.teamIds.includes(match.homeTeamId) && group.teamIds.includes(match.awayTeamId))),
  );

  return groupMatches.length > 0 && groupMatches.every((match) => match.played);
};

export const buildProvisionalTournamentBracket = ({
  standingsByGroup,
  groups,
  matches,
  qualifyCount = 8,
}: BuildProvisionalTournamentBracketInput): ProvisionalTournamentBracket => {
  const groupSlots = groups.map((group) => {
    const standing = standingsByGroup.find((candidate) => candidate.groupId === group.id);
    const isProvisional = !groupMatchesAreComplete(group, matches);

    return {
      groupId: group.id,
      isProvisional,
      slots: [0, 1].map((rankIndex) => ({
        id: `group-${group.id}-rank-${rankIndex + 1}`,
        sourceLabel: `Group ${group.id} 現在${rankIndex + 1}位`,
        teamId: standing?.rows[rankIndex]?.teamId ?? null,
        status: 'provisional' as const,
      })),
    };
  });

  const thirdPlaceSlots = Array.from({ length: qualifyCount }, (_, index) => ({
    id: `third-place-${index + 1}`,
    sourceLabel: `3位通過枠 ${index + 1}`,
    teamId: null,
    status: 'unresolved' as const,
  }));

  return {
    status: 'unofficial_provisional_beta',
    groupSlots,
    thirdPlaceSlots,
  };
};
