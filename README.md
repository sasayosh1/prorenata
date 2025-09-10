# ProReNata - 看護助手向け情報サイト

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/sasayosh1/prorenata)

## 📚 概要

ProReNata（プロ・レ・ナータ）は、看護助手として働く方、目指す方のための専門情報サイトです。現場経験者による実践的なガイドを提供し、看護助手の皆様のキャリア形成をサポートします。

「Pro Re Nata」は医療用語で「必要に応じて、その都度」という意味です。

## ✨ 主な機能

- 📝 **100+の専門記事**: 転職、資格、給与、実務ノウハウ
- 🎯 **6つのカテゴリ**: 基礎知識、キャリア、給与、実務、職場情報、悩み相談
- 🔍 **SEO最適化**: 検索エンジンに最適化された構造
- 📱 **レスポンシブデザイン**: PC・スマホ・タブレット対応
- ⚡ **高速パフォーマンス**: Next.js 15 + Sanity CMS
- 🌐 **PWA対応**: アプリライクな体験

## 🛠 技術スタック

- **フレームワーク**: Next.js 15.4.4
- **CMS**: Sanity CMS
- **スタイリング**: Tailwind CSS
- **言語**: TypeScript
- **デプロイ**: Vercel
- **分析**: Google Analytics（設定可能）

## 🚀 クイックスタート

### 1. プロジェクトのクローン

```bash
git clone https://github.com/sasayosh1/prorenata.git
cd prorenata
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

```bash
cp .env.example .env.local
```

以下の環境変数を設定してください：

```env
# Sanity CMS設定
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your_sanity_token

# サイト設定
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## 📂 プロジェクト構造

```
prorenata/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API ルート（サイトマップ、robots.txt）
│   │   ├── nursing-assistant/ # 看護助手専用ページ
│   │   └── posts/          # 記事ページ
│   ├── components/         # 再利用可能コンポーネント
│   └── lib/               # ユーティリティ・設定
├── schemas/               # Sanity スキーマ
├── archive/              # アーカイブされた開発ファイル
└── public/               # 静的ファイル
```

## 📖 コンテンツ管理

### 記事の作成

1. **Sanity Studio**: 直接コンテンツ管理システムで編集
2. **手動作成**: マークダウンまたはリッチテキストエディタ
3. **SEO最適化**: メタデータとキーワード設定

### カテゴリ構成

- 📚 **基礎知識・入門**: 看護助手の基本情報
- 🎯 **キャリア・資格**: 転職・スキルアップ
- 💰 **給与・待遇**: 労働条件・福利厚生
- ⚕️ **実務・ノウハウ**: 現場のテクニック
- 🏥 **職場別情報**: 病院・クリニック等
- 💭 **悩み・相談**: 問題解決・アドバイス

## 🎨 デザインシステム

### カラーパレット
- **プライマリ**: Blue (#3b82f6)
- **セカンダリ**: Purple (#8b5cf6)
- **アクセント**: Pink (#ec4899)

### タイポグラフィ
- **メイン**: Geist Sans
- **コード**: Geist Mono
- **日本語**: Noto Sans JP

## 🔧 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# プロダクションビルド
npm run build

# 本番サーバー起動
npm start

# リンター実行
npm run lint

# 型チェック
npm run type-check

# Vercelデプロイ
npm run deploy
```

## 📊 SEO・パフォーマンス

- ✅ **Core Web Vitals最適化**
- ✅ **構造化データ（JSON-LD）**
- ✅ **動的サイトマップ生成**
- ✅ **robots.txt最適化**
- ✅ **Open Graph / Twitter Cards**
- ✅ **PWA対応**

## 🌍 デプロイ

### Vercelでのデプロイ

1. Vercelアカウントにログイン
2. GitHub リポジトリを接続
3. 環境変数を設定
4. デプロイ実行

### 環境変数設定（Vercel）

```
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your_token
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
NEXT_PUBLIC_GA_ID=your_analytics_id
```

## 🤝 コントリビューション

1. フォークしてください
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. Pull Request を作成

## 📄 ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。詳細は [LICENSE](LICENSE) ファイルをご覧ください。

## 📞 サポート

質問やサポートが必要な場合は、以下までお問い合わせください：

- 📧 Email: [contact@prorenata.com](mailto:contact@prorenata.com)
- 🐦 Twitter: [@prorenata](https://twitter.com/prorenata)
- 🐛 Issues: [GitHub Issues](https://github.com/sasayosh1/prorenata/issues)

## 🙏 謝辞

このプロジェクトは、看護助手として働く全ての方々への感謝と敬意を込めて作成されました。医療現場での貴重な経験と知識を共有していただいている皆様に深く感謝いたします。

---

**Pro Re Nata** - 必要に応じて、その都度。
