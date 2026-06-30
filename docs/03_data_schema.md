# データ設計

## 0. このファイルの目的

このファイルは、「今日見るべきW杯 - 観戦OS開発」で使用するJSONデータの設計を定義する。

初期MVPでは、バックエンドやDBは使わず、`public/data` 配下のJSONファイルを読み込んでアプリを動かす。

順位計算、3位通過ライン、試合重要度判定はTypeScriptロジックで処理する。  
AIは見る理由、解説文、X投稿文などの生成に使う。

---

# 1. データ管理方針

## 1.1 基本方針

- データはJSONファイルで管理する
- アプリは `public/data/*.json` を読み込む
- ユーザーの推し国設定は `localStorage` に保存する
- 試合結果は無料APIから取得する
- API不調時は `manualOverrides.json` で補正する
- 順位や3位通過ラインは保存せず、アプリ側で計算する
- AI生成文は表示用の補助情報として扱い、計算結果の正本にはしない

## 1.2 ディレクトリ構成

```txt
/public
  /data
    teams.json
    groups.json
    matches.json
    results.json
    insights.json
    manualOverrides.json
    config.json
```

## 1.3 データの役割

| ファイル | 役割 |
|---|---|
| `teams.json` | チーム情報を管理する |
| `groups.json` | グループ構成を管理する |
| `matches.json` | 試合日程を管理する |
| `results.json` | 試合結果を管理する |
| `insights.json` | 試合ごとの重要度・見る理由・Xコピーを管理する |
| `manualOverrides.json` | API不調時の手動補正を管理する |
| `config.json` | アプリ全体の設定値を管理する |

---

# 2. teams.json

## 2.1 目的

出場チームの基本情報を管理する。

## 2.2 スキーマ例

```json
[
  {
    "id": "jpn",
    "nameJa": "日本",
    "nameEn": "Japan",
    "fifaCode": "JPN",
    "group": "F",
    "flagEmoji": "🇯🇵",
    "region": "AFC",
    "seedType": "default"
  }
]
```

## 2.3 フィールド定義

| フィールド | 型 | 必須 | 説明 |
|---|---|---:|---|
| `id` | string | 必須 | アプリ内で使う一意ID |
| `nameJa` | string | 必須 | 日本語名 |
| `nameEn` | string | 必須 | 英語名 |
| `fifaCode` | string | 任意 | 3文字コード |
| `group` | string | 必須 | 所属グループ |
| `flagEmoji` | string | 任意 | 国旗絵文字 |
| `region` | string | 任意 | 所属地域 |
| `seedType` | string | 任意 | シード・強豪判定などに使う補助情報 |

## 2.4 注意点

- `id` は小文字3文字を基本とする
- アプリ内部では `nameJa` ではなく `id` で参照する
- グループ確定前や未確定チームがある場合は `tbd_xxx` のようなIDを使う
- 公式ロゴや公式エンブレムは使わない

---

# 3. groups.json

## 3.1 目的

各グループの構成を管理する。

## 3.2 スキーマ例

```json
[
  {
    "id": "F",
    "name": "グループF",
    "teamIds": ["ned", "jpn", "tun", "swe"]
  }
]
```

## 3.3 フィールド定義

| フィールド | 型 | 必須 | 説明 |
|---|---|---:|---|
| `id` | string | 必須 | グループID |
| `name` | string | 必須 | 表示名 |
| `teamIds` | string[] | 必須 | 所属チームIDの配列 |

## 3.4 注意点

- `teamIds` は `teams.json` の `id` と一致させる
- グループ順位計算では、この `teamIds` を基準に対象チームを抽出する
- 1グループ4チームを前提にする

---

# 4. matches.json

## 4.1 目的

全試合の日程・対戦カード・ステージ情報を管理する。

## 4.2 スキーマ例

```json
[
  {
    "id": "match_001",
    "stage": "group",
    "group": "F",
    "homeTeamId": "jpn",
    "awayTeamId": "ned",
    "kickoffJst": "2026-06-15T05:00:00+09:00",
    "kickoffLocal": "2026-06-14T13:00:00-07:00",
    "venue": "TBD",
    "city": "TBD",
    "status": "scheduled",
    "sourceMatchId": "api_12345"
  }
]
```

## 4.3 フィールド定義

| フィールド | 型 | 必須 | 説明 |
|---|---|---:|---|
| `id` | string | 必須 | アプリ内の試合ID |
| `stage` | string | 必須 | `group` / `round32` / `round16` / `quarterfinal` / `semifinal` / `final` など |
| `group` | string/null | 任意 | グループステージの場合のグループID |
| `homeTeamId` | string | 必須 | ホーム扱いのチームID |
| `awayTeamId` | string | 必須 | アウェイ扱いのチームID |
| `kickoffJst` | string | 必須 | 日本時間のキックオフ時刻 |
| `kickoffLocal` | string | 任意 | 現地時間 |
| `venue` | string | 任意 | 会場名 |
| `city` | string | 任意 | 都市名 |
| `status` | string | 必須 | `scheduled` / `finished` / `postponed` / `cancelled` / `tbd` |
| `sourceMatchId` | string | 任意 | 外部API側の試合ID |

MVP実装では、日程と手動反映済み結果を `public/data/matches.json` の同一レコードで管理する。結果系フィールドは以下。

| フィールド | 型 | 必須 | 説明 |
|---|---|---:|---|
| `homeScore` | number/null | 必須 | ホーム扱いチームの得点。未消化は `null` |
| `awayScore` | number/null | 必須 | アウェイ扱いチームの得点。未消化は `null` |
| `played` | boolean | 必須 | 試合終了済みなら `true` |
| `homePenaltyScore` | number | 任意 | PK戦がある場合のホーム扱いチームのPK得点 |
| `awayPenaltyScore` | number | 任意 | PK戦がある場合のアウェイ扱いチームのPK得点 |
| `winnerTeamId` | string | 任意 | ノックアウト戦で同点後PKなどにより勝者を明示するチームID |
| `decidedBy` | string | 任意 | `regular` / `extra_time` / `penalties`。PK決着では `penalties` |

## 4.4 注意点

- `kickoffJst` は必ず日本時間で保存する
- 表示時にタイムゾーン変換しないで済むようにする
- API連携する場合は `sourceMatchId` を使って照合する
- 決勝トーナメントで対戦相手未定の場合は `homeTeamId` / `awayTeamId` に `tbd_xxx` を入れる
- 日程変更があった場合は `matches.json` を更新する
- PK決着の試合だけ `homePenaltyScore` / `awayPenaltyScore` / `winnerTeamId` / `decidedBy: "penalties"` を追加する
- PKのない試合へ不要なPKフィールドを追加しない

---

# 5. results.json

## 5.1 目的

試合結果を管理する。

## 5.2 スキーマ例

```json
[
  {
    "matchId": "match_001",
    "homeScore": 2,
    "awayScore": 1,
    "status": "finished",
    "source": "api",
    "updatedAt": "2026-06-15T07:10:00+09:00"
  }
]
```

## 5.3 フィールド定義

| フィールド | 型 | 必須 | 説明 |
|---|---|---:|---|
| `matchId` | string | 必須 | `matches.json` の `id` |
| `homeScore` | number/null | 必須 | ホーム扱いチームの得点 |
| `awayScore` | number/null | 必須 | アウェイ扱いチームの得点 |
| `status` | string | 必須 | `scheduled` / `live` / `finished` / `postponed` |
| `source` | string | 必須 | `api` / `manual` / `override` |
| `updatedAt` | string | 必須 | 最終更新日時 |

## 5.4 注意点

- MVPではライブスコアは扱わない
- `status: finished` の試合のみ順位計算に反映する
- `live` は表示してもよいが、順位計算には使わない
- `manualOverrides.json` がある場合は、そちらを優先する
- 試合結果の正誤判定をAIに任せない

---

# 6. insights.json

## 6.1 目的

試合ごとの重要度、見る理由、Xコピーなど、AI生成または編集済みの解説情報を管理する。

## 6.2 スキーマ例

```json
[
  {
    "matchId": "match_001",
    "importance": "S",
    "sleepScore": 95,
    "reasonJa": "日本の突破条件に直結する初戦。勝てば2位以内に大きく近づく。",
    "impactJa": "日本が勝てばグループ突破に大きく前進。引き分け以下の場合は3位通過ラインも意識する展開になる。",
    "xCopy": "日本の初戦はただの初戦ではなく、3位通過ラインに回るかどうかを左右する試合。寝不足価値は高い。",
    "tags": ["日本戦", "突破条件", "重要度S"]
  }
]
```

## 6.3 フィールド定義

| フィールド | 型 | 必須 | 説明 |
|---|---|---:|---|
| `matchId` | string | 必須 | `matches.json` の `id` |
| `importance` | string | 必須 | `S` / `A` / `B` / `C` |
| `sleepScore` | number | 必須 | 0〜100の寝不足価値 |
| `reasonJa` | string | 必須 | 見る理由の短文 |
| `impactJa` | string | 任意 | 勝敗が与える意味 |
| `xCopy` | string | 任意 | X投稿用コピー |
| `tags` | string[] | 任意 | 表示・検索補助タグ |

## 6.4 注意点

- `importance` はロジック側でも算出できるが、編集上書きできるようにする
- `reasonJa` は短く、スマホで読める長さにする
- AI生成文は事実確認済みのデータをもとに作る
- 勝ち抜け条件などの計算結果はAIの文章を正本にしない
- 初期MVPでは、ダミーデータでもよい

---

# 7. manualOverrides.json

## 7.1 目的

無料APIの遅延・誤反映・取得失敗に備え、手動補正データを管理する。

## 7.2 スキーマ例

```json
[
  {
    "matchId": "match_001",
    "homeScore": 2,
    "awayScore": 1,
    "status": "finished",
    "note": "API反映遅延のため手動補正",
    "updatedAt": "2026-06-15T07:30:00+09:00"
  }
]
```

## 7.3 フィールド定義

| フィールド | 型 | 必須 | 説明 |
|---|---|---:|---|
| `matchId` | string | 必須 | 補正対象の試合ID |
| `homeScore` | number/null | 必須 | 補正後ホーム得点 |
| `awayScore` | number/null | 必須 | 補正後アウェイ得点 |
| `status` | string | 必須 | 補正後ステータス |
| `note` | string | 任意 | 補正理由 |
| `updatedAt` | string | 必須 | 補正日時 |

## 7.4 優先順位

結果データは以下の順で優先する。

```txt
manualOverrides.json
↓
results.json
↓
matches.json の status
```

---

# 8. config.json

## 8.1 目的

アプリ全体の設定値を管理する。

## 8.2 スキーマ例

```json
{
  "defaultMainTeamId": "jpn",
  "maxMainTeams": 1,
  "maxSubTeams": 3,
  "maxLightFollowTeams": 5,
  "thirdPlaceQualifyCount": 8,
  "importanceLevels": ["S", "A", "B", "C"],
  "timezone": "Asia/Tokyo"
}
```

## 8.3 フィールド定義

| フィールド | 型 | 説明 |
|---|---|---|
| `defaultMainTeamId` | string | 初期設定するチームID |
| `maxMainTeams` | number | メイン推し国の最大数 |
| `maxSubTeams` | number | サブ推し国の最大数 |
| `maxLightFollowTeams` | number | ゆる追い国の最大数 |
| `thirdPlaceQualifyCount` | number | 3位通過チーム数 |
| `importanceLevels` | string[] | 重要度ラベル |
| `timezone` | string | 基準タイムゾーン |

---

# 9. localStorage

## 9.1 目的

ログインなしでユーザーごとの推し国設定を保存する。

## 9.2 キー名

```txt
wc-watch-os:userPreferences
```

## 9.3 スキーマ例

```json
{
  "mainTeamId": "jpn",
  "subTeamIds": ["arg", "fra", "bra"],
  "lightFollowTeamIds": ["cro", "mar"],
  "displayMode": "standard"
}
```

## 9.4 フィールド定義

| フィールド | 型 | 説明 |
|---|---|---|
| `mainTeamId` | string | メイン推し国 |
| `subTeamIds` | string[] | サブ推し国 |
| `lightFollowTeamIds` | string[] | ゆる追い国 |
| `displayMode` | string | `hardcore` / `standard` / `light` / `morning` |

## 9.5 注意点

- ログインは使わない
- 端末・ブラウザごとの保存でよい
- 設定が壊れた場合は初期値に戻す
- 日本代表を初期設定にする

---

# 10. 派生データ

以下はJSONとして保存せず、TypeScriptロジックで計算する。

## 10.1 groupStandings

- 試合数
- 勝
- 分
- 敗
- 勝点
- 得点
- 失点
- 得失点差
- 暫定順位
- 状態ラベル

## 10.2 thirdPlaceRanking

- 各グループ3位
- 勝点順
- 得失点差順
- 総得点順
- 上位8チームの通過圏判定

## 10.3 matchImportance

- 重要度S/A/B/C
- 推し国との関係
- 3位通過ラインへの影響
- 寝不足価値スコア

## 10.4 tournamentPath

- 推し国の想定ルート
- 1位通過時の相手
- 2位通過時の相手
- 3位通過時の条件分岐

---

# 11. データ更新フロー

## 11.1 通常時

```txt
無料スポーツデータAPI
↓
scripts/fetchResults.ts
↓
scripts/normalizeResults.ts
↓
public/data/results.json
↓
アプリ側で順位・3位通過ラインを再計算
```

## 11.2 API不調時

```txt
manualOverrides.json を編集
↓
manualOverrides を優先して結果反映
↓
アプリ側で順位・3位通過ラインを再計算
```

## 11.3 解説文更新

```txt
試合データ・順位データを確認
↓
ChatGPT / Grok で見る理由・Xコピーを生成
↓
insights.json に保存
↓
アプリに表示
```

---

# 12. バリデーション方針

## 12.1 teams.json

- `id` が重複していない
- `group` が存在する
- `nameJa` が空でない

## 12.2 groups.json

- `teamIds` が `teams.json` に存在する
- 1グループのチーム数が想定と合っている

## 12.3 matches.json

- `id` が重複していない
- `homeTeamId` / `awayTeamId` が `teams.json` に存在する
- `kickoffJst` がISO形式である
- `stage` が許可値である
- PK決着では `homePenaltyScore` / `awayPenaltyScore` / `winnerTeamId` / `decidedBy` が整合している

## 12.4 results.json

- `matchId` が `matches.json` に存在する
- `homeScore` / `awayScore` が数値またはnullである
- `status` が許可値である
- `finished` の場合、スコアがnullではない

## 12.5 insights.json

- `matchId` が `matches.json` に存在する
- `importance` が `S/A/B/C` のいずれかである
- `sleepScore` が0〜100である
- `reasonJa` が空でない

---

# 13. 注意事項

- 順位表や3位通過ラインは保存データではなく計算結果として扱う
- AI生成文を計算結果の正本にしない
- 試合結果の正誤判定をAIに任せない
- APIデータと手動補正データが衝突した場合は手動補正を優先する
- 日時は日本時間を正として扱う
- スクレイピングは本命にしない
- 公式ロゴ・公式素材・公式風デザインは使わない
