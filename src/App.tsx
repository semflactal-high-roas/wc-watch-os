import { useEffect, useMemo, useState } from 'react';
import { loadAppData } from './data/loader';
import { computeGroupStandings } from './logic/standings';
import { rankThirdPlaceTeams } from './logic/thirdPlaceRanking';
import type { AppData, StandingRow } from './types';

function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadAppData().then(setData).catch((e: Error) => setError(e.message));
  }, []);

  const standings = useMemo(() => {
    if (!data) return [];
    return data.groups.map((group) => ({
      groupId: group.id,
      rows: computeGroupStandings(
        group.teamIds,
        data.matches.filter((match) => group.teamIds.includes(match.homeTeamId) && group.teamIds.includes(match.awayTeamId)),
      ),
    }));
  }, [data]);

  const thirdPlace = useMemo(() => {
    const thirds: StandingRow[] = standings.flatMap((group) => {
      const third = group.rows[2];
      return third ? [third] : [];
    });

    return rankThirdPlaceTeams(thirds);
  }, [standings]);

  if (error) return <div className="p-6">Error: {error}</div>;
  if (!data) return <div className="p-6">Loading...</div>;

  return (
    <main className="mx-auto min-h-screen max-w-md space-y-6 bg-slate-950 p-6 text-slate-50">
      <header className="space-y-2">
        <p className="text-sm text-cyan-300">今日見るべきW杯 - 観戦OS</p>
        <h1 className="text-2xl font-bold">World Cup Viewing OS</h1>
        <p className="text-sm text-slate-300">ダミーデータで順位表と3位通過ラインを確認するMVPです。</p>
      </header>

      {standings.map((group) => (
        <section key={group.groupId} className="rounded-2xl bg-slate-900 p-4 shadow-lg">
          <h2 className="mb-3 text-xl font-semibold">Group {group.groupId}</h2>
          <ul className="space-y-2">
            {group.rows.map((row, index) => {
              const team = data.teams.find((team) => team.id === row.teamId);
              return (
                <li key={row.teamId} className="flex items-center justify-between rounded-xl bg-slate-800 px-3 py-2">
                  <span>
                    {index + 1}. {team?.name ?? row.teamId}
                  </span>
                  <span className="text-sm text-slate-300">
                    {row.points} pts / GD {row.goalDiff}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <section className="rounded-2xl bg-slate-900 p-4 shadow-lg">
        <h2 className="mb-3 text-xl font-semibold">Third-place ranking</h2>
        <ol className="space-y-2">
          {thirdPlace.map((row, index) => {
            const team = data.teams.find((team) => team.id === row.teamId);
            return (
              <li key={row.teamId} className="flex items-center justify-between rounded-xl bg-slate-800 px-3 py-2">
                <span>
                  {index + 1}. {team?.name ?? row.teamId}
                </span>
                <span className="text-sm text-slate-300">
                  {row.points} pts / GD {row.goalDiff}
                </span>
              </li>
            );
          })}
        </ol>
      </section>
    </main>
  );
}

export default App;
