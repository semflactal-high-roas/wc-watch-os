# wc-watch-os
日本時間でW杯を見る人向けに、日本代表と応援する国の試合価値・突破条件・3位通過ラインを可視化するスマホWebアプリ

## データ更新後の確認

`public/data/*.json` を更新した後は、公開前に以下を実行してください。

```bash
npm run validate:data
npm run build
```

実データ投入前に `docs/10_official_schedule_source.md`、`docs/11_data_id_design.md`、`docs/12_teams_groups_entry_plan.md`、`docs/13_match_schedule_entry_plan.md` を確認し、FIFA公式情報を一次情報として扱い、ID設計ルールと分割投入計画に沿って入力してください。

実データ投入の手順は `docs/08_real_data_entry.md`、確認項目は `docs/09_data_entry_checklist.md` を参照してください。

公開前の手動QAは `docs/14_manual_qa_checklist.md` を参照してください。
