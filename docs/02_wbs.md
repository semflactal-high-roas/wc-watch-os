# WBS

## 0. このファイルの目的

このファイルは、「今日見るべきW杯 - 観戦OS開発」の作業分解表です。

目的は、MVP完成までに必要な作業をフェーズごとに整理し、ChatGPT / Codex / Grok / Replit / GitHub で迷わず進められる状態にすることです。

初期開発では、機能追加よりも完成を優先します。

---

## Phase 0：プロジェクト準備

| ID | タスク | 成果物 | 優先度 | 想定工数 |
|---|---|---|---:|---:|
| 0.1 | プロジェクト名・コンセプト確定 | コンセプトメモ | Must | 0.5日 |
| 0.2 | GitHubリポジトリ作成 | repo | Must | 完了 |
| 0.3 | docsファイル作成 | docs一式 | Must | 0.5日 |
| 0.4 | README初期整備 | README.md | Should | 0.5日 |
| 0.5 | GitHub Pages公開設定確認 | hello world公開 | Must | 0.5日 |
| 0.6 | Replit開発環境作成 | dev環境 | Should | 0.5日 |
| 0.7 | 技術スタック確定 | 技術メモ | Must | 0.5日 |

---

## Phase 1：データ基盤

| ID | タスク | 成果物 | 優先度 | 想定工数 |
|---|---|---|---:|---:|
| 1.1 | teams.json設計 | teams.json | Must | 0.5日 |
| 1.2 | groups.json設計 | groups.json | Must | 0.5日 |
| 1.3 | matches.json設計 | matches.json | Must | 1日 |
| 1.4 | results.json設計 | results.json | Must | 0.5日 |
| 1.5 | insights.json設計 | insights.json | Should | 0.5日 |
| 1.6 | manualOverrides.json設計 | manualOverrides.json | Should | 0.5日 |
| 1.7 | ダミーデータ作成 | public/data/*.json | Must | 1日 |
| 1.8 | データ検証スクリプト作成 | validateData.ts | Should | 1日 |

---

## Phase 2：基本Webアプリ

| ID | タスク | 成果物 | 優先度 | 想定工数 |
|---|---|---|---:|---:|
| 2.1 | Vite + React + TypeScript初期化 | app skeleton | Must | 0.5日 |
| 2.2 | Tailwind CSS導入 | UI基盤 | Must | 0.5日 |
| 2.3 | ルーティング設定 | 各画面遷移 | Must | 0.5日 |
| 2.4 | JSONローダー作成 | data loader | Must | 0.5日 |
| 2.5 | スマホUI共通レイアウト作成 | Layout/Header/Nav | Must | 1日 |
| 2.6 | Home初期画面作成 | トップページ | Must | 1日 |
| 2.7 | GitHub Pagesビルド確認 | 公開可能状態 | Must | 0.5日 |

---

## Phase 3：推し国設定

| ID | タスク | 成果物 | 優先度 | 想定工数 |
|---|---|---|---:|---:|
| 3.1 | TeamSelector作成 | 国選択UI | Must | 1日 |
| 3.2 | localStorage保存実装 | userPreferences.ts | Must | 0.5日 |
| 3.3 | 日本代表の初期設定 | 初期値実装 | Must | 0.5日 |
| 3.4 | メイン推し国設定 | Settings画面 | Must | 0.5日 |
| 3.5 | サブ推し国設定 | Settings画面 | Should | 0.5日 |
| 3.6 | ゆる追い国設定 | Settings画面 | Could | 0.5日 |
| 3.7 | 設定に応じた表示フィルター | personalized view | Must | 1日 |

---

## Phase 4：順位・条件ロジック

| ID | タスク | 成果物 | 優先度 | 想定工数 |
|---|---|---|---:|---:|
| 4.1 | standings.ts実装 | グループ順位計算 | Must | 1.5日 |
| 4.2 | standings.tsテスト作成 | unit tests | Must | 1日 |
| 4.3 | thirdPlaceRanking.ts実装 | 3位比較 | Must | 1日 |
| 4.4 | 3位比較テスト作成 | unit tests | Must | 1日 |
| 4.5 | 突破ステータス簡易判定 | status labels | Should | 1日 |
| 4.6 | tournamentPath.ts下書き | トーナメント分岐ロジック | Should | 2日 |
| 4.7 | 未確定条件の表示ルール作成 | 表示ルール | Must | 0.5日 |

---

## Phase 5：主要画面実装

| ID | タスク | 成果物 | 優先度 | 想定工数 |
|---|---|---|---:|---:|
| 5.1 | Schedule画面 | 全試合一覧 | Must | 1日 |
| 5.2 | Groups画面 | グループ順位表 | Must | 1日 |
| 5.3 | ThirdPlace画面 | 3位通過ライン | Must | 1日 |
| 5.4 | TeamPage画面 | 推し国ページ | Must | 1.5日 |
| 5.5 | MatchDetail画面 | 試合詳細 | Must | 1.5日 |
| 5.6 | Bracket画面 | トーナメント表 | Should | 2日 |
| 5.7 | Settings画面 | 推し国設定 | Must | 1日 |

---

## Phase 6：試合重要度・見る理由

| ID | タスク | 成果物 | 優先度 | 想定工数 |
|---|---|---|---:|---:|
| 6.1 | matchImportance.ts実装 | S/A/B/C判定 | Must | 1.5日 |
| 6.2 | 寝不足価値スコア実装 | sleepScore | Must | 1日 |
| 6.3 | 今日見るべき試合ランキング実装 | Home表示 | Must | 1日 |
| 6.4 | 解説文テンプレート作成 | prompts.md | Should | 1日 |
| 6.5 | insights.json初期投入 | 見る理由データ | Should | 1日 |
| 6.6 | 試合詳細に見る理由を表示 | MatchDetail改善 | Must | 0.5日 |

---

## Phase 7：ICSカレンダー生成

| ID | タスク | 成果物 | 優先度 | 想定工数 |
|---|---|---|---:|---:|
| 7.1 | ICS仕様確認 | 仕様メモ | Must | 0.5日 |
| 7.2 | icsGenerator.ts実装 | ICS生成関数 | Must | 1日 |
| 7.3 | 全試合ICS出力 | download | Should | 0.5日 |
| 7.4 | 推し国別ICS出力 | personalized calendar | Must | 1日 |
| 7.5 | 重要度S/AのICS出力 | watch calendar | Should | 0.5日 |
| 7.6 | 試合詳細から単体ICS出力 | MatchDetail導線 | Should | 0.5日 |

---

## Phase 8：X共有カード生成

| ID | タスク | 成果物 | 優先度 | 想定工数 |
|---|---|---|---:|---:|
| 8.1 | カードデザイン案作成 | card design | Must | 0.5日 |
| 8.2 | Canvas画像生成実装 | PNG生成 | Must | 1.5日 |
| 8.3 | 今日見るべき試合カード | card type 1 | Must | 1日 |
| 8.4 | 推し国突破条件カード | card type 2 | Should | 1日 |
| 8.5 | 3位通過ラインカード | card type 3 | Should | 1日 |
| 8.6 | 寝不足危険度カード | card type 4 | Could | 0.5日 |
| 8.7 | X投稿文コピー機能 | copy text | Should | 0.5日 |

---

## Phase 9：結果取得自動化

| ID | タスク | 成果物 | 優先度 | 想定工数 |
|---|---|---|---:|---:|
| 9.1 | 無料API候補調査 | API比較表 | Must | 0.5日 |
| 9.2 | APIキー取得・検証 | fetch prototype | Must | 0.5日 |
| 9.3 | fetchResults.ts実装 | API取得 | Must | 1日 |
| 9.4 | normalizeResults.ts実装 | results.json変換 | Must | 1日 |
| 9.5 | GitHub Actions設定 | update-results.yml | Must | 1日 |
| 9.6 | 手動補正ファイル対応 | manualOverrides | Should | 1日 |
| 9.7 | 取得失敗時ログ | error handling | Should | 0.5日 |
| 9.8 | 前回データ保持処理 | fallback | Should | 0.5日 |

---

## Phase 10：公開・テスト

| ID | タスク | 成果物 | 優先度 | 想定工数 |
|---|---|---|---:|---:|
| 10.1 | GitHub Pages deploy設定 | 公開URL | Must | 0.5日 |
| 10.2 | スマホ表示確認 | QAメモ | Must | 1日 |
| 10.3 | 主要ロジックテスト | test results | Must | 1日 |
| 10.4 | ダミーデータで大会進行テスト | scenario test | Must | 2日 |
| 10.5 | API自動更新テスト | workflow result | Must | 1日 |
| 10.6 | README更新 | README.md | Should | 0.5日 |
| 10.7 | 非公式表記・権利表記確認 | 表記確認 | Must | 0.5日 |

---

## Phase 11：運用準備

| ID | タスク | 成果物 | 優先度 | 想定工数 |
|---|---|---|---:|---:|
| 11.1 | 大会前投稿テンプレート作成 | X templates | Should | 1日 |
| 11.2 | Grok用話題収集プロンプト作成 | grok prompts | Should | 0.5日 |
| 11.3 | ChatGPT用解説生成プロンプト作成 | insight prompts | Should | 0.5日 |
| 11.4 | 試合日運用手順作成 | operation.md | Must | 1日 |
| 11.5 | API障害時の手動更新手順作成 | fallback.md | Must | 0.5日 |
| 11.6 | Xカード投稿手順作成 | posting guide | Should | 0.5日 |

---

# マイルストーン

## Milestone 1：仕様正本の作成

目標：GitHub上に開発に必要な基本ドキュメントを置く。

含む：

- `00_project_overview.md`
- `01_requirements.md`
- `02_wbs.md`
- `03_data_schema.md`
- `04_logic_spec.md`

完了条件：

- `/docs` 配下に5ファイルが存在する
- 各ファイルに最低限の内容が入っている
- GitHubにコミット済み

---

## Milestone 2：動く原型

目標：データを読み込み、全試合一覧と推し国設定が動く。

含む：

- React初期構築
- JSON読み込み
- スケジュール表示
- 推し国設定
- GitHub Pages公開

---

## Milestone 3：観戦OSの核

目標：順位・3位通過ライン・今日見るべき試合が動く。

含む：

- グループ順位計算
- 3位通過ライン
- 重要度判定
- Homeランキング
- MatchDetail

---

## Milestone 4：拡散・再訪導線

目標：XカードとICS出力が動く。

含む：

- ICS出力
- Xカード生成
- コピー文生成
- 推し国別カード

---

## Milestone 5：自動更新

目標：API結果取得とGitHub Actions更新が動く。

含む：

- API取得
- JSON変換
- Actions定期実行
- 手動補正

---

## Milestone 6：大会前運用準備

目標：公開・投稿・更新の運用ができる状態にする。

含む：

- README
- 運用手順
- 障害時手順
- 投稿テンプレート
- ダミー大会シナリオテスト

---

# 直近の作業

現在の直近タスクは以下です。

1. `docs/02_wbs.md` を作成する
2. `docs/03_data_schema.md` を作成する
3. `docs/04_logic_spec.md` を作成する
4. `docs/05_codex_prompts.md` を作成する
5. CodexにMVP初期実装を依頼する

---

# 注意事項

- 初期はWebアプリのみを作る
- LINE通知、ログイン、課金、リアルタイム速報は作らない
- 順位計算や3位通過ラインはAIに任せない
- AIは見る理由、解説文、Xコピーの生成に使う
- スクレイピングは本命にしない
- 公式ロゴ・公式素材・公式風デザインは使わない
- 機能追加よりも、まずMVP完成を優先する
