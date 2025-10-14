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

## 記事作成ガイドライン

**記事作成の際は以下のドキュメントを参照**：
- **記事テンプレート**: `/Users/user/Documents/sasakiyoshimasa_article_template_codex.md`
  - 記事構成の基本フォーマット
  - 見出し・本文の書き方ルール
  - SEO最適化ガイドライン
  - 記事タイプ別テンプレート（4種類）

- **記事作成ガイド**: `ARTICLE_GUIDE.md`（プロジェクトルート）
  - Sanity CMSでの記事作成手順
  - 公開前チェックリスト
  - 品質基準・執筆ルール

**記事品質基準**：
- 文字数: 1500〜2500文字
- 見出し: H2を3〜5個使用
- 具体性: 数字・事例を含む
- SEO: タイトル30〜40文字、ディスクリプション120〜160文字

## 記事自動生成戦略

**詳細**: `docs/ARTICLE_GENERATION_STRATEGY.md` を参照

### 自動実行スケジュール

**1. メンテナンスチェック**
- **実行時刻**: 毎日 深夜2:00 (JST)
- **ワークフロー**: `.github/workflows/daily-maintenance.yml`
- **内容**: 全記事の品質チェック（必須フィールド、SEO、文字数など）

**2. 記事自動生成**
- **実行時刻**: 毎日 深夜3:00 (JST)
- **ワークフロー**: `.github/workflows/daily-draft.yml`
- **生成エンジン**: Gemini API
- **API キー**: GitHub Secrets (`GEMINI_API_KEY`) に設定済み

### キーワード戦略（黄金比）

**ショート1：ミドル3：ロング5**

| キーワードタイプ | 割合 | 記事数目安（150記事中） | 狙い |
|----------------|------|---------------------|------|
| ショートテール | 10-15% | 15〜20記事 | カテゴリ／ガイドページ |
| ミドルテール | 35-40% | 50〜60記事 | **主力トラフィック獲得** |
| ロングテール | 45-55% | 70〜80記事 | CVR・E-E-A-T強化 |

**現在の重点**: ミドルテールを積極的に拡充し、トピッククラスターを形成

## 最近の変更

1. 🎨 **フロントエンドデザイン完成** (2025-09-12)
   - Tailwind Next.js Starter Blogデザインの完全再現
   - 薄いグレー文字問題を根本解決
   - カスタムCSSを削除、Tailwind標準クラスのみ使用

2. 🔒 **UI変更永久禁止**
   - UI-DESIGN-LOCK.mdファイル追加
   - 今後はフロントエンドデザインの変更を完全禁止
   - 機能追加・コンテンツ改善のみ許可

3. ✅ **Google Search Console設定完了** (2025-09-15)
   - DNS TXT方式で所有権確認成功
   - 確認コード: google-site-verification=Xy7fDHrYsVObXVQeb0D3He2wEWQCSnlsClAJ_OYsioE
   - プロパティ: https://prorenata.jp

4. 🚨 **プレビューボタン重大インシデント対応完了** (2025-09-27)
   - Sanity Studio プレビューボタン機能が完全消失（重大インシデント）
   - 緊急復旧: `src/sanity/actions/PreviewAction.tsx` を再作成
   - `sanity.config.ts` の PreviewAction 設定を再構築
   - 今後の予防策をCLAUDE.mdに追記（削除・変更の完全禁止）

## ⚠️ 重要なルール

**🚫 UIデザイン変更の完全禁止**
- レイアウト、色、フォント、スタイルの変更は絶対禁止
- 詳細は `UI-DESIGN-LOCK.md` を参照
- 違反した場合は最重要事項の不遵守となる

**🚫 SEOフィールド設定の変更禁止**
- excerpt, metaDescription, tagsのみ使用（確定）
- metaTitle, focusKeyword, relatedKeywordsは削除済み（再追加禁止）
- 詳細は `SEO-FIELDS-LOCK.md` を参照
- ユーザーの明示的指示なしに変更した場合は最重要違反となる

**🚨 Google Analytics & Search Console コード改変の完全禁止**
- Google Analytics トラッキングコードの変更は絶対禁止
- Google Search Console 確認コードの変更は絶対禁止
- 測定ID: G-HV2JLW3DPB の変更・削除は厳禁
- DNS TXT確認レコードの削除・変更は厳禁
- 違反した場合は最重要事項の不遵守となる

**🚨 Sanity Studio プレビューボタン機能の完全保護**
- `src/sanity/actions/PreviewAction.tsx` ファイルの削除は絶対禁止
- `sanity.config.ts` の PreviewAction 設定の削除・変更は絶対禁止
- プレビューボタン機能は業務の根幹システムであり削除は重大インシデント
- 設定ファイル:
  - Import: `import { PreviewAction } from './src/sanity/actions/PreviewAction'`
  - Actions設定: `actions: (prev, context) => { if (context.schemaType === 'post') { return [...prev, PreviewAction] } return prev }`
- 違反した場合は最重要事項の不遵守となる
