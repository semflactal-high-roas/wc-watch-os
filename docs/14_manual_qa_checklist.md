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

## Home Screen

- [ ] The page renders without a browser or app error.
- [ ] Header shows `今日見るべきW杯`.
- [ ] Qualification status cards are visible.
- [ ] The `日本代表の試合` section is visible.
- [ ] The `日本代表の試合` section shows 3 Japan matches.
- [ ] The `日本代表 突破シナリオ` section is visible.
- [ ] The `Group F 日本の組` section is visible.
- [ ] Group F shows Netherlands, Japan, Sweden, and Tunisia.
- [ ] The `今日見るべき試合ランキング` section is visible.
- [ ] Standings summary is visible.
- [ ] No `データエラー` is visible anywhere on the screen.

## Schedule Screen

- [ ] The Schedule tab can be opened from the bottom navigation.
- [ ] Group-stage matches are visible.
- [ ] Groups A-L matches can be found in the schedule.
- [ ] Group K and Group L matches are visible.
- [ ] Each match card shows `date` and `kickoffTimeJST`.
- [ ] Tapping a match card opens Match Detail.
- [ ] No `データエラー` is visible.

## Settings Screen

- [ ] The Settings tab can be opened from the bottom navigation.
- [ ] Main favorite team can be selected.
- [ ] Japan, Netherlands, Sweden, and Tunisia are visible as team choices.
- [ ] After changing preferences and returning Home, the main favorite team setting is reflected.
- [ ] After refreshing the browser, preferences remain saved through `localStorage`.

## Match Detail Screen

- [ ] Tapping a match card opens the detail screen.
- [ ] The match card title is shown.
- [ ] `date`, `kickoffTimeJST`, `stage`, score, and importance are shown.
- [ ] Viewing points are shown.
- [ ] Win/draw/loss impact is shown.
- [ ] An ICS file can be downloaded.
- [ ] The user can return to Home or Schedule.
- [ ] After returning, the previous screen is still usable and layout is not broken.

## ICS Download

- [ ] A `.ics` file is downloaded from Match Detail.
- [ ] The file name includes the match id.
- [ ] The file can be opened in a calendar app.
- [ ] The event appears at the expected Japan time.
- [ ] Example: `2026-06-15 05:00 JST` may be stored as UTC inside the ICS, but should display correctly in a calendar app.
- [ ] On a device using Japan time zone, confirm the event displays in Japan time.

## Mobile Layout

- [ ] At an iPhone-like width, no horizontal scrolling occurs.
- [ ] Bottom navigation is tappable.
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
