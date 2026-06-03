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

公開前の手動QAは `docs/14_manual_qa_checklist.md` を参照してください。β公開前の最終確認と既知の制限は `docs/15_beta_release_checklist.md` に集約しています。

## 公開画面の情報表示

公開画面では、最終更新日と日程ソース（FIFA公式）を共通フッターのデータ情報に表示します。URL共有時に内容が分かるよう、`index.html` の title / description / OGP / Twitter card も設定しています。

## 観戦しやすさの表示

試合カードと詳細画面では、日本時間のキックオフを `朝5:00キックオフ` や `深夜2:00キックオフ` のような時間帯ラベルで表示します。

Match Detail と Home のおすすめカードでは `この試合を共有` から共有文をコピーできます。自動投稿は行わず、ユーザーがXやLINEなどへ任意で貼り付ける方式です。
