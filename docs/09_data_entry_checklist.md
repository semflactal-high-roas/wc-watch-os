# Real Data Entry Checklist

Use this checklist before merging real data updates.

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

- [ ] Every match has a unique `id`.
- [ ] Every match has `homeTeamId` and `awayTeamId`.
- [ ] No match has the same `homeTeamId` and `awayTeamId`.
- [ ] Every match team ID exists in `teams.json`.
- [ ] Every match has `date` in `YYYY-MM-DD` format.
- [ ] Every match has `kickoffTimeJST` in `HH:mm` format.
- [ ] Every match has a valid `stage`.
- [ ] Every group stage match has `groupId`.
- [ ] Group stage `groupId` matches both teams' group.
- [ ] Knockout stage matches omit `groupId` unless there is a specific display need.

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
