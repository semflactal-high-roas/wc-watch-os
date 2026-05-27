import { useEffect, useMemo, useState } from 'react';
import { loadAppData } from './data/loader';
import { filterTodayMatches, filterUpcomingMatches } from './logic/dateFilters';
import { createMatchIcsEvent, downloadIcsFile } from './logic/ics';
import { getJapanScenarioSummary, type JapanScenarioSummary } from './logic/japanScenario';
import { rankMatchesByImportance, type MatchWithImportance } from './logic/matchImportance';
import { getQualificationSummary } from './logic/qualificationStatus';
import { computeGroupStandings } from './logic/standings';
import {
  getThirdPlaceLine,
  getThirdPlaceRowStatus,
  getThirdPlaceStatusLabel,
  getThirdPlaceSummary,
  type ThirdPlaceStatus,
} from './logic/thirdPlaceLine';
import { rankThirdPlaceTeams } from './logic/thirdPlaceRanking';
import type { AppData, Match, MatchStage, QualificationSummary, StandingRow, Team } from './types';

type MainScreen = 'home' | 'schedule' | 'settings';
type Screen = MainScreen | 'matchDetail';
type GroupStanding = { groupId: string; rows: StandingRow[] };

type UserPreferences = {
  mainFavoriteTeamId: string;
  selectedTeamIds: string[];
};

type HomeRanking = {
  matches: MatchWithImportance[];
  isFallback: boolean;
};

type GroupOverview = {
  groupId: string;
  matches: MatchWithImportance[];
  rows: {
    team: Team;
    standing: StandingRow | null;
    rank: number | null;
    remainingMatches: number;
  }[];
};

const preferencesKey = 'wc-watch-os:userPreferences';

const defaultPreferences: UserPreferences = {
  mainFavoriteTeamId: '',
  selectedTeamIds: [],
};

const tabs: { id: MainScreen; label: string }[] = [
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

const statusStyles: Record<QualificationSummary['status'], string> = {
  safe: 'bg-emerald-300 text-slate-950',
  borderline: 'bg-amber-300 text-slate-950',
  danger: 'bg-rose-300 text-slate-950',
  eliminated: 'bg-slate-600 text-slate-100',
  qualified: 'bg-cyan-300 text-slate-950',
  unknown: 'bg-slate-700 text-slate-100',
};

const thirdPlaceStatusStyles: Record<ThirdPlaceStatus, string> = {
  advance: 'bg-emerald-300 text-slate-950',
  borderline: 'bg-amber-300 text-slate-950',
  outside: 'bg-rose-300 text-slate-950',
  not_third: 'bg-slate-700 text-slate-100',
  unknown: 'bg-slate-700 text-slate-100',
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

const formatRecord = (row: StandingRow): string => `${row.won}勝 ${row.draw}分 ${row.lost}敗`;
const formatMatchDateTime = (match: Match): string => `${match.date} ${match.kickoffTimeJST} JST`;

const formatMatchStage = (match: Match): string => {
  if (match.stage === 'group' && match.groupId) return `Group ${match.groupId}`;
  return stageLabels[match.stage];
};

const findJapanTeamId = (teams: Team[]): string => teams.find((team) => team.name === 'Japan')?.id ?? 'JPN';
const matchIncludesTeam = (match: Match, teamId: string): boolean => match.homeTeamId === teamId || match.awayTeamId === teamId;
const teamGroup = (teams: Team[], teamId: string): string => teams.find((team) => team.id === teamId)?.group ?? '';

const getTrackedTeamIds = (teams: Team[], preferences: UserPreferences): string[] => {
  const ids = [findJapanTeamId(teams), preferences.mainFavoriteTeamId, ...preferences.selectedTeamIds].filter(Boolean);
  return [...new Set(ids)];
};

const sortMatchesByDate = <T extends Match>(matches: T[]): T[] => {
  return [...matches].sort(
    (a, b) =>
      Number(a.played) - Number(b.played) ||
      a.date.localeCompare(b.date) ||
      a.kickoffTimeJST.localeCompare(b.kickoffTimeJST) ||
      a.id.localeCompare(b.id),
  );
};

const isSameGroupAsTrackedTeam = (match: Match, teams: Team[], trackedTeamIds: string[]): boolean => {
  const matchGroups = new Set([match.groupId, teamGroup(teams, match.homeTeamId), teamGroup(teams, match.awayTeamId)].filter(Boolean));

  return trackedTeamIds.some((teamId) => {
    const group = teamGroup(teams, teamId);
    return group ? matchGroups.has(group) : false;
  });
};

const buildGroupOverview = (
  groupId: string,
  data: AppData,
  standings: GroupStanding[],
  rankedMatches: MatchWithImportance[],
): GroupOverview | null => {
  const group = data.groups.find((candidate) => candidate.id === groupId);
  if (!group) return null;

  const groupStanding = standings.find((candidate) => candidate.groupId === groupId);
  const matches = sortMatchesByDate(rankedMatches.filter((match) => match.groupId === groupId));
  const rows = group.teamIds
    .map((teamId) => {
      const team = data.teams.find((candidate) => candidate.id === teamId);
      if (!team) return null;

      const rankIndex = groupStanding?.rows.findIndex((row) => row.teamId === teamId) ?? -1;
      const standing = rankIndex >= 0 ? groupStanding?.rows[rankIndex] ?? null : null;
      const remainingMatches = matches.filter((match) => !match.played && matchIncludesTeam(match, teamId)).length;

      return { team, standing, rank: rankIndex >= 0 ? rankIndex + 1 : null, remainingMatches };
    })
    .filter((row): row is GroupOverview['rows'][number] => row !== null);

  return { groupId, matches, rows };
};

function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [error, setError] = useState<string>('');
  const [activeScreen, setActiveScreen] = useState<Screen>('home');
  const [detailReturnScreen, setDetailReturnScreen] = useState<MainScreen>('home');
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [preferences, setPreferences] = useState<UserPreferences>(() => readPreferences());
  const today = useMemo(() => new Date(), []);

  useEffect(() => {
    loadAppData().then(setData).catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    window.localStorage.setItem(preferencesKey, JSON.stringify(preferences));
  }, [preferences]);

  const standings = useMemo<GroupStanding[]>(() => {
    if (!data) return [];
    return data.groups.map((group) => ({
      groupId: group.id,
      rows: computeGroupStandings(
        group.teamIds,
        data.matches.filter((match) => group.teamIds.includes(match.homeTeamId) && group.teamIds.includes(match.awayTeamId)),
      ),
    }));
  }, [data]);

  const thirdPlace = useMemo(() => rankThirdPlaceTeams(standings.flatMap((group) => (group.rows[2] ? [group.rows[2]] : []))), [standings]);

  const trackedTeamIds = useMemo(() => (data ? getTrackedTeamIds(data.teams, preferences) : []), [data, preferences]);

  const qualificationSummaries = useMemo(() => {
    if (!data) return [];
    return trackedTeamIds.map((teamId) => getQualificationSummary(teamId, data.teams, data.groups, standings, data.matches, thirdPlace));
  }, [data, trackedTeamIds, standings, thirdPlace]);

  const rankedMatches = useMemo(() => {
    if (!data) return [];
    return rankMatchesByImportance(data.matches, data.teams, data.groups, preferences, today);
  }, [data, preferences, today]);

  const japanMatches = useMemo(() => {
    if (!data) return [];
    const japanTeamId = findJapanTeamId(data.teams);
    return sortMatchesByDate(rankedMatches.filter((match) => matchIncludesTeam(match, japanTeamId)));
  }, [data, rankedMatches]);

  const japanScenario = useMemo(() => (data ? getJapanScenarioSummary(data, standings, data.matches) : null), [data, standings]);
  const groupFOverview = useMemo(() => (data ? buildGroupOverview('F', data, standings, rankedMatches) : null), [data, standings, rankedMatches]);

  const homeRanking = useMemo<HomeRanking>(() => {
    if (!data) return { matches: [], isFallback: false };

    const todayMatches = filterTodayMatches(data.matches, today);
    if (todayMatches.length > 0) {
      return { matches: rankMatchesByImportance(todayMatches, data.teams, data.groups, preferences, today), isFallback: false };
    }

    const upcomingMatches = filterUpcomingMatches(data.matches, today);
    const nextMatch = upcomingMatches[0];
    if (!nextMatch) return { matches: rankedMatches.slice(0, 5), isFallback: true };

    const nextDateMatches = upcomingMatches.filter((match) => match.date === nextMatch.date);
    return { matches: rankMatchesByImportance(nextDateMatches, data.teams, data.groups, preferences, today), isFallback: true };
  }, [data, preferences, rankedMatches, today]);

  const selectedMatch = useMemo(() => rankedMatches.find((match) => match.id === selectedMatchId) ?? null, [rankedMatches, selectedMatchId]);

  const openMatchDetail = (matchId: string, returnScreen: MainScreen) => {
    setSelectedMatchId(matchId);
    setDetailReturnScreen(returnScreen);
    setActiveScreen('matchDetail');
  };

  const closeMatchDetail = () => {
    setActiveScreen(detailReturnScreen);
    setSelectedMatchId('');
  };

  if (error) return <div className="p-6">Error: {error}</div>;
  if (!data) return <div className="p-6">Loading...</div>;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 pb-24 pt-5">
        <header className="mb-5 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">World Cup Viewing OS</p>
          <h1 className="mt-1 text-2xl font-bold">今日見るべきW杯</h1>
        </header>

        {activeScreen === 'home' && (
          <HomeScreen
            data={data}
            preferences={preferences}
            homeRanking={homeRanking}
            japanMatches={japanMatches}
            japanScenario={japanScenario}
            groupFOverview={groupFOverview}
            qualificationSummaries={qualificationSummaries}
            standings={standings}
            thirdPlace={thirdPlace}
            trackedTeamIds={trackedTeamIds}
            onMatchSelect={(matchId) => openMatchDetail(matchId, 'home')}
          />
        )}
        {activeScreen === 'schedule' && (
          <ScheduleScreen data={data} rankedMatches={rankedMatches} standings={standings} onMatchSelect={(matchId) => openMatchDetail(matchId, 'schedule')} />
        )}
        {activeScreen === 'settings' && <SettingsScreen data={data} preferences={preferences} onPreferencesChange={setPreferences} />}
        {activeScreen === 'matchDetail' && selectedMatch && (
          <MatchDetailScreen
            match={selectedMatch}
            teams={data.teams}
            preferences={preferences}
            trackedTeamIds={trackedTeamIds}
            returnScreen={detailReturnScreen}
            onBack={closeMatchDetail}
          />
        )}
        {activeScreen === 'matchDetail' && !selectedMatch && (
          <section className="space-y-3 rounded-2xl bg-slate-900 p-4 shadow-lg">
            <h2 className="text-lg font-semibold">試合が見つかりません</h2>
            <button type="button" onClick={closeMatchDetail} className="rounded-xl bg-cyan-300 px-4 py-3 text-sm font-bold text-slate-950">
              戻る
            </button>
          </section>
        )}
      </div>

      {activeScreen !== 'matchDetail' && (
        <nav className="fixed inset-x-0 bottom-0 border-t border-slate-800 bg-slate-950/95 px-3 py-2 backdrop-blur">
          <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveScreen(tab.id)}
                className={`rounded-xl px-3 py-3 text-sm font-semibold transition ${activeScreen === tab.id ? 'bg-cyan-300 text-slate-950' : 'bg-slate-900 text-slate-300'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </nav>
      )}
    </main>
  );
}

type HomeScreenProps = {
  data: AppData;
  preferences: UserPreferences;
  homeRanking: HomeRanking;
  japanMatches: MatchWithImportance[];
  japanScenario: JapanScenarioSummary | null;
  groupFOverview: GroupOverview | null;
  qualificationSummaries: QualificationSummary[];
  standings: GroupStanding[];
  thirdPlace: StandingRow[];
  trackedTeamIds: string[];
  onMatchSelect: (matchId: string) => void;
};

function HomeScreen({
  data,
  preferences,
  homeRanking,
  japanMatches,
  japanScenario,
  groupFOverview,
  qualificationSummaries,
  standings,
  thirdPlace,
  trackedTeamIds,
  onMatchSelect,
}: HomeScreenProps) {
  const favoriteName = preferences.mainFavoriteTeamId ? teamName(data.teams, preferences.mainFavoriteTeamId) : '未設定';

  return (
    <div className="space-y-5">
      <QualificationStatusSection summaries={qualificationSummaries} />
      <JapanMatchesSection matches={japanMatches} teams={data.teams} onMatchSelect={onMatchSelect} />
      {japanScenario && <JapanScenarioSection scenario={japanScenario} teams={data.teams} />}
      {groupFOverview && <GroupOverviewSection overview={groupFOverview} teams={data.teams} highlightTeamId="JPN" onMatchSelect={onMatchSelect} />}

      <section className="space-y-3 rounded-2xl bg-slate-900 p-4 shadow-lg">
        <h2 className="text-lg font-semibold">今日見るべき試合ランキング</h2>
        <p className="text-sm leading-6 text-slate-300">推し国や日本、同じグループへの影響、日付、ステージを点数化して、見る優先度が高い順に並べます。</p>
        {homeRanking.isFallback && (
          <p className="rounded-xl border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-sm text-amber-100">今日の対象試合がないため、直近の注目試合を表示しています。</p>
        )}
        <p className="rounded-xl bg-slate-800 px-3 py-2 text-sm text-slate-300">メイン推し国: {favoriteName}</p>
        <div className="space-y-3">
          {homeRanking.matches.slice(0, 5).map((match) => (
            <MatchCard key={match.id} match={match} teams={data.teams} showRank onSelect={() => onMatchSelect(match.id)} />
          ))}
        </div>
      </section>

      <StandingsCards standings={standings} thirdPlace={thirdPlace} teams={data.teams} trackedTeamIds={trackedTeamIds} />
    </div>
  );
}

type JapanMatchesSectionProps = {
  matches: MatchWithImportance[];
  teams: Team[];
  onMatchSelect: (matchId: string) => void;
};

function JapanMatchesSection({ matches, teams, onMatchSelect }: JapanMatchesSectionProps) {
  return (
    <section className="space-y-3 rounded-2xl bg-slate-900 p-4 shadow-lg">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">日本代表の試合</h2>
        <p className="text-sm leading-6 text-slate-300">推し国設定に関係なく、日本代表の試合を固定表示します。</p>
      </div>
      {matches.length === 0 ? (
        <p className="rounded-xl bg-slate-800 px-3 py-3 text-sm text-slate-300">日本代表の試合データがまだ登録されていません</p>
      ) : (
        <div className="space-y-3">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} teams={teams} onSelect={() => onMatchSelect(match.id)} />
          ))}
        </div>
      )}
    </section>
  );
}

type JapanScenarioSectionProps = {
  scenario: JapanScenarioSummary;
  teams: Team[];
};

function JapanScenarioSection({ scenario, teams }: JapanScenarioSectionProps) {
  return (
    <section className="space-y-4 rounded-2xl border border-cyan-300/30 bg-slate-900 p-4 shadow-lg">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">Japan Scenario</p>
        <h2 className="text-lg font-semibold">日本代表 突破シナリオ</h2>
        <p className="text-sm leading-6 text-slate-300">現在順位・残り試合・次戦・同組状況から、MVP版の見通しを表示します。</p>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <Metric label="現在順位" value={scenario.rank ? `${scenario.rank}位` : '判定保留'} />
        <Metric label="勝点" value={scenario.points ?? '-'} />
        <Metric label="得失点差" value={scenario.goalDiff ?? '-'} />
        <Metric label="残り試合" value={`${scenario.remainingMatches}試合`} />
        <Metric label="次の日本戦" value={scenario.nextOpponentName ? `${scenario.nextOpponentName}戦` : '未登録'} />
        <Metric label="次戦キックオフ" value={scenario.nextMatch ? `${formatMatchDateTime(scenario.nextMatch)}` : '未登録'} />
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-cyan-300">同組ライバル</h3>
        <div className="flex flex-wrap gap-2">
          {scenario.rivals.map((team) => (
            <span key={team.id} className="rounded-full bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200">
              {team.name}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-cyan-300">シナリオメッセージ</h3>
        {scenario.messages.map((message) => (
          <p key={message} className="rounded-xl bg-slate-800 px-3 py-2 text-sm leading-6 text-slate-200">
            {message}
          </p>
        ))}
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-cyan-300">見るべき同組試合</h3>
        {scenario.watchGroupMatches.length === 0 ? (
          <p className="rounded-xl bg-slate-800 px-3 py-3 text-sm text-slate-300">日本が出ない未実施のGroup F試合はありません。</p>
        ) : (
          <div className="space-y-2">
            {scenario.watchGroupMatches.map((match) => (
              <div key={match.id} className="rounded-xl bg-slate-800 px-3 py-3">
                <p className="text-sm font-semibold">
                  {teamName(teams, match.homeTeamId)} vs {teamName(teams, match.awayTeamId)}
                </p>
                <p className="mt-1 text-xs text-slate-400">{formatMatchDateTime(match)}</p>
                <p className="mt-2 text-xs leading-5 text-slate-300">日本と同組の勝点配分に影響します。</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs leading-5 text-slate-400">MVP版では詳細タイブレーク・直接対決・フェアプレーポイント等は未反映です。</p>
    </section>
  );
}

type GroupOverviewSectionProps = {
  overview: GroupOverview;
  teams: Team[];
  highlightTeamId: string;
  onMatchSelect: (matchId: string) => void;
};

function GroupOverviewSection({ overview, teams, highlightTeamId, onMatchSelect }: GroupOverviewSectionProps) {
  return (
    <section className="space-y-4 rounded-2xl bg-slate-900 p-4 shadow-lg">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Group {overview.groupId} 日本の組</h2>
        <p className="text-sm leading-6 text-slate-300">日本代表の突破条件を見るには、日本戦だけでなく同組のNetherlands / Sweden / Tunisiaの試合結果も重要です。</p>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-cyan-300">チーム状況</h3>
        <div className="space-y-2">
          {overview.rows.map(({ team, standing, rank, remainingMatches }) => {
            const isHighlighted = team.id === highlightTeamId;
            return (
              <div key={team.id} className={`rounded-xl px-3 py-3 ${isHighlighted ? 'bg-cyan-300/15 ring-1 ring-cyan-300/60' : 'bg-slate-800'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{team.name}</p>
                    <p className="text-xs text-slate-400">{team.id}</p>
                  </div>
                  {isHighlighted && <span className="shrink-0 rounded-full bg-cyan-300 px-2 py-1 text-xs font-bold text-slate-950">日本代表</span>}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <Metric label="現在順位" value={rank ? `${rank}位` : '判定保留'} />
                  <Metric label="勝点" value={standing ? standing.points : '-'} />
                  <Metric label="得失点差" value={standing ? standing.goalDiff : '-'} />
                  <Metric label="残り試合" value={`${remainingMatches}試合`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-cyan-300">Group {overview.groupId} 試合一覧</h3>
        <div className="space-y-3">
          {overview.matches.map((match) => (
            <MatchCard key={match.id} match={match} teams={teams} onSelect={() => onMatchSelect(match.id)} />
          ))}
        </div>
      </div>
    </section>
  );
}

type QualificationStatusSectionProps = { summaries: QualificationSummary[] };

function QualificationStatusSection({ summaries }: QualificationStatusSectionProps) {
  return (
    <section className="space-y-3 rounded-2xl bg-slate-900 p-4 shadow-lg">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">突破条件カード</h2>
        <p className="text-sm leading-6 text-slate-300">日本代表・メイン推し国・選択中の推し国について、現在順位と残り試合からMVP版の見通しを表示します。</p>
      </div>
      {summaries.length === 0 ? (
        <p className="rounded-xl bg-slate-800 px-3 py-3 text-sm text-slate-300">対象チームが未設定です。Settingsで推し国を選ぶと表示されます。</p>
      ) : (
        <div className="space-y-3">
          {summaries.map((summary) => (
            <QualificationCard key={summary.teamId} summary={summary} />
          ))}
        </div>
      )}
      <p className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs leading-5 text-slate-400">MVP版では詳細タイブレーク・直接対決・フェアプレーポイント・抽選等は未反映です。</p>
    </section>
  );
}

type QualificationCardProps = { summary: QualificationSummary };

function QualificationCard({ summary }: QualificationCardProps) {
  const standing = summary.context?.standing;
  const rank = summary.context?.groupRank;
  const remainingText = summary.context ? (summary.context.remainingMatches === 0 ? '全日程消化' : `残り${summary.context.remainingMatches}試合`) : '残り試合不明';

  return (
    <article className="space-y-3 rounded-xl bg-slate-800 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold">{summary.teamName}</p>
          <p className="text-xs text-slate-400">{summary.context?.groupId ? `Group ${summary.context.groupId}` : 'Group unknown'}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-bold ${statusStyles[summary.status]}`}>{summary.statusLabel}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <Metric label="現在順位" value={rank ? `${rank}位` : '判定保留'} />
        <Metric label="勝点" value={standing ? standing.points : '-'} />
        <Metric label="得失点差" value={standing ? standing.goalDiff : '-'} />
        <Metric label="残り試合" value={remainingText} />
        {summary.thirdPlaceRank && <Metric label="3位ランキング" value={`${summary.thirdPlaceRank}位`} />}
      </div>
      <p className="text-sm leading-6 text-slate-300">{summary.summary}</p>
    </article>
  );
}

type MetricProps = { label: string; value: string | number };

function Metric({ label, value }: MetricProps) {
  return (
    <div className="rounded-lg bg-slate-900 px-3 py-2">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 font-semibold text-slate-50">{value}</p>
    </div>
  );
}

type ScheduleScreenProps = {
  data: AppData;
  rankedMatches: MatchWithImportance[];
  standings: GroupStanding[];
  onMatchSelect: (matchId: string) => void;
};

function ScheduleScreen({ data, rankedMatches, standings, onMatchSelect }: ScheduleScreenProps) {
  const importanceByMatchId = new Map(rankedMatches.map((match) => [match.id, match]));

  return (
    <div className="space-y-5">
      <section className="space-y-3 rounded-2xl bg-slate-900 p-4 shadow-lg">
        <h2 className="text-lg font-semibold">試合一覧</h2>
        <div className="space-y-3">
          {data.matches.map((match) => (
            <MatchCard key={match.id} match={importanceByMatchId.get(match.id) ?? match} teams={data.teams} compact onSelect={() => onMatchSelect(match.id)} />
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
  const toggleSelectedTeamId = (teamId: string, selected: boolean) => {
    const selectedTeamIds = selected ? [...new Set([...preferences.selectedTeamIds, teamId])] : preferences.selectedTeamIds.filter((selectedTeamId) => selectedTeamId !== teamId);
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
          onChange={(event) => onPreferencesChange({ ...preferences, mainFavoriteTeamId: event.currentTarget.value })}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-base text-slate-50 outline-none focus:border-cyan-300"
        >
          <option value="">未設定</option>
          {data.teams.map((team) => (
            <option key={team.id} value={team.id}>{team.name}</option>
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
  onSelect?: () => void;
};

const hasImportance = (match: Match | MatchWithImportance): match is MatchWithImportance => 'importanceScore' in match;

function MatchCard({ match, teams, compact = false, showRank = false, onSelect }: MatchCardProps) {
  const importance = hasImportance(match) ? match : null;

  return (
    <button type="button" onClick={onSelect} disabled={!onSelect} className={`w-full rounded-xl bg-slate-800 p-3 text-left ${onSelect ? 'transition hover:bg-slate-700' : 'cursor-default'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {showRank && importance && <span className="rounded-full bg-cyan-300 px-2 py-1 text-xs font-bold text-slate-950">#{importance.importanceRank}</span>}
            {importance && <span className="rounded-full bg-slate-950 px-2 py-1 text-xs font-bold text-cyan-300">重要度 {importance.importanceLabel}</span>}
            {importance && !compact && <span className="text-xs font-semibold text-slate-400">{importance.importanceScore}点</span>}
          </div>
          <p className="text-xs font-semibold text-slate-400">{formatMatchDateTime(match)}</p>
          <p className="mb-2 text-xs text-slate-400">{formatMatchStage(match)}</p>
          <p className="truncate text-sm font-semibold">{teamName(teams, match.homeTeamId)}</p>
          <p className="truncate text-sm font-semibold">{teamName(teams, match.awayTeamId)}</p>
          {importance && !compact && (
            <div className="mt-3 flex flex-wrap gap-2">
              {importance.reasonTags.map((tag) => <span key={tag} className="rounded-full bg-slate-700 px-2 py-1 text-xs text-slate-200">{tag}</span>)}
            </div>
          )}
        </div>
        <div className="shrink-0 rounded-lg bg-slate-950 px-3 py-2 text-center">
          <p className="text-sm font-bold text-cyan-300">{scoreLabel(match)}</p>
          <p className="mt-1 text-xs text-slate-400">{match.played ? 'played' : '未実施'}</p>
        </div>
      </div>
    </button>
  );
}

type MatchDetailScreenProps = {
  match: MatchWithImportance;
  teams: Team[];
  preferences: UserPreferences;
  trackedTeamIds: string[];
  returnScreen: MainScreen;
  onBack: () => void;
};

function MatchDetailScreen({ match, teams, preferences, trackedTeamIds, returnScreen, onBack }: MatchDetailScreenProps) {
  const japanTeamId = findJapanTeamId(teams);
  const mainFavoriteName = preferences.mainFavoriteTeamId ? teamName(teams, preferences.mainFavoriteTeamId) : '';
  const selectedTeamNames = preferences.selectedTeamIds.filter((teamId) => matchIncludesTeam(match, teamId)).map((teamId) => teamName(teams, teamId));
  const viewingPoints = getViewingPoints(match, teams, preferences, trackedTeamIds);
  const impactItems = getImpactItems(match);
  const backLabel = returnScreen === 'schedule' ? 'Scheduleに戻る' : 'Homeに戻る';

  const handleDownloadIcs = () => {
    const content = createMatchIcsEvent(match, teams, {
      importanceLabel: match.importanceLabel,
      importanceScore: match.importanceScore,
      reasonTags: match.reasonTags,
    });
    downloadIcsFile(`wc-watch-os-match-${match.id}.ics`, content);
  };

  return (
    <div className="space-y-5">
      <button type="button" onClick={onBack} className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-cyan-300">{backLabel}</button>
      <section className="space-y-4 rounded-2xl bg-slate-900 p-4 shadow-lg">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">Match Detail</p>
          <h2 className="text-2xl font-bold leading-tight">{teamName(teams, match.homeTeamId)} vs {teamName(teams, match.awayTeamId)}</h2>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <Metric label="日付" value={match.date} />
          <Metric label="Kickoff" value={`${match.kickoffTimeJST} JST`} />
          <Metric label="Stage" value={formatMatchStage(match)} />
          <Metric label="状態" value={match.played ? 'played' : '未実施'} />
          <Metric label="スコア" value={scoreLabel(match)} />
          <Metric label="重要度" value={`${match.importanceLabel} / ${match.importanceScore}点`} />
        </div>
        <button type="button" onClick={handleDownloadIcs} className="w-full rounded-xl bg-cyan-300 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-200">ICSをダウンロード</button>
        <p className="text-xs leading-5 text-slate-400">端末やブラウザによっては、ダウンロード後にカレンダーアプリで開く操作が必要です。</p>
        <div className="flex flex-wrap gap-2">
          {match.reasonTags.map((tag) => <span key={tag} className="rounded-full bg-slate-700 px-2 py-1 text-xs text-slate-200">{tag}</span>)}
        </div>
      </section>

      <section className="space-y-3 rounded-2xl bg-slate-900 p-4 shadow-lg">
        <h3 className="text-lg font-semibold">関係性</h3>
        <div className="grid gap-2 text-sm">
          <Metric label="日本代表との関係" value={japanTeamId ? (matchIncludesTeam(match, japanTeamId) ? '日本代表が関係する試合' : '直接関係なし') : '日本代表データなし'} />
          <Metric label="メイン推し国との関係" value={preferences.mainFavoriteTeamId ? (matchIncludesTeam(match, preferences.mainFavoriteTeamId) ? `${mainFavoriteName} が関係` : '直接関係なし') : '未設定'} />
          <Metric label="選択中の推し国との関係" value={selectedTeamNames.length > 0 ? selectedTeamNames.join(' / ') : '直接関係なし'} />
        </div>
      </section>

      <section className="space-y-3 rounded-2xl bg-slate-900 p-4 shadow-lg">
        <h3 className="text-lg font-semibold">観戦ポイント</h3>
        <ul className="space-y-2">{viewingPoints.map((point) => <li key={point} className="rounded-xl bg-slate-800 px-3 py-2 text-sm leading-6 text-slate-200">{point}</li>)}</ul>
      </section>

      <section className="space-y-3 rounded-2xl bg-slate-900 p-4 shadow-lg">
        <h3 className="text-lg font-semibold">勝敗時インパクト</h3>
        <div className="space-y-2">
          {impactItems.map((item) => (
            <div key={item.label} className="rounded-xl bg-slate-800 px-3 py-2">
              <p className="text-sm font-semibold text-cyan-300">{item.label}</p>
              <p className="mt-1 text-sm leading-6 text-slate-300">{item.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const getViewingPoints = (match: MatchWithImportance, teams: Team[], preferences: UserPreferences, trackedTeamIds: string[]): string[] => {
  const points: string[] = [];
  const japanTeamId = findJapanTeamId(teams);

  if (japanTeamId && matchIncludesTeam(match, japanTeamId)) points.push('日本代表が関係する試合です。');
  if (preferences.mainFavoriteTeamId && matchIncludesTeam(match, preferences.mainFavoriteTeamId)) points.push('メイン推し国が関係する試合です。');
  if (preferences.selectedTeamIds.some((teamId) => matchIncludesTeam(match, teamId))) points.push('選択中の推し国が関係する試合です。');
  if (match.stage === 'group' && isSameGroupAsTrackedTeam(match, teams, trackedTeamIds)) points.push('推し国と同組のため、順位に影響する可能性があります。');
  if (match.stage === 'group') points.push('3位通過ラインに関わる可能性があります。');
  if (match.played) points.push('消化済みの試合です。現在の順位表・3位通過ラインに結果が反映されています。');
  if (points.length === 0) points.push('今後のステージや他会場結果を見るうえで参考になる試合です。');

  return [...new Set(points)];
};

const getImpactItems = (match: Match): { label: string; text: string }[] => {
  if (match.played) {
    return [{ label: '終了済み', text: 'この試合は終了済みです。現在の順位表・3位通過ラインに結果が反映されています。' }];
  }

  return [
    { label: '勝利時', text: '勝点3を積み上げ、突破圏に近づきます。' },
    { label: '引き分け時', text: '勝点1を積み上げますが、他会場結果の影響を受けやすくなります。' },
    { label: '敗戦時', text: '勝点を積めず、3位通過ラインや他会場結果への依存が高まります。' },
  ];
};

type StandingsCardsProps = {
  standings: GroupStanding[];
  thirdPlace: StandingRow[];
  teams: Team[];
  trackedTeamIds: string[];
};

function StandingsCards({ standings, thirdPlace, teams, trackedTeamIds }: StandingsCardsProps) {
  return (
    <section className="space-y-3 rounded-2xl bg-slate-900 p-4 shadow-lg">
      <h2 className="text-lg font-semibold">順位サマリー</h2>
      <div className="space-y-3">
        {standings.map((group) => (
          <div key={group.groupId} className="rounded-xl bg-slate-800 p-3">
            <h3 className="mb-2 text-sm font-semibold text-cyan-300">Group {group.groupId}</h3>
            <div className="space-y-2">
              {group.rows.map((row, index) => <StandingRowCard key={row.teamId} row={row} rank={index + 1} teams={teams} compact />)}
            </div>
          </div>
        ))}
      </div>
      <ThirdPlaceLineSection thirdPlace={thirdPlace} teams={teams} trackedTeamIds={trackedTeamIds} />
    </section>
  );
}

type ThirdPlaceLineSectionProps = {
  thirdPlace: StandingRow[];
  teams: Team[];
  trackedTeamIds: string[];
};

function ThirdPlaceLineSection({ thirdPlace, teams, trackedTeamIds }: ThirdPlaceLineSectionProps) {
  const line = getThirdPlaceLine(thirdPlace);
  const trackedSummaries = trackedTeamIds.map((teamId) => getThirdPlaceSummary(teamId, teams, thirdPlace));
  const lineTeamName = line.lineTeam ? teamName(teams, line.lineTeam.teamId) : '-';
  const firstOutsideName = line.firstOutsideTeam ? teamName(teams, line.firstOutsideTeam.teamId) : '-';

  return (
    <div className="space-y-3 rounded-xl bg-slate-800 p-3">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-cyan-300">3位通過ライン</h3>
        <p className="text-sm leading-6 text-slate-300">MVP版では3位ランキング上位8チームを通過圏として、8位を現在の通過ラインとして表示します。</p>
      </div>
      <div className="rounded-xl border border-cyan-300/30 bg-slate-900 p-3">
        <p className="text-xs font-semibold text-slate-400">現在の8位ライン</p>
        <p className="mt-1 text-base font-semibold">{lineTeamName}</p>
        {line.lineTeam ? (
          <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
            <Metric label="勝点" value={line.lineTeam.points} />
            <Metric label="得失点差" value={line.lineTeam.goalDiff} />
            <Metric label="総得点" value={line.lineTeam.goalsFor} />
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-400">3位チーム数がまだ不足しています。</p>
        )}
        <p className="mt-3 text-xs leading-5 text-slate-400">
          圏外先頭: {firstOutsideName}
          {line.pointsGapToOutside !== null && line.goalDiffGapToOutside !== null
            ? ` / 9位との差: 勝点${line.pointsGapToOutside}, 得失点差${line.goalDiffGapToOutside}`
            : ' / 9位との差は未算出'}
        </p>
      </div>
      {trackedSummaries.length > 0 && (
        <div className="space-y-2">
          {trackedSummaries.map((summary) => (
            <div key={summary.teamId} className="rounded-xl bg-slate-900 px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-sm font-semibold">{summary.teamName}</p>
                <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-bold ${thirdPlaceStatusStyles[summary.status]}`}>{summary.statusLabel}</span>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-400">{summary.summary}</p>
            </div>
          ))}
        </div>
      )}
      <div className="space-y-2">
        {thirdPlace.map((row, index) => <ThirdPlaceRowCard key={row.teamId} row={row} rank={index + 1} teams={teams} highlighted={trackedTeamIds.includes(row.teamId)} />)}
      </div>
      <p className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs leading-5 text-slate-400">MVP版では詳細タイブレーク・直接対決・フェアプレーポイント等は未反映です。</p>
    </div>
  );
}

type ThirdPlaceRowCardProps = {
  row: StandingRow;
  rank: number;
  teams: Team[];
  highlighted: boolean;
};

function ThirdPlaceRowCard({ row, rank, teams, highlighted }: ThirdPlaceRowCardProps) {
  const status = getThirdPlaceRowStatus(rank);
  const label = getThirdPlaceStatusLabel(status);

  return (
    <div className={`rounded-lg px-3 py-2 ${highlighted ? 'bg-cyan-300/15 ring-1 ring-cyan-300/60' : 'bg-slate-900'}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{rank}. {teamName(teams, row.teamId)}</p>
          <p className="text-xs text-slate-400">勝点 {row.points} / GD {row.goalDiff} / 得点 {row.goalsFor}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-bold ${thirdPlaceStatusStyles[status]}`}>{label}</span>
      </div>
    </div>
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
        <p className="truncate text-sm font-semibold">{rank}. {teamName(teams, row.teamId)}</p>
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
