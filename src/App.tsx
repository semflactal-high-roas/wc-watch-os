import { useEffect, useMemo, useState } from 'react';
import ProvisionalTournamentBracketBeta from './ProvisionalTournamentBracketBeta';
import { loadAppData } from './data/loader';
import { formatJstDateWithWeekday, formatMatchDateTime } from './logic/dateTimeDisplay';
import { getHomeMatchSections, isUpcomingMatch, type HomeMatchSections } from './logic/homeMatchSections';
import { createMatchIcsEvent, downloadIcsFile } from './logic/ics';
import { getJapanMatchImpactItems } from './logic/japanMatchImpact';
import { getJapanScenarioSummary, type JapanScenarioSummary } from './logic/japanScenario';
import { getFinishedMatchResultMessage, isFinishedMatchForDisplay } from './logic/matchDisplayStatus';
import { rankMatchesByImportance, type MatchWithImportance } from './logic/matchImportance';
import { getQualificationSummary } from './logic/qualificationStatus';
import { getRecommendationReason } from './logic/recommendationCopy';
import { getScheduleDisplayStateLabel, getScheduleMatchStatusLabel, groupScheduleMatchesByDisplayState, type ScheduleDisplayState } from './logic/scheduleDisplayState';
import { filterScheduleMatches, getScheduleFilterOptions, type ScheduleFilterId } from './logic/scheduleFilters';
import { buildMatchShareText, copyTextToClipboard } from './logic/shareCopy';
import { computeGroupStandings } from './logic/standings';
import { getJstViewingHint, formatKickoffWithTimeOfDay } from './logic/timeOfDayLabel';
import { getThirdPlaceLine } from './logic/thirdPlaceLine';
import { rankThirdPlaceTeams } from './logic/thirdPlaceRanking';
import type { AppData, Match, MatchStage, QualificationSummary, StandingRow, Team } from './types';

type MainScreen = 'home' | 'schedule' | 'standings' | 'tournament' | 'settings';
type MainTab = Exclude<MainScreen, 'settings'>;
type Screen = MainScreen | 'matchDetail';
type GroupStanding = { groupId: string; rows: StandingRow[] };
type ShareStatus = 'idle' | 'copied' | 'error';

type UserPreferences = {
  mainFavoriteTeamId: string;
  selectedTeamIds: string[];
};

const preferencesKey = 'wc-watch-os:userPreferences';
const japanTeamId = 'JPN';
const calendarHelperText = '端末やブラウザによっては、ダウンロード後にカレンダーアプリで開く操作が必要です。通知時間はカレンダーアプリ側で調整してください。';

const defaultPreferences: UserPreferences = {
  mainFavoriteTeamId: '',
  selectedTeamIds: [],
};

const tabs: { id: MainTab; label: string }[] = [
  { id: 'home', label: 'ホーム' },
  { id: 'schedule', label: '日程' },
  { id: 'standings', label: '順位' },
  { id: 'tournament', label: 'トーナメント' },
];

const stageLabels: Record<MatchStage, string> = {
  group: 'グループステージ',
  round_of_32: 'ラウンド32',
  round_of_16: 'ラウンド16',
  quarter_final: '準々決勝',
  semi_final: '準決勝',
  third_place: '3位決定戦',
  final: '決勝',
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

const formatTeamName = (teams: Team[], teamId: string): string => {
  const team = teams.find((candidate) => candidate.id === teamId);
  if (!team) return teamId;
  return team.flagEmoji ? `${team.name} ${team.flagEmoji}` : team.name;
};

const teamName = formatTeamName;
const matchIncludesTeam = (match: Match, teamId: string): boolean => match.homeTeamId === teamId || match.awayTeamId === teamId;
const teamGroup = (teams: Team[], teamId: string): string => teams.find((team) => team.id === teamId)?.group ?? '';
const scoreLabel = (match: Match): string => {
  if (!isFinishedMatchForDisplay(match)) return 'これから';
  return match.homeScore === null || match.awayScore === null ? '結果確認' : `${match.homeScore} - ${match.awayScore}`;
};
const matchStatusLabel = (match: Match): string => (isFinishedMatchForDisplay(match) ? '終了' : 'これから');
const formatRecord = (row: StandingRow): string => `${row.won}勝 ${row.draw}分 ${row.lost}敗`;

const formatMatchStage = (match: Match): string => {
  if (match.stage === 'group' && match.groupId) return `Group ${match.groupId}`;
  return stageLabels[match.stage];
};

const importanceLabelText = (label?: string): string => {
  if (label === 'S' || label === 'A') return '高';
  if (label === 'B') return '中';
  if (label === 'C') return '低';
  return label ?? '-';
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

const getTrackedTeamIds = (teams: Team[], preferences: UserPreferences): string[] => {
  const ids = [japanTeamId, preferences.mainFavoriteTeamId, ...preferences.selectedTeamIds].filter((teamId) => teams.some((team) => team.id === teamId));
  return [...new Set(ids)];
};

const isSameGroupAsTrackedTeam = (match: Match, teams: Team[], trackedTeamIds: string[]): boolean => {
  const matchGroups = new Set([match.groupId, teamGroup(teams, match.homeTeamId), teamGroup(teams, match.awayTeamId)].filter(Boolean));
  return trackedTeamIds.some((teamId) => {
    const group = teamGroup(teams, teamId);
    return group ? matchGroups.has(group) : false;
  });
};

function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [error, setError] = useState<string>('');
  const [activeScreen, setActiveScreen] = useState<Screen>('home');
  const [detailReturnScreen, setDetailReturnScreen] = useState<MainScreen>('home');
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [preferences, setPreferences] = useState<UserPreferences>(() => readPreferences());
  const [today, setToday] = useState(() => new Date());

  useEffect(() => {
    loadAppData().then(setData).catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setToday(new Date()), 60_000);
    return () => window.clearInterval(timer);
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
        data.matches.filter(
          (match) =>
            match.stage === 'group' &&
            group.teamIds.includes(match.homeTeamId) &&
            group.teamIds.includes(match.awayTeamId),
        ),
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

  const japanMatches = useMemo(
    () => sortMatchesByDate(rankedMatches.filter((match) => matchIncludesTeam(match, japanTeamId) && isUpcomingMatch(match, today))),
    [rankedMatches, today],
  );
  const favoriteNextMatch = useMemo(
    () => preferences.mainFavoriteTeamId
      ? sortMatchesByDate(rankedMatches.filter((match) => matchIncludesTeam(match, preferences.mainFavoriteTeamId) && isUpcomingMatch(match, today)))[0] ?? null
      : null,
    [preferences.mainFavoriteTeamId, rankedMatches, today],
  );
  const japanScenario = useMemo(() => (data ? getJapanScenarioSummary(data, standings, data.matches) : null), [data, standings]);

  const homeMatchSections = useMemo(() => getHomeMatchSections(rankedMatches, preferences, today), [preferences, rankedMatches, today]);

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
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">日本時間で見るW杯ガイド</p>
          <span className="mt-2 inline-flex w-fit rounded-full border border-cyan-300/40 bg-cyan-300/10 px-2 py-1 text-xs font-semibold text-cyan-200">
            2026 FIFA World Cup 対応
          </span>
          <h1 className="mt-1 text-2xl font-bold">W杯 観戦ナビ</h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">日本代表と応援する国の試合だけ、見る価値で整理</p>
        </header>

        {activeScreen === 'home' && (
          <HomeScreen
            data={data}
            preferences={preferences}
            homeMatchSections={homeMatchSections}
            japanMatches={japanMatches}
            favoriteNextMatch={favoriteNextMatch}
            japanScenario={japanScenario}
            qualificationSummaries={qualificationSummaries}
            onSettingsOpen={() => setActiveScreen('settings')}
            onScheduleOpen={() => setActiveScreen('schedule')}
            onStandingsOpen={() => setActiveScreen('standings')}
            onTournamentOpen={() => setActiveScreen('tournament')}
            onMatchSelect={(matchId) => openMatchDetail(matchId, 'home')}
          />
        )}
        {activeScreen === 'schedule' && (
          <ScheduleScreen
            data={data}
            preferences={preferences}
            rankedMatches={rankedMatches}
            today={today}
            onMatchSelect={(matchId) => openMatchDetail(matchId, 'schedule')}
          />
        )}
        {activeScreen === 'standings' && (
          <StandingsScreen standings={standings} thirdPlace={thirdPlace} teams={data.teams} trackedTeamIds={trackedTeamIds} />
        )}
        {activeScreen === 'tournament' && (
          <ProvisionalTournamentBracketBeta data={data} standings={standings} mainFavoriteTeamId={preferences.mainFavoriteTeamId} />
        )}
        {activeScreen === 'settings' && (
          <SettingsScreen data={data} preferences={preferences} onPreferencesChange={setPreferences} onBack={() => setActiveScreen('home')} />
        )}
        {activeScreen === 'matchDetail' && selectedMatch && (
          <MatchDetailScreen
            match={selectedMatch}
            teams={data.teams}
            preferences={preferences}
            trackedTeamIds={trackedTeamIds}
            today={today}
            returnScreen={detailReturnScreen}
            onBack={closeMatchDetail}
          />
        )}
      </div>

      {activeScreen !== 'matchDetail' && (
        <nav className="fixed inset-x-0 bottom-0 border-t border-slate-800 bg-slate-950/95 px-3 py-2 backdrop-blur">
          <div className="mx-auto grid max-w-md grid-cols-4 gap-2">
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
  homeMatchSections: HomeMatchSections;
  japanMatches: MatchWithImportance[];
  favoriteNextMatch: MatchWithImportance | null;
  japanScenario: JapanScenarioSummary | null;
  qualificationSummaries: QualificationSummary[];
  onSettingsOpen: () => void;
  onScheduleOpen: () => void;
  onStandingsOpen: () => void;
  onTournamentOpen: () => void;
  onMatchSelect: (matchId: string) => void;
};

function HomeScreen({
  data,
  preferences,
  homeMatchSections,
  japanMatches,
  favoriteNextMatch,
  japanScenario,
  qualificationSummaries,
  onSettingsOpen,
  onScheduleOpen,
  onStandingsOpen,
  onTournamentOpen,
  onMatchSelect,
}: HomeScreenProps) {
  const favoriteName = preferences.mainFavoriteTeamId ? teamName(data.teams, preferences.mainFavoriteTeamId) : '未設定';

  return (
    <div className="space-y-5">
      <section className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-lg">
        <div>
          <p className="text-xs font-semibold text-cyan-300">推し国設定</p>
          <p className="mt-1 text-sm text-slate-300">メインで応援する国: {favoriteName}</p>
        </div>
        <button type="button" onClick={onSettingsOpen} className="shrink-0 rounded-xl border border-cyan-300/50 px-3 py-2 text-sm font-bold text-cyan-200 transition hover:bg-cyan-300/10">
          設定する
        </button>
      </section>

      <HomeMatchRecommendationSections
        sections={homeMatchSections}
        teams={data.teams}
        favoriteName={favoriteName}
        onMatchSelect={onMatchSelect}
        onScheduleOpen={onScheduleOpen}
        onStandingsOpen={onStandingsOpen}
        onTournamentOpen={onTournamentOpen}
      />

      <QualificationStatusSection summaries={qualificationSummaries} teams={data.teams} />
      <NextMatchSection title="日本代表の次戦" match={japanMatches[0] ?? null} emptyMessage="日本代表の次戦データがまだ登録されていません" teams={data.teams} onMatchSelect={onMatchSelect} />
      <NextMatchSection title="推し国の次戦" match={favoriteNextMatch} emptyMessage={preferences.mainFavoriteTeamId ? 'メイン推し国の次戦データがまだ登録されていません' : '推し国設定からメインで応援する国を選ぶと表示します'} teams={data.teams} onMatchSelect={onMatchSelect} />
      {japanScenario && <JapanScenarioSection scenario={japanScenario} teams={data.teams} />}

      <section className="space-y-3 rounded-2xl border border-violet-300/30 bg-slate-900 p-4 shadow-lg">
        <div>
          <p className="text-xs font-semibold text-violet-300">暫定トーナメント表β</p>
          <h2 className="mt-1 text-lg font-semibold">暫定トーナメント表β</h2>
        </div>
        <p className="text-sm leading-6 text-slate-300">現在順位ベースで、決勝トーナメントの想定組み合わせを確認できます。</p>
        <button type="button" onClick={onTournamentOpen} className="w-full rounded-xl bg-violet-300 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-violet-200">
          トーナメント表を見る
        </button>
      </section>
    </div>
  );
}

function HomeMatchRecommendationSections({
  sections,
  teams,
  favoriteName,
  onMatchSelect,
  onScheduleOpen,
  onStandingsOpen,
  onTournamentOpen,
}: {
  sections: HomeMatchSections;
  teams: Team[];
  favoriteName: string;
  onMatchSelect: (matchId: string) => void;
  onScheduleOpen: () => void;
  onStandingsOpen: () => void;
  onTournamentOpen: () => void;
}) {
  if (sections.tournamentFinished) {
    return (
      <section className="space-y-3 rounded-2xl bg-slate-900 p-4 shadow-lg">
        <h2 className="text-lg font-semibold">大会日程は終了しました</h2>
        <p className="text-sm leading-6 text-slate-300">結果、順位、トーナメント表から大会を振り返れます。</p>
        <div className="grid grid-cols-3 gap-2">
          <HomeNavigationButton label="日程を見る" onClick={onScheduleOpen} />
          <HomeNavigationButton label="順位を見る" onClick={onStandingsOpen} />
          <HomeNavigationButton label="トーナメント" onClick={onTournamentOpen} />
        </div>
      </section>
    );
  }

  return (
    <>
      {sections.upcomingWatchMatches.length > 0 && (
        <section className="space-y-3 rounded-2xl bg-slate-900 p-4 shadow-lg">
          <h2 className="text-lg font-semibold">これから見るべき試合</h2>
          <p className="text-sm leading-6 text-slate-300">今日この後に始まる未開始試合を、見る優先度が高い順に表示します。</p>
          <p className="rounded-xl bg-slate-800 px-3 py-2 text-sm text-slate-300">メインで応援する国: {favoriteName}</p>
          <div className="space-y-3">
            {sections.upcomingWatchMatches.map((match) => (
              <MatchCard key={match.id} match={match} teams={teams} showRank onSelect={() => onMatchSelect(match.id)} />
            ))}
          </div>
        </section>
      )}

      {sections.todayFinishedImportantMatches.length > 0 && (
        <section className="space-y-3 rounded-2xl border border-emerald-300/20 bg-slate-900 p-4 shadow-lg">
          <h2 className="text-lg font-semibold">今日の結果確認</h2>
          <p className="text-sm leading-6 text-slate-300">今日終了した試合のうち、重要度が高い試合や応援する国に関係する結果です。</p>
          <div className="space-y-3">
            {sections.todayFinishedImportantMatches.map((match) => (
              <MatchCard key={match.id} match={match} teams={teams} compact onSelect={() => onMatchSelect(match.id)} />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <HomeNavigationButton label="日程を見る" onClick={onScheduleOpen} />
            <HomeNavigationButton label="順位を見る" onClick={onStandingsOpen} />
          </div>
        </section>
      )}

      {sections.upcomingWatchMatches.length === 0 && (
        <section className="space-y-3 rounded-2xl border border-amber-300/20 bg-slate-900 p-4 shadow-lg">
          <p className="rounded-xl border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-sm text-amber-100">
            {sections.hasTodayMatches ? '今日これから見る試合はありません。' : '今日は試合がありません。'}
          </p>
          <h2 className="text-lg font-semibold">次の注目試合</h2>
          {sections.nextFeaturedMatches.length > 0 ? (
            <div className="space-y-3">
              {sections.nextFeaturedMatches.map((match) => (
                <MatchCard key={match.id} match={match} teams={teams} onSelect={() => onMatchSelect(match.id)} />
              ))}
            </div>
          ) : (
            <p className="rounded-xl bg-slate-800 px-3 py-3 text-sm text-slate-300">次の注目試合はまだ登録されていません。</p>
          )}
          <HomeNavigationButton label="日程を見る" onClick={onScheduleOpen} />
        </section>
      )}
    </>
  );
}

function HomeNavigationButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="w-full rounded-xl border border-cyan-300/50 px-3 py-2 text-sm font-bold text-cyan-200 transition hover:bg-cyan-300/10">
      {label}
    </button>
  );
}

function TimeOfDayInfo({ match }: { match: Match }) {
  const label = formatKickoffWithTimeOfDay(match.kickoffTimeJST);
  const hint = getJstViewingHint(match.kickoffTimeJST);

  return (
    <p className="text-xs leading-5 text-cyan-200">
      {label}
      {hint ? ` / ${hint}` : ''}
    </p>
  );
}

function ShareButton({ onClick, status }: { onClick: () => void; status: ShareStatus }) {
  return (
    <div className="space-y-2">
      <button type="button" onClick={onClick} className="w-full rounded-xl border border-slate-600 px-4 py-3 text-sm font-bold text-slate-100 transition hover:bg-slate-800">
        この試合を共有
      </button>
      <p className="text-xs leading-5 text-slate-400">XやLINEに貼れる共有文をコピーします。</p>
      {status === 'copied' && <p className="text-xs font-semibold text-emerald-300">共有文をコピーしました</p>}
      {status === 'error' && <p className="text-xs font-semibold text-rose-300">コピーできませんでした。手動で選択してコピーしてください。</p>}
    </div>
  );
}

function NextMatchSection({ title, match, emptyMessage, teams, onMatchSelect }: { title: string; match: MatchWithImportance | null; emptyMessage: string; teams: Team[]; onMatchSelect: (matchId: string) => void }) {
  return (
    <section className="space-y-3 rounded-2xl bg-slate-900 p-4 shadow-lg">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      {!match ? (
        <p className="rounded-xl bg-slate-800 px-3 py-3 text-sm text-slate-300">{emptyMessage}</p>
      ) : (
        <div className="space-y-2">
          <MatchCard match={match} teams={teams} onSelect={() => onMatchSelect(match.id)} />
          {matchIncludesTeam(match, japanTeamId) && <JapanMatchImpactSummary match={match} teams={teams} />}
        </div>
      )}
    </section>
  );
}

function JapanMatchImpactSummary({ match, teams }: { match: Match; teams: Team[] }) {
  const items = getJapanMatchImpactItems(match, teams);
  if (items.length === 0) return null;

  return (
    <div className="space-y-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2">
      <p className="text-xs font-semibold text-cyan-300">勝敗時インパクト</p>
      {items.map((item) => (
        <p key={item.label} className="text-xs leading-5 text-slate-300">
          <span className="font-semibold text-slate-100">{item.label}：</span>
          {item.text}
        </p>
      ))}
    </div>
  );
}

function JapanScenarioSection({ scenario, teams }: { scenario: JapanScenarioSummary; teams: Team[] }) {
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
        <Metric label="次戦キックオフ" value={scenario.nextMatch ? formatMatchDateTime(scenario.nextMatch) : '未登録'} />
      </div>
      {scenario.nextMatch && <TimeOfDayInfo match={scenario.nextMatch} />}
      <div className="flex flex-wrap gap-2">
        {scenario.rivals.map((team) => <span key={team.id} className="rounded-full bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200">{teamName(teams, team.id)}</span>)}
      </div>
      <div className="space-y-2">
        {scenario.messages.map((message) => <p key={message} className="rounded-xl bg-slate-800 px-3 py-2 text-sm leading-6 text-slate-200">{message}</p>)}
      </div>
      <p className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs leading-5 text-slate-400">MVP版では詳細タイブレーク・直接対決・フェアプレーポイント等は未反映です。</p>
    </section>
  );
}

function QualificationStatusSection({ summaries, teams }: { summaries: QualificationSummary[]; teams: Team[] }) {
  return (
    <section className="space-y-3 rounded-2xl bg-slate-900 p-4 shadow-lg">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">突破条件カード</h2>
        <p className="text-sm leading-6 text-slate-300">日本代表・メインで応援する国・応援中の国について、現在順位と残り試合からMVP版の見通しを表示します。</p>
      </div>
      <div className="space-y-3">
        {summaries.map((summary) => <QualificationCard key={summary.teamId} summary={summary} teams={teams} />)}
      </div>
      <p className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs leading-5 text-slate-400">MVP版では詳細タイブレーク・直接対決・フェアプレーポイント・抽選等は未反映です。</p>
    </section>
  );
}

function QualificationCard({ summary, teams }: { summary: QualificationSummary; teams: Team[] }) {
  const standing = summary.context?.standing;
  const rank = summary.context?.groupRank;
  const remainingText = summary.context ? (summary.context.remainingMatches === 0 ? '全日程終了' : `残り${summary.context.remainingMatches}試合`) : '残り試合不明';

  return (
    <article className="space-y-3 rounded-xl bg-slate-800 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold">{teamName(teams, summary.teamId)}</p>
          <p className="text-xs text-slate-400">{summary.context?.groupId ? `Group ${summary.context.groupId}` : 'Group unknown'}</p>
        </div>
        <span className="shrink-0 rounded-full bg-cyan-300 px-2 py-1 text-xs font-bold text-slate-950">{summary.statusLabel}</span>
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

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-slate-900 px-3 py-2">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 font-semibold text-slate-50">{value}</p>
    </div>
  );
}

function ScheduleScreen({ data, preferences, rankedMatches, today, onMatchSelect }: { data: AppData; preferences: UserPreferences; rankedMatches: MatchWithImportance[]; today: Date; onMatchSelect: (matchId: string) => void }) {
  const [activeFilterId, setActiveFilterId] = useState<ScheduleFilterId>('today_next');
  const importanceByMatchId = new Map(rankedMatches.map((match) => [match.id, match]));
  const filterOptions = useMemo(() => getScheduleFilterOptions(data.matches, data.teams, preferences, today), [data.matches, data.teams, preferences, today]);
  const filterResult = useMemo(() => filterScheduleMatches(data.matches, data.teams, preferences, activeFilterId, today), [data.matches, data.teams, preferences, activeFilterId, today]);
  const matchGroups = useMemo(() => groupScheduleMatchesByDisplayState(filterResult.matches, today), [filterResult.matches, today]);
  const emptyMessage = filterResult.message ?? 'この条件に合う試合はありません';

  return (
    <div className="space-y-5">
      <section className="space-y-4 rounded-2xl bg-slate-900 p-4 shadow-lg">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">試合一覧</h2>
          <p className="text-sm leading-6 text-slate-300">見たい切り口を選んで、全72試合から必要な試合だけを絞り込めます。</p>
          <p className="text-xs leading-5 text-cyan-200">日付と時刻はすべて日本時間で表示しています。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((option) => {
            const isActive = option.id === activeFilterId;
            return (
              <button key={option.id} type="button" onClick={() => setActiveFilterId(option.id)} className={`rounded-full px-3 py-2 text-xs font-bold transition ${isActive ? 'bg-cyan-300 text-slate-950' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`}>
                {option.label} {option.count}
              </button>
            );
          })}
        </div>
        <p className="text-sm font-semibold text-slate-300">{filterResult.matches.length}試合を表示中</p>
        {filterResult.message && <p className="rounded-xl border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-sm leading-6 text-amber-100">{filterResult.message}</p>}
        {filterResult.matches.length === 0 ? (
          <p className="rounded-xl bg-slate-800 px-3 py-3 text-sm leading-6 text-slate-300">{emptyMessage}</p>
        ) : (
          <div className="space-y-5">
            <ScheduleMatchSection title="これからの試合" matches={matchGroups.upcoming} displayState="upcoming" importanceByMatchId={importanceByMatchId} teams={data.teams} onMatchSelect={onMatchSelect} />
            <ScheduleMatchSection
              title="進行中・結果待ち"
              description="このアプリはリアルタイム速報ではありません。結果は確認後に手動更新されます。"
              matches={matchGroups.started_awaiting_result}
              displayState="started_awaiting_result"
              importanceByMatchId={importanceByMatchId}
              teams={data.teams}
              onMatchSelect={onMatchSelect}
            />
            <ScheduleMatchSection title="終了済み" matches={matchGroups.finished} displayState="finished" importanceByMatchId={importanceByMatchId} teams={data.teams} onMatchSelect={onMatchSelect} />
          </div>
        )}
      </section>
    </div>
  );
}

function ScheduleMatchSection({ title, description, matches, displayState, importanceByMatchId, teams, onMatchSelect }: { title: string; description?: string; matches: Match[]; displayState: ScheduleDisplayState; importanceByMatchId: Map<string, MatchWithImportance>; teams: Team[]; onMatchSelect: (matchId: string) => void }) {
  return (
    <section className="space-y-3" aria-labelledby={`schedule-${displayState}`}>
      <div className="flex items-baseline justify-between gap-3 border-b border-slate-700 pb-2">
        <h3 id={`schedule-${displayState}`} className="text-base font-semibold text-slate-50">{title}</h3>
        <span className="shrink-0 text-xs font-semibold text-slate-400">{matches.length}試合</span>
      </div>
      {description && matches.length > 0 && <p className="rounded-xl border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-xs leading-5 text-amber-100">{description}</p>}
      {matches.length === 0 ? (
        <p className="rounded-xl bg-slate-800/60 px-3 py-3 text-sm text-slate-400">該当する試合はありません。</p>
      ) : (
        <div className="space-y-3">
          {matches.map((match) => <MatchCard key={match.id} match={importanceByMatchId.get(match.id) ?? match} teams={teams} compact scheduleDisplayState={displayState} onSelect={() => onMatchSelect(match.id)} />)}
        </div>
      )}
    </section>
  );
}

function SettingsScreen({ data, preferences, onPreferencesChange, onBack }: { data: AppData; preferences: UserPreferences; onPreferencesChange: (preferences: UserPreferences) => void; onBack: () => void }) {
  const toggleSelectedTeamId = (teamId: string, selected: boolean) => {
    const selectedTeamIds = selected ? [...new Set([...preferences.selectedTeamIds, teamId])] : preferences.selectedTeamIds.filter((selectedTeamId) => selectedTeamId !== teamId);
    onPreferencesChange({ ...preferences, selectedTeamIds });
  };

  return (
    <section className="space-y-5 rounded-2xl bg-slate-900 p-4 shadow-lg">
      <button type="button" onClick={onBack} className="rounded-xl border border-slate-600 px-3 py-2 text-sm font-bold text-cyan-200">
        ホームに戻る
      </button>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">応援する国の設定</h2>
        <p className="text-sm leading-6 text-slate-300">応援する国の設定はこの端末のブラウザに保存されます。応援する国を設定すると、Homeのおすすめ試合や日程フィルターに反映されます。メインで応援する国はおすすめ試合の優先度に強く反映されます。一緒に追いかける国は、日程フィルターや関連試合に反映されます。</p>
      </div>
      <label className="block space-y-2">
        <span className="text-sm font-semibold text-slate-200">メインで応援する国</span>
        <select value={preferences.mainFavoriteTeamId} onChange={(event) => onPreferencesChange({ ...preferences, mainFavoriteTeamId: event.currentTarget.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-base text-slate-50 outline-none focus:border-cyan-300">
          <option value="">未設定</option>
          {data.teams.map((team) => <option key={team.id} value={team.id}>{teamName(data.teams, team.id)}</option>)}
        </select>
      </label>
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-200">一緒に追いかける国</h3>
        <div className="grid gap-2">
          {data.teams.map((team) => (
            <label key={team.id} className="flex items-center justify-between rounded-xl bg-slate-800 px-3 py-3">
              <span>
                <span className="block text-sm font-semibold">{teamName(data.teams, team.id)}</span>
                <span className="text-xs text-slate-400">Group {team.group}</span>
              </span>
              <input type="checkbox" checked={preferences.selectedTeamIds.includes(team.id)} onChange={(event) => toggleSelectedTeamId(team.id, event.currentTarget.checked)} className="h-5 w-5 accent-cyan-300" />
            </label>
          ))}
        </div>
      </div>
    </section>
  );
}

function MatchCard({ match, teams, compact = false, showRank = false, scheduleDisplayState, onSelect }: { match: Match | MatchWithImportance; teams: Team[]; compact?: boolean; showRank?: boolean; scheduleDisplayState?: ScheduleDisplayState; onSelect?: () => void }) {
  const importance = 'importanceScore' in match ? match : null;
  const scheduleStatus = scheduleDisplayState === 'finished'
    ? { score: scoreLabel(match), label: getScheduleDisplayStateLabel(scheduleDisplayState) }
    : scheduleDisplayState === 'started_awaiting_result'
      ? { score: '結果待ち', label: getScheduleDisplayStateLabel(scheduleDisplayState) }
      : scheduleDisplayState === 'upcoming'
        ? { score: 'これから', label: getScheduleDisplayStateLabel(scheduleDisplayState) }
        : null;

  return (
    <button type="button" onClick={onSelect} disabled={!onSelect} className={`w-full rounded-xl bg-slate-800 p-3 text-left ${onSelect ? 'transition hover:bg-slate-700' : 'cursor-default'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {showRank && importance && <span className="rounded-full bg-cyan-300 px-2 py-1 text-xs font-bold text-slate-950">#{importance.importanceRank}</span>}
            {importance && <span className="rounded-full bg-slate-950 px-2 py-1 text-xs font-bold text-cyan-300">重要度 {importanceLabelText(importance.importanceLabel)}</span>}
            {importance && !compact && <span className="text-xs font-semibold text-slate-400">{importance.importanceScore}点</span>}
          </div>
          <p className="text-xs font-semibold text-slate-400">{formatMatchDateTime(match)}</p>
          <TimeOfDayInfo match={match} />
          <p className="mb-2 text-xs text-slate-400">{formatMatchStage(match)}</p>
          <p className="truncate text-sm font-semibold">{teamName(teams, match.homeTeamId)}</p>
          <p className="truncate text-sm font-semibold">{teamName(teams, match.awayTeamId)}</p>
          {importance && !compact && <div className="mt-3 flex flex-wrap gap-2">{importance.reasonTags.map((tag) => <span key={tag} className="rounded-full bg-slate-700 px-2 py-1 text-xs text-slate-200">{tag}</span>)}</div>}
        </div>
        <div className="shrink-0 rounded-lg bg-slate-950 px-3 py-2 text-center">
          <p className="text-sm font-bold text-cyan-300">{scheduleStatus?.score ?? scoreLabel(match)}</p>
          <p className="mt-1 text-xs text-slate-400">{scheduleStatus?.label ?? matchStatusLabel(match)}</p>
        </div>
      </div>
    </button>
  );
}

function MatchDetailScreen({ match, teams, preferences, trackedTeamIds, today, returnScreen, onBack }: { match: MatchWithImportance; teams: Team[]; preferences: UserPreferences; trackedTeamIds: string[]; today: Date; returnScreen: MainScreen; onBack: () => void }) {
  const [shareStatus, setShareStatus] = useState<ShareStatus>('idle');
  const viewingPoints = getViewingPoints(match, teams, preferences, trackedTeamIds);
  const impactItems = getImpactItems(match);
  const backLabel = returnScreen === 'schedule' ? '日程に戻る' : 'ホームに戻る';
  const recommendationReason = getRecommendationReason(match, teams, preferences);

  const handleDownloadIcs = () => {
    const content = createMatchIcsEvent(match, teams, {
      importanceLabel: match.importanceLabel,
      importanceScore: match.importanceScore,
      reasonTags: match.reasonTags,
    });
    downloadIcsFile(`wc-watch-os-match-${match.id}.ics`, content);
  };

  const handleShare = async () => {
    const copied = await copyTextToClipboard(buildMatchShareText(match, teams, {
      importanceLabel: importanceLabelText(match.importanceLabel),
      recommendationReason,
    }));
    setShareStatus(copied ? 'copied' : 'error');
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
          <Metric label="日付" value={formatJstDateWithWeekday(match.date)} />
          <Metric label="キックオフ" value={`${match.kickoffTimeJST} 日本時間`} />
          <Metric label="時間帯" value={formatKickoffWithTimeOfDay(match.kickoffTimeJST)} />
          <Metric label="ラウンド" value={formatMatchStage(match)} />
          <Metric label="状態" value={getScheduleMatchStatusLabel(match, today)} />
          <Metric label="重要度" value={`${importanceLabelText(match.importanceLabel)} / ${match.importanceScore}点`} />
        </div>
        <p className="rounded-xl bg-slate-800 px-3 py-2 text-sm leading-6 text-cyan-100">{getJstViewingHint(match.kickoffTimeJST)}</p>
        <button type="button" onClick={handleDownloadIcs} className="w-full rounded-xl bg-cyan-300 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-200">カレンダーに追加</button>
        <p className="text-xs leading-5 text-slate-400">{calendarHelperText}</p>
        <ShareButton onClick={handleShare} status={shareStatus} />
        <div className="flex flex-wrap gap-2">{match.reasonTags.map((tag) => <span key={tag} className="rounded-full bg-slate-700 px-2 py-1 text-xs text-slate-200">{tag}</span>)}</div>
      </section>

      <section className="space-y-3 rounded-2xl bg-slate-900 p-4 shadow-lg">
        <h3 className="text-lg font-semibold">観戦ポイント</h3>
        <ul className="space-y-2">{viewingPoints.map((point) => <li key={point} className="rounded-xl bg-slate-800 px-3 py-2 text-sm leading-6 text-slate-200">{point}</li>)}</ul>
      </section>

      <section className="space-y-3 rounded-2xl bg-slate-900 p-4 shadow-lg">
        <h3 className="text-lg font-semibold">勝敗時インパクト</h3>
        <div className="space-y-2">
          {impactItems.map((item) => <div key={item.label} className="rounded-xl bg-slate-800 px-3 py-2"><p className="text-sm font-semibold text-cyan-300">{item.label}</p><p className="mt-1 text-sm leading-6 text-slate-300">{item.text}</p></div>)}
        </div>
      </section>
    </div>
  );
}

const getViewingPoints = (match: MatchWithImportance, teams: Team[], preferences: UserPreferences, trackedTeamIds: string[]): string[] => {
  const points: string[] = [];

  if (matchIncludesTeam(match, japanTeamId)) points.push('日本代表が関係する試合です。');
  if (preferences.mainFavoriteTeamId && matchIncludesTeam(match, preferences.mainFavoriteTeamId)) points.push('メインで応援する国が関係する試合です。');
  if (preferences.selectedTeamIds.some((teamId) => matchIncludesTeam(match, teamId))) points.push('応援中の国が関係する試合です。');
  if (match.stage === 'group' && isSameGroupAsTrackedTeam(match, teams, trackedTeamIds)) points.push('応援する国と同組のため、順位に影響する可能性があります。');
  if (match.stage === 'group') points.push('3位通過ラインに関わる可能性があります。');
  const finishedResultMessage = getFinishedMatchResultMessage(match);
  if (finishedResultMessage) points.push(finishedResultMessage);
  if (points.length === 0) points.push('今後のラウンドや他会場結果を見るうえで参考になる試合です。');

  return [...new Set(points)];
};

const getImpactItems = (match: Match): { label: string; text: string }[] => {
  const finishedResultMessage = getFinishedMatchResultMessage(match);
  if (finishedResultMessage) {
    return [{ label: match.played ? '終了済み' : '終了済み / 結果待ち', text: finishedResultMessage }];
  }

  return [
    { label: '勝利時', text: '勝点3を積み上げ、突破圏に近づきます。' },
    { label: '引き分け時', text: '勝点1を積み上げますが、他会場結果の影響を受けやすくなります。' },
    { label: '敗戦時', text: '勝点を積めず、3位通過ラインや他会場結果への依存が高まります。' },
  ];
};

function StandingsScreen({ standings, thirdPlace, teams, trackedTeamIds }: { standings: GroupStanding[]; thirdPlace: StandingRow[]; teams: Team[]; trackedTeamIds: string[] }) {
  return (
    <div className="space-y-5">
      <section className="space-y-2 rounded-2xl border border-cyan-300/30 bg-slate-900 p-4 shadow-lg">
        <p className="text-xs font-semibold text-cyan-300">現在地を確認</p>
        <h2 className="text-xl font-bold">順位</h2>
        <p className="text-sm leading-6 text-slate-300">グループ順位と3位通過ラインをまとめて確認できます。日本代表と推し国は強調表示します。</p>
      </section>
      <StandingsList standings={standings} teams={teams} trackedTeamIds={trackedTeamIds} />
      <section className="space-y-3 rounded-2xl bg-slate-900 p-4 shadow-lg">
        <ThirdPlaceLineSection thirdPlace={thirdPlace} teams={teams} trackedTeamIds={trackedTeamIds} />
      </section>
    </div>
  );
}

function StandingsList({ standings, teams, trackedTeamIds = [] }: { standings: GroupStanding[]; teams: Team[]; trackedTeamIds?: string[] }) {
  return (
    <section className="space-y-3 rounded-2xl bg-slate-900 p-4 shadow-lg">
      <h2 className="text-lg font-semibold">グループ順位</h2>
      <div className="space-y-3">
        {standings.map((group) => (
          <div key={group.groupId} className="rounded-xl bg-slate-800 p-3">
            <h3 className="mb-2 text-sm font-semibold text-cyan-300">Group {group.groupId}</h3>
            <div className="space-y-2">{group.rows.map((row, index) => <StandingRowCard key={row.teamId} row={row} rank={index + 1} teams={teams} highlighted={trackedTeamIds.includes(row.teamId)} />)}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ThirdPlaceLineSection({ thirdPlace, teams, trackedTeamIds }: { thirdPlace: StandingRow[]; teams: Team[]; trackedTeamIds: string[] }) {
  const line = getThirdPlaceLine(thirdPlace);
  const lineTeamName = line.lineTeam ? teamName(teams, line.lineTeam.teamId) : '-';

  return (
    <div className="space-y-3 rounded-xl bg-slate-800 p-3">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-cyan-300">3位通過ライン</h2>
        <p className="text-sm leading-6 text-slate-300">各組3位のうち、成績上位8チームが通過します。ここでは現在の8番目をボーダーとして表示します。</p>
      </div>
      <div className="rounded-xl border border-cyan-300/30 bg-slate-900 p-3">
        <p className="text-xs font-semibold text-slate-400">現在の8位ライン</p>
        <p className="mt-1 text-base font-semibold">{lineTeamName}</p>
      </div>
      <div className="space-y-2">
        {thirdPlace.map((row, index) => <ThirdPlaceRowCard key={row.teamId} row={row} rank={index + 1} teams={teams} highlighted={trackedTeamIds.includes(row.teamId)} />)}
      </div>
      <p className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs leading-5 text-slate-400">MVP版では詳細タイブレーク・直接対決・フェアプレーポイント等は未反映です。</p>
    </div>
  );
}

function ThirdPlaceRowCard({ row, rank, teams, highlighted }: { row: StandingRow; rank: number; teams: Team[]; highlighted: boolean }) {
  const label = rank <= 7 ? '通過圏' : rank === 8 ? 'ボーダー' : '圏外';
  return (
    <div className={`rounded-lg px-3 py-2 ${highlighted ? 'bg-cyan-300/15 ring-1 ring-cyan-300/60' : 'bg-slate-900'}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{rank}. {teamName(teams, row.teamId)}</p>
          <p className="text-xs text-slate-400">勝点 {row.points} / GD {row.goalDiff} / 得点 {row.goalsFor}</p>
        </div>
        <span className="shrink-0 rounded-full bg-slate-700 px-2 py-1 text-xs font-bold text-slate-100">{label}</span>
      </div>
    </div>
  );
}

function StandingRowCard({ row, rank, teams, highlighted }: { row: StandingRow; rank: number; teams: Team[]; highlighted: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 ${highlighted ? 'bg-cyan-300/15 ring-1 ring-cyan-300/60' : 'bg-slate-900'}`}>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{rank}. {teamName(teams, row.teamId)}</p>
        <p className="text-xs text-slate-400">{formatRecord(row)}</p>
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
