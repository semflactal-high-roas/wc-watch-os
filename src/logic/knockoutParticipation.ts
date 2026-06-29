import type { Match, QualificationSummary } from '../types';

export type SupportedTeamStatusDisplay = {
  position: string;
  statusLabel?: string;
};

export const getKnockoutParticipantTeamIds = (matches: Match[]): Set<string> => {
  const teamIds = matches
    .filter((match) => match.stage !== 'group')
    .flatMap((match) => [match.homeTeamId, match.awayTeamId]);

  return new Set(teamIds);
};

export const getSupportedTeamStatusDisplay = ({
  teamId,
  summary,
  knockoutParticipantTeamIds,
}: {
  teamId: string;
  summary: QualificationSummary | null;
  knockoutParticipantTeamIds: ReadonlySet<string>;
}): SupportedTeamStatusDisplay => {
  if (knockoutParticipantTeamIds.has(teamId)) {
    return {
      position: '決勝トーナメント表で確認',
      statusLabel: '決勝トーナメント',
    };
  }

  const context = summary?.context;

  return {
    position: context?.groupRank
      ? `Group ${context.groupId} ${context.groupRank}位`
      : '現在地は順位タブで確認',
    statusLabel: summary?.statusLabel,
  };
};
