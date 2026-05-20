import { useEffect, useMemo, useState } from 'react';
import { loadAppData } from './data/loader';
import { computeGroupStandings } from './logic/standings';
import { rankThirdPlaceTeams } from './logic/thirdPlaceRanking';
import type { AppData } from './types';

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
        data.matches.filter((m) => group.teamIds.includes(m.homeTeamId) && group.teamIds.includes(m.awayTeamId)),
      ),
    }));
  }, [data]);

  const thirdPlace = useMemo(() => {
    const thirds = standings.map((g) => g.rows[2]).filter(Boolean);
    return rankThirdPlaceTeams(thirds);
  }, [standings]);

  if (error) return <div className="p-6">Error: {error}</div>;
  if (!data) return <div className="p-6">Loading...</div>;

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">World Cup Viewing OS (MVP)</h1>
      {standings.map((g) => (
        <section key={g.groupId}>
          <h2 className="text-xl font-semibold">Group {g.groupId}</h2>
          <ul>
            {g.rows.map((row, idx) => {
              const team = data.teams.find((t) => t.id === row.teamId);
              return (
                <li key={row.teamId}>
                  {idx + 1}. {team?.name ?? row.teamId} - {row.points} pts (GD {row.goalDiff})
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      <section>
        <h2 className="text-xl font-semibold">Third-place ranking</h2>
        <ol>
          {thirdPlace.map((row) => {
            const team = data.teams.find((t) => t.id === row.teamId);
            return (
              <li key={row.teamId}>
                {team?.name ?? row.teamId} - {row.points} pts (GD {row.goalDiff})
              </li>
            );
          })}
        </ol>
      </section>
    </main>
  );
}

export default App;
