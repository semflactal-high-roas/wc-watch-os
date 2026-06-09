import { useMemo } from 'react';
import {
  buildProvisionalTournamentTree,
  type BracketMatch,
  type ResolvedBracketSlot,
  type TournamentRound,
} from './logic/tournamentPath';
import type { AppData, StandingRow, Team } from './types';

type GroupStanding = { groupId: string; rows: StandingRow[] };

type Props = {
  data: AppData;
  standings: GroupStanding[];
  mainFavoriteTeamId: string;
};

const roundLabels: Record<TournamentRound, string> = {
  round32: 'Round of 32',
  round16: 'Round of 16',
  quarterfinal: 'Quarter-finals',
  semifinal: 'Semi-finals',
  final: 'Final',
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

function MatchCard({ match, teams }: { match: BracketMatch; teams: Team[] }) {
  return (
    <article className={`space-y-2 rounded-xl border p-3 ${match.isFavoritePath ? 'border-cyan-300 bg-cyan-300/10 ring-1 ring-cyan-300/40' : 'border-slate-700 bg-slate-800'}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-violet-200">Match {match.id}</p>
        <div className="flex flex-wrap gap-1">
          {match.isFavoritePath && <span className="rounded-full bg-cyan-300 px-2 py-1 text-xs font-bold text-slate-950">推し国の山</span>}
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
      {match.note && <p className="text-xs leading-5 text-slate-400">{match.note}</p>}
    </article>
  );
}

function RoundSection({ round, matches, teams }: { round: TournamentRound; matches: BracketMatch[]; teams: Team[] }) {
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <h2 className="text-lg font-semibold">{roundLabels[round]}</h2>
        <span className="text-xs text-slate-400">{matches.length} matches</span>
      </div>
      <div className="space-y-3">{matches.map((match) => <MatchCard key={match.id} match={match} teams={teams} />)}</div>
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
          公式発表ではありません。repo内で公式R32枠を確認できていないため、R32の対戦枠とその接続順は差し替え前提の仮配置です。
        </p>
      </section>

      <section className="space-y-3 rounded-2xl border border-cyan-300/30 bg-slate-900 p-4 shadow-lg">
        <h2 className="text-lg font-semibold text-cyan-200">推し国の山</h2>
        {!favoriteTeam ? (
          <p className="rounded-xl bg-slate-800 px-3 py-3 text-sm leading-6 text-slate-300">メイン推し国を設定すると、R32から決勝までの山を強調表示します。</p>
        ) : favoriteMatches.length === 0 ? (
          <p className="rounded-xl bg-slate-800 px-3 py-3 text-sm leading-6 text-slate-300">現在の暫定順位では、メイン推し国のR32枠は未確定です。</p>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-semibold">{teamName(data.teams, favoriteTeam.id)} の暫定ルート</p>
            {favoriteMatches.map((match) => (
              <p key={match.id} className="rounded-lg bg-cyan-300/10 px-3 py-2 text-sm text-cyan-100">
                {roundLabels[match.round]}: Match {match.id} の枠
              </p>
            ))}
            <p className="text-xs leading-5 text-slate-400">勝ち上がりを断定する表示ではありません。</p>
          </div>
        )}
      </section>

      {(Object.keys(roundLabels) as TournamentRound[]).map((round) => (
        <RoundSection key={round} round={round} matches={tree.rounds[round]} teams={data.teams} />
      ))}
    </div>
  );
}
