# ロジック仕様

## 0. このファイルの目的

このファイルは、「今日見るべきW杯 - 観戦OS開発」で使用する主要ロジックの仕様を定義する。

対象ロジックは以下。

- グループ順位計算
- 3位通過ライン計算
- 試合重要度判定
- 寝不足価値スコア
- 推し国との関係判定
- トーナメント分岐
- ICS出力対象判定
- X共有カード対象判定

重要な方針として、順位計算・3位通過ライン・突破条件・トーナメント分岐はAIに任せない。  
TypeScriptロジックで決定論的に処理する。

AIは、見る理由・解説文・X投稿文・UI文言の生成にのみ使う。

---

# 1. 基本方針

## 1.1 AIに任せない処理

以下は必ずTypeScriptロジックで処理する。

- 勝点計算
- 得失点計算
- 総得点計算
- グループ順位判定
- 3位チームランキング
- 上位8チームの3位通過圏判定
- 試合重要度の基本判定
- トーナメント分岐
- ICS出力対象判定
- Xカード対象判定

## 1.2 AIに任せる処理

以下はAI生成または手動編集してよい。

- 試合の見る理由
- 勝敗別の意味の説明
- 過去対戦・因縁の整理
- 試合前コメント
- 試合後コメント
- X投稿文案
- 共有カードのコピー
- UI文言改善

## 1.3 表示上の注意

未確定の条件は、断定しない。

悪い例：

```txt
日本は次戦引き分けで突破です
```

良い例：

```txt
日本は次戦引き分けで突破圏に近づきます。ただし他グループ3位の結果次第です。
```

MVPでは、複雑な条件は無理に断定せず、以下のように表示する。

```txt
条件分岐あり
他グループ結果待ち
未確定
詳細条件は試合終了後に更新
```

---

# 2. 型定義

## 2.1 Team

```ts
export type Team = {
  id: string;
  nameJa: string;
  nameEn: string;
  fifaCode?: string;
  group: string;
  flagEmoji?: string;
  region?: string;
  seedType?: string;
};
```

## 2.2 Match

```ts
export type MatchStage =
  | "group"
  | "round32"
  | "round16"
  | "quarterfinal"
  | "semifinal"
  | "thirdPlace"
  | "final";

export type MatchStatus =
  | "scheduled"
  | "live"
  | "finished"
  | "postponed"
  | "cancelled"
  | "tbd";

export type Match = {
  id: string;
  stage: MatchStage;
  group?: string | null;
  homeTeamId: string;
  awayTeamId: string;
  kickoffJst: string;
  kickoffLocal?: string;
  venue?: string;
  city?: string;
  status: MatchStatus;
  sourceMatchId?: string;
};
```

MVP実装では `public/data/matches.json` の `Match` に手動反映済み結果も持たせる。

```ts
export type MatchDecision =
  | "regular"
  | "extra_time"
  | "penalties";

export type MatchResultFields = {
  homeScore: number | null;
  awayScore: number | null;
  played: boolean;
  homePenaltyScore?: number;
  awayPenaltyScore?: number;
  winnerTeamId?: string;
  decidedBy?: MatchDecision;
};
```

PK決着では `homeScore` / `awayScore` は試合スコアの同点を保持し、PKスコアと `winnerTeamId` で勝者を決定論的に表現する。

## 2.3 Result

```ts
export type ResultStatus =
  | "scheduled"
  | "live"
  | "finished"
  | "postponed";

export type Result = {
  matchId: string;
  homeScore: number | null;
  awayScore: number | null;
  status: ResultStatus;
  source: "api" | "manual" | "override";
  updatedAt: string;
};
```

## 2.4 StandingRow

```ts
export type StandingRow = {
  teamId: string;
  group: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  rank: number;
  status: QualificationStatus;
};
```

## 2.5 QualificationStatus

```ts
export type QualificationStatus =
  | "qualified"
  | "in_qualifying_zone"
  | "third_place_zone"
  | "waiting_other_groups"
  | "at_risk"
  | "eliminated"
  | "undetermined";
```

## 2.6 Importance

```ts
export type Importance = "S" | "A" | "B" | "C";
```

## 2.7 UserPreferences

```ts
export type DisplayMode =
  | "hardcore"
  | "standard"
  | "light"
  | "morning";

export type UserPreferences = {
  mainTeamId: string;
  subTeamIds: string[];
  lightFollowTeamIds: string[];
  displayMode: DisplayMode;
};
```

---

# 3. グループ順位計算

## 3.1 対象ファイル

実装ファイル：

```txt
src/logic/standings.ts
```

テストファイル：

```txt
src/logic/standings.test.ts
```

## 3.2 入力

```ts
calculateGroupStandings(
  teams: Team[],
  matches: Match[],
  results: Result[]
): Record<string, StandingRow[]>
```

## 3.3 出力

グループIDごとに順位表を返す。

```ts
{
  F: [
    {
      teamId: "jpn",
      group: "F",
      played: 3,
      won: 2,
      drawn: 0,
      lost: 1,
      points: 6,
      goalsFor: 5,
      goalsAgainst: 2,
      goalDifference: 3,
      rank: 1,
      status: "in_qualifying_zone"
    }
  ]
}
```

## 3.4 勝点ルール

- 勝利：3点
- 引き分け：1点
- 敗北：0点

## 3.5 計算対象

順位計算に反映するのは、以下の条件を満たす試合のみ。

- `stage === "group"`
- `result.status === "finished"`
- `homeScore` と `awayScore` が `null` ではない

`live` や `scheduled` の試合は順位計算に反映しない。

## 3.6 集計項目

各チームについて以下を集計する。

- played：試合数
- won：勝利数
- drawn：引き分け数
- lost：敗戦数
- points：勝点
- goalsFor：得点
- goalsAgainst：失点
- goalDifference：得失点差

## 3.7 並び順

MVPでは以下の順でソートする。

1. 勝点
2. 得失点差
3. 総得点
4. チームID

```ts
sort((a, b) => {
  if (b.points !== a.points) return b.points - a.points;
  if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
  if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
  return a.teamId.localeCompare(b.teamId);
});
```

## 3.8 注意点

正式な大会ルールでは、上記以外のタイブレーク条件が存在する可能性がある。  
MVPでは勝点・得失点差・総得点までを実装し、詳細な当該チーム間成績やフェアプレーポイント等は後続実装とする。

表示上は、タイブレーク未完全対応の場合に以下の注記を入れる。

```txt
同勝点チームの詳細順位は公式発表と異なる可能性があります。
```

後続で公式ルールに合わせてタイブレークを拡張する。

---

# 4. 3位通過ライン計算

## 4.1 対象ファイル

実装ファイル：

```txt
src/logic/thirdPlaceRanking.ts
```

テストファイル：

```txt
src/logic/thirdPlaceRanking.test.ts
```

## 4.2 入力

```ts
calculateThirdPlaceRanking(
  standingsByGroup: Record<string, StandingRow[]>,
  qualifyCount: number
): ThirdPlaceRow[]
```

## 4.3 出力

```ts
export type ThirdPlaceRow = {
  rank: number;
  teamId: string;
  group: string;
  points: number;
  goalDifference: number;
  goalsFor: number;
  played: number;
  isInQualifyingZone: boolean;
  isBorderline: boolean;
};
```

## 4.4 計算手順

1. 各グループの順位表から3位チームを抽出する
2. 抽出した3位チームを以下の順でソートする
   - 勝点
   - 得失点差
   - 総得点
   - チームID
3. 上位8チームを通過圏として扱う
4. 8位をボーダーとして強調する
5. 9位を圏外先頭として強調する

## 4.5 状態表示

| 条件 | 表示 |
|---|---|
| 1〜7位 | 通過圏 |
| 8位 | ボーダー |
| 9位 | 圏外先頭 |
| 10〜12位 | 圏外 |

## 4.6 推し国との関係

ユーザーの推し国が3位ランキングに入っている場合は強調表示する。

```ts
isUserTeamThirdPlace = userTeamIds.includes(row.teamId)
```

## 4.7 注意点

グループによって消化試合数が異なる期間は、比較に注意が必要。  
表示上は以下のように補足する。

```txt
消化試合数が異なるため、暫定順位です。
```

---

# 5. 試合重要度判定

## 5.1 対象ファイル

実装ファイル：

```txt
src/logic/matchImportance.ts
```

テストファイル：

```txt
src/logic/matchImportance.test.ts
```

## 5.2 入力

```ts
calculateMatchImportance({
  match,
  userPreferences,
  standingsByGroup,
  thirdPlaceRanking,
  insights
}): MatchImportanceResult
```

## 5.3 出力

```ts
export type MatchImportanceResult = {
  importance: Importance;
  sleepScore: number;
  relationTypes: RelationType[];
  reasonCode: string[];
};
```

## 5.4 RelationType

```ts
export type RelationType =
  | "main_team_match"
  | "sub_team_match"
  | "light_follow_team_match"
  | "same_group_as_main_team"
  | "same_group_as_sub_team"
  | "third_place_relevant"
  | "knockout_path_relevant"
  | "high_profile_match"
  | "no_direct_relation";
```

## 5.5 重要度の基本定義

### S：寝不足してでも見る価値あり

条件例：

- メイン推し国の試合
- 日本代表の試合
- メイン推し国の次ラウンド進出に直結するノックアウト戦
- 敗れれば大会終了の一発勝負
- 決勝トーナメントの次戦相手が決まる試合

### A：結果は必ず追うべき

条件例：

- サブ推し国の試合
- メイン推し国と同じブロックの勝ち上がりに関係する試合
- サブ推し国と同じブロックの勝ち上がりに関係する試合
- 勝者枠が次ラウンドのカードを決める試合
- 強豪国同士など大会全体の注目カード

### B：ハイライトで十分

条件例：

- ゆる追い国の試合
- 推し国への直接影響は薄いが、話題性がある試合
- 同じ側のトーナメント表を追ううえで参考になる試合

### C：寝ていい

条件例：

- 推し国・日本・次ラウンドの組み合わせへの影響が薄い
- 話題性が低い
- 深夜・早朝に起きる理由が弱い

## 5.6 MVP判定ルール

初期MVPでは、以下の順で判定する。

```ts
if (isMainTeamMatch) return "S";
if (isSubTeamMatch) return "A";
if (isSameGroupAsMainTeam) return "A";
if (isThirdPlaceRelevant) return "A";
if (isLightFollowTeamMatch) return "B";
if (isHighProfileMatch) return "B";
return "C";
```

## 5.7 insights.json による上書き

`insights.json` に `importance` が設定されている場合、ロジック算出値を上書きできる。

優先順位：

```txt
insights.json の importance
↓
matchImportance.ts のロジック算出
```

ただし、将来的には「ロジック値」と「編集値」を分けて表示できるようにする。

---

# 6. 寝不足価値スコア

## 6.1 対象ファイル

実装ファイル：

```txt
src/logic/matchImportance.ts
```

## 6.2 出力

0〜100の数値で返す。

```ts
sleepScore: number
```

## 6.3 スコア基準

| スコア | 表示 |
|---:|---|
| 90〜100 | 起きる価値あり |
| 70〜89 | 迷うなら見る |
| 40〜69 | 結果確認でよい |
| 0〜39 | 寝てよい |

## 6.4 初期スコア計算

MVPでは以下の加点方式で計算する。

```ts
let score = 0;

if (importance === "S") score += 70;
if (importance === "A") score += 50;
if (importance === "B") score += 30;
if (importance === "C") score += 10;

if (isMainTeamMatch) score += 20;
if (isSubTeamMatch) score += 10;
if (isSameGroupAsMainTeam) score += 10;
if (isThirdPlaceRelevant) score += 15;
if (isHighProfileMatch) score += 10;

return Math.min(score, 100);
```

## 6.5 日本時間による補正

深夜・早朝の試合は、重要度が低い場合に減点してもよい。

```ts
if (kickoffHourJst >= 0 && kickoffHourJst <= 5 && importance === "C") {
  score -= 10;
}
```

ただし、メイン推し国の試合は深夜でも大きく減点しない。

---

# 7. 推し国との関係判定

## 7.1 対象ファイル

実装ファイル：

```txt
src/logic/userPreferences.ts
src/logic/matchImportance.ts
```

## 7.2 userTeamIds

ユーザーが関心を持つチームID一覧を返す。

```ts
const userTeamIds = [
  userPreferences.mainTeamId,
  ...userPreferences.subTeamIds,
  ...userPreferences.lightFollowTeamIds
];
```

## 7.3 判定関数

```ts
isTeamInMatch(match: Match, teamId: string): boolean
```

```ts
isMainTeamMatch(match: Match, preferences: UserPreferences): boolean
```

```ts
isSubTeamMatch(match: Match, preferences: UserPreferences): boolean
```

```ts
isLightFollowTeamMatch(match: Match, preferences: UserPreferences): boolean
```

```ts
isSameGroupAsTeam(match: Match, teamId: string, teams: Team[]): boolean
```

## 7.4 表示ラベル

| 条件 | 表示 |
|---|---|
| メイン推し国の試合 | 推し国の試合 |
| 日本代表の試合 | 日本戦 |
| サブ推し国の試合 | サブ推し国 |
| 同じブロックの試合 | 同じブロック |
| 次ラウンド相手決定 | 勝者枠が確定 |
| 関係なし | 関係薄め |

---

# 8. トーナメント分岐

## 8.1 対象ファイル

実装ファイル：

```txt
src/logic/tournamentPath.ts
```

## 8.2 基本方針

グループリーグ終了後は、確定したR32カードをFIXトーナメント表として表示する。
R16以降の未消化カードは、存在しないTBDチームを追加せず、前ラウンドの勝者枠・敗者枠として接続する。
勝敗予想や勝ち上がり断定は行わない。

表示するもの：

- FIX済みR32カード
- 終了済みノックアウト試合の結果
- 結果確定済みカードから次ラウンドへの勝者反映
- R16以降の勝者枠・敗者枠
- Group F 1位など、出場枠やシード由来の補足

## 8.3 表示例

```txt
R32-01 South Africa 0-1 Canada
R16-01 Canada vs Netherlands vs Morocco の勝者
QF-01 R16-02の勝者 vs R16-01の勝者
```

## 8.4 未消化カード表示

未消化試合の勝者を無理に断定しない。

```txt
未消化の試合は前ラウンドの勝者枠として表示しています。
勝敗予想ではありません。
```

## 8.5 後続実装

R16以降の結果が確定したら、以下を追加する。

- 該当試合の `played` / score
- 次ラウンドの勝者枠への反映
- 必要に応じた表示文言の更新

## 8.6 決勝トーナメント表

- FIX済みR32は実チームIDで `matches.json` に持つ。
- R16以降は前ラウンドの勝者枠・敗者枠を接続し、未消化試合の勝者や勝ち上がりを予想しない。
- 終了済みノックアウト試合はscore、またはPK決着時の `winnerTeamId` / penalty score から勝者を決定論的に解決し、次ラウンドの該当枠へ表示する。
- PK決着の表示は通常スコアを残したうえで `1-1 (PK 3-4)` のようにPKスコアを併記する。
- メイン推し国がR32または勝者枠候補に含まれる場合、そのカードからFinal/3位決定戦まで接続する枠を強調できる情報を返す。
- スマホ表示ではR32〜準々決勝をブロックA〜Dに分け、各ブロックを縦型アコーディオンで表示する。
- ブロックA/Bは準決勝1、ブロックC/Dは準決勝2へ接続し、準決勝・決勝は勝者枠として表示する。
- 3位決定戦は準決勝の敗者枠として表示する。

---

# 9. ICS出力対象判定

## 9.1 対象ファイル

実装ファイル：

```txt
src/logic/icsGenerator.ts
```

## 9.2 出力対象

ユーザーは以下のICSを出力できる。

- 全試合
- 日本戦
- メイン推し国
- サブ推し国
- 重要度S/A
- 今日見るべき試合

## 9.3 判定関数

```ts
shouldIncludeInCalendar(
  match: Match,
  preferences: UserPreferences,
  importance: Importance,
  calendarType: CalendarType
): boolean
```

## 9.4 CalendarType

```ts
export type CalendarType =
  | "all"
  | "mainTeam"
  | "subTeams"
  | "important"
  | "today";
```

## 9.5 ルール

| calendarType | 対象 |
|---|---|
| `all` | 全試合 |
| `mainTeam` | メイン推し国の試合 |
| `subTeams` | サブ推し国の試合 |
| `important` | 重要度S/A |
| `today` | 今日の試合 |

---

# 10. X共有カード対象判定

## 10.1 対象ファイル

実装ファイル：

```txt
src/logic/shareCard.ts
```

## 10.2 カード種類

```ts
export type ShareCardType =
  | "todayMatches"
  | "teamCondition"
  | "thirdPlaceLine"
  | "sleepRisk"
  | "nextMatch";
```

## 10.3 カード生成対象

| カード | 内容 |
|---|---|
| `todayMatches` | 今日見るべき試合 |
| `teamCondition` | 推し国の突破条件 |
| `thirdPlaceLine` | 3位通過ライン |
| `sleepRisk` | 寝不足危険度 |
| `nextMatch` | 推し国の次戦 |

## 10.4 注意点

- MVPではPNG生成のみ
- Xへの自動投稿はしない
- 投稿文はテキストコピーでよい
- 公式ロゴや公式素材は使わない

---

# 11. テスト方針

## 11.1 必須テスト

以下は必ずテストする。

- 勝利時に勝点3が加算される
- 引き分け時に両チームへ勝点1が加算される
- 得失点差が正しく計算される
- グループ順位が勝点順に並ぶ
- 同勝点の場合、得失点差で並ぶ
- 同得失点差の場合、総得点で並ぶ
- 各グループ3位が抽出される
- 3位ランキング上位8チームが通過圏になる
- メイン推し国の試合が重要度Sになる
- サブ推し国の試合が重要度Aになる
- 推し国と同組の他国試合が重要度Aになる
- 重要度S/AがICS重要試合に含まれる

## 11.2 ダミー大会シナリオ

ダミーデータで以下を検証する。

- 全チーム0試合時
- 1試合消化時
- 2試合消化時
- グループ最終節前
- 全グループ終了後
- 3位通過ボーダーが勝点で分かれるケース
- 3位通過ボーダーが得失点差で分かれるケース
- 推し国が3位になったケース
- 推し国が敗退したケース

## 11.3 未確定条件のテスト

未確定条件は断定表示しない。

例：

```txt
未確定
条件分岐あり
他グループ結果待ち
```

---

# 12. 実装優先順位

## 12.1 MVPで必ず実装

- グループ順位計算
- 3位通過ライン計算
- 推し国との関係判定
- 試合重要度S/A/B/C
- 寝不足価値スコア
- ICS出力対象判定
- Xカード対象判定

## 12.2 後続で実装

- 詳細タイブレーク
- 正式トーナメント分岐
- 複雑な突破条件の自然文生成
- API取得データとの照合ロジック
- 過去対戦・因縁スコア

---

# 13. 注意事項

- AIに順位計算をさせない
- AIに突破条件の最終判定をさせない
- AI生成文は表示用であり、計算結果の正本ではない
- 公式ルール未対応の箇所は未確定と明示する
- 複雑な条件は無理に断定しない
- スクレイピングは本命にしない
- 公式ロゴ・公式素材・公式風デザインは使わない
- MVPでは完成と運用可能性を優先する
