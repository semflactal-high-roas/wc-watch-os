import { describe, expect, it } from 'vitest';
import type { Group, Match, StandingRow } from '../types';
import { calculateQualificationStatus, getQualificationSummary } from './qualificationStatus';

const groupIds = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

type TestGroup = Group & { teamIds: [string, string, string, string] };

const groups: TestGroup[] = groupIds.map((groupId) => ({
  id: groupId,
  teamIds: [`${groupId}1`, `${groupId}2`, `${groupId}3`, `${groupId}4`],
}));

const row = (teamId: string, points: number, goalDiff = 0, goalsFor = 0): StandingRow => ({
  teamId,
  played: 3,
  won: 0,
  draw: 0,
  lost: 0,
  goalsFor,
  goalsAgainst: Math.max(0, goalsFor - goalDiff),
  goalDiff,
  points,
});

const standings = groups.map((group) => ({
  groupId: group.id,
  rows: [
    row(group.teamIds[0], 9, 4, 6),
    row(group.teamIds[1], 6, 2, 5),
    row(group.teamIds[2], group.id === 'A' ? 4 : 3, group.id === 'A' ? 2 : 0, group.id === 'A' ? 4 : 2),
    row(group.teamIds[3], 0, -6, 0),
  ],
}));

const roundRobinPairs = (teamIds: TestGroup['teamIds']): Array<[string, string]> => [
  [teamIds[0], teamIds[1]],
  [teamIds[2], teamIds[3]],
  [teamIds[0], teamIds[2]],
  [teamIds[1], teamIds[3]],
  [teamIds[0], teamIds[3]],
  [teamIds[1], teamIds[2]],
];

const buildMatches = (completedGroupIds: Set<string>): Match[] =>
  groups.flatMap((group) =>
    roundRobinPairs(group.teamIds).map(([homeTeamId, awayTeamId], index) => {
      const played = completedGroupIds.has(group.id);
      return {
        id: `G-${group.id}-${String(index + 1).padStart(2, '0')}`,
        homeTeamId,
        awayTeamId,
        homeScore: played ? 1 : null,
        awayScore: played ? 0 : null,
        played,
        date: '2026-06-20',
        kickoffTimeJST: '12:00',
        groupId: group.id,
        stage: 'group',
      };
    }),
  );

const thirdPlaceRanking: StandingRow[] = standings.map((group) => group.rows[2]!);

describe('qualification status', () => {
  it('does not qualify a third-place team before every group is complete', () => {
    const status = calculateQualificationStatus(
      'A3',
      groups,
      standings,
      buildMatches(new Set(['A', 'B', 'C', 'D', 'E', 'F'])),
      thirdPlaceRanking,
    );

    expect(status).toBe('borderline');
  });

  it('keeps a provisional top-eight third-place team in other-groups-waiting copy', () => {
    const summary = getQualificationSummary(
      'A3',
      [{ id: 'A3', name: 'Group A third place', group: 'A', fifaRank: 1 }],
      groups,
      standings,
      buildMatches(new Set(['A', 'B', 'C', 'D', 'E', 'F'])),
      thirdPlaceRanking,
    );

    expect(summary.thirdPlaceRank).toBe(1);
    expect(summary.status).toBe('borderline');
    expect(summary.statusLabel).not.toContain('確定');
    expect(summary.summary).toContain('他グループ結果待ち');
  });

  it('qualifies top-eight third-place teams after all twelve groups are complete', () => {
    const status = calculateQualificationStatus(
      'A3',
      groups,
      standings,
      buildMatches(new Set(groupIds)),
      thirdPlaceRanking,
    );

    expect(status).toBe('qualified');
  });

  it('keeps first- and second-place qualification behavior for completed groups', () => {
    const matches = buildMatches(new Set(['A', 'B', 'C', 'D', 'E', 'F']));

    expect(calculateQualificationStatus('A1', groups, standings, matches, thirdPlaceRanking)).toBe('qualified');
    expect(calculateQualificationStatus('A2', groups, standings, matches, thirdPlaceRanking)).toBe('qualified');
  });
});
