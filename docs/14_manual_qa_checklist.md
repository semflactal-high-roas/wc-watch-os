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
- [ ] Site name shows `W杯 観戦ナビ`.
- [ ] Header copy shows `日本代表と応援する国の試合だけ、見る価値で整理`.
- [ ] Bottom navigation labels are `ホーム`, `日程`, and `設定`.
- [ ] User-facing labels use `応援する国` style wording instead of `推し国`.
- [ ] Match Detail uses `カレンダーに追加` instead of `ICSをダウンロード`.
- [ ] Main date/time displays use `日本時間` instead of `JST`.
- [ ] Main status labels use `これから` / `終了` instead of `未実施` / `played`.
- [ ] Major team names show flag emoji when available, for example `Japan 🇯🇵` and `Netherlands 🇳🇱`.
- [ ] If a flag emoji is not rendered by the device, the country name is still readable.

## Home Screen

- [ ] The page renders without a browser or app error.
- [ ] Header shows `W杯 観戦ナビ`.
- [ ] The top of Home shows `今日のおすすめ` when today's matches are available, or `次に見るべき試合` when fallback matches are shown.
- [ ] If no recommendation match can be displayed, the fallback text `現在表示できるおすすめ試合はありません` is shown.
- [ ] The recommendation card shows the match pairing, flags, kickoff time, `日本時間`, context label, importance label, and importance score.
- [ ] The recommendation card shows short reason text and reason tags.
- [ ] Tapping `試合詳細を見る` opens Match Detail for the recommended match.
- [ ] Tapping `カレンダーに追加` downloads a `.ics` file for the recommended match.
- [ ] Qualification status cards are visible.
- [ ] The `日本代表の試合` section is visible.
- [ ] The `日本代表の試合` section shows 3 Japan matches.
- [ ] Japan match cards show country names with flag emoji where available.
- [ ] The `日本代表 突破シナリオ` section is visible.
- [ ] The `Group F 日本の組` section is visible.
- [ ] Group F shows Netherlands, Japan, Sweden, and Tunisia.
- [ ] Group F team names remain readable even if a flag emoji does not render.
- [ ] The `今日見るべき試合ランキング` section is visible.
- [ ] Standings summary is visible.
- [ ] No `データエラー` is visible anywhere on the screen.

## Schedule Screen

- [ ] The `日程` tab can be opened from the bottom navigation.
- [ ] Group-stage matches are visible.
- [ ] Groups A-L matches can be found in the schedule.
- [ ] Group K and Group L matches are visible.
- [ ] Each match card shows date and kickoff time in `日本時間` wording.
- [ ] Match cards show country names with flag emoji where available.
- [ ] Tapping a match card opens Match Detail.
- [ ] No `データエラー` is visible.

## Settings Screen

- [ ] The `設定` tab can be opened from the bottom navigation.
- [ ] The heading shows `応援する国の設定`.
- [ ] `メインで応援する国` can be selected.
- [ ] `一緒に追いかける国` choices can be selected.
- [ ] Japan, Netherlands, Sweden, and Tunisia are visible as team choices.
- [ ] Team choices show flag emoji where available, while the country name remains readable.
- [ ] After changing preferences and returning Home, the main supported team setting is reflected.
- [ ] After refreshing the browser, preferences remain saved through `localStorage`.

## Match Detail Screen

- [ ] Tapping a match card or recommendation detail button opens the detail screen.
- [ ] The match card title is shown with country names and flag emoji where available.
- [ ] date, kickoff time, round, score, and importance are shown.
- [ ] Kickoff time uses `日本時間` wording.
- [ ] Viewing points are shown.
- [ ] Win/draw/loss impact is shown.
- [ ] The calendar button says `カレンダーに追加`.
- [ ] The calendar helper text explains that a calendar app may need to open the downloaded file.
- [ ] The user can return to Home or Schedule.
- [ ] After returning, the previous screen is still usable and layout is not broken.

## Calendar Download

- [ ] A `.ics` file is downloaded from Match Detail after tapping `カレンダーに追加`.
- [ ] A `.ics` file is downloaded from the Home recommendation card after tapping `カレンダーに追加`.
- [ ] The file name includes the match id.
- [ ] The file can be opened in a calendar app.
- [ ] The event appears at the expected Japan time.
- [ ] Example: `2026-06-15 05:00 日本時間` may be stored as UTC inside the ICS, but should display correctly in a calendar app.
- [ ] On a device using Japan time zone, confirm the event displays in Japan time.

## Mobile Layout

- [ ] At an iPhone-like width, no horizontal scrolling occurs.
- [ ] Bottom navigation is tappable.
- [ ] Recommendation card buttons are large enough to tap comfortably and do not conflict with each other.
- [ ] Card text does not collapse or overflow badly.
- [ ] Buttons are large enough to tap comfortably.
- [ ] Home, Schedule, Settings, and Match Detail core flows can be used on mobile.

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
