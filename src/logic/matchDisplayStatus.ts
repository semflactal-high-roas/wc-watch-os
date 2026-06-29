import type { Match } from '../types';

type MatchWithOptionalStatus = Match & {
  status?: string;
};

export const isFinishedMatchForDisplay = (match: MatchWithOptionalStatus): boolean => {
  return match.played || match.status === 'finished';
};

export const getFinishedMatchResultMessage = (match: MatchWithOptionalStatus): string | null => {
  if (match.stage === 'group' && match.played) {
    return '終了した試合です。現在の順位表・3位通過ラインに結果が反映されています。';
  }
  if (match.stage === 'group' && isFinishedMatchForDisplay(match)) {
    return '試合は終了扱いですが、結果は手動更新後に順位表・3位通過ラインへ反映されます。';
  }
  if (match.played) {
    return '終了したノックアウトステージの試合です。決勝トーナメント表の次ラウンド枠に結果が反映されています。';
  }
  if (isFinishedMatchForDisplay(match)) {
    return '試合は終了扱いですが、結果は手動更新後に決勝トーナメント表へ反映されます。';
  }
  return null;
};
