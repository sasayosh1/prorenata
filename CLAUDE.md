# Claude Code プロジェクト設定

### エージェントの行動指針（最重要）

1. **すべての変更において事前に確認を取る** (🔒 **慎重実行**)
   - ファイルの作成、削除、リネーム、内容の変更（リファクタリング、SEO改善、タイポ修正を含む）を行う際は、**必ず具体的な変更内容を提示し、ユーザーの承諾を得てから実行**すること。
   - 勝手な「良かれと思って」の修正は禁止。

2. **コスト見積もりの提示** (💰 **費用透明性**)
   - Claude Code (`audit` コマンド等)、Codex CLI (`build` コマンド等)、または Gemini API を使用するツールを実行する際は、**必ず事前に推定消費コスト（円単位）を提示**すること。
   - **コストの目安**:
     - Claude Code (Sonnet 3.5): 1リクエストあたり 約5円〜30円（コンテキスト量に依存）
     - Gemini 2.0 Flash Lite: ほぼ無料（無料枠内）
     - Codex CLI: 1ツール実行あたり 約10円〜50円
   - コストが発生する可能性がある場合は、必ずユーザーに「実行してよろしいですか？」と確認すること。

**重要**: ユーザーが明示的に「全部保存」と言った場合のみ、事後報告形式での一括保存を許可する。それ以外のすべての作業は個別確認をエンジンの基本動作とする。

---

## 開発コマンド

### 開発サーバー起動
```bash
npm run dev
```
ローカル開発サーバーを起動します（http://localhost:3000）

### Sanity Studio起動
```bash
npm run dev:sanity
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

### カテゴリ・スキーマ同期
```bash
SANITY_WRITE_TOKEN=$SANITY_WRITE_TOKEN node scripts/maintenance.js sync-categories
```
- Sanity Studio のカテゴリ文書を正規ラベル（厚労省/JNA語彙）と説明に自動置換します
- レガシー名称が表示されたり、新規環境にPullした直後は必ず実行してください
- 書き込みトークン必須（`SANITY_WRITE_TOKEN`）。実行ログに差し替え結果が表示されます

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
- SEO: タイトル30〜40文字、**Meta Description 120〜160文字**、Excerpt 100〜150文字
- **タイトル最適化**: 【】括弧や過度な装飾は使用しない。キーワードを自然に配置し、30〜40文字に収める
- **冒頭文**: 挨拶文・自己紹介（「〇歳の看護助手として...」など）は使用せず、すぐに本題に入る
- **キャラクターボイス**: 白崎セラ（20歳の看護助手、一人称「わたし」）。トーンや価値観は最新版 `docs/character-shirasaki-sera.md` を必ず参照し、挨拶なしの導入・曖昧なことは「わからない」と明記する姿勢を守る。

## 制度・トレンド更新の即時対応

- **監視対象**: 厚生労働省 看護政策情報、JNAお知らせ、e-Stat の新着統計は毎朝チェック。新通知が出たら `docs/policy-update-workflow.md` に日付メモを残す。
- **更新フロー**: 週次バッチを待たずに、その場で対象記事を `manual-content-helper.js` 等で抽出し、白崎セラ口調で本文を修正。最終更新日も書き換える。
- **出典必須**: 法律・制度・トレンド記事には一次情報（厚労省/JNA/政府統計など）のリンクを最低1件。`addSourceLinksToArticle()` で自動付与後も必ず実リンクを目視確認する。
- **Geminiの使い方**: 文章再生成が必要な場合は `gemini-2.5-flash-lite-001` 固定。必要な段落のみを対象にし、APIコストと表現ブレを最小限に抑える。
- **記録**: 反映した内容と根拠URLを `PROJECT_STATUS.md` か Issue に記載し、次回確認の目安（例: 「次期診療報酬発表時に再確認」）を残す。
- 詳細な手順・チェックリストは `docs/policy-update-workflow.md` を確認。

## 記事自動生成戦略

**詳細**: `docs/ARTICLE_GENERATION_STRATEGY.md` を参照

### 自動実行スケジュール

**1. 記事自動生成**
- **実行時刻**: 毎週 月曜 深夜2:00 (JST)
- **実行頻度**: 週1回（月4-5回）
- **ワークフロー**: `.github/workflows/daily-draft.yml`
- **生成エンジン**: Gemini API (gemini-1.5-flash-001) ⚠️ **Pro禁止**
- **API キー**: GitHub Secrets (`GEMINI_API_KEY`) に設定済み
- **月間コスト**: 約¥6-10（gemini-1.5-flash-001使用時）

**2. メンテナンスチェック**
- **実行時刻**: 毎日 AM 9:00 JST（00:00 UTC）
- **実行頻度**: 毎日（月30回）
- **ワークフロー**: `.github/workflows/daily-maintenance.yml`
- **内容**: 全記事の品質チェック（必須フィールド、SEO、文字数など）
- **コスト**: 無料（Sanity API無料枠内、月間約5,000リクエスト/無料枠100,000の5%）

**3. ステップメール・ニュースレター健康チェック**
- **実行時刻**: 毎日 AM 9:00 JST（00:00 UTC）
- **実行頻度**: 毎日
- **ワークフロー**: `.github/workflows/send-step-emails.yml`
- **内容**: 購読者ステップ進捗 + ニュースレター本文完全性チェック（2026-04-04追加）
- **月間コスト**: 無料（Sanity Query + Gmail送信のみ）

**4. X投稿用メール（semi-auto）**
- **実行時刻**: 朝/夜（workflowのcronに準拠）
- **実行頻度**: 1日2回
- **ワークフロー**: `.github/workflows/x-mailer.yml`
- **内容**: Sanityから記事を1件選び、Gmailで投稿用テキスト（140字以内）+ URL を送信
- **生成**: テンプレなし（テキスト + 改行 + URL）
- **月間コスト**: 無料（Sanity Query + Gmail送信のみ）

### キーワード戦略（黄金比）

**ショート1：ミドル3：ロング5**

| キーワードタイプ | 割合 | 記事数目安（150記事中） | 狙い |
|----------------|------|---------------------|------|
| ショートテール | 10-15% | 15〜20記事 | カテゴリ／ガイドページ |
| ミドルテール | 35-40% | 50〜60記事 | **主力トラフィック獲得** |
| ロングテール | 45-55% | 70〜80記事 | CVR・E-E-A-T強化 |

**現在の重点**: ミドルテールを積極的に拡充し、トピッククラスターを形成

---

## ニュースレター管理

> 📋 **詳細ガイド**: `docs/NEWSLETTER_GUIDE.md` を参照
> ⚠️ **問題の根本原因分析**: 2026-04-04 実施・文書化完了

### 仕様

- **配信対象**: メルマガ登録者（`subscriber` document）
- **emailNumber**: 1, 2, 3...（複数のemailNumber=1があってもOK、シリーズ分岐可）
- **形式**: PortableText（記事と同じエディタで編集）
- **必須フィールド**: `subject`（100字以内）、`emailNumber`（数値）、`body`（PortableText配列）
- **品質基準**:
  - ブロック数: **最低15ブロック以上**（500語相当）
  - 見出し: **H2見出し 3-5個**
  - 構成: オープニング → 複数セクション（H2+説明） → クロージング
  - キャラクター性: 白崎セラ（一人称「わたし」）、見出しに「セラ」を含めない

### 生成・編集のフロー

1. **コンテンツ企画**: テーマ・対象読者・emailNumber を決定
2. **JSON生成**: `scripts/generate-newsletter-bodies.js` で PortableText JSON を生成
3. **Sanity へのパッチ**: MCP `patch_document_from_json` で Sanity に適用
4. **品質チェック**: `scripts/newsletter-health-check.cjs` で本文完全性を検査
5. **配信準備**: `scheduledAt` を設定、プレビューメール送信

### 禁止事項

- **Markdown → PortableText 自動変換の使用禁止**（トークン制限で切り詰められるため）
- **直接 PortableText JSON を生成すること**（推奨方法）
- 一度の API 呼び出しで複数メール編集禁止（エラーハンドリング困難）
- 記事内リンク・アフィリエイトリンク不可（メール体験を損なう）
- ニュースレターに画像・動画の挿入は基本的に不推奨

### メンテナンスチェック

**週次チェック（毎週月曜 AM 3:00 JST）**:
- `scripts/newsletter-health-check.cjs` を実行
- エラー（本文が空）・警告（ブロック < 10）がないか確認
- すべてのニュースレターが完全な状態か確認

**配信前チェック**:
- ☑ subject が 30-60 文字か確認
- ☑ emailNumber が正しく設定されているか確認
- ☑ body が 15 ブロック以上か確認
- ☑ 見出しが 3-5 個か確認
- ☑ プレビューメール送信（テスト配信）
- ☑ 件名・本文に誤字がないか確認

### 関連スクリプト

| スクリプト | 用途 | 実行 |
|-----------|------|------|
| `scripts/generate-newsletter-bodies.js` | PortableText JSON 生成 | 手動 |
| `scripts/newsletter-health-check.cjs` | 本文完全性チェック | 毎日 3:00 JST |
| `scripts/fix-newsletter-truncation.js` | トラブル修復（レガシー） | 手動 |
| MCP `patch_document_from_json` | Sanity へのパッチ適用 | 手動 |

### 根本原因と改善施策

**📋 2026-04-04 根本原因分析結果**:
- **原因**: ニュースレター生成に関する仕様・フロー・品質基準が CLAUDE.md に未記載、自動化なし、複数のアプローチが混在
- **結果**: 6つのニュースレットが不完全な状態で存在
- **改善**: `docs/NEWSLETTER_GUIDE.md` 作成・CLAUDE.md 本セクション追加・`newsletter-health-check.cjs` 強化
- **再発防止**: 仕様書ドキュメント化 + 自動品質チェック + プロセス統一

詳細は `docs/NEWSLETTER_GUIDE.md` を参照してください。

---

### [過去の変更履歴は docs/history/CLAUDE_HISTORY.md にアーカイブ済み]

## ⚠️ 重要なルール

**🔒 maintenanceLocked記事の完全保護（最重要・収益直結）**
- `maintenanceLocked: true` が設定された記事は、**いかなるスクリプトも編集してはいけません**
- すべての編集スクリプトは必ず以下のフィルタを使用すること：
  ```groq
  (!defined(maintenanceLocked) || maintenanceLocked == false)
  ```
- 対象記事（収益に直結する重要記事）：
  - `comparison-of-three-resignation-agencies`（退職代行３社比較）
  - `nursing-assistant-compare-services-perspective`（転職サービス３社比較）
- **インシデント履歴**:
  - 2025-11-25: スクリプトにmaintenanceLockedチェックが欠落し、ロック記事が編集される重大インシデント発生
  - 対応: 全スクリプトにチェックを追加、検証テストスクリプトを作成（`test-maintenance-lock.js`）
  - 復元: アフィリエイトブロックを再構築し、両方の記事を完全復元（`scripts/tmp/restore-comparison-articles-v2.js`）
    - `comparison-of-three-resignation-agencies`: 弁護士法人みやび、退職代行 即ヤメの2件を復元
    - `nursing-assistant-compare-services-perspective`: ヒューマンライフケア、かいご畑、リニューケアの3件を復元
    - 両記事に免責事項ブロックを追加
  - 検証: ロック機能が正常に動作することを確認（全テスト成功）
- 違反した場合は収益損失の重大インシデントとなる

**🔐 収益最重要記事の絶対保護（maintenanceLockedの状態に関わらず編集禁止）**
- 以下の2記事は、**maintenanceLockedフラグの状態に関わらず、絶対に編集してはいけません**
  - `nursing-assistant-compare-services-perspective`（看護助手の転職サービス３社比較）
  - `comparison-of-three-resignation-agencies`（退職代行３社のメリット・デメリット徹底比較）
- これらは収益最適化のための最重要記事です
- すべてのスクリプトで `PROTECTED_REVENUE_SLUGS` をハードコードし、これらのslugを明示的にスキップすること
- `scripts/maintenance.js` の `PUBLIC_POST_FILTER` にもこれらのslugを除外するフィルタを追加済み
- 実装例：
  ```javascript
  const { PROTECTED_REVENUE_SLUGS } = require('./maintenance');

  if (PROTECTED_REVENUE_SLUGS.includes(slug)) {
    console.log('🚫 収益最重要記事のため編集をスキップ');
    return null;
  }
  ```
- 違反した場合は収益損失の最重大インシデントとなる

**🚨 時間設定・タイムゾーン設定の改変は絶対禁止（最重要・インシデント発生済み）**
- タイムゾーン設定（JST、UTC等）の変更は絶対禁止
- リセット時刻・実行時刻の変更は絶対禁止
- 日付取得方法（`new Date()`、`toISOString()`、`toLocaleDateString()`等）の変更は絶対禁止
- **インシデント履歴**:
  - 2025-11-26: メディカルクイズのリセット時刻が JST 0:00 → JST 9:00 に改変される重大インシデント発生
  - 原因: 作成時は `toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' })` だったが、何らかの理由で `toISOString()` に改変
  - 対応: JST 0:00 リセットに復旧、CLAUDE.mdにルール追加
- 時間に関する設定を変更する必要がある場合は、必ず事前にユーザーに確認すること
- 違反した場合はユーザー体験を損なう重大インシデントとなる

**🚨 指定された作業以外のコード変更は絶対禁止（最重要）**
- ユーザーから明示的に指示された作業のみを実施すること
- 「ついでに」「改善のため」などの理由で指示外の変更を行うことは絶対禁止
- 問題を発見した場合や改善案がある場合は、必ず事前にユーザーに確認すること
- メンテナンススクリプトやリファクタリング時も、指示された範囲のみを変更すること
- **理由**: 意図しない変更により、時間設定改変のような重大インシデントが発生する可能性がある
- 違反した場合は最重要事項の不遵守となる

**🚫 UIデザイン変更の完全禁止**
- レイアウト、色、フォント、スタイルの変更は絶対禁止
- 詳細は `UI-DESIGN-LOCK.md` を参照
- 違反した場合は最重要事項の不遵守となる

**🚫 SEOフィールド設定の変更禁止**
- excerpt, metaDescription, tagsのみ使用（確定）
- metaTitle, focusKeyword, relatedKeywordsは削除済み（再追加禁止）
- 詳細は `SEO-FIELDS-LOCK.md` を参照
- ユーザーの明示的指示なしに変更した場合は最重要違反となる

**⚖️ 免責事項ブロック配置ルール**
- 免責事項は必ず `まとめ` セクション直後、記事の最終ブロックとして配置
- 本文中間に挿入することは禁止（ユーザビリティ低下・YMYL配慮のため）
- メンテナンススクリプトは `ensureDisclaimerPlacement()` で自動補正するため、手動編集時もルール厳守
- 免責事項テキストの改変は禁止。定義:  
  `免責事項: この記事は、看護助手としての現場経験に基づく一般的な情報提供を目的としています。職場や地域、個人の状況によって異なる場合がありますので、詳細は勤務先や専門家にご確認ください。`

**📝 H2見出しと言葉遣いのルール**
- H2見出しに「セラ」という固有名詞を入れない（自動修正対象）
- 一人称は本文でも見出しでも常に「わたし」を使用し、キャラ紹介は本文中で最小限に
- キャラクター性は本文で柔らかく出す。見出し・メタ情報・タイトルでは内輪感を避ける
- 一次資料リンクは有効性を確認できるURLのみ挿入する。取得できない場合は出典ブロックを作成しない
- 使用可能な出典は「厚労省jobtag / JNAガイドライン / JNA離職レポート / NsPace Career / コメディカルドットコム / 看護助手ラボ / 介護サーチプラス」のみ。追加したい場合は事前に合意を取る
- アフィリエイトリンクはAmazon/Rakuten/ナースリー以外は1記事2件まで。CTA文は`affiliateEmbed`枠内で完結させ、枠外にリンクを増やさない
- アイテム特集（「○○アイテム◯選」「便利グッズ」など）以外の記事では、アフィリエイト枠を連続させず最低2ブロック以上の本文を挟むこと

**🎨 リンク・セクション背景色のルール（確定・変更禁止）**
- **参考リンク**（「参考: ...」で始まる段落）: 背景色なし、通常のテキスト表示
- **内部リンク**（`/posts/...`へのリンクを含む段落）: ピンク色の背景（`bg-rose-50/80 border border-rose-100 rounded-md px-4 py-3`）
- **[PR]アフィリエイトリンク**（`[PR]`で始まる段落）: 薄いブルーの背景（`bg-sky-50/80 border border-sky-100 rounded-md px-4 py-3`）
- **免責事項**（「免責事項:」で始まる段落）: イエローの背景（`bg-yellow-50 border border-yellow-200 rounded-md px-4 py-3`）
- **実装場所**: `src/components/PortableTextComponents.tsx` の `CustomParagraph` コンポーネント
- **自動適用**: このスタイルはすべての記事（既存・新規）に自動的に適用される
- **変更禁止**: このスタイル設定は確定しており、ユーザーの明示的な指示なしに変更することは禁止

**🗂️ カテゴリ語彙と出典レイヤーの統一**
- Studioのカテゴリは公的語彙で固定された11ラベル（離職理由 / 賃金水準 / 就業移動（転職）など）以外を追加・改名しない
- 1記事につき最も関連性の高いカテゴリを1つだけ選択（複数指定禁止）。カテゴリはリンク挿入・出典選定のルールベースとして使用する
- レガシー名称が表示された場合は `SANITY_WRITE_TOKEN=$SANITY_WRITE_TOKEN node scripts/maintenance.js sync-categories` を実行して正規ラベルと説明を同期
- カテゴリ一覧と想定トピックは `ARTICLE_GUIDE.md` / `PROJECT_KNOWLEDGE_BASE.md` に記載。記事作成・メンテナンス時は必ず参照する
- ユーザー指示なしでカテゴリを増やす・削除する・命名を変えることは禁止（SEO・出典ポリシーと直結するため）
- 内部資料として公開したい記事は `internalOnly` にチェックを入れる。チェック時は一覧/検索/サイトマップから除外され、robots noindex を付与する（手動で noindex メタを追加しない）。現在該当: `comparison-of-three-resignation-agencies`, `nursing-assistant-compare-services-perspective`。
- **Cost Transparency**: Estimate token usage/cost before expensive operations.
- **Budget Guard**: All AI operations via `./tools/ai` automatically check against the monthly (100 JPY) and daily (20 JPY) budget defined in `.budget/gemini-usage.json`.
- **Sonnet Usage**: Only use for audits or complex tasks; prefer Gemini Flash Lite for volume.
- `internalOnly` にチェックされた記事は `scripts/maintenance.js` の sanitize / autofix / recategorize / その他の自動整形対象から除外される（メンテで触れない）

**🔗 転職・退職記事のアフィリエイトリンク禁止ルール（最重要）**
- **転職記事**: 転職サービスのアフィリエイトリンクを単体で貼ることは禁止
  - 代わりに「看護助手の転職サービス３社を "看護助手の視点だけ" で比較」（`nursing-assistant-compare-services-perspective`）への内部リンクを設置
- **退職記事**: 退職代行サービスのアフィリエイトリンクを単体で貼ることは禁止
  - 代わりに「退職代行３社のメリット・デメリット徹底比較」（`comparison-of-three-resignation-agencies`）への内部リンクを設置
- **配置場所**:
  - 基本: 記事のまとめセクションの後、免責事項の前に1箇所
  - 長文記事（2000文字以上）: 記事中盤にも1箇所追加可能
- **理由**: ユーザーに複数の選択肢を比較検討させるため、単一サービスへの誘導ではなく比較記事を経由させる
- 退職・離職テーマの記事では退職代行ASPの代わりに「退職代行３社のメリット・デメリット徹底比較」への内部リンクを自動挿入し、同セクション周辺に退職代行ASPを配置しない

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

**🚨 Gemini API モデル選択の絶対ルール（全プロジェクト対象）**
- **絶対に Gemini Pro モデルを使用してはいけません**（最重要ルール）
- **絶対にバージョン指定なしのFlashモデルを使用してはいけません**（最重要ルール）
- **Vertex AI の使用は絶対禁止**（最重要ルール）
- **適用範囲**: prorenataプロジェクトだけでなく、**今後関わるすべてのプロジェクトで禁止**
- **重大な経緯**:
  - 過去にバージョン指定なしモデル（`gemini-1.5-flash`, `gemini-2.5-flash`）を使用した際、自動的にProにフォールバックし、Vertex AI経由で課金された
  - 結果として多大な課金が発生（通常APIの数十倍高額）
  - この経験から、バージョン固定（`-001`付き）モデルのみ使用するルールを確立
- **使用可能なモデル**: バージョン固定（`-001`付き）のFlashモデルのみ
  - `gemini-2.0-flash-lite-001`（推奨・最低コスト）
  - `gemini-2.0-flash-001`（標準Flash、品質優先時のみ）
- **使用禁止モデル**:
  - すべてのProモデル（`gemini-2.5-pro`, `gemini-1.5-pro`等）
  - バージョン指定なしのFlashモデル（`gemini-2.5-flash`, `gemini-1.5-flash`等）
  - 存在しないモデル名（自動的にProにフォールバックするため）
- **理由**:
  - Proモデルは料金が約17-67倍高額（¥545/月 vs ¥30-50/月）
  - バージョン指定なしモデルは自動的にProにフォールバック
  - Vertex AI経由の課金は通常APIの数十倍高額
  - コスト管理と安定性のため、バージョン固定モデルのみ使用
- **新規スクリプト作成時の必須ルール**:
  - 必ず `gemini-2.0-flash-lite-001` を使用すること（最低コスト）
  - 品質が不足する場合のみ `gemini-2.0-flash-001` を検討
  - バージョン固定（`-001`付き）以外のモデルは絶対に使用しない
- **現在のGemini API使用状況（prorenataプロジェクト）**:
  - `scripts/run-daily-generation.cjs`: gemini-2.0-flash-lite-001 使用（週1回）
  - `scripts/expand-short-posts.js`: gemini-2.0-flash-lite-001 使用（手動実行のみ）
  - `scripts/clean-affiliate-sections.js`: gemini-2.0-flash-lite-001 使用（手動実行のみ）
  - `.github/scripts/x-mailer.mjs`: **Gemini API不使用**（Sanityの既存フィールドから所感を組み立て、X互換の文字数に収める）
- **モデル移行履歴**:
  - 2025-11-04以前: `gemini-1.5-flash-001`（廃止により404エラー）
  - 2025-11-04以降: `gemini-2.0-flash-lite-001`（バージョン固定、最低コスト、Proフォールバック防止、Vertex AI禁止）
- 違反した場合は重大な課金が発生するため最重要違反となる

