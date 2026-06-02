# Real Data Entry Checklist

Use this checklist before merging real data updates.

## Official Source

- [ ] `docs/10_official_schedule_source.md` was checked before entering official schedule data.
- [ ] FIFA official website was used as the primary schedule source.
- [ ] Reuters or other reporting was used only as secondary confirmation if needed.
- [ ] Unofficial websites, Wikipedia, social media, screenshots, and copied spreadsheets were not used as authoritative sources.
- [ ] Source notes are recorded in the pull request or docs: `sourceName`, `sourceUrl`, `checkedAt`, `inputBy`, and `notes`.
- [ ] Source metadata was not added to `public/data/matches.json`.

## ID Design

- [ ] `docs/11_data_id_design.md` was checked before assigning production IDs.
- [ ] Production `teamId` values use stable FIFA/IOC-style uppercase codes when possible.
- [ ] Production `groupId` values use uppercase group letters such as `A`, `B`, and `C`.
- [ ] Group-stage `matchId` values follow `G-{groupId}-{number}`, such as `G-A-01`.
- [ ] Knockout `matchId` values follow stage prefixes such as `R32-01`, `R16-01`, `QF-01`, `SF-01`, `TP-01`, and `F-01`.
- [ ] No production ID contains Japanese text, spaces, or display names.
- [ ] Any ID change after publication includes a compatibility note for localStorage favorite team IDs.

## Teams and Groups Entry Plan

- [ ] `docs/12_teams_groups_entry_plan.md` was checked before replacing dummy team or group data.
- [ ] No unconfirmed teams were added to app-loaded production JSON.
- [ ] No unconfirmed group assignments were added to app-loaded production JSON.
- [ ] `public/data/teams.production.template.json` and `public/data/groups.production.template.json` were treated as app non-loaded reference templates only.
- [ ] Template files were not treated as official group assignments.

## Match Schedule Entry Plan

- [ ] `docs/13_match_schedule_entry_plan.md` was checked before entering official match schedules.
- [ ] Official group-stage schedules are entered in the planned group batches, not as one large 104-match update.
- [ ] Knockout-stage schedules are deferred until participating teams are confirmed or official bracket information is clear.
- [ ] JST conversion notes are recorded in the pull request description.

## teams.json

- [ ] `teams.json` includes every team needed by the current schedule.
- [ ] Every team has a unique `id`.
- [ ] Every team has a `name`.
- [ ] Every team has a `group`.
- [ ] Team IDs are stable and reused consistently.

## groups.json

- [ ] Every `groups.json` `teamIds` value exists in `teams.json`.
- [ ] Group membership matches each team's `group` value in `teams.json`.
- [ ] No expected group is missing.

## matches.json

- [ ] Every target group in the pull request has all 6 group-stage matches.
- [ ] Target group match IDs use `G-{groupId}-01` through `G-{groupId}-06`.
- [ ] Match numbering follows the official schedule order for each target group.
- [ ] Every match has a unique `id`.
- [ ] Every match has `homeTeamId` and `awayTeamId`.
- [ ] No match has the same `homeTeamId` and `awayTeamId`.
- [ ] Every match team ID exists in `teams.json`.
- [ ] Every match has `date` in `YYYY-MM-DD` format.
- [ ] Every match has `kickoffTimeJST` in `HH:mm` format.
- [ ] Every `kickoffTimeJST` value is stored in Japan time.
- [ ] Japan-time date changes are reflected in `date`.
- [ ] Every match has a valid `stage`.
- [ ] Every group stage match has `groupId`.
- [ ] Group stage `groupId` matches both teams' group.
- [ ] Knockout stage matches omit `groupId` unless there is a specific display need.

## Group Stage 72-Match QA

After all group-stage matches are entered, `npm run validate:data` must confirm:

- [ ] Groups A-L each have exactly 4 teams.
- [ ] Groups A-L each have exactly 6 group-stage matches.
- [ ] The group-stage total is exactly 72 matches.
- [ ] Group-stage match IDs use `G-{groupId}-01` through `G-{groupId}-06`.
- [ ] No match IDs are duplicated.
- [ ] No same-group fixture cards are duplicated.
- [ ] Each 4-team group has all 6 round-robin pairings.
- [ ] Every group-stage team belongs to the match `groupId`.
- [ ] `date` and `kickoffTimeJST` use strict JST-ready formats.
- [ ] `played` and score fields are consistent.

## Results

- [ ] Unplayed matches use `played: false`.
- [ ] Unplayed matches use `homeScore: null` and `awayScore: null`.
- [ ] Played matches use `played: true`.
- [ ] Played matches use number values for `homeScore` and `awayScore`.
- [ ] Result-only updates changed only `played`, `homeScore`, and `awayScore`.

## Local Checks

- [ ] `npm run validate:data` succeeds.
- [ ] `npm run build` succeeds.

## Pull Request Checks

- [ ] GitHub Actions Build succeeds.
- [ ] Review confirms no official logos, official images, external APIs, login, notifications, or backend features were added.
- [ ] JSON files contain no comments.

## After Merge

- [ ] GitHub Pages Deploy succeeds.
- [ ] Public URL opens successfully.
- [ ] No `データエラー` appears.
- [ ] Home screen renders match ranking.
- [ ] Schedule screen renders all updated matches.
- [ ] Match detail opens for a newly updated match.
- [ ] ICS download still works from match detail.

Public URL:

```text
https://semflactal-high-roas.github.io/wc-watch-os/
```
