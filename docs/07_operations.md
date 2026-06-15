# Data Operations Guide

This project reads static JSON files from `public/data`. Keep the files valid and consistent before merging changes to `main`.

## Files

- `public/data/teams.json`: Team master data
- `public/data/groups.json`: Group membership data
- `public/data/matches.json`: Match schedule and result data
- `public/data/results.json`: Reserved for additional result snapshots
- `public/data/insights.json`: Reserved for editorial or MVP insight text
- `public/data/manualOverrides.json`: Reserved for manual display overrides
- `public/data/config.json`: App-level configuration

## Updating teams.json

Each team must have a stable `id`.

```json
{
  "id": "A1",
  "name": "Japan",
  "group": "A",
  "fifaRank": 18
}
```

Rules:

- Do not duplicate `id` values.
- Use the same `id` in `groups.json` and `matches.json`.
- Keep `group` aligned with the group that contains the team in `groups.json`.

## Updating groups.json

Each group lists the team IDs that belong to it.

```json
{
  "id": "A",
  "teamIds": ["A1", "A2", "A3", "A4"]
}
```

Rules:

- Every `teamIds` entry must exist in `teams.json`.
- Keep the order easy to scan by grouping teams together.
- If a team moves groups in dummy data, update both `teams.json` and `groups.json`.

## Updating matches.json

Each match needs schedule fields, team IDs, score fields, and a stage.

Group stage example:

```json
{
  "id": "A-1",
  "homeTeamId": "A1",
  "awayTeamId": "A2",
  "homeScore": null,
  "awayScore": null,
  "played": false,
  "date": "2026-06-12",
  "kickoffTimeJST": "04:00",
  "groupId": "A",
  "stage": "group"
}
```

Knockout stage example:

```json
{
  "id": "R16-1",
  "homeTeamId": "A1",
  "awayTeamId": "B2",
  "homeScore": null,
  "awayScore": null,
  "played": false,
  "date": "2026-06-28",
  "kickoffTimeJST": "04:00",
  "stage": "round_of_16"
}
```

Rules:

- `homeTeamId` and `awayTeamId` must exist in `teams.json`.
- `date` must be `YYYY-MM-DD`.
- `kickoffTimeJST` must be `HH:mm` in Japan time.
- `stage` must be one of:
  - `group`
  - `round_of_32`
  - `round_of_16`
  - `quarter_final`
  - `semi_final`
  - `third_place`
  - `final`
- Group stage matches must include `groupId`.
- Knockout stage matches do not need `groupId`.

## Updating Match Results

Before kickoff or when the result is not known:

```json
{
  "homeScore": null,
  "awayScore": null,
  "played": false
}
```

After the match finishes:

```json
{
  "homeScore": 2,
  "awayScore": 1,
  "played": true
}
```

Rules:

- If `played` is `true`, both `homeScore` and `awayScore` must be numbers.
- If `played` is `false`, scores may stay `null`.
- Update only the score and `played` fields when entering a result unless the schedule itself changed.

## Result Update Pull Request Review Checklist

1. Official confirmation
   - Prefer FIFA official sources.
   - Use Reuters / AP / BBC / ESPN / official broadcasters / national associations only as secondary confirmation.
   - Do not use general blogs, summary sites, social media alone, or Wikipedia.
2. Update target confirmation
   - Confirm the target match ID in `public/data/matches.json`.
   - Confirm `homeTeamId` / `awayTeamId` / `groupId` / `stage` match the request.
3. Change scope confirmation
   - Change only the target matches in `public/data/matches.json` for result-only updates.
   - Do not change `teams.json` / `groups.json` / `config.json`.
   - Do not change `src` / UI / logic.
4. Score confirmation
   - Confirm `homeScore`.
   - Confirm `awayScore`.
   - Confirm `played: true`.
5. Validation
   - Run `npm run validate:data`.
   - Run `npm test`.
   - Run `npm run build`.
6. Screen confirmation
   - Confirm the score in Schedule.
   - Confirm the finished match no longer appears under Home's `これから見るべき試合`.
   - Confirm points and goal difference are reflected in Standings.
   - Confirm the provisional tournament bracket beta reflects provisional standings when applicable.
7. Pull request body
   - List the changed match IDs.
   - List the scores.
   - Record the confirmation sources.
   - Record the `validate:data` / `test` / `build` results.
   - State that no file other than `public/data/matches.json` was changed.

## Validation

The app validates `teams`, `groups`, and `matches` after loading them. If invalid data is found, the app shows a `データエラー` message instead of rendering normal screens.

The validation currently checks:

- Duplicate team IDs
- Unknown team IDs in groups
- Unknown team IDs in matches
- Invalid `date` format
- Invalid `kickoffTimeJST` format
- Invalid `stage`
- Missing `groupId` for group stage matches
- Score consistency for `played` matches

## Before Merging Data Updates

Run these checks locally:

```bash
npm run validate:data
npm test
npm run build
```

Then confirm after opening a pull request:

- GitHub Actions Build succeeds.
- GitHub Pages deploy succeeds after merge.
- The public app opens without `データエラー`.
- Home, Schedule, Settings, match detail, and ICS download still work for the edited data.

Public URL:

```text
https://semflactal-high-roas.github.io/wc-watch-os/
```
