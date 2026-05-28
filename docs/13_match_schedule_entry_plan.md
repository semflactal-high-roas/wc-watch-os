# Match Schedule Entry Plan

This document defines how to enter official match schedule data safely before expanding `public/data/matches.json` beyond the currently seeded Group F schedule.

Do not use this workstream to add all 104 matches at once. Keep schedule entry split into small pull requests so each group can be checked, reviewed, validated, and deployed without making the app hard to debug.

## Source Policy

- Treat the FIFA official website as the primary source of truth for official match schedule data.
- Use Reuters and other reputable reporting only as secondary confirmation.
- Do not use unofficial websites, Wikipedia, social media, screenshots, or copied spreadsheets as authoritative schedule sources.
- Do not add source metadata such as `sourceUrl`, `sourceName`, `checkedAt`, `inputBy`, or `notes` to `public/data/matches.json`.
- Record source metadata in the pull request description instead.
- Keep `public/data/*.json` valid JSON without comments.

Each schedule-entry pull request should include these source notes:

```text
sourceName:
sourceUrl:
secondarySourceName:
secondarySourceUrl:
checkedAt:
inputBy:
notes:
```

## Why Not Enter All 104 Matches At Once

A single large schedule update makes it harder to review time-zone conversion, group membership, match IDs, and team references. Smaller pull requests keep failures narrow and make GitHub Pages regressions easier to trace.

Split entry also helps avoid mixing confirmed group-stage data with knockout-stage placeholders. Knockout-stage matches should be entered only when the teams are confirmed or when the official bracket information is clear enough for the app's current data model.

## Split Entry Order

Use this sequence for group-stage schedule entry:

- PR 1: Group F, already seeded.
- PR 2: Groups A / B / C.
- PR 3: Groups D / E / G.
- PR 4: Groups H / I / J.
- PR 5: Groups K / L.
- PR 6 and later: knockout stage, only after participating teams are confirmed or official bracket information is clear.

Do not add placeholder knockout matches in bulk for the MVP. If a knockout match needs a placeholder later, define that separately and document why the placeholder is safe.

## Per-PR Checklist

For every schedule-entry pull request, confirm:

- The target group has all 6 group-stage matches.
- Each group-stage `matchId` follows `G-{groupId}-01` through `G-{groupId}-06`.
- Match numbering follows the official schedule order for that group.
- `homeTeamId` exists in `public/data/teams.json`.
- `awayTeamId` exists in `public/data/teams.json`.
- `homeTeamId` and `awayTeamId` are not the same.
- `groupId` is correct for both teams.
- `date` is the Japan-time date in `YYYY-MM-DD` format.
- `kickoffTimeJST` is the Japan-time kickoff in `HH:mm` format.
- `played` is `false` for future official schedule entries.
- `homeScore` is `null` for unplayed matches.
- `awayScore` is `null` for unplayed matches.
- `stage` is `group` for group-stage matches.
- `npm run validate:data` succeeds.
- `npm run build` succeeds.
- GitHub Actions Build succeeds.
- GitHub Pages deploy succeeds after merge.
- The Schedule screen renders without a data error after deployment.

## JST Conversion Rules

All app schedule data must be stored in Japan time.

- If FIFA displays kickoff in local venue time, convert it to JST before entering it.
- If FIFA displays kickoff in UTC or GMT, convert it to JST before entering it.
- JST is UTC+09:00.
- If the Japan-time conversion changes the calendar date, store the Japan-time date in `date`.
- Store the Japan-time clock value in `kickoffTimeJST` using `HH:mm`.
- Record a short JST conversion note in the pull request description.

Example PR note:

```text
JST conversion notes:
FIFA source displayed kickoff times in local venue time. Each kickoff was converted to JST (UTC+09:00). Matches crossing midnight use the Japan-time calendar date in matches.json.
```

## Match ID Rules

Group-stage match IDs must follow `docs/11_data_id_design.md`.

Use:

```text
G-A-01
G-A-02
G-A-03
G-A-04
G-A-05
G-A-06
```

Replace `A` with the target group letter. Use two digits for the within-group match number.

For knockout stage, use the knockout-stage prefixes defined in `docs/11_data_id_design.md`, such as `R32-01`, `R16-01`, `QF-01`, `SF-01`, `TP-01`, and `F-01`.

## Data Scope

Schedule-entry pull requests should update only the files needed for the target group schedule.

Expected group-stage schedule PR files:

- `public/data/matches.json`
- Docs or PR body notes if source or conversion details need clarification

Do not mix schedule entry with app features, styling changes, external APIs, login, notifications, official logos, or official images.

## After Merge

After each schedule-entry PR is merged:

- Confirm GitHub Pages Deploy succeeds.
- Open the public app.
- Confirm no `データエラー` appears.
- Confirm Home still renders.
- Confirm Schedule shows the newly added matches.
- Open at least one newly added match detail.
- Confirm ICS download still works from match detail.

Public URL:

```text
https://semflactal-high-roas.github.io/wc-watch-os/
```
