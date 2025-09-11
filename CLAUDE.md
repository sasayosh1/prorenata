# Claude Code プロジェクト設定

## 開発コマンド

### 開発サーバー起動
```bash
npm run dev
```
ローカル開発サーバーを起動します（通常はhttp://localhost:3000）

### Sanity Studio起動
```bash
npx sanity dev --port 3333
```
SanityのCMSスタジオを起動します（http://localhost:3333）

### ビルド
```bash
npm run build
```
本番用ビルドを作成します

### 型チェック
```bash
npm run type-check
```
TypeScriptの型チェックを実行します

### リント
```bash
npm run lint
```
コードのリント（構文チェック）を実行します

## デプロイ

### Vercelデプロイ
```bash
vercel
```
Vercelに本番デプロイします

### プレビューデプロイ
```bash
vercel --previewe
```
プレビュー環境にデプロイします

## プロジェクト概要

- **サイト名**: ProReNata
- **用途**: 看護助手向け情報サイト
- **技術**: Next.js 15.5.2 + Sanity CMS + TypeScript
- **デザイン**: sasakiyoshimasa.comスタイルのミニマルデザイン
- **本番URL**: https://prorenata.jp

## 最近の変更

1. ヒーローセクションをシンプルな白背景に変更
2. カラーパレットをグレースケール+ブルーアクセントに統一
3. カードデザインをミニマルなボーダー付きに変更
4. 検索コンポーネントをシンプル化
5. 余計なアニメーションやテキストを削除