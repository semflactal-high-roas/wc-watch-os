import { useEffect, useMemo, useState } from 'react';
import {
  buildTournamentTree,
  type BracketMatch,
  type ResolvedBracketSlot,
  type TournamentBlock,
  type TournamentBlockId,
  type TournamentRound,
} from './logic/tournamentPath';
import type { AppData, StandingRow, Team } from './types';

type GroupStanding = { groupId: string; rows: StandingRow[] };

type Props = {
  data: AppData;
  standings: GroupStanding[];
  mainFavoriteTeamId: string;
};

const teamName = (teams: Team[], teamId: string): string => {
  const team = teams.find((candidate) => candidate.id === teamId);
  if (!team) return teamId;
  return team.flagEmoji ? `${team.name} ${team.flagEmoji}` : team.name;
};

const slotText = (slot: ResolvedBracketSlot, teams: Team[]): string => {
  if (slot.teamId) return teamName(teams, slot.teamId);
  if (slot.candidateTeamIds?.length === 2) {
    const [firstTeamId, secondTeamId] = slot.candidateTeamIds;
    if (!firstTeamId || !secondTeamId) return slot.sourceLabel;
    const relationLabel = slot.relation === 'loser' ? '敗者' : '勝者';
    return `${teamName(teams, firstTeamId)} vs ${teamName(teams, secondTeamId)} の${relationLabel}`;
  }
  return slot.sourceLabel;
};

const roundLabel = (round: TournamentRound): string => {
  switch (round) {
    case 'round32':
      return 'Round of 32';
    case 'round16':
      return 'Round of 16';
    case 'quarterfinal':
      return '準々決勝';
    case 'semifinal':
      return '準決勝';
    case 'third_place':
      return '3位決定戦';
    case 'final':
      return '決勝';
    default:
      return round;
  }
};

const matchScoreText = (match: BracketMatch): string | null => {
  if (!match.played || match.homeScore == null || match.awayScore == null) return null;
  return `${match.homeScore}-${match.awayScore}`;
};

function MatchCard({ match, teams }: { match: BracketMatch; teams: Team[] }) {
  const scoreText = matchScoreText(match);

  return (
    <article className={`space-y-2 rounded-xl border p-3 ${match.isFavoritePath ? 'border-cyan-300 bg-cyan-300/10 ring-1 ring-cyan-300/40' : 'border-slate-700 bg-slate-800'}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-violet-200">Match {match.id}</p>
        <div className="flex flex-wrap gap-1">
          {match.date && match.kickoffTimeJST && <span className="rounded-full bg-slate-950 px-2 py-1 text-xs font-bold text-slate-300">{match.date} {match.kickoffTimeJST} JST</span>}
          {scoreText && <span className="rounded-full bg-emerald-300 px-2 py-1 text-xs font-bold text-slate-950">終了 {scoreText}</span>}
          {match.isFavoritePath && <span className="rounded-full bg-cyan-300 px-2 py-1 text-xs font-bold text-slate-950">推し国の接続</span>}
          {!match.isOfficialSlotConfirmed && <span className="rounded-full bg-amber-300/15 px-2 py-1 text-xs font-bold text-amber-200">要確認</span>}
        </div>
      </div>
      {[match.home, match.away].map((slot, index) => (
        <div key={`${match.id}-${index}`} className="rounded-lg bg-slate-950 px-3 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold leading-6">{slotText(slot, teams)}</p>
            {slot.isProvisional && (
              <span className="rounded-full bg-slate-700 px-2 py-1 text-xs font-bold text-slate-200">未消化試合の{slot.relation === 'loser' ? '敗者枠' : '勝者枠'}</span>
            )}
          </div>
        </div>
      ))}
    </article>
  );
}

function RoundGroup({ label, matches, teams }: { label: string; matches: BracketMatch[]; teams: Team[] }) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-bold text-slate-200">{label}</h3>
      <div className="space-y-3">{matches.map((match) => <MatchCard key={match.id} match={match} teams={teams} />)}</div>
    </section>
  );
}

function BlockAccordion({
  block,
  teams,
  isOpen,
  onToggle,
}: {
  block: TournamentBlock;
  teams: Team[];
  isOpen: boolean;
  onToggle: () => void;
}) {
  const includedSlots = block.round32
    .flatMap((match) => [match.home, match.away])
    .map((slot) => slotText(slot, teams))
    .filter((label, index, labels) => labels.indexOf(label) === index);

  return (
    <section className={`overflow-hidden rounded-2xl border ${block.isFavoriteBlock ? 'border-cyan-300 bg-cyan-300/5 ring-1 ring-cyan-300/30' : 'border-slate-700 bg-slate-900'}`}>
      <button type="button" aria-expanded={isOpen} onClick={onToggle} className="w-full space-y-3 p-4 text-left">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold">{block.label}</h2>
              {block.isFavoriteBlock && <span className="rounded-full bg-cyan-300 px-2 py-1 text-xs font-bold text-slate-950">推し国のブロック</span>}
            </div>
            <p className="mt-1 text-sm text-slate-300">Match {block.quarterfinal.id} へ進む組</p>
          </div>
          <span className="rounded-full bg-slate-800 px-3 py-1 text-sm font-bold text-slate-200">{isOpen ? '閉じる' : '見る'}</span>
        </div>
        {!isOpen && (
          <div className="rounded-xl bg-slate-950 px-3 py-3">
            <p className="text-xs font-bold text-slate-400">含まれる枠</p>
            <p className="mt-1 text-sm leading-6 text-slate-300">{includedSlots.join(' / ')}</p>
          </div>
        )}
      </button>
      {isOpen && (
        <div className="space-y-5 border-t border-slate-700 px-4 pb-4 pt-5">
          <RoundGroup label="Round of 32" matches={block.round32} teams={teams} />
          <p className="text-center text-lg font-bold text-slate-500" aria-hidden="true">↓</p>
          <RoundGroup label="Round of 16" matches={block.round16} teams={teams} />
          <p className="text-center text-lg font-bold text-slate-500" aria-hidden="true">↓</p>
          <RoundGroup label="準々決勝" matches={[block.quarterfinal]} teams={teams} />
        </div>
      )}
    </section>
  );
}

export default function ProvisionalTournamentBracketBeta({ data, standings, mainFavoriteTeamId }: Props) {
  const tree = useMemo(
    () => buildTournamentTree({ standingsByGroup: standings, groups: data.groups, matches: data.matches, mainFavoriteTeamId }),
    [data.groups, data.matches, mainFavoriteTeamId, standings],
  );
  const favoriteTeam = data.teams.find((team) => team.id === mainFavoriteTeamId);
  const favoriteMatches = tree.favoritePath
    ? tree.favoritePath.matchIds.map((matchId) =>
      Object.values(tree.rounds).flat().find((match) => match.id === matchId),
    ).filter((match): match is BracketMatch => Boolean(match))
    : [];
  const favoriteBlock = tree.blocks.find((block) => block.isFavoriteBlock);
  const initialBlockId = favoriteBlock?.id ?? 'A';
  const [openBlockId, setOpenBlockId] = useState<TournamentBlockId | null>(initialBlockId);

  useEffect(() => {
    setOpenBlockId(initialBlockId);
  }, [initialBlockId]);

  const favoriteRound32 = favoriteMatches.find((match) => match.round === 'round32');
  const favoriteLaterMatches = favoriteMatches.filter((match) => match.round !== 'round32');

  return (
    <div className="space-y-5">
      <section className="space-y-3 rounded-2xl border border-violet-300/30 bg-slate-900 p-4 shadow-lg">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold text-violet-100">決勝トーナメント表</h1>
          <span className="rounded-full border border-violet-300/40 bg-violet-300/10 px-2 py-1 text-xs font-bold text-violet-100">FIX</span>
        </div>
        <p className="text-sm leading-6 text-slate-200">
          グループリーグ終了後に確定した決勝トーナメント表です。未消化の試合は前ラウンドの勝者枠・敗者枠で表示しています。勝敗予想ではありません。
        </p>
        <p className="rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-xs leading-5 text-cyan-100">
          R32の終了済み試合は結果を反映し、次ラウンドの該当枠へ勝者を表示します。
        </p>
      </section>

      <section className="space-y-3 rounded-2xl border border-cyan-300/30 bg-slate-900 p-4 shadow-lg">
        <h2 className="text-lg font-semibold text-cyan-200">推し国のトーナメント接続</h2>
        {!favoriteTeam ? (
          <p className="rounded-xl bg-slate-800 px-3 py-3 text-sm leading-6 text-slate-300">メイン推し国を設定すると、決勝トーナメント表の該当カードを表示します。</p>
        ) : !favoriteRound32 ? (
          <div className="rounded-xl bg-slate-800 px-3 py-3 text-sm leading-6 text-slate-300">
            <p className="font-bold text-slate-100">メイン推し国は決勝トーナメント表に見つかりません。</p>
            <p className="mt-1">別の推し国を設定すると、該当カードを確認できます。</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-semibold">{teamName(data.teams, favoriteTeam.id)} のトーナメント接続</p>
            <div>
              <p className="mb-2 text-xs font-bold text-slate-400">Round of 32</p>
              <MatchCard match={favoriteRound32} teams={data.teams} />
            </div>
            {favoriteLaterMatches.map((match) => (
              <div key={match.id} className="rounded-xl bg-cyan-300/10 px-3 py-3">
                <p className="text-xs font-bold text-cyan-200">
                  {roundLabel(match.round)}
                </p>
                <p className="mt-1 text-sm font-semibold text-cyan-50">Match {match.id}</p>
              </div>
            ))}
            <p className="text-xs leading-5 text-slate-400">未消化試合の勝敗を断定する表示ではありません。</p>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">ブロック別トーナメント</h2>
          <p className="mt-1 text-sm leading-6 text-slate-400">各ブロックを開くと、Round of 32から準々決勝までの接続を縦に確認できます。</p>
        </div>
        {tree.blocks.map((block) => (
          <BlockAccordion
            key={block.id}
            block={block}
            teams={data.teams}
            isOpen={openBlockId === block.id}
            onToggle={() => setOpenBlockId((current) => current === block.id ? null : block.id)}
          />
        ))}
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-700 bg-slate-900 p-4 shadow-lg">
        <div>
          <h2 className="text-lg font-semibold">準決勝・3位決定戦・決勝の接続</h2>
          <p className="mt-1 text-sm leading-6 text-slate-400">チームの進出を予想せず、各ブロックの勝者枠・敗者枠だけを接続しています。</p>
        </div>
        {tree.semifinalConnections.map((connection) => (
          <div key={connection.match.id} className={`rounded-xl border px-3 py-3 ${connection.isFavoriteConnection ? 'border-cyan-300 bg-cyan-300/10' : 'border-slate-700 bg-slate-800'}`}>
            <p className="text-xs font-bold text-violet-200">準決勝 Match {connection.match.id}</p>
            <p className="mt-1 text-sm font-semibold">ブロック{connection.blockIds[0]}の勝者 vs ブロック{connection.blockIds[1]}の勝者</p>
          </div>
        ))}
        <div className={`rounded-xl border px-3 py-3 ${tree.thirdPlaceConnection.isFavoritePath ? 'border-cyan-300 bg-cyan-300/10' : 'border-slate-700 bg-slate-800'}`}>
          <p className="text-xs font-bold text-violet-200">3位決定戦 Match {tree.thirdPlaceConnection.id}</p>
          <p className="mt-1 text-sm font-semibold">準決勝 {tree.semifinalConnections[0]?.match.id} の敗者 vs 準決勝 {tree.semifinalConnections[1]?.match.id} の敗者</p>
        </div>
        <div className={`rounded-xl border px-3 py-3 ${tree.finalConnection.isFavoritePath ? 'border-cyan-300 bg-cyan-300/10' : 'border-slate-700 bg-slate-800'}`}>
          <p className="text-xs font-bold text-violet-200">決勝 Match {tree.finalConnection.id}</p>
          <p className="mt-1 text-sm font-semibold">準決勝 {tree.semifinalConnections[0]?.match.id} の勝者 vs 準決勝 {tree.semifinalConnections[1]?.match.id} の勝者</p>
        </div>
        {favoriteBlock && (
          <p className="rounded-xl bg-slate-950 px-3 py-2 text-xs leading-5 text-slate-300">
            推し国の現在の接続ブロックを強調表示しています。未消化試合の結果は断定していません。
          </p>
        )}
      </section>
    </div>
  );
}
