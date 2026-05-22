import { useEffect, useMemo, useState } from 'react';
import { loadAppData } from './data/loader';
import { filterTodayMatches, filterUpcomingMatches } from './logic/dateFilters';
import { rankMatchesByImportance, type MatchWithImportance } from './logic/matchImportance';
import { computeGroupStandings } from './logic/standings';
import { rankThirdPlaceTeams } from './logic/thirdPlaceRanking';
import type { AppData, Match, MatchStage, StandingRow, Team } from './types';

type Tab = 'home' | 'schedule' | 'settings';

type UserPreferences = {
  mainFavoriteTeamId: string;
  selectedTeamIds: string[];
};

type HomeRanking = {
  matches: MatchWithImportance[];
  isFallback: boolean;
};

const preferencesKey = 'wc-watch-os:userPreferences';

const defaultPreferences: UserPreferences = {
  mainFavoriteTeamId: '',
  selectedTeamIds: [],
};

const tabs: { id: Tab; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'settings', label: 'Settings' },
];

const stageLabels: Record<MatchStage, string> = {
  group: 'Group',
  round_of_32: 'Round of 32',
  round_of_16: 'Round of 16',
  quarter_final: 'Quarter-final',
  semi_final: 'Semi-final',
  third_place: 'Third-place match',
  final: 'Final',
};

const readPreferences = (): UserPreferences => {
  if (typeof window === 'undefined') return defaultPreferences;

  try {
    const raw = window.localStorage.getItem(preferencesKey);
    if (!raw) return defaultPreferences;

    const parsed = JSON.parse(raw) as Partial<UserPreferences>;
    return {
      mainFavoriteTeamId: typeof parsed.mainFavoriteTeamId === 'string' ? parsed.mainFavoriteTeamId : '',
      selectedTeamIds: Array.isArray(parsed.selectedTeamIds)
        ? parsed.selectedTeamIds.filter((teamId): teamId is string => typeof teamId === 'string')
        : [],
    };
  } catch {
    return defaultPreferences;
  }
};

const scoreLabel = (match: Match): string => {
  if (!match.played || match.homeScore === null || match.awayScore === null) return '未実施';
  return `${match.homeScore} - ${match.awayScore}`;
};

const teamName = (teams: Team[], teamId: string): string => {
  return teams.find((team) => team.id === teamId)?.name ?? teamId;
};

const formatRecord = (row: StandingRow): string => {
  return `${row.won}勝 ${row.draw}分 ${row.lost}敗`;
};

const formatMatchDateTime = (match: Match): string => {
  return `${match.date} ${match.kickoffTimeJST} JST`;
};

const formatMatchStage = (match: Match): string => {
  if (match.stage === 'group' && match.groupId) return `Group ${match.groupId}`;
  return stageLabels[match.stage];
};

function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [preferences, setPreferences] = useState<UserPreferences>(() => readPreferences());
  const today = useMemo(() => new Date(), []);

  useEffect(() => {
    loadAppData().then(setData).catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    window.localStorage.setItem(preferencesKey, JSON.stringify(preferences));
  }, [preferences]);

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

  const rankedMatches = useMemo(() => {
    if (!data) return [];
    return rankMatchesByImportance(data.matches, data.teams, data.groups, preferences, today);
  }, [data, preferences, today]);

  const homeRanking = useMemo<HomeRanking>(() => {
    if (!data) return { matches: [], isFallback: false };

    const todayMatches = filterTodayMatches(data.matches, today);
    if (todayMatches.length > 0) {
      return {
        matches: rankMatchesByImportance(todayMatches, data.teams, data.groups, preferences, today),
        isFallback: false,
      };
    }

    const upcomingMatches = filterUpcomingMatches(data.matches, today);
    const nextMatch = upcomingMatches[0];
    if (!nextMatch) return { matches: rankedMatches.slice(0, 5), isFallback: true };

    const nextDateMatches = upcomingMatches.filter((match) => match.date === nextMatch.date);
    return {
      matches: rankMatchesByImportance(nextDateMatches, data.teams, data.groups, preferences, today),
      isFallback: true,
    };
  }, [data, preferences, rankedMatches, today]);

  if (error) return <div className="p-6">Error: {error}</div>;
  if (!data) return <div className="p-6">Loading...</div>;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 pb-24 pt-5">
        <header className="mb-5 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">World Cup Viewing OS</p>
          <h1 className="mt-1 text-2xl font-bold">今日見るべきW杯</h1>
        </header>

        {activeTab === 'home' && (
          <HomeScreen
            data={data}
            preferences={preferences}
            homeRanking={homeRanking}
            standings={standings}
            thirdPlace={thirdPlace}
          />
        )}
        {activeTab === 'schedule' && <ScheduleScreen data={data} rankedMatches={rankedMatches} standings={standings} />}
        {activeTab === 'settings' && (
          <SettingsScreen data={data} preferences={preferences} onPreferencesChange={setPreferences} />
        )}
      </div>

      <nav className="fixed inset-x-0 bottom-0 border-t border-slate-800 bg-slate-950/95 px-3 py-2 backdrop-blur">
        <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-xl px-3 py-3 text-sm font-semibold transition ${
                  isActive ? 'bg-cyan-300 text-slate-950' : 'bg-slate-900 text-slate-300'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>
    </main>
  );
}

type HomeScreenProps = {
  data: AppData;
  preferences: UserPreferences;
  homeRanking: HomeRanking;
  standings: { groupId: string; rows: StandingRow[] }[];
  thirdPlace: StandingRow[];
};

function HomeScreen({ data, preferences, homeRanking, standings, thirdPlace }: HomeScreenProps) {
  const favoriteName = preferences.mainFavoriteTeamId
    ? teamName(data.teams, preferences.mainFavoriteTeamId)
    : '未設定';

  return (
    <div className="space-y-5">
      <section className="space-y-3 rounded-2xl bg-slate-900 p-4 shadow-lg">
        <h2 className="text-lg font-semibold">今日見るべき試合ランキング</h2>
        <p className="text-sm leading-6 text-slate-300">
          推し国や日本、同じグループへの影響、日付、ステージを点数化して、見る優先度が高い順に並べます。
        </p>
        {homeRanking.isFallback && (
          <p className="rounded-xl border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-sm text-amber-100">
            今日の対象試合がないため、直近の注目試合を表示しています。
          </p>
        )}
        <p className="rounded-xl bg-slate-800 px-3 py-2 text-sm text-slate-300">メイン推し国: {favoriteName}</p>
        <div className="space-y-3">
          {homeRanking.matches.slice(0, 5).map((match) => (
            <MatchCard key={match.id} match={match} teams={data.teams} showRank />
          ))}
        </div>
      </section>

      <StandingsCards standings={standings} thirdPlace={thirdPlace} teams={data.teams} />
    </div>
  );
}

type ScheduleScreenProps = {
  data: AppData;
  rankedMatches: MatchWithImportance[];
  standings: { groupId: string; rows: StandingRow[] }[];
};

function ScheduleScreen({ data, rankedMatches, standings }: ScheduleScreenProps) {
  const importanceByMatchId = new Map(rankedMatches.map((match) => [match.id, match]));

  return (
    <div className="space-y-5">
      <section className="space-y-3 rounded-2xl bg-slate-900 p-4 shadow-lg">
        <h2 className="text-lg font-semibold">試合一覧</h2>
        <div className="space-y-3">
          {data.matches.map((match) => (
            <MatchCard key={match.id} match={importanceByMatchId.get(match.id) ?? match} teams={data.teams} compact />
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-2xl bg-slate-900 p-4 shadow-lg">
        <h2 className="text-lg font-semibold">グループ順位</h2>
        <div className="space-y-3">
          {standings.map((group) => (
            <div key={group.groupId} className="rounded-xl bg-slate-800 p-3">
              <h3 className="mb-2 text-sm font-semibold text-cyan-300">Group {group.groupId}</h3>
              <div className="space-y-2">
                {group.rows.map((row, index) => (
                  <StandingRowCard key={row.teamId} row={row} rank={index + 1} teams={data.teams} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

type SettingsScreenProps = {
  data: AppData;
  preferences: UserPreferences;
  onPreferencesChange: (preferences: UserPreferences) => void;
};

function SettingsScreen({ data, preferences, onPreferencesChange }: SettingsScreenProps) {
  const setMainFavoriteTeamId = (mainFavoriteTeamId: string) => {
    onPreferencesChange({ ...preferences, mainFavoriteTeamId });
  };

  const toggleSelectedTeamId = (teamId: string, selected: boolean) => {
    const selectedTeamIds = selected
      ? [...new Set([...preferences.selectedTeamIds, teamId])]
      : preferences.selectedTeamIds.filter((selectedTeamId) => selectedTeamId !== teamId);

    onPreferencesChange({ ...preferences, selectedTeamIds });
  };

  return (
    <section className="space-y-5 rounded-2xl bg-slate-900 p-4 shadow-lg">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Settings</h2>
        <p className="text-sm leading-6 text-slate-300">推し国の設定はこの端末のブラウザに保存されます。</p>
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-semibold text-slate-200">メイン推し国</span>
        <select
          value={preferences.mainFavoriteTeamId}
          onChange={(event) => setMainFavoriteTeamId(event.currentTarget.value)}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-base text-slate-50 outline-none focus:border-cyan-300"
        >
          <option value="">未設定</option>
          {data.teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </label>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-200">気になる国</h3>
        <div className="grid gap-2">
          {data.teams.map((team) => (
            <label key={team.id} className="flex items-center justify-between rounded-xl bg-slate-800 px-3 py-3">
              <span>
                <span className="block text-sm font-semibold">{team.name}</span>
                <span className="text-xs text-slate-400">Group {team.group}</span>
              </span>
              <input
                type="checkbox"
                checked={preferences.selectedTeamIds.includes(team.id)}
                onChange={(event) => toggleSelectedTeamId(team.id, event.currentTarget.checked)}
                className="h-5 w-5 accent-cyan-300"
              />
            </label>
          ))}
        </div>
      </div>
    </section>
  );
}

type MatchCardProps = {
  match: Match | MatchWithImportance;
  teams: Team[];
  compact?: boolean;
  showRank?: boolean;
};

const hasImportance = (match: Match | MatchWithImportance): match is MatchWithImportance => {
  return 'importanceScore' in match;
};

function MatchCard({ match, teams, compact = false, showRank = false }: MatchCardProps) {
  const importance = hasImportance(match) ? match : null;

  return (
    <article className="rounded-xl bg-slate-800 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {showRank && importance && (
              <span className="rounded-full bg-cyan-300 px-2 py-1 text-xs font-bold text-slate-950">
                #{importance.importanceRank}
              </span>
            )}
            {importance && (
              <span className="rounded-full bg-slate-950 px-2 py-1 text-xs font-bold text-cyan-300">
                重要度 {importance.importanceLabel}
              </span>
            )}
            {importance && !compact && (
              <span className="text-xs font-semibold text-slate-400">{importance.importanceScore}点</span>
            )}
          </div>
          <p className="text-xs font-semibold text-slate-400">{formatMatchDateTime(match)}</p>
          <p className="mb-2 text-xs text-slate-400">{formatMatchStage(match)}</p>
          <p className="truncate text-sm font-semibold">{teamName(teams, match.homeTeamId)}</p>
          <p className="truncate text-sm font-semibold">{teamName(teams, match.awayTeamId)}</p>
          {importance && !compact && (
            <div className="mt-3 flex flex-wrap gap-2">
              {importance.reasonTags.map((tag) => (
                <span key={tag} className="rounded-full bg-slate-700 px-2 py-1 text-xs text-slate-200">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="shrink-0 rounded-lg bg-slate-950 px-3 py-2 text-center">
          <p className="text-sm font-bold text-cyan-300">{scoreLabel(match)}</p>
          <p className="mt-1 text-xs text-slate-400">{match.played ? 'played' : '未実施'}</p>
        </div>
      </div>
    </article>
  );
}

type StandingsCardsProps = {
  standings: { groupId: string; rows: StandingRow[] }[];
  thirdPlace: StandingRow[];
  teams: Team[];
};

function StandingsCards({ standings, thirdPlace, teams }: StandingsCardsProps) {
  return (
    <section className="space-y-3 rounded-2xl bg-slate-900 p-4 shadow-lg">
      <h2 className="text-lg font-semibold">順位サマリー</h2>
      <div className="space-y-3">
        {standings.map((group) => (
          <div key={group.groupId} className="rounded-xl bg-slate-800 p-3">
            <h3 className="mb-2 text-sm font-semibold text-cyan-300">Group {group.groupId}</h3>
            <div className="space-y-2">
              {group.rows.map((row, index) => (
                <StandingRowCard key={row.teamId} row={row} rank={index + 1} teams={teams} compact />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-slate-800 p-3">
        <h3 className="mb-2 text-sm font-semibold text-cyan-300">3位ランキング</h3>
        <div className="space-y-2">
          {thirdPlace.map((row, index) => (
            <StandingRowCard key={row.teamId} row={row} rank={index + 1} teams={teams} compact />
          ))}
        </div>
      </div>
    </section>
  );
}

type StandingRowCardProps = {
  row: StandingRow;
  rank: number;
  teams: Team[];
  compact?: boolean;
};

function StandingRowCard({ row, rank, teams, compact = false }: StandingRowCardProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-900 px-3 py-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">
          {rank}. {teamName(teams, row.teamId)}
        </p>
        {!compact && <p className="text-xs text-slate-400">{formatRecord(row)}</p>}
      </div>
      <p className="shrink-0 text-right text-xs text-slate-300">
        <span className="font-semibold text-slate-50">{row.points} pts</span>
        <br />
        GD {row.goalDiff}
      </p>
    </div>
  );
}

export default App;
