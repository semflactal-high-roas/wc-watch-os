import { describe, expect, it } from 'vitest';
import type { Match, QualificationSummary } from '../types';
import { getKnockoutParticipantTeamIds, getSupportedTeamStatusDisplay } from './knockoutParticipation';

const match = (overrides: Partial<Match> = {}): Match => ({
  id: 'G-A-01',
  homeTeamId: 'CZE',
  awayTeamId: 'KOR',
  homeScore: 0,
  awayScore: 3,
  played: true,
  date: '2026-06-18',
  kickoffTimeJST: '10:00',
  groupId: 'A',
  stage: 'group',
  ...overrides,
});

const summary = (overrides: Partial<QualificationSummary> = {}): QualificationSummary => ({
  teamId: 'CZE',
  teamName: 'Czechia',
  status: 'eliminated',
  statusLabel: '敗退濃厚',
  summary: '現在4位。全試合消化済み。現時点では通過圏外です。',
  context: {
    groupId: 'A',
    groupRank: 4,
    standing: null,
    remainingMatches: 0,
    groupMatchesRemaining: 0,
  },
  thirdPlaceRank: null,
  ...overrides,
});

describe('getKnockoutParticipantTeamIds', () => {
  it('collects knockout teams without promoting group-only teams', () => {
    const teamIds = getKnockoutParticipantTeamIds([
      match(),
      match({
        id: 'R32-01',
        homeTeamId: 'RSA',
        awayTeamId: 'CAN',
        homeScore: 0,
        awayScore: 1,
        played: true,
        stage: 'round_of_32',
        groupId: undefined,
      }),
      match({
        id: 'R32-02',
        homeTeamId: 'BRA',
        awayTeamId: 'JPN',
        homeScore: null,
        awayScore: null,
        played: false,
        stage: 'round_of_32',
        groupId: undefined,
      }),
    ]);

    expect(teamIds.has('CAN')).toBe(true);
    expect(teamIds.has('JPN')).toBe(true);
    expect(teamIds.has('CZE')).toBe(false);
    expect(teamIds.has('KOR')).toBe(false);
  });
});

describe('getSupportedTeamStatusDisplay', () => {
  it('keeps an eliminated CZE-like team out of knockout wording after knockout starts', () => {
    const display = getSupportedTeamStatusDisplay({
      teamId: 'CZE',
      summary: summary(),
      knockoutParticipantTeamIds: new Set(['CAN', 'JPN']),
    });

    expect(display).toEqual({
      position: 'Group A 4位',
      statusLabel: '敗退濃厚',
    });
  });

  it('keeps a KOR-like non-R32 team on its computed status label', () => {
    const display = getSupportedTeamStatusDisplay({
      teamId: 'KOR',
      summary: summary({
        teamId: 'KOR',
        teamName: 'Korea Republic',
        statusLabel: '敗退濃厚',
        context: {
          groupId: 'A',
          groupRank: 3,
          standing: null,
          remainingMatches: 0,
          groupMatchesRemaining: 0,
        },
      }),
      knockoutParticipantTeamIds: new Set(['CAN', 'JPN']),
    });

    expect(display).toEqual({
      position: 'Group A 3位',
      statusLabel: '敗退濃厚',
    });
  });

  it('uses knockout wording only for a team present in the fixed bracket', () => {
    const display = getSupportedTeamStatusDisplay({
      teamId: 'JPN',
      summary: summary({
        teamId: 'JPN',
        teamName: 'Japan',
        statusLabel: '突破確定相当',
        context: {
          groupId: 'F',
          groupRank: 2,
          standing: null,
          remainingMatches: 0,
          groupMatchesRemaining: 0,
        },
      }),
      knockoutParticipantTeamIds: new Set(['CAN', 'JPN']),
    });

    expect(display).toEqual({
      position: '決勝トーナメント表で確認',
      statusLabel: '決勝トーナメント',
    });
  });
});
