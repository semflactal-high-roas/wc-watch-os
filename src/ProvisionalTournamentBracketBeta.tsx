import { useEffect, useMemo, useState } from 'react';
import {
  buildProvisionalTournamentTree,
  type BracketMatch,
  type ResolvedBracketSlot,
  type TournamentBlock,
  type TournamentBlockId,
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
  if (slot.sourceLabel === '3位通過枠 / 未確定') return slot.sourceLabel;
  if (!slot.teamId) return slot.sourceLabel;
  return `${slot.sourceLabel} ${teamName(teams, slot.teamId)}`;
};

const compactSlotLabel = (slot: ResolvedBracketSlot): string =>
  slot.sourceLabel === '3位通過枠 / 未確定' ? slot.sourceLabel : slot.sourceLabel;

function MatchCard({ match, teams }: { match: BracketMatch; teams: Team[] }) {
  return (
    <article className={`space-y-2 rounded-xl border p-3 ${match.isFavoritePath ? 'border-cyan-300 bg-cyan-300/10 ring-1 ring-cyan-300/40' : 'border-slate-700 bg-slate-800'}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-violet-200">Match {match.id}</p>
        <div className="flex flex-wrap gap-1">
          {match.isFavoritePath && <span className="rounded-full bg-cyan-300 px-2 py-1 text-xs font-bold text-slate-950">推し国のルート</span>}
          {!match.isOfficialSlotConfirmed && <span className="rounded-full bg-amber-300/15 px-2 py-1 text-xs font-bold text-amber-200">要確認</span>}
        </div>
      </div>
      {[match.home, match.away].map((slot, index) => (
        <div key={`${match.id}-${index}`} className="rounded-lg bg-slate-950 px-3 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold leading-6">{slotText(slot, teams)}</p>
            {slot.isProvisional && slot.sourceLabel !== '3位通過枠 / 未確定' && (
              <span className="rounded-full bg-amber-300/15 px-2 py-1 text-xs font-bold text-amber-200">暫定</span>
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
    .map(compactSlotLabel)
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
    () => buildProvisionalTournamentTree({ standingsByGroup: standings, groups: data.groups, matches: data.matches, mainFavoriteTeamId }),
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
          <h1 className="text-xl font-bold text-violet-100">暫定トーナメント表β</h1>
          {['非公式', '暫定', 'β'].map((label) => <span key={label} className="rounded-full border border-violet-300/40 bg-violet-300/10 px-2 py-1 text-xs font-bold text-violet-100">{label}</span>)}
        </div>
        <p className="text-sm leading-6 text-slate-200">
          この表は、現在の暫定順位をもとにした非公式の想定トーナメント表です。3位通過枠と正式な組み合わせは、全グループの結果確定後に変動します。勝敗予想ではありません。
        </p>
        <p className="rounded-xl border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-xs leading-5 text-amber-100">
          公式発表ではありません。3位通過枠は未確定です。repo内で公式R32枠を確認できていないため、R32の対戦枠と接続順は要確認の仮配置です。
        </p>
      </section>

      <section className="space-y-3 rounded-2xl border border-cyan-300/30 bg-slate-900 p-4 shadow-lg">
        <h2 className="text-lg font-semibold text-cyan-200">推し国の道のり</h2>
        {!favoriteTeam ? (
          <p className="rounded-xl bg-slate-800 px-3 py-3 text-sm leading-6 text-slate-300">メイン推し国を設定すると、現在順位ベースの暫定ルートを表示します。</p>
        ) : !favoriteRound32 ? (
          <div className="rounded-xl bg-slate-800 px-3 py-3 text-sm leading-6 text-slate-300">
            <p className="font-bold text-slate-100">推し国の道のりは未確定です。</p>
            <p className="mt-1">現在の暫定R32枠にメイン推し国が入っていないため、正式な組み合わせ確定後に確認してください。</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-semibold">{teamName(data.teams, favoriteTeam.id)} の暫定ルート</p>
            <div>
              <p className="mb-2 text-xs font-bold text-slate-400">現在の暫定R32</p>
              <MatchCard match={favoriteRound32} teams={data.teams} />
            </div>
            {favoriteLaterMatches.map((match) => (
              <div key={match.id} className="rounded-xl bg-cyan-300/10 px-3 py-3">
                <p className="text-xs font-bold text-cyan-200">
                  勝ち上がった場合の{match.round === 'round16' ? 'R16' : match.round === 'quarterfinal' ? '準々決勝' : match.round === 'semifinal' ? '準決勝' : '決勝'}
                </p>
                <p className="mt-1 text-sm font-semibold text-cyan-50">Match {match.id} の勝者枠</p>
              </div>
            ))}
            <p className="text-xs leading-5 text-slate-400">勝ち上がりを断定する表示ではありません。</p>
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
          <h2 className="text-lg font-semibold">準決勝・決勝の接続</h2>
          <p className="mt-1 text-sm leading-6 text-slate-400">チームの進出を予想せず、各ブロックの勝者枠だけを接続しています。</p>
        </div>
        {tree.semifinalConnections.map((connection) => (
          <div key={connection.match.id} className={`rounded-xl border px-3 py-3 ${connection.isFavoriteConnection ? 'border-cyan-300 bg-cyan-300/10' : 'border-slate-700 bg-slate-800'}`}>
            <p className="text-xs font-bold text-violet-200">準決勝 Match {connection.match.id}</p>
            <p className="mt-1 text-sm font-semibold">ブロック{connection.blockIds[0]}の勝者 vs ブロック{connection.blockIds[1]}の勝者</p>
          </div>
        ))}
        <div className={`rounded-xl border px-3 py-3 ${tree.finalConnection.isFavoritePath ? 'border-cyan-300 bg-cyan-300/10' : 'border-slate-700 bg-slate-800'}`}>
          <p className="text-xs font-bold text-violet-200">決勝 Match {tree.finalConnection.id}</p>
          <p className="mt-1 text-sm font-semibold">準決勝 {tree.semifinalConnections[0]?.match.id} の勝者 vs 準決勝 {tree.semifinalConnections[1]?.match.id} の勝者</p>
        </div>
        {favoriteBlock && (
          <p className="rounded-xl bg-slate-950 px-3 py-2 text-xs leading-5 text-slate-300">
            推し国がこの暫定ルートを進む場合、反対側の準決勝につながるブロックとは決勝まで当たりません。
          </p>
        )}
      </section>
    </div>
  );
}
