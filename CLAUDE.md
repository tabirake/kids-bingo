# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Webブラウザで動作する子供向けビンゴゲームアプリケーション。数字の範囲を指定して、ランダムに数字を抽選する機能を提供。

## 開発コマンド

```bash
# 開発サーバー起動（ホットリロード有効）
npm run dev

# プロダクションビルド（TypeScriptコンパイル + Viteビルド）
npm run build

# ビルド結果のプレビュー
npm run preview

# リント実行（Oxlint使用）
npm run lint

# コードフォーマット（Oxfmt使用）
npm run format

# フォーマットチェック（CI用）
npm run format:check
```

## 技術構成

- **ビルドツール**: Vite (esbuild使用)
- **言語**: TypeScript (strict mode有効)
- **フレームワーク**: React 18
- **リンター**: Oxlint (OXC)
- **フォーマッター**: Oxfmt (OXC)

**注:** ビルドはViteの標準（esbuild）を使用。OXCはリントとフォーマットのみで使用。`vite-plugin-oxc`は実験的で不安定なため採用していない。

## アーキテクチャ

### コンポーネント構造

- `App.tsx` - メインコンポーネント。ゲームの状態管理とUI表示を担当
  - 初期画面: 数字の範囲設定（最小値・最大値）
  - ゲーム画面: 数字の抽選、履歴表示、終了ボタン

### 状態管理

React hooksを使用したシンプルな状態管理:
- `gameStarted` - ゲーム開始フラグ
- `minNumber` / `maxNumber` - 数字の範囲
- `currentNumber` - 現在表示中の数字
- `drawnNumbers` - 抽選済み数字の配列

### 重複防止ロジック

`drawNumber()` 関数で未抽選の数字のみを候補にする仕組み:
1. 範囲内のすべての数字を配列生成
2. 既に抽選済みの数字をフィルタリング
3. 残りからランダムに1つ選択

## ビルド出力

- `npm run build` で `dist/` に静的ファイルを生成
- 生成されたファイルは任意のWebサーバーで配信可能
- ブラウザ互換性を考慮したトランスパイル設定済み

## TODO / 未実装機能

- 数字抽選時の音の演出（`drawNumber()` 内の `// TODO: 音を再生する` コメント参照）
  - Web Audio API または HTMLAudioElement を使用して実装予定
  - 音声ファイルは `public/` ディレクトリに配置

## 開発時の注意点

- リント・フォーマットにOXCツール（Oxlint/Oxfmt）を使用。ESLint/Prettierは使用しない
- TypeScript strict mode有効 - 型エラーは必ず解決すること
- コードフォーマットは保存時に自動実行されない設定のため、コミット前に `npm run format` を実行
- ビルドはVite標準（esbuild）を使用。OXCのビルドプラグインは安定版がリリースされたら検討可能
