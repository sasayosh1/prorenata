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

1. 🎨 **フロントエンドデザイン完成** (2025-09-12)
   - Tailwind Next.js Starter Blogデザインの完全再現
   - 薄いグレー文字問題を根本解決
   - カスタムCSSを削除、Tailwind標準クラスのみ使用

2. 🔒 **UI変更永久禁止**
   - UI-DESIGN-LOCK.mdファイル追加
   - 今後はフロントエンドデザインの変更を完全禁止
   - 機能追加・コンテンツ改善のみ許可

## ⚠️ 重要なルール

**🚫 UIデザイン変更の完全禁止**
- レイアウト、色、フォント、スタイルの変更は絶対禁止
- 詳細は `UI-DESIGN-LOCK.md` を参照
- 違反した場合は最重要事項の不遵守となる