# Codex依頼文

## 0. このファイルの目的

このファイルは、「今日見るべきW杯 - 観戦OS開発」でCodexに実装を依頼するためのプロンプト集である。

Codexに依頼するときは、まずこのファイルと以下のドキュメントを前提にする。

- `docs/00_project_overview.md`
- `docs/01_requirements.md`
- `docs/02_wbs.md`
- `docs/03_data_schema.md`
- `docs/04_logic_spec.md`

基本方針は以下。

- MVP優先
- スマホWebアプリ優先
- 低コスト運用
- GitHub Pagesで公開
- データはJSON管理
- ユーザー設定はlocalStorage
- AIに順位計算や突破条件判定を任せない
- 計算ロジックはTypeScriptで実装
- 解説文生成はAIまたは `insights.json` で管理
- LINE通知、ログイン、課金、リアルタイム速報は初期対象外

---

# 1. Codexに最初に渡すプロンプト

## 1.1 MVP初期実装プロンプト

```txt
このリポジトリは「今日見るべきW杯 - 観戦OS開発」です。

まず以下のドキュメントを読んで、MVPの初期実装を進めてください。

- docs/00_project_overview.md
- docs/01_requirements.md
- docs/02_wbs.md
- docs/03_data_schema.md
- docs/04_logic_spec.md

目的：
日本時間でW杯を見る国内ユーザー向けに、日本代表と推し国に関係ある試合だけを、見る価値・突破条件・3位通過ライン・トーナメント分岐つきで提示するスマホWebアプリを作る。

初期MVPで実装したいもの：
1. Vite + React + TypeScript + Tailwind CSS の初期構成
2. GitHub Pagesで静的公開できる構成
3. public/data 配下のJSON読み込み
4. 日本代表＋推し国設定を localStorage に保存
5. 全試合スケジュール表示
6. 今日見るべき試合ランキング
7. グループ順位表
8. 3位通過ライン表
9. 試合詳細ページ
10. ICSカレンダー出力の土台
11. X共有カードPNG生成の土台

重要：
- 順位計算、3位通過ライン、試合重要度判定はTypeScriptロジックで実装してください。
- AIやLLMに計算させる前提にはしないでください。
- まずはダミーデータで動く状態を優先してください。
- UIはスマホ最適化を優先してください。
- 機能追加よりも、動くMVPを優先してください。
- LINE通知、ログイン、課金、リアルタイム速報、自動X投稿は実装しないでください。

希望する構成：
- src/components
- src/pages
- src/logic
- src/types
- public/data
- scripts
- .github/workflows

まずは最小構成で、アプリが起動し、トップページ・スケジュール・推し国設定・グループ順位・3位通過ラインが表示できるところまで実装してください。
```

---

# 2. 初期セットアップ依頼

## 2.1 Vite + React + TypeScript + Tailwind 初期化

```txt
Vite + React + TypeScript + Tailwind CSSで、このリポジトリにスマホ向けWebアプリの初期構成を作ってください。

要件：
- npm scripts で dev / build / preview が動く
- Tailwind CSSを導入する
- GitHub Pagesで公開しやすい構成にする
- src/components, src/pages, src/logic, src/types を作る
- public/data を作る
- まずは Home 画面を表示する
- スマホ幅で見やすいレイアウトにする

注意：
- まだ本番データは不要です
- ダミーデータで動作確認できる形にしてください
- 余計なライブラリは増やさないでください
```

---

# 3. データ基盤実装依頼

## 3.1 JSONデータ雛形作成

```txt
docs/03_data_schema.md を参照して、public/data 配下にMVP用のダミーJSONを作成してください。

作成するファイル：
- public/data/teams.json
- public/data/groups.json
- public/data/matches.json
- public/data/results.json
- public/data/insights.json
- public/data/manualOverrides.json
- public/data/config.json

要件：
- 日本を含むグループFのダミーデータを入れる
- 日本、オランダ、チュニジア、スウェーデンを含める
- 他グループも3位通過ライン検証用に最低3グループ分入れる
- results.jsonには未消化・消化済みの両方を含める
- standings計算とthirdPlaceRanking計算のテストに使えるデータにする

注意：
- 公式ロゴや公式素材は使わない
- まずは動作確認用のダミーデータでよい
```

## 3.2 JSONローダー作成

```txt
public/data 配下のJSONファイルを読み込むためのデータローダーを作成してください。

実装場所：
- src/data/loader.ts

読み込むデータ：
- teams.json
- groups.json
- matches.json
- results.json
- insights.json
- manualOverrides.json
- config.json

要件：
- 型定義を使って読み込む
- 読み込み失敗時にエラー表示できるようにする
- UIコンポーネントから直接fetchを書かず、loader経由で扱う
```

---

# 4. 型定義実装依頼

## 4.1 TypeScript型定義作成

```txt
docs/03_data_schema.md と docs/04_logic_spec.md を参照して、TypeScriptの型定義を作成してください。

作成場所：
- src/types/Team.ts
- src/types/Match.ts
- src/types/Result.ts
- src/types/Standing.ts
- src/types/UserPreferences.ts
- src/types/Insight.ts
- src/types/index.ts

要件：
- Team, Match, Result, StandingRow, QualificationStatus, Importance, UserPreferences を定義
- 型はロジックとUIの両方で再利用できるようにする
- 文字列リテラル型を使い、stage/status/importanceの許可値を明確にする
```

---

# 5. 推し国設定実装依頼

## 5.1 localStorage設定

```txt
ユーザーの推し国設定をlocalStorageに保存する機能を実装してください。

実装場所：
- src/logic/userPreferences.ts
- src/pages/Settings.tsx
- src/components/TeamSelector.tsx

仕様：
- 日本代表を初期設定にする
- メイン推し国：1チーム
- サブ推し国：最大3チーム
- ゆる追い国：最大5チーム
- localStorageキーは wc-watch-os:userPreferences
- 設定が壊れている場合は初期値に戻す

UI要件：
- スマホで操作しやすいこと
- 設定中のチームがわかること
- 保存後、Homeに反映されること
```

---

# 6. グループ順位ロジック実装依頼

## 6.1 standings.ts実装

```txt
docs/04_logic_spec.md の「グループ順位計算」に従って、グループ順位計算ロジックを実装してください。

実装場所：
- src/logic/standings.ts

関数：
calculateGroupStandings(teams, matches, results)

要件：
- group stage の finished 試合のみ順位計算に反映
- 勝利3点、引き分け1点、敗北0点
- played, won, drawn, lost, points, goalsFor, goalsAgainst, goalDifference を計算
- グループごとに順位表を返す
- MVPでは勝点、得失点差、総得点、teamIdの順でソートする

注意：
- live/scheduled は順位計算に含めない
- AIに順位計算させない
- 未確定条件は断定しない
```

## 6.2 standings.test.ts作成

```txt
standings.ts のユニットテストを作成してください。

テスト対象：
- 勝利時に勝点3が加算される
- 引き分け時に両チームへ勝点1が加算される
- 得点・失点・得失点差が正しく計算される
- 勝点順に並ぶ
- 同勝点の場合、得失点差で並ぶ
- 同得失点差の場合、総得点で並ぶ
- scheduled/live の試合は計算対象外になる

テストフレームワークは、既存構成に合う軽量なものを選んでください。
```

---

# 7. 3位通過ライン実装依頼

## 7.1 thirdPlaceRanking.ts実装

```txt
docs/04_logic_spec.md の「3位通過ライン計算」に従って、3位通過ラインのロジックを実装してください。

実装場所：
- src/logic/thirdPlaceRanking.ts

関数：
calculateThirdPlaceRanking(standingsByGroup, qualifyCount)

要件：
- 各グループの3位チームを抽出
- 勝点、得失点差、総得点、teamIdの順でソート
- 上位8チームを通過圏として扱う
- 8位をボーダーとして扱う
- 9位を圏外先頭として扱う
- 推し国が3位ランキングにいる場合、UIで強調できる情報を返す

注意：
- 消化試合数が異なる場合は暫定順位であることをUI側で表示できるようにする
```

## 7.2 thirdPlaceRanking.test.ts作成

```txt
thirdPlaceRanking.ts のユニットテストを作成してください。

テスト対象：
- 各グループ3位が抽出される
- 勝点順に並ぶ
- 同勝点の場合、得失点差で並ぶ
- 同得失点差の場合、総得点で並ぶ
- 上位8チームが通過圏になる
- 8位がボーダーになる
- 9位が圏外先頭になる
```

---

# 8. 試合重要度ロジック実装依頼

## 8.1 matchImportance.ts実装

```txt
docs/04_logic_spec.md の「試合重要度判定」と「寝不足価値スコア」に従って、試合重要度ロジックを実装してください。

実装場所：
- src/logic/matchImportance.ts

関数：
calculateMatchImportance({ match, userPreferences, standingsByGroup, thirdPlaceRanking, insights })

出力：
- importance: "S" | "A" | "B" | "C"
- sleepScore: number
- relationTypes: string[]
- reasonCode: string[]

MVP判定ルール：
- メイン推し国の試合はS
- サブ推し国の試合はA
- メイン推し国と同組の他国試合はA
- 3位通過ラインに影響する試合はA
- ゆる追い国の試合はB
- 強豪国など注目カードはB
- それ以外はC

注意：
- insights.json に importance がある場合は上書きできるようにする
- sleepScore は0〜100に丸める
- 深夜・早朝のCランク試合は寝てよい扱いにする
```

---

# 9. 主要画面実装依頼

## 9.1 Home画面

```txt
Home画面を実装してください。

表示内容：
- 今日見るべき試合ランキング
- S/A/B/Cの重要度バッジ
- 日本時間のキックオフ
- 対戦カード
- 推し国との関係
- 見る理由の一言
- 寝不足価値スコア
- 推し国設定への導線
- グループ順位・3位通過ラインへの導線

UI方針：
- スマホ最適化
- 情報を詰め込みすぎない
- 重要度S/Aを上に表示
- Cランクは控えめに表示
```

## 9.2 Schedule画面

```txt
全試合スケジュール画面を実装してください。

表示内容：
- 全試合一覧
- 日本時間のキックオフ
- 対戦カード
- グループ/ステージ
- 重要度
- スコア
- ステータス

フィルター：
- 今日
- 明日
- 日本戦
- 推し国
- 重要度S/A
- グループ別

UI方針：
- スマホでスクロールしやすい
- フィルターは上部に配置
```

## 9.3 Groups画面

```txt
グループ順位表画面を実装してください。

表示内容：
- グループ別順位表
- チーム名
- 試合数
- 勝点
- 得失点差
- 総得点
- 順位
- 状態ラベル

要件：
- calculateGroupStandings の結果を表示する
- 推し国を強調する
- 詳細タイブレーク未対応の場合は注記を表示する
```

## 9.4 ThirdPlace画面

```txt
3位通過ライン画面を実装してください。

表示内容：
- 3位チームランキング
- チーム名
- グループ
- 勝点
- 得失点差
- 総得点
- 通過圏/ボーダー/圏外
- 推し国の強調表示

要件：
- calculateThirdPlaceRanking の結果を表示する
- 8位をボーダーとして強調する
- 9位を圏外先頭として表示する
- 消化試合数が違う場合は暫定表示の注記を出す
```

## 9.5 MatchDetail画面

```txt
試合詳細ページを実装してください。

表示内容：
- 対戦カード
- キックオフ時刻 日本時間
- グループ/ステージ
- 現在順位
- 重要度
- 寝不足価値スコア
- 見る理由
- 推し国への影響
- X共有カード生成ボタン
- ICS追加ボタン

注意：
- 勝敗別の突破条件は、未実装の場合は断定しない
- 未確定条件は「条件分岐あり」「他グループ結果待ち」と表示する
```

---

# 10. ICS出力実装依頼

## 10.1 ICS生成

```txt
ICSカレンダー出力機能を実装してください。

実装場所：
- src/logic/icsGenerator.ts

対象：
- 全試合
- メイン推し国の試合
- サブ推し国の試合
- 重要度S/Aの試合
- 今日の試合

要件：
- .icsファイルを生成してダウンロードできる
- イベント名に対戦カードと重要度を入れる
- 説明欄に見る理由を入れる
- 日本時間を基準にする
- LINE通知の代替として使えるようにする

注意：
- 通知タイミングはカレンダー側の設定に委ねる
```

---

# 11. X共有カード実装依頼

## 11.1 PNGカード生成

```txt
X共有用のPNGカード生成機能を実装してください。

実装場所：
- src/components/ShareCardGenerator.tsx
- src/logic/shareCard.ts

カード種類：
- 今日見るべき試合カード
- 推し国の次戦カード
- 3位通過ラインカード
- 寝不足危険度カード

MVP要件：
- CanvasまたはHTMLからPNGを生成できる
- PNGをダウンロードできる
- X投稿文をコピーできる
- Xへの自動投稿はしない

デザイン方針：
- 公式ロゴや公式素材は使わない
- スマホ画面でも読みやすい
- 重要度S/Aが目立つ
- 情報を詰め込みすぎない
```

---

# 12. GitHub Pages公開依頼

## 12.1 deploy設定

```txt
GitHub Pagesで公開できるように設定してください。

要件：
- npm run build が成功する
- dist をGitHub Pagesで公開できる
- 必要なら base path を設定する
- GitHub Actionsでbuild/deployできるようにする

作成候補：
- .github/workflows/deploy.yml

注意：
- GitHub Pagesで表示したときにルーティングが壊れないようにする
- 静的サイトとして動く構成にする
```

---

# 13. API結果取得実装依頼

## 13.1 無料API検証

```txt
無料スポーツデータAPIから試合結果を取得するための検証コードを作成してください。

目的：
試合結果の手入力を避けるため、無料APIから結果を取得し、results.json に変換できるか確認する。

作成候補：
- scripts/fetchResults.ts
- scripts/normalizeResults.ts

要件：
- APIキーは環境変数で扱う
- APIレスポンスを内部形式に変換する
- public/data/results.json に出力できる
- 取得失敗時は既存results.jsonを壊さない
- manualOverrides.json がある場合はそちらを優先できるようにする

注意：
- リアルタイム速報は不要
- 1時間に1回程度の更新でよい
- スクレイピングは本命にしない
```

## 13.2 GitHub Actions自動更新

```txt
GitHub Actionsで試合結果を定期取得し、results.json を更新するワークフローを作成してください。

作成候補：
- .github/workflows/update-results.yml

要件：
- scheduleで定期実行する
- 手動実行 workflow_dispatch に対応する
- scripts/fetchResults.ts を実行する
- results.json に変更があればコミットする
- APIキーはGitHub Secretsから読む
- 取得失敗時は失敗ログを出し、既存データを壊さない

注意：
- 更新頻度は高すぎないようにする
- 無料APIの制限を考慮する
```

---

# 14. バグ修正依頼テンプレート

```txt
以下の問題を修正してください。

問題：
[ここに問題を書く]

期待する挙動：
[ここに期待する挙動を書く]

現状の挙動：
[ここに現状を書く]

関連ファイル：
[関連しそうなファイルを書く]

制約：
- 既存のデータ設計を大きく変えない
- 順位計算や3位通過ラインはAIに任せない
- 修正後、関連するテストも追加または更新する
- 不要なライブラリは追加しない
```

---

# 15. リファクタリング依頼テンプレート

```txt
以下の観点でリファクタリングしてください。

対象：
[対象ファイル/機能を書く]

目的：
- 可読性を上げる
- ロジックとUIを分離する
- テストしやすくする
- Codexが今後修正しやすい構成にする

制約：
- 表示仕様を変えない
- データスキーマを勝手に変えない
- 既存テストを通す
- 変更点を最後に要約する
```

---

# 16. テスト追加依頼テンプレート

```txt
以下のロジックに対してユニットテストを追加してください。

対象：
[standings / thirdPlaceRanking / matchImportance など]

テストしたい観点：
[箇条書きで書く]

制約：
- 実装仕様は docs/04_logic_spec.md に従う
- AIに順位計算をさせない
- ダミーデータで再現可能なテストにする
- テスト名は日本語でも英語でもよいが、内容がわかる名前にする
```

---

# 17. Codexへの共通注意事項

Codexに依頼するときは、毎回以下を守らせる。

```txt
共通注意事項：
- MVP優先で実装する
- 不要な機能を勝手に追加しない
- LINE通知、ログイン、課金、リアルタイム速報、自動X投稿は実装しない
- 順位計算、3位通過ライン、突破条件、トーナメント分岐はTypeScriptロジックで処理する
- AI生成文は表示用であり、計算結果の正本にはしない
- 公式ロゴ、公式画像、公式風デザインは使わない
- スクレイピングを本命にしない
- 変更後は、どのファイルを変更したか要約する
- 可能ならテストを追加する
```

---

# 18. 最初に実行する推奨プロンプト

最初にCodexへ投げるなら、以下を使う。

```txt
docs/00_project_overview.md、docs/01_requirements.md、docs/02_wbs.md、docs/03_data_schema.md、docs/04_logic_spec.md、docs/05_codex_prompts.md を読んでください。

このリポジトリで「今日見るべきW杯 - 観戦OS」のMVPを実装します。

まずは以下を実装してください。

1. Vite + React + TypeScript + Tailwind CSS の初期構成
2. public/data 配下のダミーJSON
3. JSONローダー
4. TypeScript型定義
5. Home画面
6. Schedule画面
7. Settings画面
8. localStorageによる推し国設定
9. グループ順位計算ロジック
10. 3位通過ライン計算ロジック

制約：
- スマホWebアプリとして見やすくする
- GitHub Pagesで静的公開できる構成にする
- 順位計算と3位通過ラインはTypeScriptで実装する
- AIに計算させない
- ログイン、課金、LINE通知、リアルタイム速報、自動X投稿は実装しない
- まずはダミーデータで動くMVPを優先する

実装後、変更したファイル一覧と、次に実装すべきタスクを要約してください。
```
