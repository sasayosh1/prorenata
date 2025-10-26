# Claude Code プロジェクト設定

## ⚠️ Claude Codeへの重要な指示

### 「全部保存」コマンドの動作

ユーザーが「全部保存」と指示した時は、以下の手順を**必ず実行**すること：

1. **コード変更をgitコミット＆プッシュ**
   ```bash
   git add -A
   git commit -m "適切なコミットメッセージ"
   git push
   ```

2. **CLAUDE.mdの更新**
   - 「## 最近の変更」セクションに新しいエントリーを追加
   - 日付、変更内容、目的、効果を記録
   - 番号付きリストで整理（例: 5. 💰 **タイトル** (YYYY-MM-DD)）

3. **該当する場合は関連ドキュメントも更新**
   - 自動実行スケジュールの変更 → 該当セクションを更新
   - 重要なルール追加 → 「⚠️ 重要なルール」セクションに追加
   - コマンド変更 → 「開発コマンド」セクションを更新

4. **更新したドキュメントもコミット＆プッシュ**
   ```bash
   git add CLAUDE.md (その他のドキュメント)
   git commit -m "ドキュメント更新"
   git push
   ```

**重要**: ユーザーが明示的に「全部保存」と言った場合、上記の手順をすべて実行し、「✅ すべて保存完了」と報告すること。

---

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

**1. 記事自動生成**
- **実行時刻**: 毎週 月・水・金 深夜2:00 (JST)
- **実行頻度**: 週3回（月12-13回）
- **ワークフロー**: `.github/workflows/daily-draft.yml`
- **生成エンジン**: Gemini API (gemini-2.5-flash)
- **API キー**: GitHub Secrets (`GEMINI_API_KEY`) に設定済み

**2. メンテナンスチェック**
- **実行時刻**: 毎週 月・水・金 深夜3:00 (JST)
- **実行頻度**: 週3回（月12-13回）
- **ワークフロー**: `.github/workflows/daily-maintenance.yml`
- **内容**: 全記事の品質チェック（必須フィールド、SEO、文字数など）

**3. X自動投稿**
- **実行時刻**: 毎日 PM8:30-PM9:30の間（ランダム、スパム対策）
- **実行頻度**: 毎日（月30回）
- **ワークフロー**: `.github/workflows/daily-x-post.yml`
- **内容**: ランダム記事をX（Twitter）に自動投稿

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

5. 💰 **記事生成頻度の最適化とコスト削減** (2025-10-25)
   - 記事自動生成を毎日実行から週3回（水・土・日）に変更
   - Gemini API使用料を60%削減（¥147/月 → ¥59/月）
   - 全費用の100%がGemini APIによるものと判明
   - 夜間スクリプト群の包括的改善を実施：
     - Gemini APIモデルをgemini-2.5-flashに統一
     - 記事生成失敗時のGitHub Issue自動作成機能追加
     - X投稿の重複回避機構実装（30日履歴管理）
     - excerpt自動更新機能追加（白崎セラ口調で一貫性保持）

6. 👤 **白崎セラのプロフィールページ実装とキャラクター設定拡充** (2025-10-26)
   - aboutページに白崎セラのプロフィールカード追加
     - プロフィール画像（円形デザイン、グラデーション背景）
     - 基本情報（年齢、職業、活動内容）の視覚的表示
     - レスポンシブ対応（モバイル/デスクトップ最適化）
   - キャラクター設定に「お金との向き合い方」を追加
     - 奨学金・補助金は返済まで見据えて判断
     - 家計管理や投資について学び、実践する姿勢
     - 「今だけでなく、未来の自分も守る」金銭感覚
   - Sanity APIトークンエラー修正（GitHub Secrets更新）

7. 🔐 **セキュリティインフラ完全構築** (2025-10-26)
   - 5層のセキュリティ保護システム構築完了
   - **ローカル保護（3層）**:
     - `.gitignore` 更新: `.env*`, `*.secret`, `*.private` を除外
     - Git pre-commit フック: 秘密情報検出・コミット阻止（APIキーパターン検出）
     - direnv 導入: `.env.local` 自動読み込み（プロジェクト入室時）
     - `~/.env_keys` 作成: 全APIキー一元管理（chmod 600）
   - **GitHub保護（2層）**:
     - Secret Scanning 有効化: リポジトリ全体スキャン
     - Push Protection 有効化: プッシュ時秘密情報検査
     - GitHub Actions Secrets 登録: OPENAI_API_KEY, ANTHROPIC_API_KEY, GEMINI_API_KEY
   - **ビルドワークフロー追加**:
     - `.github/workflows/build.yml` 作成
     - Node.js 20 + npm でビルド
     - メモリ上限4GB設定 (--max-old-space-size=4096)
     - ビルド時に全APIキーを環境変数として注入

8. ⏰ **ワークフロー実行スケジュール最適化** (2025-10-26)
   - ワークフロー実行時間を整理・最適化
   - **記事自動生成**: 月・水・金 AM3:00 → **月・水・金 AM2:00** に変更（1時間前倒し）
   - **メンテナンスチェック**: 毎日 AM2:00 → **月・水・金 AM3:00** に変更（記事生成の1時間後、頻度削減）
   - **X自動投稿**: 毎日 PM8:30-PM9:30の間でランダム投稿（スパム対策、変更なし）
   - 目的: 記事生成後すぐにメンテナンスチェックを実行し、効率化

9. 🔧 **記事自動生成の認証エラー修正** (2025-10-26)
   - **問題**: ワークフローは成功表示だが実際には記事が生成されていなかった
   - **原因**: SANITY_WRITE_TOKEN が期限切れ（401 Unauthorized エラー）
     - ワークフローの `continue-on-error: true` により失敗が隠蔽されていた
   - **対応**:
     - 新しい Sanity API トークンを発行
     - GitHub Secrets の SANITY_WRITE_TOKEN を更新
     - `.env.local` にも SANITY_WRITE_TOKEN を追加
     - ローカル・GitHub Actions 両方でテスト成功確認
   - **結果**: 記事自動生成が正常に動作開始
     - ローカルテスト: drafts.9d8dddf8-d2b7-480c-92b6-4c1725837885
     - GitHub Actions: drafts.73924fd4-b938-4911-aadf-9549d306ef08

10. 🔑 **ローカル環境の Sanity トークン設定** (2025-10-26)
   - **問題**: ローカルスクリプトで Sanity API 401/403 エラーが発生
     - セキュリティインフラ構築時に `~/.env_keys` に Sanity トークンが未登録
     - `scripts/maintenance.js` など編集系スクリプトが実行不可
   - **対応**:
     - `~/.env_keys` に SANITY_WRITE_TOKEN と SANITY_API_TOKEN を追加
     - `.env.template` に Sanity トークン項目を追加
     - `scripts/test-sanity-write.js` 追加（書き込み権限テスト用）
     - Pre-commit フック修正：`.env.template` を除外リストに追加
   - **結果**: ローカル環境で Sanity API への書き込み権限が正常に動作

11. ✨ **メンテナンススクリプトの白崎セラ口調対応** (2025-10-26)
   - **追加ファイル**: `scripts/utils/postHelpers.js` 作成
     - `blocksToPlainText`: body ブロックをプレーンテキストに変換（リンクURLは除去）
     - `generateExcerpt`: 白崎セラ口調で excerpt を生成（100-150文字）
     - `generateMetaDescription`: 白崎セラ口調で metaDescription を生成（100-180文字、excerpt とは別）
     - `generateSlugFromTitle`: タイトルから URL スラッグを生成
     - `selectBestCategory`: タイトル・本文から最適なカテゴリを自動選択
   - **変更内容**:
     - excerpt と metaDescription を明確に区別（metaDescription は excerpt の要約版ではない）
     - カテゴリが空の場合、既存17種類のカテゴリから最適なものを自動選択
     - Meta Description 長さ基準を緩和（120-160文字 → 100-180文字、ユーザビリティやSEO優先）
   - **白崎セラ口調の実装**:
     - 導入フレーズ: 「看護助手として働く中で」「わたしの経験から」など
     - 締めフレーズ: 「現場目線で詳しくお伝えします」「無理なく続けるヒントをお届けします」など
     - 穏やかで丁寧、柔らかいが芯の通った口調を維持

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
