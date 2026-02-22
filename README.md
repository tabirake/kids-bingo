# キッズビンゴ

Webブラウザで動作する子供向けビンゴゲームアプリケーションです。

https://tabirake.github.io/kids-bingo/

## 機能

- 数字の範囲を自由に設定可能
- ランダムに数字を抽選
- 過去に出た数字の履歴表示
- 数字が出る際の音の演出（実装予定）
- レスポンシブデザイン対応

## 技術スタック

- **React** - UIフレームワーク
- **TypeScript** - 型安全な開発
- **Vite** - ビルドツール（esbuild使用）
- **Oxlint** - 高速リンター（OXC）
- **Oxfmt** - 高速フォーマッター（OXC）

## セットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# ビルド
npm run build

# ビルド結果のプレビュー
npm run preview
```

## 開発

```bash
# リント
npm run lint

# フォーマット
npm run format

# フォーマットチェック（CIなどで使用）
npm run format:check
```

## ビルド出力

`npm run build` を実行すると、`dist` ディレクトリに静的ファイルが生成されます。このファイルをWebサーバーにデプロイすることで、どのブラウザでも動作します。

## ライセンス

MIT
