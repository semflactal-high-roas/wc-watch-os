# Production Data ID Design

This guide defines stable ID rules for production World Cup data before real teams and official schedules are entered.

## Why IDs Must Be Fixed First

The app links data across `teams.json`, `groups.json`, `matches.json`, rankings, preferences, and match detail screens by ID. Once real data is entered, IDs become more than labels:

- `teamId` is stored in localStorage as the user's favorite team setting.
- `matchId` is used to open match detail views and generate ICS file names.
- `groupId` connects teams, group standings, and group-stage match validation.
- Future data updates should change scores, dates, and names without breaking existing references.

Changing IDs after release can break saved preferences, schedule references, and any shared links or exported calendar files that depend on match IDs.

## teamId Rules

Use FIFA/IOC-style three-letter uppercase codes when possible.

Recommended examples:

- `JPN`
- `ARG`
- `BRA`
- `FRA`
- `GER`
- `USA`
- `CAN`
- `MEX`

Rules:

- Use uppercase ASCII letters and numbers only.
- Prefer three-letter country/team codes that users and operators can recognize.
- Keep display names in the `name` field, not in the ID.
- Do not use Japanese names, spaces, punctuation, or full display names as IDs.
- Once a production `teamId` is assigned, do not change it unless the data is still unpublished or the team identity was entered incorrectly.

Good:

```json
{ "id": "JPN", "name": "Japan", "group": "C", "fifaRank": 18 }
```

Avoid:

```json
{ "id": "Japan", "name": "Japan", "group": "C", "fifaRank": 18 }
```

```json
{ "id": "日本", "name": "Japan", "group": "C", "fifaRank": 18 }
```

## groupId Rules

Use one uppercase letter per group.

Recommended examples:

- `A`
- `B`
- `C`
- `D`

Rules:

- Use `A`, `B`, `C`, and so on in official group order.
- Keep `groups.json` `id` and each team's `teams.json` `group` value identical.
- Do not prefix group IDs with `Group` in JSON; use only the letter.
- If future tournaments use more groups, continue the same uppercase letter sequence.

Good:

```json
{ "id": "A", "teamIds": ["MEX", "CAN", "JPN", "BRA"] }
```

## Group Stage matchId Rules

Use this format:

```text
G-{groupId}-{number}
```

Examples:

- `G-A-01`
- `G-A-02`
- `G-B-01`

Meaning:

- `G` = group stage
- `A` = `groupId`
- `01` = match number within that group

Rules:

- Use two-digit numbering with leading zeroes.
- Number matches by official group schedule order.
- Keep the ID stable if kickoff time or score changes.
- If an official schedule order changes before data is published, renumber before release. After release, prefer keeping existing match IDs stable and adjusting dates/times instead.

Example:

```json
{
  "id": "G-A-01",
  "homeTeamId": "MEX",
  "awayTeamId": "CAN",
  "groupId": "A",
  "stage": "group"
}
```

## Knockout Stage matchId Rules

Use stage prefix plus two-digit match number.

Recommended examples:

- `R32-01`
- `R16-01`
- `QF-01`
- `SF-01`
- `TP-01`
- `F-01`

Meaning:

- `R32` = `round_of_32`
- `R16` = `round_of_16`
- `QF` = `quarter_final`
- `SF` = `semi_final`
- `TP` = `third_place`
- `F` = `final`

Rules:

- Use official bracket order when numbering knockout matches.
- Use `F-01` for the final.
- Use `TP-01` for the third-place match.
- Keep IDs stable after publication, even if the participating teams change before the match is played.

Example:

```json
{
  "id": "R16-01",
  "homeTeamId": "JPN",
  "awayTeamId": "ARG",
  "stage": "round_of_16"
}
```

## Handling Undetermined Team Slots

For the MVP, avoid bulk-entering knockout matches before participating teams are known.

Rules:

- Do not put placeholder teams into normal `teams.json` unless there is a clear product need.
- Prefer entering knockout matches after teams are confirmed.
- If an undetermined slot must be represented temporarily, use a dedicated placeholder such as `TBD_A1`, but keep it out of normal production team records when possible.
- Do not mix placeholder IDs with real team IDs in user-facing production data unless the UI is prepared to explain them.
- The MVP should not bulk-load an entire undecided knockout bracket into `matches.json`.

## IDs That May Change Before Production

These can be changed while data is still dummy, draft, or unpublished:

- Temporary sample IDs such as `A1`, `B2`, `official-template-group-1`.
- Draft match IDs created before official schedule order is confirmed.
- Placeholder IDs in template files that are not loaded by the app.

## IDs That Should Not Change After Production Entry

After real production data is merged and deployed, avoid changing:

- Real `teamId` values in `teams.json`.
- Real `groupId` values in `groups.json` and `teams.json`.
- Published `matchId` values in `matches.json`.

If an ID must change after publication:

1. Check whether it affects localStorage preferences or match detail references.
2. Update every reference in `teams.json`, `groups.json`, and `matches.json` together.
3. Mention the compatibility impact in the pull request.
4. Run `npm run validate:data` and `npm run build`.
5. Confirm the public app does not show `データエラー`.

## Cross-File References

`teams.json` is the team master file:

- `teams[].id` is referenced by `groups[].teamIds`.
- `teams[].id` is referenced by `matches[].homeTeamId` and `matches[].awayTeamId`.
- `teams[].group` should match the group record in `groups.json`.

`groups.json` defines group membership:

- `groups[].id` should match each relevant `teams[].group`.
- `groups[].teamIds` should contain only IDs from `teams.json`.

`matches.json` defines schedule and results:

- `matches[].homeTeamId` and `matches[].awayTeamId` must exist in `teams.json`.
- Group-stage `matches[].groupId` must exist in `groups.json`.
- Group-stage `groupId` should match both teams' `group` values.

## localStorage Compatibility

The app stores user preferences in localStorage under:

```text
wc-watch-os:userPreferences
```

The saved values include team IDs such as `mainFavoriteTeamId` and `selectedTeamIds`. If production `teamId` values are changed after users have selected favorite teams, their saved preferences may no longer point to an existing team.

To preserve compatibility:

- Choose production `teamId` values before launch.
- Avoid changing team IDs after release.
- If a team ID change is unavoidable, consider a migration plan before merging.

## Final Pre-Entry Rule

Before entering real official data, confirm these docs:

- `docs/10_official_schedule_source.md`
- `docs/11_data_id_design.md`

Then run:

```bash
npm run validate:data
npm run build
```
