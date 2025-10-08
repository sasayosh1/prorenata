# ProReNata

> 看護助手の現場経験を活かし、実践的で役立つ情報をお届けします。

Next.js + Sanity CMS + TypeScript で構築された看護助手向け情報サイトです。

## 🛠 技術スタック

- **フロントエンド**: Next.js, React, TypeScript
- **CMS**: Sanity
- **スタイリング**: Tailwind CSS
- **デプロイ**: Vercel
- **フォント**: Geist (Vercel製)
- **Analytics**: Google Analytics (G-HV2JLW3DPB)

## 🚀 クイックスタート

### ローカル開発

1. **依存関係インストール**
   ```bash
   npm install
   # または
   pnpm install
   ```

2. **環境変数設定**
   ```bash
   cp .env.example .env.local
   # 必要に応じて値を編集
   ```

3. **開発サーバー起動**
   ```bash
   npm run dev
   # または
   pnpm dev
   ```

4. **ブラウザでアクセス**
   ```
   http://localhost:3000
   ```

### Sanity Studio起動

1. **Sanity Studio開発サーバー起動**
   ```bash
   npx sanity dev --port 3007
   ```

2. **ブラウザでSanity Studioにアクセス**
   ```
   http://localhost:3007
   ```

### 記事の追加・編集

1. Sanity Studio（http://localhost:3007）にアクセス
2. 「Post」から新しい記事を作成
3. 以下の項目を入力：
   - **Title**: 記事タイトル（必須、最大120文字）
   - **Slug**: URL用識別子（自動生成）
   - **Body**: 記事本文（リッチテキストエディタ）
   - **Main Image**: メイン画像（任意）
   - **Categories**: カテゴリ（複数選択可）
   - **Published at**: 公開日時
   - **Author**: ProReNata編集部（統一済み）

## 📝 記事管理（Sanity CMS）

### 記事構造

```typescript
// schemas/post.ts で定義
{
  title: string,          // 記事タイトル（必須、最大120文字）
  slug: {                 // URL用スラッグ（必須、自動生成）
    current: string
  },
  body: Array,            // 記事本文（リッチテキスト、画像対応）
  mainImage?: Image,      // メイン画像（任意）
  categories?: Array,     // カテゴリ（複数選択可）
  publishedAt: DateTime,  // 公開日時
  author: Reference       // 著者（ProReNata編集部に統一）
}
```

### 画像の追加

1. Sanity Studioの本文エディタで画像アイコンをクリック
2. 画像ファイルをアップロード
3. 代替テキスト（alt）を入力
4. 画像の位置やサイズを調整

## 🔧 設定

### Sanity CMS設定

`sanity.config.ts` で以下を設定:
- プロジェクトID: `72m8vhy2`
- データセット: `production`
- APIバージョン: `2024-01-01`

### 環境変数

`.env.local` に以下を設定:
```env
# Sanity設定
NEXT_PUBLIC_SANITY_PROJECT_ID=72m8vhy2
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your_api_token_here

# サイト設定
NEXT_PUBLIC_GA_ID=G-HV2JLW3DPB
```

### スキーマ設定

※ サイトのベースURLは `src/lib/constants.ts` 内の `SITE_URL` 定数で管理しています。

`schemas/` ディレクトリでコンテンツ構造を定義:
- `post.ts`: 記事スキーマ
- `category.ts`: カテゴリスキーマ
- `author.ts`: 著者スキーマ

## 🚢 デプロイ（Vercel）

1. **GitHubにプッシュ**
   ```bash
   git add .
   git commit -m "Initial ProReNata blog"
   git push origin main
   ```

2. **Vercel設定**
   - [Vercel](https://vercel.com) でアカウント作成
   - "New Project" → GitHubリポジトリを選択
   - Framework: Next.js （自動検出）
   - Environment Variables に `.env.local` の内容を追加
   - Deploy

3. **カスタムドメイン設定**
   - Vercel ダッシュボード → Settings → Domains
   - `prorenata.jp` を追加し、DNSレコードを設定
   - 現在のURL: https://prorenata.jp

## 📂 プロジェクト構造

```
prorenata/
├── src/                   # Next.js アプリケーション
│   ├── app/              # App Router（Next.js 13+）
│   ├── components/       # Reactコンポーネント
│   └── lib/              # ライブラリ・ユーティリティ
├── schemas/              # Sanityスキーマ定義
│   ├── post.ts          # 記事スキーマ
│   ├── category.ts      # カテゴリスキーマ
│   └── author.ts        # 著者スキーマ
├── tools/               # 開発ツール
│   └── bridge/          # ブリッジワークフロー
├── scripts/             # スクリプト
├── public/              # 静的ファイル
├── sanity.config.ts     # Sanity設定
└── next.config.js       # Next.js設定
```

## 📊 現在の状況

### 記事データ

- **総記事数**: 139記事
- **Author**: 全記事「ProReNata編集部」に統一済み
- **カテゴリ**: 地域名ベースのカテゴリ設定
- **データベース**: Sanity CMS (production)

### 運用中の機能

- ✅ 記事の作成・編集・公開
- ✅ カテゴリ管理
- ✅ 画像アップロード・管理
- ✅ SEO最適化
- ✅ レスポンシブデザイン
- ✅ Google Analytics 連携

### ブリッジワークフロー

codex環境での開発・デプロイをサポート:
```bash
# ベースライン作成（初回のみ）
npm run bridge:baseline

# 変更差分エクスポート
npm run bridge:export

# ローカルで適用・push
./scripts/apply_and_push.sh <repo> <changeset> <branch> "<message>"
```

## 🔧 開発・管理コマンド

### 基本コマンド

```bash
# 開発サーバー起動
npm run dev

# Sanity Studio起動
npx sanity dev --port 3007

# ビルド
npm run build

# 型チェック
npm run type-check

# リント
npm run lint
```

### Author管理

```bash
# 現在のAuthor状況確認
node check-authors.js

# 全記事のAuthor更新
SANITY_API_TOKEN="your_token" node update-authors.js
```

### ブリッジワークフロー

```bash
# ベースライン作成
npm run bridge:baseline

# 変更差分エクスポート
npm run bridge:export
```

## 🔄 管理・運用

### コンテンツ管理
- **Sanity Studio**: http://localhost:3007
- **記事作成・編集・公開**: リッチテキストエディタ
- **カテゴリ・Author管理**: 地域名ベースの分類

### 開発ワークフロー
- **codex環境**: 読み取り専用環境での開発
- **ブリッジワークフロー**: 自動changeset生成・適用
- **GitHub連携**: 自動コミット・プッシュ

### 分析・最適化
- **Google Analytics**: G-HV2JLW3DPB
- **SEO最適化**: メタデータ・構造化データ
- **レスポンシブデザイン**: 全デバイス対応

## 📞 技術サポート

- [Next.js ドキュメント](https://nextjs.org/docs)
- [Sanity ドキュメント](https://www.sanity.io/docs)
- [TypeScript ドキュメント](https://www.typescriptlang.org/docs)
- [Tailwind CSS ドキュメント](https://tailwindcss.com/docs)

---

**Pro Re Nata** - 必要に応じて、その都度
