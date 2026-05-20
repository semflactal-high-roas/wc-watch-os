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
