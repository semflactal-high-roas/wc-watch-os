# Current State

## 1. Public Status

| Item | Status | Evidence / Notes |
| --- | --- | --- |
| Public URL | `https://semflactal-high-roas.github.io/wc-watch-os/` | `docs/14_manual_qa_checklist.md`、`docs/08_real_data_entry.md`、`src/logic/shareCopy.ts`、`index.html` に記載 |
| Current release status | β版として扱う。公開可否は要確認 | `docs/15_beta_release_checklist.md` にβ公開条件と「β版として扱う」の記載あり。チェック項目の実施結果はrepo内で未記録 |
| Last checked | 2026-06-09 JST | このスナップショットの更新日 |
| GitHub Pages deploy status | 要確認 | `.github/workflows/deploy.yml` にmain更新時のPagesデプロイ処理あり。最新デプロイの成否はrepo内だけでは確認できない |
| Build / validation status | `npm run build`: 成功。`npm run validate`: scriptなし。`npm run validate:data`: 成功 | 2026-06-09 JST にmainのローカル取得内容で確認。GitHub Actions上の最新実行状況は要確認 |

## 2. Latest Merged Work

| Item | Details |
| --- | --- |
| Latest merged PR | [#36 Replace DOM polish with React date display](https://github.com/semflactal-high-roas/wc-watch-os/pull/36)（2026-06-04マージ） |
| Main changes | DOM後処理コンポーネントを削除し、β表示ラベル、曜日つき日付、補助文言、3位通過ライン説明などをReact JSXと通常の表示ロジックへ移行 |
| Confirmed checks | PR本文に GitHub Actions Build run 230 で `npm run validate:data` と `npm run build` が成功した記録あり |
| Notes | `public/data/*.json` の変更なし。最新mainのGitHub Pages Deploy成否と公開画面の手動QA結果は要確認 |

## 3. Current Implemented Scope

| Item | Status | Evidence / Notes |
| --- | --- | --- |
| GitHub Pages公開 | 一部実装 | `vite.config.ts` のbase設定と `.github/workflows/deploy.yml` を確認。公開URLと公開可能の記載あり。最新デプロイ成否・実アクセスは要確認 |
| Vite + React + TypeScript | 実装済み | `package.json`、`vite.config.ts`、`src/main.tsx`、`src/App.tsx` で確認 |
| スマホ向けUI | 実装済み | `src/App.tsx` の `max-w-md`、固定ボトムナビ、カードUIで確認。実端末QA結果は要確認 |
| グループステージ全72試合データ | 実装済み | `public/data/matches.json` は72件。`public/data/groups.json` はGroups A-Lの12組、`teams.json` は48件 |
| 日本時間・曜日つき表示 | 実装済み | `src/logic/dateTimeDisplay.ts` と `src/App.tsx` で確認 |
| 時間帯ラベル | 実装済み | `src/logic/timeOfDayLabel.ts` と試合カード・詳細での利用を確認 |
| 日本代表＋推し国設定 | 実装済み | 日本代表は固定追跡対象。`src/App.tsx` の設定画面でメイン・追加の応援国を設定可能 |
| localStorage保存 | 実装済み | `src/App.tsx` の `wc-watch-os:userPreferences` 読み書きを確認 |
| 今日見るべき試合ランキング | 実装済み | `src/logic/matchImportance.ts` とHomeランキング表示を確認 |
| 重要度S/A/B/C | 一部実装 | `src/logic/matchImportance.ts` でS/A/B/Cを決定論的に算出。主要UIでは `高 / 中 / 低` 表示へ変換している箇所あり |
| グループ順位表 | 実装済み | `src/logic/standings.ts` と `src/App.tsx` の順位表示を確認 |
| 3位通過ライン | 実装済み | `src/logic/thirdPlaceRanking.ts`、`thirdPlaceLine.ts` と表示を確認。詳細タイブレークは未反映 |
| 暫定トーナメント表β | 一部実装 | 専用の「トーナメント」画面で推し国の道のりを先に表示し、R32〜準々決勝をブロックA〜Dの縦型アコーディオン、準決勝〜Finalを勝者枠の接続として表示。3位通過枠・公式R32枠・正式組み合わせは未確定で、勝敗予想は行わない |
| 試合詳細 | 実装済み | `src/App.tsx` のMatch Detail画面を確認 |
| ICSカレンダー追加 | 実装済み | `src/logic/ics.ts` とHome・Match Detailの導線を確認 |
| 共有文コピー | 実装済み | `src/logic/shareCopy.ts` とHome・Match Detailの導線を確認 |
| X共有カード生成 | 未実装 | Canvas/PNGの共有カード生成実装はrepo内で確認できない。共有文コピーのみ実装済み |
| FIFA公式ソース表示 | 実装済み | `public/data/config.json` と `index.html` の共通フッターで確認 |
| 非公式表記 | 実装済み | `index.html` に「非公式の個人制作ツールです」の表示あり |
| 結果更新方式 | 一部実装 | `docs/08_real_data_entry.md` に `matches.json` の `played` / scoreを手動更新する手順あり。外部API連携・自動更新はなし |
| データ検証 | 実装済み | `scripts/validate-data.mjs` と `npm run validate:data` を確認。アプリ読込時は `src/logic/validateData.ts` も実行 |
| GitHub Actions | 実装済み | `.github/workflows/build.yml` と `.github/workflows/deploy.yml` を確認。最新実行成否は要確認 |

## 4. Known Gaps

- GitHub Pagesの最新デプロイ成功、公開URLへの実アクセス、公開画面の手動QA結果は要確認。
- `docs/14_manual_qa_checklist.md` と `docs/15_beta_release_checklist.md` のチェック結果はrepo内で未記録。
- `npm run validate` scriptは存在しない。現在のデータ検証scriptは `npm run validate:data`。
- X共有カードのCanvas/PNG生成は未実装。共有文コピーは実装済み。
- ノックアウトステージは未投入で、全104試合は未対応。
- 暫定トーナメント表βのR32枠と接続順は、repo内に公式定義がないため要確認の仮配置。公式ブラケット完全再現ではない。
- 外部API連携と結果の自動更新は未実装。結果更新は当面手動。
- 詳細タイブレーク、直接対決、フェアプレーポイント、抽選条件は未反映。
- FIFA公式データの再確認と、更新後の公開画面確認は手動運用。

## 5. Next Actions

- **Priority 1:** GitHub Actionsの最新BuildとGitHub Pages Deployを確認し、公開URLでHome・日程・設定・試合詳細が開くことを確認する。
- **Priority 2:** `docs/14_manual_qa_checklist.md` と `docs/15_beta_release_checklist.md` の主要項目をスマホ幅で実施し、公開可否を記録する。
- **Priority 3:** 開幕前の結果手動更新手順を再確認し、更新時に `npm run validate:data`、`npm run build`、Pages公開確認を行える状態にする。

## 6. Operation Rules

- リアルタイム速報はしない。
- 結果更新は当面手動とする。
- 本番運用・結果更新ではReplitを使わない。
- AIに順位計算や突破条件判定を任せない。
- 順位計算、3位通過ライン、試合重要度判定はTypeScriptロジックで処理する。
- 解説文、見る理由、共有文はAI生成または編集済みデータを使ってよい。
- ログイン、課金、LINE通知、自動X投稿はMVP対象外とする。
- 公式ロゴ、公式画像、公式風デザインは使わない。
- FIFA公式情報への参照と非公式表記を維持する。

## 7. Update Policy

- mainに重要PRをマージした後、必要に応じて更新する。
- 細かい文言修正や軽微なUI修正では毎回更新しない。
- 公開状態、未対応項目、次アクション、運用ルールが変わった場合に更新する。
- 古い情報が残ると判断を誤るため、更新日を `Last checked` に `YYYY-MM-DD JST` 形式で明記する。
