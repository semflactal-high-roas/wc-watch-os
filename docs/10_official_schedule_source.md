# Official Schedule Source Guidance

This document defines how to treat official FIFA schedule information before entering real World Cup data into `public/data`.

## Source Policy

- The primary source of truth for match schedules is the FIFA official website.
- Use FIFA's official World Cup schedule pages and FIFA-published schedule documents when entering or changing match data.
- Reuters and other reputable reporting may be used only as secondary confirmation.
- Do not use unofficial websites, Wikipedia, social media posts, screenshots, or copied spreadsheets as the authoritative source.
- If sources conflict, pause the data update and re-check the FIFA official source before changing JSON.

Useful official source page:

```text
https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/match-schedule-fixtures-results-teams-stadiums
```

## Required Source Notes

When entering official schedule data, record the source trail in the pull request description or a docs update. Keep this metadata out of `public/data/matches.json`.

Record these fields:

- `sourceName`: Human-readable source name, such as `FIFA World Cup 2026 match schedule`.
- `sourceUrl`: The exact FIFA URL checked.
- `checkedAt`: Date and time when the source was checked, preferably ISO-like JST such as `2026-05-26 10:00 JST`.
- `inputBy`: GitHub username or person who entered the data.
- `notes`: Any ambiguity, conversion detail, or update reason.

## Schedule Change Rules

When FIFA updates a date, kickoff time, venue, opponent, or match order:

1. Confirm the change on FIFA's official website.
2. Record `sourceName`, `sourceUrl`, `checkedAt`, `inputBy`, and `notes` in the pull request.
3. Update the smallest possible JSON fields.
4. Run `npm run validate:data`.
5. Run `npm run build`.
6. Open a pull request with a short summary of what changed and why.
7. After merge, confirm GitHub Pages deploy and public display.

For result-only updates after a match is played, update only:

- `played`
- `homeScore`
- `awayScore`

## Time Zone Rules

- Store `kickoffTimeJST` in Japan time only.
- If FIFA displays local venue time, GMT, or UTC, convert it to JST before entering data.
- JST is UTC+09:00 and does not use daylight saving time.
- When converting from UTC/GMT to JST, add 9 hours and adjust the date if the time crosses midnight.
- When converting from local host-city time, account for the local time zone and daylight saving rules on that match date.
- If a converted kickoff changes the Japanese calendar date, store the Japanese date in `date`.

Example:

```text
FIFA source: 2026-06-11 19:00 UTC
JST entry: date = 2026-06-12, kickoffTimeJST = 04:00
```

## JSON Metadata Boundary

Do not add source metadata to production app JSON files.

Keep these files focused on app display and calculation data:

- `public/data/teams.json`
- `public/data/groups.json`
- `public/data/matches.json`

Do not add these fields to `matches.json` in the MVP:

- `sourceName`
- `sourceUrl`
- `checkedAt`
- `inputBy`
- `notes`

Use docs, pull request descriptions, and `public/data/matches.official.template.json` for source-tracking examples instead.

## Template Usage

`public/data/matches.official.template.json` is a reference template only. The app does not load it. Use it to copy the expected shape for official schedule entry work, then move only app-facing fields into `matches.json`.
