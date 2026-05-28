# Real Data Entry Guide

This guide prepares the project for manual entry of real World Cup data. Do not add comments to files under `public/data`; keep explanations in docs only.

## Basic Policy

- Enter real data in small pull requests.
- Treat FIFA's official website as the primary source of truth for official schedule data.
- Use Reuters and other reputable reporting only as secondary confirmation.
- Do not use unofficial websites, Wikipedia, social media, screenshots, or copied spreadsheets as authoritative schedule sources.
- Check `docs/10_official_schedule_source.md` before entering official schedule data.
- Check `docs/11_data_id_design.md` before assigning production `teamId`, `groupId`, or `matchId` values.
- Check `docs/12_teams_groups_entry_plan.md` before replacing dummy `teams.json` or `groups.json` data.
- Check `docs/13_match_schedule_entry_plan.md` before entering official match schedules into `matches.json`.
- Update master data before schedule data.
- Keep IDs stable once they are used by matches or user preferences.
- Run validation before opening a pull request.
- Do not add official logos, official images, external APIs, login, notifications, or backend services as part of data entry.

## Recommended Order

1. Confirm source rules in `docs/10_official_schedule_source.md`.
2. Confirm ID rules in `docs/11_data_id_design.md`.
3. Confirm teams/groups entry rules in `docs/12_teams_groups_entry_plan.md`.
4. Confirm match schedule split-entry rules in `docs/13_match_schedule_entry_plan.md`.
5. Update `public/data/teams.json`.
6. Update `public/data/groups.json`.
7. Update `public/data/matches.json` in the planned group batches.
8. Update results later by changing only `played`, `homeScore`, and `awayScore`.

## teams.json

Use one object per team. Production `teamId` values should follow `docs/11_data_id_design.md` and use FIFA/IOC-style three-letter uppercase codes when possible. See `docs/12_teams_groups_entry_plan.md` before replacing dummy team data.

```json
{
  "id": "JPN",
  "name": "Japan",
  "group": "A",
  "fifaRank": 18
}
```

Rules:

- `id` must be unique.
- `id` is the value used by `groups.json` and `matches.json`.
- `id` should not contain Japanese names, spaces, or display names.
- `group` should match the group where the team is listed in `groups.json`.
- Keep the file as valid JSON without comments.
- Do not enter unconfirmed teams or unconfirmed group assignments.

## groups.json

Use one object per group. Production `groupId` values should be uppercase letters such as `A`, `B`, and `C`. See `docs/12_teams_groups_entry_plan.md` before replacing dummy group data.

```json
{
  "id": "A",
  "teamIds": ["JPN", "ARG", "BRA", "FRA"]
}
```

Rules:

- Every value in `teamIds` must exist in `teams.json`.
- Keep team IDs grouped by their actual group.
- If a team group changes, update both `teams.json` and `groups.json`.
- Do not enter unconfirmed groups or placeholder qualifier slots in app-loaded production JSON.

## Production Template Files

These files are reference templates only and are not loaded by the app:

- `public/data/teams.production.template.json`
- `public/data/groups.production.template.json`

They contain sample IDs and sample groups only. They are not official group assignments and are not checked by `npm run validate:data`.

## matches.json

Use one object per match. Production `matchId` values should follow `docs/11_data_id_design.md`, such as `G-A-01` for group-stage matches and `R16-01` / `QF-01` / `F-01` for knockout matches. Enter official group-stage schedules in the batches defined in `docs/13_match_schedule_entry_plan.md`.

```json
{
  "id": "G-A-01",
  "homeTeamId": "JPN",
  "awayTeamId": "ARG",
  "homeScore": null,
  "awayScore": null,
  "played": false,
  "date": "2026-06-12",
  "kickoffTimeJST": "04:00",
  "groupId": "A",
  "stage": "group"
}
```

Rules:

- `id` must be unique.
- `homeTeamId` and `awayTeamId` must exist in `teams.json`.
- `homeTeamId` and `awayTeamId` must not be the same.
- `date` must be `YYYY-MM-DD`.
- `kickoffTimeJST` must be `HH:mm` in Japan time.
- Group stage matches must include `groupId`.
- Knockout stage matches do not need `groupId`.
- Keep source metadata such as `sourceName`, `sourceUrl`, `checkedAt`, `inputBy`, and `notes` out of `matches.json`; record it in the pull request or docs instead.
- Record JST conversion notes in the pull request when entering official schedule data.

## stage Values

Use only these values:

- `group`
- `round_of_32`
- `round_of_16`
- `quarter_final`
- `semi_final`
- `third_place`
- `final`

## Official Source Notes

When entering official schedule data, record these in the pull request description or a docs update:

- `sourceName`
- `sourceUrl`
- `checkedAt`
- `inputBy`
- `notes`

Use `public/data/matches.official.template.json` as a reference shape for source-tracked input work. The app does not load that template.

## Result Updates

Before a match is played:

```json
{
  "played": false,
  "homeScore": null,
  "awayScore": null
}
```

After a match is played:

```json
{
  "played": true,
  "homeScore": 2,
  "awayScore": 1
}
```

For result-only updates, change only these fields:

- `played`
- `homeScore`
- `awayScore`

## Editing on GitHub

1. Open the target file under `public/data`.
2. Use GitHub's edit button.
3. Keep the JSON valid and do not add comments.
4. Record official source notes in the pull request description.
5. Commit changes to a new branch.
6. Open a pull request.
7. Confirm GitHub Actions Build passes.
8. Merge after review.
9. Confirm GitHub Pages Deploy passes.
10. Open the public URL and check that no `データエラー` appears.

## Editing Locally

1. Pull the latest `main`.
2. Create a new branch.
3. Edit `public/data/teams.json`, `groups.json`, or `matches.json`.
4. Run validation and build.
5. Commit the changes.
6. Push the branch and open a pull request.

## Required Checks

Run these before opening a pull request:

```bash
npm run validate:data
npm run build
```

After opening a pull request, confirm:

- GitHub Actions Build succeeds.
- GitHub Pages Deploy succeeds after merge.
- The public app opens without `データエラー`.
- Home, Schedule, Settings, match detail, and ICS download still work with the updated data.

Public URL:

```text
https://semflactal-high-roas.github.io/wc-watch-os/
```
