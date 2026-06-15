# Manual QA Checklist

## Purpose

Use this checklist to verify the GitHub Pages production build before public release or after data updates.

- Confirm the published MVP flows work without visible errors.
- Catch display, navigation, and interaction issues that `npm run validate:data` cannot detect.
- Provide a minimum acceptance checklist before sharing the app publicly.

## Target URL

```text
https://semflactal-high-roas.github.io/wc-watch-os/
```

## Preconditions

- [ ] `npm run validate:data` has succeeded.
- [ ] `npm run build` has succeeded.
- [ ] GitHub Pages Deploy has succeeded.
- [ ] Browser hard reload has been performed.
- [ ] Mobile layout has been checked when needed.

## User-Facing Labels

- [ ] Header eyebrow shows `日本時間で見るW杯ガイド`.
- [ ] Header shows the badge `2026 FIFA World Cup 対応`.
- [ ] Site name shows `W杯 観戦ナビ`.
- [ ] Header copy shows `日本代表と応援する国の試合だけ、見る価値で整理`.
- [ ] Bottom navigation labels are `ホーム`, `日程`, `順位`, and `トーナメント`.
- [ ] `設定` is not shown in the bottom navigation.
- [ ] User-facing labels use `応援する国` style wording instead of `推し国`.
- [ ] Match Detail uses `カレンダーに追加` instead of `ICSをダウンロード`.
- [ ] Main date/time displays use `日本時間` instead of `JST`.
- [ ] Main status labels use `これから` / `終了` instead of `未実施` / `played`.
- [ ] Major team names show flag emoji when available.
- [ ] If a flag emoji is not rendered by the device, the country name is still readable.

## Beta Clarification Labels

- [ ] Footer or data information area shows `非公式の個人制作ツールです。日程はFIFA公式情報をもとに日本時間で表示しています。`.
- [ ] The existing `最終更新` display is still visible.
- [ ] The existing `日程ソース：FIFA公式` link is still visible and opens in a new tab.
- [ ] The 3rd-place qualification section explains `各組3位のうち、成績上位8チームが通過します。ここでは現在の8番目をボーダーとして表示します。`.
- [ ] Schedule screen shows `日付と時刻はすべて日本時間で表示しています。` near the match list or filters.
- [ ] Settings screen explains that supported team settings affect Home recommendations and Schedule filters.
- [ ] Share buttons show `XやLINEに貼れる共有文をコピーします。` nearby.
- [ ] Calendar helper text includes `通知時間はカレンダーアプリ側で調整してください。`.

## Weekday Date Display

- [ ] Home match section card dates include weekdays, for example `2026-06-15（月）05:00 日本時間`.
- [ ] Japan match cards include weekdays in date/time display.
- [ ] Match ranking cards include weekdays in date/time display.
- [ ] Schedule match cards include weekdays in date/time display.
- [ ] Match Detail date includes a weekday.
- [ ] Japan scenario next kickoff display includes a weekday.
- [ ] Share copy text includes a weekday, for example `2026-06-15（月）05:00 日本時間（朝5:00キックオフ）`.
- [ ] Existing time-of-day labels remain visible, for example `朝5:00キックオフ` and `深夜2:00キックオフ`.

## Home Screen

- [ ] The page renders without a browser or app error.
- [ ] `次に見るべき試合` is the first Home section and shows no more than three matches.
- [ ] The primary section includes unstarted matches within the next 36 hours, including tomorrow-morning matches visible from the previous evening.
- [ ] Primary recommendation cards show `起きて見るべき` / `結果だけ必ず確認` / `ハイライトで十分` / `寝ていい`, a short reason, impact tags, and a route to Match Detail / calendar addition.
- [ ] `次に見るべき試合` never shows a finished, already-started, or exact-kickoff-time match.
- [ ] `推し国の状況` combines Japan/current favorite position, their next matches, Standings, provisional Tournament, and Settings routes.
- [ ] When a main supported team is not configured, `推し国の状況` gives a stronger setup prompt; when configured, the Settings route stays compact.
- [ ] `今朝 / 今日の結果確認` shows only important or supported-team results from the last 24 hours and does not become a full finished-match list.
- [ ] Home contains no more than three large blocks: viewing decision, supported-team status, and recent results.
- [ ] When every match is finished, Home shows `大会日程は終了しました` and routes to Schedule, Standings, and Tournament.
- [ ] Full group standings and the full 3rd-place line are not visible.
- [ ] Major UI labels use `暫定トーナメント表` and `推し国の想定対戦ルート`, not ambiguous `山` wording.
- [ ] No `データエラー` is visible anywhere on the screen.

## Schedule Screen

- [ ] The `日程` tab can be opened from the bottom navigation.
- [ ] Schedule filter buttons are visible above the match list.
- [ ] The initial selected filter is `今日・次の試合`.
- [ ] `日本代表` filters to the 3 Japan matches.
- [ ] `応援する国` filters to matches involving the saved main supported team or selected teams.
- [ ] If supported teams are not configured, guidance text asks the user to configure supported teams.
- [ ] `日本と同じ組` filters to the 6 Group F matches.
- [ ] `すべて` shows all 72 group-stage matches.
- [ ] The displayed match count updates after each filter change.
- [ ] Filtered matches are grouped in the order `これからの試合`, `進行中・結果待ち`, and `終了済み`.
- [ ] An unplayed match whose kickoff has passed appears under `進行中・結果待ち`, not `これからの試合`.
- [ ] The `進行中・結果待ち` section explains that results are manually updated and does not imply live coverage.
- [ ] Finished matches remain visible under `終了済み`.
- [ ] Groups A-L matches can be found when `すべて` is selected.
- [ ] Group K and Group L matches are visible when `すべて` is selected.
- [ ] Tapping a filtered match card opens Match Detail.
- [ ] Full group standings and the full 3rd-place line are not visible.
- [ ] No `データエラー` is visible after changing filters.

## Standings Screen

- [ ] The `順位` tab can be opened from the bottom navigation.
- [ ] The headings `グループ順位` and `3位通過ライン` are visible.
- [ ] Japan and configured supported teams are highlighted.
- [ ] Full match lists and the provisional tournament bracket are not visible.

## Settings Screen

- [ ] Settings can be opened from the Home settings button.
- [ ] Tapping `ホームに戻る` returns to Home.
- [ ] The heading shows `応援する国の設定`.
- [ ] `メインで応援する国` can be selected.
- [ ] `一緒に追いかける国` choices can be selected.
- [ ] Japan, Netherlands, Sweden, and Tunisia are visible as team choices.
- [ ] After changing preferences and returning Home, the main supported team setting is reflected.
- [ ] After refreshing the browser, preferences remain saved through `localStorage`.

## Match Detail Screen

- [ ] Tapping a match card opens the detail screen.
- [ ] The match title is shown with country names and flag emoji where available.
- [ ] date, kickoff time, round, score, and importance are shown.
- [ ] Kickoff time uses `日本時間` wording.
- [ ] The time-of-day label and viewing hint are shown.
- [ ] Viewing points are shown.
- [ ] Win/draw/loss impact is shown.
- [ ] The calendar button says `カレンダーに追加`.
- [ ] The `この試合を共有` button is visible and copies a share text.
- [ ] The share text includes matchup, flags, Japan time, weekday, time-of-day label, importance, app URL, and `#W杯観戦ナビ`.
- [ ] The user can return to Home or Schedule.

## Calendar Download

- [ ] A `.ics` file is downloaded from Match Detail after tapping `カレンダーに追加`.
- [ ] The file name includes the match id.
- [ ] The file can be opened in a calendar app.
- [ ] The event appears at the expected Japan time.
- [ ] On a device using Japan time zone, confirm the event displays in Japan time.

## Data Source Display

- [ ] A common data information footer is visible on the published page.
- [ ] The footer shows `最終更新`.
- [ ] The footer shows `日程ソース：FIFA公式`.
- [ ] The FIFA official source link can be opened.
- [ ] The FIFA official source link opens in a new tab.
- [ ] The data note explains that group-stage schedules are based on FIFA official information and shown in Japan time.

## Meta / Sharing

- [ ] `index.html` has `<title>W杯 観戦ナビ</title>`.
- [ ] `index.html` has a meta description describing the W杯観戦ガイド.
- [ ] `index.html` has `og:title`, `og:description`, `og:type`, and `og:url`.
- [ ] `og:url` is `https://semflactal-high-roas.github.io/wc-watch-os/`.
- [ ] `index.html` has `twitter:card`, `twitter:title`, and `twitter:description`.
- [ ] No OGP image is required for this MVP; URL sharing should still show title and description where supported.

## Mobile Layout

- [ ] At an iPhone-like width, no horizontal scrolling occurs.
- [ ] Bottom navigation shows four readable, tappable tabs: `ホーム`, `日程`, `順位`, and `トーナメント`.
- [ ] Home shows the current viewing decision near the top without requiring horizontal scrolling.
- [ ] Schedule filter buttons wrap cleanly and remain tappable.
- [ ] Schedule sections `これからの試合`, `進行中・結果待ち`, and `終了済み` remain readable.
- [ ] Standings group rows and the 3rd-place line remain readable without horizontal scrolling.
- [ ] The provisional tournament bracket beta remains readable without horizontal scrolling.
- [ ] Settings remains reachable from Home, and saved preferences survive a refresh through `localStorage`.
- [ ] Recommendation card buttons are large enough to tap comfortably and do not conflict with each other.
- [ ] Share and calendar buttons remain easy to tap on mobile.
- [ ] Card text does not collapse or overflow badly.
- [ ] Home, Schedule, Standings, Tournament, Settings, and Match Detail core flows can be used on mobile.

## QA Result Record

```text
QA date:
Tester:
Target URL:
Target commit / PR:
Browser:
Device:
Result: OK / NG / Needs follow-up
Issues found:
Next fix PR:
```

After manual QA is complete, confirm the beta release conditions in `docs/15_beta_release_checklist.md`.
