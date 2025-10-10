# ProReNata プロジェクト完全知識ベース

このドキュメントは、ProReNataプロジェクトの全ルール、構造、ガイドライン、テンプレートを包括的にまとめたものです。
他のAI環境（Codex CLI、Gemini CLI等）でこのプロジェクトを扱う際は、このドキュメントを参照してください。

**最終更新日**: 2025-10-10

---

## 目次

1. [プロジェクト概要](#プロジェクト概要)
2. [技術スタック](#技術スタック)
3. [重要なルール（絶対遵守）](#重要なルール絶対遵守)
4. [プロジェクト構造](#プロジェクト構造)
5. [記事作成ガイドライン](#記事作成ガイドライン)
6. [アフィリエイトリンク管理](#アフィリエイトリンク管理)
7. [開発コマンド](#開発コマンド)
8. [デプロイメント](#デプロイメント)
9. [SEO設定](#seo設定)
10. [トラブルシューティング](#トラブルシューティング)

---

## プロジェクト概要

### 基本情報
- **プロジェクト名**: ProReNata（プロレナータ）
- **サイトURL**: https://prorenata.jp
- **目的**: 看護助手向け情報サイト
- **ターゲット**: 看護助手、介護職、医療従事者
- **記事数**: 139件（2025-10-10時点）
- **収益化率**: 89.7%

### コンセプト
- **最小限のデザイン**: Tailwind Next.js Starter Blogスタイル
- **シンプルで読みやすい**: 情報を探しやすい構造
- **SEO最適化**: 構造化データ、内部リンク最適化
- **アフィリエイト収益化**: 控えめで自然な配置

---

## 技術スタック

### フロントエンド
- **Framework**: Next.js 15.5.3/15.5.4
- **React**: 19.x
- **TypeScript**: 5.x
- **Styling**: Tailwind CSS 3.x
- **App Router**: Server Components使用

### CMS
- **Sanity CMS**
  - Project ID: `72m8vhy2`
  - Dataset: `production`
  - API Version: `2024-01-01`
  - Studio Port: 3333

### データ形式
- **Portable Text**: Sanityのブロックコンテンツ形式
- **JSON-LD**: 構造化データ（Article, BreadcrumbList, Organization）

### デプロイ
- **Hosting**: Vercel
- **Domain**: prorenata.jp
- **Analytics**: Google Analytics (G-HV2JLW3DPB)
- **Search Console**: DNS TXT認証済み

---

## 重要なルール（絶対遵守）

### 🚫 UI/UXデザインの変更禁止

**詳細**: `UI-DESIGN-LOCK.md` 参照

- レイアウト、色、フォント、スタイルの変更は**絶対禁止**
- Tailwind Next.js Starter Blogデザインを完全維持
- カスタムCSSの追加禁止
- デザイン変更はユーザーの明示的指示があっても慎重に確認

### 🚫 SEOフィールド設定の変更禁止

**詳細**: `SEO-FIELDS-LOCK.md` 参照

- 使用フィールド: `excerpt`, `metaDescription`, `tags` のみ
- 削除済みフィールド: `metaTitle`, `focusKeyword`, `relatedKeywords`
- 削除済みフィールドの再追加は**絶対禁止**

### 🚫 Google Analytics/Search Consoleコードの変更禁止

- トラッキングID: `G-HV2JLW3DPB`
- DNS TXT確認コード: `google-site-verification=Xy7fDHrYsVObXVQeb0D3He2wEWQCSnlsClAJ_OYsioE`
- コードの変更・削除は**絶対禁止**

### 🚫 Sanity Studio プレビューボタン機能の保護

**重要**: 削除は重大インシデント

- ファイル: `src/sanity/actions/PreviewAction.tsx`
- 設定: `sanity.config.ts` の PreviewAction 設定
- 削除・変更は**絶対禁止**

### ✅ Git コミットルール

- `--no-verify` や `--no-gpg-sign` は使用禁止（ユーザー明示的指示がある場合を除く）
- force pushは禁止（特にmain/master）
- コミットメッセージ末尾に必ず追加:
  ```
  🤖 Generated with [Claude Code](https://claude.com/claude-code)

  Co-Authored-By: Claude <noreply@anthropic.com>
  ```

---

## プロジェクト構造

### ディレクトリ構成

```
prorenata/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # トップページ
│   │   ├── about/             # Aboutページ
│   │   ├── blog/              # ブログ一覧
│   │   ├── posts/[slug]/      # 記事詳細ページ
│   │   ├── categories/        # カテゴリページ
│   │   └── api/               # API Routes
│   ├── components/            # Reactコンポーネント
│   │   ├── StructuredData.tsx # JSON-LD構造化データ
│   │   └── ...
│   ├── sanity/                # Sanity設定
│   │   ├── schema.ts          # スキーマ定義
│   │   ├── actions/           # カスタムアクション
│   │   └── ...
│   └── lib/                   # ユーティリティ
├── scripts/                   # 管理スクリプト
│   ├── moshimo-affiliate-links.js          # アフィリエイトリンクDB
│   ├── add-moshimo-links.js                # Moshimoリンク配置
│   ├── add-taishokudaikou-links.js         # 退職代行リンク配置
│   ├── insert-contextual-links.js          # 内部リンク挿入
│   ├── remove-internal-links.js            # 内部リンク削除
│   ├── fix-amazon-rakuten-links.js         # Amazon/楽天リンク修正
│   ├── remove-duplicate-posts.js           # 重複記事削除
│   ├── optimize-a8-kaigobatake-links.js    # A8.netリンク最適化
│   ├── reorganize-affiliate-links-matome.js # まとめセクション整理
│   ├── fix-h2-after-matome.js              # 見出し階層修正
│   ├── optimize-h3-sections.js             # H3セクション最適化
│   ├── verify-affiliate-links-live.js      # アフィリエイトリンク検証
│   ├── complete-affiliate-stats.js         # 統計レポート
│   └── check-affiliate-links-health.js     # リンクヘルスチェック
├── internal-links-analysis/   # 分析レポート
├── CLAUDE.md                  # Claude Code設定
├── UI-DESIGN-LOCK.md          # UIデザイン禁止ルール
├── SEO-FIELDS-LOCK.md         # SEOフィールド禁止ルール
├── ARTICLE_GUIDE.md           # 記事作成ガイド
└── PROJECT_KNOWLEDGE_BASE.md  # このファイル
```

### 重要ファイル

#### `CLAUDE.md`
- プロジェクト設定とコマンド
- 開発サーバー、ビルド、デプロイコマンド
- 最近の変更履歴

#### `UI-DESIGN-LOCK.md`
- UIデザイン変更の完全禁止ルール
- 許可されている変更の範囲

#### `SEO-FIELDS-LOCK.md`
- SEOフィールド設定の固定ルール
- 使用可能なフィールドのリスト

#### `ARTICLE_GUIDE.md`
- Sanity CMSでの記事作成手順
- 公開前チェックリスト
- 品質基準・執筆ルール

---

## 記事作成ガイドライン

### 記事テンプレート

**参照**: `/Users/user/Documents/sasakiyoshimasa_article_template_codex.md`

### 基本構造

```
H1: 記事タイトル（自動生成、編集不要）

導入文（2-3段落）

H2: セクション1タイトル
  本文（2-5段落）

H2: セクション2タイトル
  本文（2-5段落）

H2: セクション3タイトル
  本文（2-5段落）

H2: まとめ
  まとめ本文（1-2段落）

  H3: より良い職場環境を探している方へ（任意）
    本文
    アフィリエイトリンク（1-2個）

次のステップカード（自動挿入）
```

### 見出し階層ルール

1. **H1は1つのみ**（記事タイトル、自動生成）
2. **H2はメインセクション**（3-5個推奨）
3. **まとめH2の後はH3**（H2を置かない）
4. **H3はH2の下位セクション**のみ

### 文字数・構成

- **総文字数**: 1500〜2500文字
- **H2見出し**: 3〜5個
- **段落**: 各セクション2-5段落
- **具体性**: 数字・事例を含む

### SEO設定

#### タイトル
- **文字数**: 30〜40文字
- **キーワード**: 前半に配置
- **例**: 「看護助手を辞めたいとき上手な退職理由の伝え方」

#### ディスクリプション（excerpt）
- **文字数**: 120〜160文字
- **記事要約**: 具体的な内容
- **CTA**: 「〜について解説します」

#### タグ
- **数**: 3-5個
- **例**: `基礎知識`, `入門`, `転職`, `給料`, `辞めたい`

### 記事タイプ

1. **ハウツー記事**
   - タイトル: 「〜する方法」「〜するコツ」
   - 構造: 問題提起 → 解決策（ステップ形式）→ まとめ

2. **解説記事**
   - タイトル: 「〜とは？」「〜を徹底解説」
   - 構造: 定義 → 詳細説明 → 具体例 → まとめ

3. **比較記事**
   - タイトル: 「〜と〜の違い」「〜を比較」
   - 構造: 概要 → 比較項目 → 選び方 → まとめ

4. **体験談・事例記事**
   - タイトル: 「〜の体験談」「〜の事例」
   - 構造: 背景 → 体験内容 → 学び → まとめ

---

## アフィリエイトリンク管理

### アフィリエイトリンクデータベース

**ファイル**: `scripts/moshimo-affiliate-links.js`

### 登録済みアフィリエイト

#### 1. Moshimo（もしも）アフィリエイト

1. **リニューケア**
   - カテゴリ: 転職・求人
   - 対象記事: 転職、求人、関西、大阪、兵庫、京都、辞めたい
   - URL: `//af.moshimo.com/af/c/click?a_id=5207862&...`

2. **ヒューマンライフケア**
   - カテゴリ: 転職・求人
   - 対象記事: 転職、求人、介護、ケアマネ、辞めたい、キャリア
   - URL: `//af.moshimo.com/af/c/click?a_id=5207863&...`

3. **パソナライフケア**
   - カテゴリ: 転職・求人
   - 対象記事: 転職、求人、未経験、なるには、辞めたい
   - URL: `//af.moshimo.com/af/c/click?a_id=5207867&...`

4. **クラースショップ**
   - カテゴリ: 商品・グッズ
   - 対象記事: シューズ、靴、グッズ、必要なもの、1日の流れ、夜勤
   - URL: `//af.moshimo.com/af/c/click?a_id=5207866&...`

5. **楽天市場**
   - カテゴリ: 商品・グッズ
   - 対象記事: シューズ、靴、グッズ、制服、ユニフォーム、必要なもの
   - URL: `//af.moshimo.com/af/c/click?a_id=5207851&...`

#### 2. TCS-ASP（汐留パートナーズ）

**退職代行サービス**
- カテゴリ: 退職代行
- 対象記事: 辞めたい、退職、辞める、転職、辞め方、理由
- URL: `https://www.tcs-asp.net/alink?AC=C110444&...`

#### 3. A8.net

**かいご畑**
- カテゴリ: 転職・求人
- 対象記事: 給料、辞めたい、夜勤、シフト、人間関係
- URL: `https://px.a8.net/svt/ejp?a8mat=3ZAXGX+DKVSUA+5OUU+5YZ77`
- **配置**: 1行のシンプルなテキストリンク形式

#### 4. Amazon Associates / 楽天アフィリエイト

- **Amazon**: `tag=ptb875pmj49-22`
- **楽天**: 商品検索URL
- **配置**: 商品紹介セクション（記事中）

### アフィリエイトリンク配置ルール

#### 1. 記事内の配置位置

**H2セクション末尾**（内部リンクとして）
```
H2: 給料について
  本文...

  💰 給料や待遇について詳しく知りたい方は、こちらの記事もご覧ください： [記事タイトル]
```

**まとめセクション**
```
H2: まとめ
  まとめ本文...

  H3: より良い職場環境を探している方へ
    本文...

    ⚖️ 退職でお悩みの方へ： 弁護士による退職代行サービス【汐留パートナーズ】 [PR]
    💼 転職・求人をお探しの方へ： 介護職・看護助手の求人なら「ヒューマンライフケア」 [PR]
```

#### 2. リンク数の制限

- **まとめH2セクション**: 最大2-3個
- **H3セクション**: 最大1-2個
- **記事全体**: 過度に多くならないよう調整

#### 3. リンク選択基準

**記事内容に応じて選択**:
- 退職関連記事 → 退職代行サービス
- 給料・待遇記事 → 転職サービス
- 夜勤・シフト記事 → 転職サービス
- 人間関係記事 → 転職サービス + 退職代行

#### 4. Portable Text形式

```javascript
{
  _type: 'block',
  _key: 'block-xxx',
  style: 'normal',
  markDefs: [{
    _key: 'link-xxx',
    _type: 'link',
    href: 'https://...'
  }],
  children: [
    {
      _type: 'span',
      _key: 'span-xxx',
      text: '⚖️ 退職でお悩みの方へ： ',
      marks: []
    },
    {
      _type: 'span',
      _key: 'span-yyy',
      text: '弁護士による退職代行サービス【汐留パートナーズ】',
      marks: ['link-xxx']
    },
    {
      _type: 'span',
      _key: 'span-zzz',
      text: ' [PR]',
      marks: []
    }
  ]
}
```

### アフィリエイトリンク統計（2025-10-10時点）

- **総リンク数**: 424個
- **Amazon**: 87個（30記事）
- **楽天**: 87個（30記事）
- **Moshimo**: 237個（136記事）
- **A8.net**: 9個（7記事）
- **TCS-ASP**: 4個（4記事）
- **収益化率**: 89.7% (124/139記事)

---

## 開発コマンド

### 開発サーバー

```bash
# Next.js開発サーバー（ポート3000）
npm run dev

# Sanity Studio（ポート3333）
npx sanity dev --port 3333
```

### ビルド

```bash
# 本番ビルド
npm run build

# 型チェック
npm run type-check

# リント
npm run lint
```

### アフィリエイトリンク管理

```bash
# リンク統計
node scripts/complete-affiliate-stats.js

# リンク検証
node scripts/verify-affiliate-links-live.js

# リンクヘルスチェック
node scripts/check-affiliate-links-health.js
```

### メンテナンス

```bash
# 重複記事削除（プレビュー）
node scripts/remove-duplicate-posts.js

# 重複記事削除（実行）
node scripts/remove-duplicate-posts.js --execute

# 見出し階層修正
node scripts/fix-h2-after-matome.js

# H3セクション最適化
node scripts/optimize-h3-sections.js
```

---

## デプロイメント

### Vercel

```bash
# デプロイ
vercel

# プレビュー
vercel --preview

# 本番デプロイ
vercel --prod
```

### 環境変数

`.env.local`:
```
NEXT_PUBLIC_SANITY_PROJECT_ID=72m8vhy2
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=sk...（シークレット）
```

---

## SEO設定

### 構造化データ

**実装**: `src/components/StructuredData.tsx`

#### Article
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "記事タイトル",
  "description": "記事の説明",
  "url": "https://prorenata.jp/posts/slug",
  "datePublished": "2025-01-01T00:00:00Z",
  "dateModified": "2025-01-10T00:00:00Z",
  "author": {
    "@type": "Person",
    "name": "著者名"
  },
  "publisher": {
    "@type": "Organization",
    "name": "ProReNata",
    "url": "https://prorenata.jp"
  }
}
```

#### BreadcrumbList
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "ホーム",
      "item": "https://prorenata.jp"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "ブログ",
      "item": "https://prorenata.jp/blog"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "記事タイトル"
    }
  ]
}
```

#### Organization
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "ProReNata",
  "url": "https://prorenata.jp",
  "logo": "https://prorenata.jp/logo.png"
}
```

### 内部リンク最適化

#### 配置戦略
- **セクション末尾配置**: 訴求テキスト + リンク
- **カテゴリベースフロー**: 関連記事への自然な誘導
- **過度なリンク禁止**: 1セクション1リンクまで

#### 形式
```
💰 給料や待遇について詳しく知りたい方は、こちらの記事もご覧ください： [看護助手の給料相場]
```

---

## トラブルシューティング

### Next.js 15 API Route型エラー

**エラー**:
```
Type "RouteContext" is not a valid type for the function's second argument.
```

**解決**:
```typescript
// ❌ 古い書き方
export async function GET(request: NextRequest, context: RouteContext)

// ✅ 正しい書き方（Next.js 15）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
}
```

### Portable Textリンク構造エラー

**問題**: marksがオブジェクトになっている

**修正**:
```javascript
// ❌ 壊れた構造
marks: [{ _key: "link-...", _type: "link", href: "..." }]

// ✅ 正しい構造
marks: ["link-key-xxx"]  // markDefsのキーを参照
```

### 重複記事の削除

```bash
# 1. 調査
node scripts/remove-duplicate-posts.js

# 2. レポート確認
cat internal-links-analysis/duplicate-posts-report.json

# 3. 実行
node scripts/remove-duplicate-posts.js --execute
```

### アフィリエイトリンクが表示されない

**原因**: Next.jsキャッシュ

**解決**:
```bash
# キャッシュクリア & 再ビルド
rm -rf .next
npm run build
npm run dev
```

---

## 追加リソース

### 外部ドキュメント

1. **記事テンプレート**: `/Users/user/Documents/sasakiyoshimasa_article_template_codex.md`
2. **Next.js 15 ドキュメント**: https://nextjs.org/docs
3. **Sanity ドキュメント**: https://www.sanity.io/docs
4. **Tailwind CSS**: https://tailwindcss.com/docs

### 重要な過去の変更

1. **2025-09-12**: フロントエンドデザイン完成（Tailwind標準化）
2. **2025-09-15**: Google Search Console設定完了
3. **2025-09-27**: Sanity Studio プレビューボタン復旧（重大インシデント対応）
4. **2025-10-09**: 内部リンク最適化（セクション末尾配置）
5. **2025-10-10**: Amazon/楽天リンク修正（174箇所）
6. **2025-10-10**: 重複記事削除（17件）
7. **2025-10-10**: アフィリエイトリンク整理・最適化

---

## このドキュメントの使い方

### 新しいAI環境で作業を始める際

1. **このドキュメント全体を読み込ませる**
2. **重要なルール（絶対遵守）セクションを確認**
3. **プロジェクト構造を理解**
4. **関連するMDファイルを参照**:
   - `CLAUDE.md`
   - `UI-DESIGN-LOCK.md`
   - `SEO-FIELDS-LOCK.md`
   - `ARTICLE_GUIDE.md`

### 定期的な更新

このドキュメントは、重要な変更があった際に更新してください:
- 新しいルールの追加
- アフィリエイトリンクの追加
- プロジェクト構造の変更
- 新しいスクリプトの追加

---

**このドキュメントを参照することで、ProReNataプロジェクトの全体像と詳細ルールを把握できます。**
