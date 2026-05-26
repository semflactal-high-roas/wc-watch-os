# Teams and Groups Entry Plan

This document prepares `teams.json` and `groups.json` for production data entry. It does not introduce real official team or group data by itself.

## Scope

Use this plan before replacing dummy team and group data with production-ready data.

In scope:

- How to order `teams.json` and `groups.json` updates.
- How to apply the ID design from `docs/11_data_id_design.md`.
- How to avoid breaking app references and saved user preferences.
- How to verify the update before merge.

Out of scope:

- Adding all real qualified teams before official confirmation.
- Adding official group assignments before FIFA confirmation.
- Adding official match schedules.
- Adding placeholder teams for unknown qualifiers or groups.

## Required References

Check these docs before editing production team or group data:

- `docs/10_official_schedule_source.md`
- `docs/11_data_id_design.md`
- `docs/12_teams_groups_entry_plan.md`

## Source Policy

- Treat FIFA official information as the source of truth for qualified teams and group assignments.
- Use Reuters and other reputable reporting only as secondary confirmation.
- Do not treat unofficial websites, Wikipedia, social media, screenshots, or copied spreadsheets as authoritative.
- Do not enter unconfirmed teams or unconfirmed groups.
- Do not replace dummy IDs with production IDs before official information is checked.

## Entry Order

Recommended production entry order:

1. Confirm official team and group information from FIFA.
2. Record source notes in the pull request: `sourceName`, `sourceUrl`, `checkedAt`, `inputBy`, and `notes`.
3. Update `public/data/teams.json` first.
4. Update `public/data/groups.json` second.
5. Run `npm run validate:data`.
6. Run `npm run build`.
7. Open a pull request and confirm GitHub Actions Build succeeds.
8. After merge, confirm GitHub Pages deploy and public display.

## teamId Rules

Production `teamId` values must follow `docs/11_data_id_design.md`.

Recommended pattern:

- Use FIFA/IOC-style three-letter uppercase codes when possible.
- Examples: `JPN`, `ARG`, `BRA`, `USA`, `CAN`, `MEX`.
- Keep display names in `name`.
- Do not use Japanese names, spaces, punctuation, or full display names as IDs.
- Once a production `teamId` is published, do not change it unless there is a clear data correction and a compatibility plan.

Example shape:

```json
{
  "id": "JPN",
  "name": "Japan",
  "group": "A",
  "fifaRank": 18
}
```

## groupId Rules

Production `groupId` values must follow `docs/11_data_id_design.md`.

Recommended pattern:

- Use uppercase group letters: `A`, `B`, `C`, and so on.
- Keep `teams.json` `group` values and `groups.json` `id` values identical.
- Do not use `Group A` as a JSON value; use `A`.

Example shape:

```json
{
  "id": "A",
  "teamIds": ["JPN", "ARG", "BRA", "USA"]
}
```

## Cross-File Consistency

When updating teams and groups:

- Every `groups.json` `teamIds` value must exist in `teams.json`.
- Every team listed in a group should have the same `group` value in `teams.json`.
- Every production `teamId` should be stable before match data references it.
- `matches.json` should not be updated to production team IDs until teams and groups are settled.

## Template Files

These files are reference templates only and are not loaded by the app:

- `public/data/teams.production.template.json`
- `public/data/groups.production.template.json`

They contain sample IDs and sample groups only. They are not official group assignments and must not be treated as real tournament data.

The CLI validator currently checks only the app-loaded files:

- `public/data/teams.json`
- `public/data/groups.json`
- `public/data/matches.json`

Production template files are intentionally not part of `npm run validate:data`.

## Undetermined Teams and Groups

- Do not enter unconfirmed teams.
- Do not enter unconfirmed group assignments.
- Do not create production `teamId` values for unknown qualifier slots.
- If a temporary placeholder is absolutely necessary for planning, keep it in docs or template files, not in app-loaded production JSON.

## localStorage Compatibility

The app stores favorite team IDs in localStorage under:

```text
wc-watch-os:userPreferences
```

If a production `teamId` changes after users select favorite teams, saved preferences may point to a missing team. Before changing a published production `teamId`:

1. Confirm the ID change is truly necessary.
2. Update every reference in `teams.json`, `groups.json`, and `matches.json` together.
3. Note the localStorage compatibility impact in the pull request.
4. Consider a migration strategy if real users may already have saved preferences.

## Required Checks

After updating `teams.json` or `groups.json`, run:

```bash
npm run validate:data
npm run build
```

Then confirm:

- GitHub Actions Build succeeds.
- GitHub Pages Deploy succeeds after merge.
- The public app opens without `データエラー`.
- Settings still shows selectable teams.
- Home and Schedule still render correctly.
