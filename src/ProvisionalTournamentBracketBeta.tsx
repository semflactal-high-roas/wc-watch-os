import { useEffect, useMemo, useState } from 'react';
import { loadAppData } from './data/loader';
import { computeGroupStandings } from './logic/standings';
import { buildProvisionalTournamentBracket } from './logic/tournamentPath';
import type { AppData, Team } from './types';

const teamName = (teams: Team[], teamId: string): string => {
  const team = teams.find((candidate) => candidate.id === teamId);
  if (!team) return teamId;
  return team.flagEmoji ? `${team.name} ${team.flagEmoji}` : team.name;
};

export default function ProvisionalTournamentBracketBeta() {
  const [data, setData] = useState<AppData | null>(null);

  useEffect(() => {
    loadAppData().then(setData).catch(() => setData(null));
  }, []);

  const bracket = useMemo(() => {
    if (!data) return null;

    const standingsByGroup = data.groups.map((group) => ({
      groupId: group.id,
      rows: computeGroupStandings(
        group.teamIds,
        data.matches.filter(
          (match) => group.teamIds.includes(match.homeTeamId) && group.teamIds.includes(match.awayTeamId),
        ),
      ),
    }));

    return buildProvisionalTournamentBracket({
      standingsByGroup,
      groups: data.groups,
      matches: data.matches,
    });
  }, [data]);

  if (!data || !bracket) return null;

  return (
    <section className="bg-slate-950 px-4 pb-28 text-slate-50">
      <div className="mx-auto max-w-md space-y-3 rounded-2xl border border-violet-300/30 bg-slate-900 p-4 shadow-lg">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-violet-200">暫定トーナメント表β</h2>
            {['非公式', '暫定', 'β'].map((label) => (
              <span key={label} className="rounded-full border border-violet-300/40 bg-violet-300/10 px-2 py-1 text-xs font-bold text-violet-100">
                {label}
              </span>
            ))}
          </div>
          <p className="text-sm leading-6 text-slate-300">
            この表は、現在の暫定順位をもとにした非公式の想定トーナメント表です。3位通過枠と正式な組み合わせは、全グループの結果確定後に変動します。
          </p>
          <p className="rounded-lg bg-slate-950 px-3 py-2 text-xs leading-5 text-slate-400">
            公式ブラケットの対戦組み合わせは再現せず、現在の各グループ1位・2位と未確定の3位通過枠だけを整理しています。
          </p>
        </div>

        <div className="space-y-2">
          {bracket.groupSlots.map((group) => (
            <div key={group.groupId} className="rounded-xl bg-slate-800 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-cyan-300">Group {group.groupId}</p>
                {group.isProvisional && <span className="rounded-full bg-amber-300/15 px-2 py-1 text-xs font-bold text-amber-200">暫定</span>}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {group.slots.map((slot) => (
                  <div key={slot.id} className="rounded-lg bg-slate-900 px-3 py-2">
                    <p className="text-xs text-slate-400">{slot.sourceLabel}</p>
                    <p className="mt-1 truncate text-sm font-semibold">{slot.teamId ? teamName(data.teams, slot.teamId) : '未確定'}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2 rounded-xl border border-dashed border-slate-600 bg-slate-950 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-200">3位通過枠</h3>
            <span className="rounded-full bg-slate-700 px-2 py-1 text-xs font-bold text-slate-200">未確定</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {bracket.thirdPlaceSlots.map((slot) => (
              <div key={slot.id} className="rounded-lg bg-slate-800 px-3 py-2">
                <p className="text-xs text-slate-400">{slot.sourceLabel}</p>
                <p className="mt-1 text-sm font-semibold">未確定</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
