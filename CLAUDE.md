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
- **実行時刻**: 毎日 深夜3:00 (JST) - 月曜は記事生成の1時間後
- **実行頻度**: 毎日（月30回）
- **ワークフロー**: `.github/workflows/daily-maintenance.yml`
- **内容**: 全記事の品質チェック（必須フィールド、SEO、文字数など）
- **コスト**: 無料（Sanity API無料枠内、月間約5,000リクエスト/無料枠100,000の5%）

**3. X自動投稿**
- **実行時刻**: 毎日 PM8:30-PM9:30の間（ランダム、スパム対策）
- **実行頻度**: 毎日（月30回）
- **ワークフロー**: `.github/workflows/daily-x-post.yml`
- **内容**: ランダム記事をX（Twitter）に自動投稿
- **生成エンジン**: Excerpt直接使用（Gemini API不使用）
- **月間コスト**: 完全無料（Excerptは既に白崎セラ口調で最適化済み）

### キーワード戦略（黄金比）

**ショート1：ミドル3：ロング5**

| キーワードタイプ | 割合 | 記事数目安（150記事中） | 狙い |
|----------------|------|---------------------|------|
| ショートテール | 10-15% | 15〜20記事 | カテゴリ／ガイドページ |
| ミドルテール | 35-40% | 50〜60記事 | **主力トラフィック獲得** |
| ロングテール | 45-55% | 70〜80記事 | CVR・E-E-A-T強化 |

**現在の重点**: ミドルテールを積極的に拡充し、トピッククラスターを形成

## 最近の変更

55. 🎨 **アイテムアフィリエイトの訴求文を記事内容に応じて動的生成** (2025-11-25)
   - **記事内容に応じた訴求文生成**: 記事のタイトル・本文から主要アイテム（シューズ、ユニフォーム、グローブ等）を自動抽出し、それに基づいて訴求文を動的に生成
     - 7つのアイテムカテゴリに対応（シューズ、ユニフォーム、グローブ、ポケットオーガナイザー、文房具、腕時計、備品）
     - 例: シューズ記事では「シューズや滑りにくい靴はナースリーが便利です」のように自動生成
   - **Amazon/Rakutenの統合表示**: Amazon/Rakutenを一つのカード内にまとめて表示
     - 訴求文: 「シューズを買い足すときは、Amazon・楽天で常備しておくと安心です。」
     - [PR] Amazonリンク
     - [PR] 楽天市場リンク
   - **配置場所の最適化**: アフィリエイトリンクを「まとめ」セクションの後、免責事項の前に配置
   - **[PR]バッジのスタイル修正**: 濃いブルー背景からプレーンテキストに変更
   - **affiliateEmbedスキーマの編集可能化**: readOnlyフラグを削除し、Sanity Studioで編集可能に
   - **新規スクリプト**: `scripts/regenerate-shoes-affiliate.js`（記事ごとのアフィリエイト再生成）
   - **効果**: 記事の内容に応じた自然な訴求文により、ユーザー体験と収益性が向上。アイテム記事のテンプレートとして全記事に適用可能

54. 📝 **アイテム記事作成とMeta Description文字数ルール追加** (2025-11-24)
   - **アイテム記事作成**: 「看護助手におすすめのシューズ7選｜現場で本当に使える靴の選び方」を新規作成
     - Amazon/楽天/ナースリーのアフィリエイトリンクを設置
     - 7つの具体的なシューズを紹介（アシックス、ミズノ、ナースリー、ニューバランス、ムーンスター、アキレス、クロックス）
     - 文字数: 約2,090文字、H2見出し: 4個、H3見出し: 13個
   - **CTA文の修正**: アフィリエイトリンクのCTA文から不自然なタイトル引用を削除
     - 修正前: 「「おすすめシューズ7選」で使う小物や...」
     - 修正後: 「小物や替えのグローブなど、毎日使うアイテムは...」
   - **Meta Description文字数ルール追加**: 120〜160文字に統一
     - 既存記事のMeta Descriptionを66文字→116文字に修正
     - 記事作成スクリプトにコメント追加（Excerpt 100〜150文字、Meta Description 120〜160文字）
     - CLAUDE.mdの記事品質基準を更新
   - **効果**: Amazonアフィリエイトの収益化に向けた第一歩。「看護助手 シューズ」「看護助手 靴」などの検索流入が期待できる

6. 🎯 **PRカード表示と記事セクション構成の整理** (2025-11-23)
   - **PRカード表示をブルー背景に統一**: `PortableTextComponents.tsx` の `affiliateEmbed` レンダラから固定のグレーボックス装飾を削除し、Sanity 側のHTMLに付与した `#f0f7ff` ベースのスタイルだけが適用されるよう調整。これにより背景の重なりを解消し、カード全体を薄いブルーで表示。
   - **PRリンクの見やすさ向上**: カード内リンクに下線スタイルを付与し、[PR] ラベル付きのリンクが一目で分かるように改善。
   - **セクション構成の修正**: 「退職代行３社比較」記事に対して `主張 → 理由（箇条書き） → フォロー → 訴求リンク` の順序をスクリプトで再整備。今後もSanity上で同じ手順を守れるよう、Portable Textブロックを再生成。
   - **効果**: PRセクションの視認性が向上し、ユーザーに提示する訴求の順序がガイドラインどおりに統一された。

7. 🔗 **退職代行比較記事のアフィリエイトリンク再設定** (2025-11-24)
   - **弁護士法人みやびのリンク修正**: ValueCommerce経由で無効ページに遷移していたため、`comparison-of-three-resignation-agencies` の `affiliateEmbed` を最新の ValueCommerce コード（計測用1px画像付き）に差し替え。
   - **弁護士法人ガイア法律事務所のリンク修正**: パソナライフケアへ誤誘導されていたURLを、指定の moshiomo（a_id=5211256 etc.）へ更新し、インプレッション画像も設置。
   - **退職代行 即ヤメは維持**: 正常動作を確認したため変更なし。
   - **効果**: 3サービスとも正しいアフィリエイトLPへ遷移し、トラッキングも復旧。

8. 🔁 **アフィリエイト配置の全量リセットと標準化** (2025-11-24)
   - **新規スクリプト**: `scripts/standardize-affiliate-links.js` を追加。全記事（`maintenanceLocked` = true を除外）から `affiliateEmbed` / インラインCTA / `[PR]` 段落を一括削除し、`addAffiliateLinksToArticle()` で定義済みのHTML（薄いブルー背景 + `[PR]` 表記）を再生成する。
   - **実行方法**: デフォルトはドライラン。`node scripts/standardize-affiliate-links.js --apply --slugs=slug-a,slug-b` のように対象スラッグを明示し、必ず `PROJECT_STATUS.md` 等に「対象記事リスト／付与案件」を事前記載する。ロック記事には触れないこと（解除指示があった場合のみ `--include-locked` を使用）。
   - **Amazon/Rakuten/ナースリー**: インラインCTA → `[PR] Amazonリンク` → 改行 → `[PR] 楽天リンク`（必要ならナースリー）という順序に統一。埋め込みカードは `affiliate-card` クラスで薄いブルー背景・角丸なし・太字[PR]バッジを持つ構造に固定した。
   - **効果**: 収益導線をサイト全体で再整備し、過去のリンク欠落やスタイル揺れを解消。今後はスクリプト実行前に slug 指定と案件メモを残すことで、誤更新と収益損失を防止する。

9. 🔧 **A8.net「かいご畑」アフィリエイトコードの完全統一** (2025-11-24)
   - **問題発見**: 複数のスクリプトで異なるA8.netコードが使用されていた
     - `optimize-a8-kaigobatake-links.js`: 間違ったコード（3ZAXGX+DKVSUA+5OUU+5YZ77）を使用
     - `affiliate-products-db.js`: トラッキングピクセルドメインがwww18（正しくはwww17）
     - `moshimo-affiliate-links.js`: トラッキングピクセルドメインがwww15（正しくはwww17）
   - **全記事一括修正**: 98件の記事すべてのトラッキングピクセルを正しいドメイン（www17）に修正
   - **新規スクリプト追加**:
     - `scripts/check-kaigobatake-links.js`: かいご畑リンクの検証ツール
     - `scripts/fix-kaigobatake-tracking.js`: かいご畑リンクの一括修正ツール
   - **正しいアフィリエイト設定**:
     - URL: `https://px.a8.net/svt/ejp?a8mat=2ZTT9A+D2Y8MQ+1W34+C8VWY`
     - トラッキングピクセル: `https://www17.a8.net/0.gif?a8mat=2ZTT9A+D2Y8MQ+1W34+C8VWY`
   - **効果**: A8.net管理画面で正確なクリック数・成果計測が可能に。全スクリプトと全記事（98件）で統一されたコードを使用

10. 🔗 **転職・退職記事のアフィリエイトリンク修正とルール追加** (2025-11-24)
   - **問題発見**: 転職・退職記事に個別アフィリエイトリンクが貼られていた（ルール違反）
   - **修正内容**:
     - 転職・退職記事から個別アフィリエイトリンクを削除（106件）
     - 比較記事への内部リンクに置換
       - 転職記事 → 「看護助手の転職サービス３社を "看護助手の視点だけ" で比較」（`nursing-assistant-compare-services-perspective`）
       - 退職記事 → 「退職代行３社のメリット・デメリット徹底比較」（`comparison-of-three-resignation-agencies`）
     - 内部リンク配置: まとめ後、免責事項前に1箇所（長文記事は中盤にも1箇所）
   - **新規スクリプト追加**: `scripts/fix-career-affiliate-links.js`
     - キーワード検出: 転職・退職関連キーワードで記事を自動判定
     - アフィリエイトブロック削除: `affiliateEmbed` タイプを全削除
     - 内部リンク挿入: 適切な位置に比較記事へのリンクを追加
   - **ルール追加**: CLAUDE.mdに「転職・退職記事のアフィリエイトリンク禁止ルール」を追加
   - **効果**: ユーザーに複数の選択肢を比較検討させる導線を確立。単一サービスへの誘導から比較記事経由の適切な情報提供へ改善

1. ♻️ **制度アップデート体制とナビゲーション改善** (2025-11-21)
   - **制度アップデートフローを文書化**: `docs/policy-update-workflow.md` を追加し、厚労省/JNAなど一次情報の監視ルール・記事更新手順・出典必須チェックリストを明文化。`CLAUDE.md`/`ARTICLE_GUIDE.md` にも即時更新ルールを追記。
   - **出典ルール強化**: `scripts/utils/postHelpers.js` に「厚労働省 看護政策情報・通知一覧」を SOURCE_RULES として追加し、制度/トレンド記事で自動的に一次情報リンクが挿入されるようにした。
   - **読者導線改善**: 記事下部の「次のステップ」をカードUI→テキストリンクへ簡素化し、関連記事→カテゴリ/タグの順で表示を入れ替えた（`src/components/RelatedPosts.tsx`, `src/app/posts/[slug]/page.tsx`）。
   - **ページトップボタン**: `ScrollToTopButton` を追加し、全ページ右下にスクロールで出現する「トップへ戻る」ボタンを実装（`src/components/ScrollToTopButton.tsx`, `src/app/layout.tsx`）。Next.js ビルドはクライアントコンポーネントとして読み込むことで解決済み。
   - **クイズ進捗の端末間共有**: `/api/quiz/progress` を新設し、サーバー側で当日のプレイ済み状態を照会。`MedicalTermQuiz` で名前＋日付に紐づく進捗を取得して10問制限をPC/スマホ間で統一。Gemini利用モデルは `2.5-flash-lite-001` 固定。

1. 🎮 **メディカルクイズの重複問題修正と名称変更** (2025-11-19)
   - **重複問題修正**: 10問中同じ問題が出ないように改善
     - `askedTermIds` stateで出題済み問題を追跡
     - 日次リセット：新しい日になった時に出題済み問題をリセット
     - セッションリセット：名前入力後の新セッション開始時にリセット
     - ファイル: `src/components/MedicalTermQuiz.tsx` (lines 44, 76, 117-138, 151-152)
   - **名称変更**: 「医療用語クイズ」→「メディカルクイズ」
     - よりスタイリッシュで幅広い内容（用語＋実践問題）をカバー
     - SEO対策を維持しながら洗練された印象
     - ファイル: `src/components/MedicalTermQuiz.tsx`, `src/app/quiz/page.tsx`
   - **回答制限変更**: 1日の回答制限を5問→10問に変更（前回実施済み）
   - **効果**: ユーザー体験向上、学習効率アップ、ブランディング強化

2. 🔍 **検索機能改善** (2025-11-19)
   - **検索機能改善**: タイトル、抜粋、スラッグ（slug）の3つのフィールドで検索可能に
     - 従来: タイトルと抜粋のみ検索
     - 改善後: `nursing-assistant-resume-writing` のようなスラッグでも検索可能
     - ファイル: `src/app/search/page.tsx`
   - **効果**: ユーザビリティ向上、検索精度向上

2. 🔧 **メンテナンスチェックの毎日実行化** (2025-11-18)
   - メンテナンスチェックを週1回から毎日実行に変更
   - 実行時刻: 毎日 深夜3:00 (JST) - 月曜は記事生成の1時間後
   - 実行頻度: 週1回（月4-5回）→ 毎日（月30回）
   - 月間APIリクエスト: 約5,000リクエスト（Sanity無料枠100,000の5%）
   - 月間コスト: 無料（Sanity API無料枠内）
   - 効果: 記事品質の継続的な維持・改善が可能に

2. 🎨 **フロントエンドデザイン完成** (2025-09-12)
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
     - Gemini APIモデルをgemini-2.5-flashに統一（⚠️ 後に存在しないモデルと判明、Proにフォールバックしていた）
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

12. 🔗 **アフィリエイトリンクチェックの最適化** (2025-10-26)
   - **変更内容**: メンテナンススクリプトのアフィリエイトリンクチェック機能を最適化
     - ASPアフィリエイト2個超過チェックを削除（ユーザビリティ優先）
     - 複数ASP（転職サイト、退職代行など）の混在は問題なしとして扱う
     - 関連性の低いリンク検出（例: 面接記事に退職代行リンク）は維持
   - **追加ファイル**: `scripts/link-summary.js` 作成
     - 全記事のリンク実装状況を集計（内部リンク、アフィリエイトリンク、外部リンク）
     - 実装率、総数、平均値を表示
   - **現状分析結果**（総記事数145件）:
     - 内部リンク: 95%実装、平均7.0個/記事（推奨2-3個より多い）
     - アフィリエイトリンク: 77%実装、平均1.1個/記事（適切）
     - 外部リンク（出典）: 12%実装、平均0.2個/記事（**要改善**）

13. 🐛 **ワークフローのエラー隠蔽バグ修正** (2025-10-26)
   - **発覚した問題**:
     - 記事自動生成が `continue-on-error: true` により失敗を隠蔽していた
     - SANITY_WRITE_TOKEN エラーが発生していたが、ワークフローは成功判定
     - GitHub Issue が作成されず、エラーに気づけない状態だった
     - 毎日実行される設定になっていた（本来は月・水・金のみ）
   - **修正内容**:
     - `.github/workflows/daily-draft.yml` から `continue-on-error: true` を削除
     - `.github/workflows/daily-maintenance.yml` から `continue-on-error: true` を削除
     - エラー発生時に `failure()` が正しく検出され、GitHub Issue が自動作成されるように改善
     - cron設定を毎日実行（`* * *`）から月・水・金（`1,3,5`）に修正済み（別コミット）
   - **結果**: エラー検出が正常に機能し、問題発生時に即座に通知されるように改善

14. 🚨 **メンテナンススクリプトが実行されていなかった重大バグ修正** (2025-10-26)
   - **発覚した問題**:
     - GitHub Actions で `node scripts/maintenance.js all` を実行していたが、`all` コマンドが未定義
     - 結果、週3回のメンテナンスチェックが**一度も実行されていなかった**
     - 自動修正も一度も行われず、ルール違反の記事が蓄積
     - ワークフローは成功していたが、実際にはヘルプメッセージが表示されるだけだった
   - **追加機能**: `all` コマンドを新規作成
     - `generateReport()` + `autoFixMetadata()` を順次実行
     - 問題検出 → 自動修正可能なものはすべて修正
     - Slug、カテゴリ、Excerpt、Meta Description を白崎セラ口調で再生成
     - プレースホルダーリンク変換、壊れたリンク削除など5つの修復タスク実行
   - **ワークフロー修正**:
     - `SANITY_API_TOKEN` → `SANITY_WRITE_TOKEN` に変更（autofix は書き込み権限必要）
     - ステップ名を「総合メンテナンス開始（検出＋自動修正）」に変更
   - **検出された主な問題**（初回レポート）:
     - 画像なし: 144件（ほぼ全記事）
     - 内部リンク多すぎ: 110件（3個超過）
     - 内部リンクとアフィリエイト近接: 84件
     - 無関係なリンク: 9件（面接記事に退職代行リンクなど）
   - **結果**: 次回の自動実行（月曜AM3:00）から、記事品質が自動改善されるように修正

15. 🗂️ **不適切な「テクノロジー」カテゴリ問題を修正** (2025-10-26)
   - **発覚した問題**:
     - 「テクノロジー」カテゴリ（技術・AI・ウェブ開発）が看護助手ブログに存在
     - 3件の記事（精神的負担、ブランド構築、転職方法）に誤って割り当てられていた
     - 記事生成時にカテゴリが指定されず、後で不適切なカテゴリが自動選択されていた
   - **修正内容**:
     - 3つの記事を適切なカテゴリに再割り当て
       - 精神的負担の記事 → 「悩み・相談」
       - ブランド構築の記事 → 「キャリア・資格」
       - 転職方法の記事 → 「就職・転職活動」
     - 「テクノロジー」カテゴリを完全削除（総カテゴリ数: 17→16種類）
     - 記事生成スクリプトを修正: Gemini AIに16種のカテゴリから最適なものを選ばせる
     - カテゴリ名をIDに変換してSanityに保存する処理を追加
   - **追加スクリプト**:
     - `scripts/check-categories.js`: 全記事のカテゴリ分布確認
     - `scripts/fix-tech-category.js`: テクノロジー記事の修正用
   - **テスト結果**: Gemini AIが「患者対応」カテゴリを正しく選択し、記事生成成功
   - **結果**: 今後の自動生成記事は、常に適切な看護助手関連カテゴリに割り当てられる

16. 📊 **カテゴリ統合とテール戦略の自動バランス調整機能実装** (2025-10-27)
   - **カテゴリ統合（16→14種類）**:
     - 重複カテゴリを統合し、すべて一言に簡素化
       - 「就職・転職活動」+「退職・転職サポート」→「転職」
       - 「キャリア・資格」+「資格取得」→「キャリア」
     - 97件の記事を最適なカテゴリに再配置（全145件中）
   - **カテゴリバランス自動調整**:
     - 記事数が少ない下位5カテゴリからランダム選択し優先生成
     - Gemini AIに優先カテゴリを明示的に指定
     - 週3回の自動生成で偏りを自動解消
   - **テール戦略の自動バランス調整**:
     - キーワード戦略（ショート1:ミドル3:ロング5）を実装
     - テール分類基準: ショート20-30文字、ミドル31-45文字、ロング46文字以上
     - 現在の分布を分析し、不足しているテールを優先生成
     - Gemini AIに文字数制約を厳守させる強化プロンプト
   - **メンテナンススクリプト拡張**:
     - `recategorize` コマンド追加: 全記事のカテゴリを再評価
     - `all` コマンドを拡張: report → recategorize → autofix の3ステップ実行
     - 週3回の自動メンテナンスでカテゴリとテールの両方を最適化
   - **追加スクリプト**:
     - `scripts/reorganize-categories.js`: カテゴリ統合・改名実行
     - `scripts/analyze-keyword-tail.js`: テール分布分析
   - **結果**: 包括的なコンテンツ戦略が自動的に実現し、ユーザーの悩みを網羅的に解決

17. 🧹 **記事冒頭の不要な挨拶文を自動削除する機能を追加** (2025-10-27)
   - **追加機能**: `scripts/utils/postHelpers.js` に `removeGreetings()` 関数を追加
     - 記事冒頭の「こんにちは」「はじめまして」などの挨拶文を検出・削除
     - 「ProReNataブログ編集長の白崎セラです」などの自己紹介文を削除
     - 「病棟で看護助手として働き始めて」などの背景説明を削除
     - 8つの正規表現パターンで包括的に検出
   - **削除対象パターン**:
     - 挨拶表現: 「こんにちは」「はじめまして」
     - 自己紹介: 「白崎セラです」「ProReNataブログ編集長の白崎セラです」
     - ウェルカム: 「ProReNataブログへようこそ」
     - 背景説明: 「病棟で看護助手として働き始めて」「もうすぐ〇年になります」
     - 応援文: 「皆さんの毎日の『お疲れさま』を応援しています」
   - **統合**: `scripts/maintenance.js` の `autoFixMetadata()` 関数に統合
     - 記事本文を自動的にクリーニング
     - 挨拶文が削除された場合はログに「記事冒頭の挨拶文を削除しました」と表示
     - 週3回の自動メンテナンス（月・水・金 AM3:00）で継続的に適用
   - **テスト結果**: 8件の記事で挨拶文削除を確認、すべて正常に動作
   - **効果**:
     - 記事の本題にすぐ入れるようになり、読みやすさが向上
     - SEO最適化にも寄与（導入文が記事の内容を直接説明）
     - 新規記事・既存記事ともに自動的にクリーニング

18. 🐛 **挨拶文削除機能のnullセーフティエラーを修正** (2025-10-27)
   - **問題**: GitHub Actionsでメンテナンススクリプトが "Cannot read properties of undefined (reading 'length')" エラーで失敗
   - **原因特定**:
     - `postHelpers.js` の `blocksToPlainText()` で `block.children` が配列かチェックしていなかった
     - `maintenance.js` の `categoriesForMeta` で全カテゴリ変数が undefined の場合に空配列フォールバックがなかった
     - `maintenance.js` で削除済みの `tooManyASPLinks` プロパティにアクセスしていた
   - **修正内容**:
     - `scripts/utils/postHelpers.js` (line 101): `Array.isArray(block.children)` チェック追加
     - `scripts/maintenance.js` (line 541): `|| []` フォールバック追加
     - `scripts/maintenance.js` (line 1638): `tooManyASPLinks` の存在チェック追加
     - `scripts/maintenance.js` (line 1736-1737): スタックトレース出力追加（デバッグ改善）
   - **テスト結果**:
     - ローカルテストで正常動作確認
     - 9件のDraft記事のPublishが成功
     - Exit code 0 で完全成功
   - **効果**: GitHub Actionsの週次メンテナンス（月・水・金 AM3:00）が正常に動作するように修正

19. 🐛 **GitHub Actions メンテナンスワークフローの権限エラー修正** (2025-10-27)
   - **問題**: GitHub Actionsで2つのエラーが発生
     - `Insufficient permissions; permission "update" required` (Sanity API)
     - `Resource not accessible by integration` (GitHub Issues)
   - **原因特定**:
     - ワークフローに `permissions` セクションがなく `issues: write` 権限が不足
     - `maintenance.js` は `SANITY_API_TOKEN` を使用するが、ワークフローは `SANITY_WRITE_TOKEN` のみ設定
     - 環境変数がインライン設定でスクリプトに正しく渡されていなかった
   - **修正内容**:
     - `.github/workflows/daily-maintenance.yml` に `permissions` セクション追加
       - `contents: read` と `issues: write` を明示的に設定
     - 環境変数を `env:` ブロックで設定
       - `SANITY_API_TOKEN` と `SANITY_WRITE_TOKEN` の両方を設定
     - インライン環境変数設定から `env:` ブロックに変更
   - **効果**:
     - GitHub Issue自動作成機能が正常に動作
     - Sanity API への書き込み権限が正しく設定される
     - 週次メンテナンス（月・水・金 AM3:00）が正常実行可能に

20. 💰 **Gemini APIコスト削減（▼18%削減）** (2025-10-28)
   - **コスト削減効果**: 約640トークン/記事削減、月間7,680トークン削減
   - **プロンプト簡素化**:
     - 白崎セラの人物像：400トークン → 150トークン（▼250トークン）
     - カテゴリ選択指示：削除（▼210トークン）
     - Excerpt生成指示：削除（▼130トークン）
     - Tags生成指示：基本タグのみ（▼50トークン）
   - **メタデータ生成をメンテナンスに移行**:
     - `generateTags()` 関数追加：タイトル・本文から関連タグを自動生成
     - Tags補完機能：2つ以下の場合、最大5つまで自動補完
     - Category、Excerpt、Meta Descriptionは既存機能で対応
   - **品質保証**:
     - タイトル生成（SEO戦略）維持
     - 本文生成（白崎セラ口調、1500-2200文字）維持
     - 構成（導入、H2見出し、まとめ）維持
     - ユーザビリティ、セラの執筆感、収益部分すべて担保
   - **フロントエンド修正**:
     - `PortableTextComponents.tsx`: リンクマーク無効化を解除
     - アフィリエイトリンクが正しくレンダリング（PR表示、外部リンク表示）
   - **アフィリエイトリンク改善**:
     - `separateAffiliateLinks()` 関数追加：リンクを独立した段落として分離
     - `removeClosingRemarks()` 関数追加：「次回のブログも〜」などの締めくくり文を削除
     - 「次のステップ」セクションへの誘導を妨げる文章を自動削除
   - **テスト結果**:
     - 記事生成：正常に動作（簡素化されたプロンプト）
     - メンテナンス：カテゴリ・Excerpt・Tags自動補完成功
   - **効果**: 次回の記事生成（月・水・金 AM2:00）からコスト削減、品質維持

21. 🚨 **緊急修正：Gemini Proモデルへのフォールバック防止（▼90-95%削減）** (2025-10-28)
   - **重大問題の発見**:
     - Google Cloud課金が月間予算¥1,000の50%（¥545）に到達
     - 全費用の100%がGemini API使用料と判明
     - 実際の課金：Gemini 2.5 **Pro** モデル使用（想定の10倍以上）
   - **根本原因**:
     - 全スクリプトで存在しない「gemini-2.5-flash」モデルを指定
     - 結果、自動的にGemini 2.5 Proにフォールバック
     - Pro料金：$5.00/1M output tokens（gemini-1.5-flash-001の約17倍）
   - **緊急対応**:
     - 記事自動生成・メンテナンスワークフローを即座に停止
     - 4つのスクリプト全てを修正：
       - `scripts/run-daily-generation.cjs`
       - `scripts/expand-short-posts.js`
       - `scripts/clean-affiliate-sections.js`
       - `scripts/auto-post-to-x.js`
     - モデル名を「gemini-1.5-flash-001」に統一
   - **コスト削減効果**:
     - 修正前：¥545/月（20記事、Proモデル）
     - 修正後：¥30-50/月（同条件、gemini-1.5-flash-001）→ **約90-95%削減**
     - 週1回実行時：¥6-10/月
   - **最終設定（週1回実行、すべてgemini-1.5-flash-001使用）**:
     - 記事自動生成：週1回（月曜AM2:00）→ ¥6-10/月
     - メンテナンス：週1回（月曜AM3:00）→ 無料（Gemini API未使用）
     - X自動投稿：毎日 → ¥15-45/月
     - **月間コスト総額：¥21-55**（予算¥300の7-18%）
   - **Google Cloud予算アラート**: ¥300/月に設定済み

22. ✅ **X自動投稿のExcerpt直接使用化（完全無料化）** (2025-10-29)
   - **問題**: gemini-1.5-flash-001もv1beta APIで404エラー（Flashモデル全体が非対応）
   - **対応**:
     - Gemini API依存を完全削除
     - Excerpt直接使用に変更（既に白崎セラ口調で最適化済み）
     - GoogleGenerativeAI依存関係を削除
     - GEMINI_API_KEYチェックを削除
   - **質の評価**:
     - Excerptは `scripts/utils/postHelpers.js` の `generateExcerpt()` で生成
     - 記事全体を理解した上で100-150文字に要約
     - 「わたし」一人称、丁寧な「です・ます」調を維持
     - 読者のメリット明確、自然な句読点
     - 140文字制限に自動調整
   - **コスト削減効果**:
     - 修正前：¥15-45/月（Gemini API使用）
     - 修正後：完全無料（Excerpt直接使用）
   - **最終設定（週1回実行、記事生成のみGemini API使用）**:
     - 記事自動生成：週1回（月曜AM2:00）→ ¥6-10/月（gemini-1.5-flash-001）
     - メンテナンス：週1回（月曜AM3:00）→ 無料（Gemini API未使用）
     - X自動投稿：毎日 → **完全無料**（Excerpt直接使用）
     - **月間コスト総額：¥6-10**（予算¥300の2-3%）

23. ✨ **まとめセクション最適化の文字数制約を柔軟化** (2025-10-29)
   - **変更内容**: まとめセクション最適化の文字数制約を柔軟化
     - 従来: 200〜300文字程度の固定制約
     - 変更後: 目安200〜400文字、内容次第で柔軟に調整可
     - ユーザビリティ重視：簡潔さと伝わりやすさのバランスを強調
   - **修正ファイル**: `scripts/utils/postHelpers.js` の `optimizeSummarySection()` プロンプト
   - **効果**:
     - 厳密な文字数制限を撤廃し、コンテンツの質を優先
     - 長すぎず、しっかり伝わる最適な長さに自動調整
     - 次回の週次メンテナンス（月曜AM3:00）から適用

24. 🚨 **Gemini API Pro禁止ルールを全プロジェクトに拡大** (2025-10-29)
   - **変更内容**: Gemini API Proモデル使用禁止を全プロジェクトに適用
     - 従来: prorenataプロジェクトのみ対象
     - 変更後: **今後関わるすべてのプロジェクトで禁止**
   - **理由**: 使用料金が高額（Flashモデルの約17-67倍）
   - **使用可能モデル**: Gemini Flashモデルのみ
     - `gemini-1.5-flash-001`（推奨・安定版）
     - `gemini-1.5-flash`
     - その他Flashバリエーション
   - **使用禁止モデル**: すべてのProモデル
     - `gemini-2.5-pro`
     - `gemini-1.5-pro`
     - その他すべてのProバリエーション
   - **効果**: 今後すべてのプロジェクトでコスト最適化を徹底

25. 🔗 **アフィリエイトリンク・出典リンク自動挿入機能を実装（収益化・YMYL対策）** (2025-10-29)
   - **重大な問題を発見・解決**:
     - 最新記事にアフィリエイトリンク0件、出典リンク0件
     - ASP管理画面でカウントされていない原因を特定
     - 記事生成・メンテナンススクリプトにリンク挿入機能がなかった
   - **実装内容**:
     - **アフィリエイトリンク自動挿入** (`addAffiliateLinksToArticle()`)
       - 記事内容に応じて最適な1-2個のリンクを自動選択
       - 「まとめ」セクションの前に独立ブロックとして配置
       - 本文とは完全分離（ユーザビリティ重視）
       - 7種類のASPコード完備（報酬合計 最大16,500円/件）
     - **出典リンク自動追加** (`addSourceLinksToArticle()`)
       - YMYL対策：厚生労働省・日本看護協会の公式データ
       - 記事タイトルから適切な出典を自動選択
       - 「まとめ」セクションの最後に配置
   - **配置ルール**:
     - セクションの一番下に配置
     - 本文の文章中には入れない
     - 報酬額よりユーザビリティ優先
     - 不自然でない配置を重視
   - **修正ファイル**:
     - `scripts/utils/postHelpers.js`: 2つの新関数追加
     - `scripts/maintenance.js`: import・関数呼び出し・ログ出力追加
   - **効果**:
     - 収益化: ASPリンクが正しく設置され、カウントされるように
     - YMYL対策: 信頼できる出典リンクでSEO評価向上
     - 自動化: 週次メンテナンスで全記事に自動適用（月曜AM3:00）

26. 🔧 **Slug生成ルールの改善（SEO対策）** (2025-10-29)
   - **問題**: 一部の記事で `nursing-assistant-article-019823-1` のような数字羅列のSlugが存在
   - **改善内容**:
     - **単語数制限を2-3個 → 2-4個に拡張**
       - `scripts/utils/postHelpers.js` の `generateSlugFromTitle()` 修正（line 425）
       - `scripts/maintenance.js` の `needsSlugRegeneration()` 修正（line 220）
     - **数字のみのセグメント検出を追加**
       - `/^\d+$/` パターンで数字のみのセグメントを検出
       - 例: `article-019823-1` の `019823` と `1` が検出され、再生成対象に
     - **既存の不適切なSlugを自動修正**
       - メンテナンススクリプトで自動検出・再生成
       - 数字羅列を避けた、キーワードベースのSlugに置き換え
   - **検出条件**（以下のいずれかに該当）:
     - セグメント数が2未満
     - セグメント数が4より多い
     - 数字のみのセグメントが含まれている（SEO対策）
   - **効果**:
     - SEO評価向上：キーワードベースのSlugで検索エンジンに最適化
     - 自動化：週次メンテナンス（月曜AM3:00）で全記事を自動チェック・修正

27. ✨ **Gemini API不使用時の高品質フォールバック機能を実装** (2025-10-29)
   - **背景**: Gemini API利用不可時の簡易版が単純すぎて記事品質が低下
   - **実装内容**:
     - **テキスト処理ヘルパー関数**
       - `stripFormatting()`: マークダウンフォーマットを削除
       - `truncateText()`: テキストを指定文字数に切り詰め
     - **H3セクション用高品質フォールバック** (`generateFallbackH3Paragraph()`)
       - 8種類のコンテキスト対応パターン配列（睡眠、夜勤、コミュニケーション、ストレス、転職、患者対応、安全、段取り）
       - セクションタイトル（H2）、見出し（H3）、箇条書きサンプルを活用
       - 白崎セラ口調で自然な本文を自動生成
     - **まとめセクション用高品質フォールバック** (`buildFallbackSummaryBlocks()`)
       - 記事全体から重要ポイントを自動抽出
       - 3部構成（導入段落 → 箇条書き → 締めの段落）
       - 記事タイトル、H2、H3、箇条書きから最大3つのハイライトを選択
     - **アフィリエイトリンク関連性チェック強化** (`isAffiliateSuggestionRelevant()`)
       - 退職代行リンク：タイトル・本文・Slug・カテゴリの複合チェック
       - 就職・転職リンク：関連キーワードチェック
       - アイテムリンク：グッズ・ユニフォーム関連チェック
       - 関連性の低いリンク挿入を防止
     - **`addAffiliateLinksToArticle()` 機能拡張**
       - `currentPost` パラメータ追加（Slug・カテゴリ情報を活用）
       - 関連性チェックを通過したリンクのみ挿入
   - **修正ファイル**: `scripts/utils/postHelpers.js`
   - **効果**:
     - Gemini API不使用時でも高品質な記事生成が可能
     - コスト削減（API使用料¥6-10/月 → ¥0）しながら品質維持
     - アフィリエイトリンクの不自然な配置を防止（ユーザビリティ向上）
     - 週次メンテナンス（月曜AM3:00）で自動適用

28. 🔧 **白崎セラのペルソナ定義モジュール化＆GA4設定** (2025-11-05)
   - **ペルソナ定義の共通モジュール化**:
     - 新規作成: `scripts/utils/seraPersona.js`
     - SERA_FULL_PERSONA: 記事生成用の詳細なペルソナ定義
     - SERA_BRIEF_PERSONA: 記事拡張用の簡潔版
     - LANGUAGE_RULES_SUMMARY: ドキュメント用の要約
   - **「がんばる」禁止ルール追加**:
     - 理由: 読者はすでに全力で取り組んでいる。励ましの意味でも誤解や反発を招く可能性がある
     - 代替表現: 「取り組む」「進める」「実行する」「応援しています」「サポートします」など
     - 休息の重要性: 「休むのも仕事のうち」。しっかり休息を取ることで、しっかり働ける。心と身体は繋がっている
   - **既存スクリプトの更新**:
     - `scripts/run-daily-generation.cjs`: SERA_FULL_PERSONAを使用
     - `scripts/expand-short-posts.js`: SERA_BRIEF_PERSONAを使用
     - 両スクリプトのGeminiモデルを gemini-2.0-flash-lite-001 に更新（コスト最適化）
   - **GA4設定完了**:
     - `.env.local`に NEXT_PUBLIC_GA_ID=G-HV2JLW3DPB を追加
     - 既存のGA4実装コード（layout.tsx, analytics.ts, Analytics.tsx）を確認済み
   - **メリット**:
     - ペルソナ定義の一元管理による保守性向上
     - 言葉遣いルールの一貫性保証
     - 今後の更新が1箇所で完結
     - コード重複の削減

29. 🧩 **「まとめ」セクション監視＆復旧フローを追加** (2025-11-07)
   - **背景**: 新規記事や大幅改稿後に「まとめ」H2を別タイトルへ差し替えると、週次メンテが走るまで締めのトーンが崩れるケースが発生（例: `nursing-assistant-mental-care-support`）
   - **実装内容**:
     - `scripts/maintenance.js` に `findPostsMissingSummary()` を追加し、`node scripts/maintenance.js missing-summary` で欠損を即検出できるようにした
     - CLIヘルプへ新コマンドを追記し、週次メンテ前でもゼロチェック可能に
   - **運用ルール**:
     - 週次の `sanitize` 実行前に `missing-summary` を走らせ、結果が0件でない場合は `sanitize --slugs=<comma区切り> --force-links` で復旧
     - sanitize は「まとめ」見出し＋フォールバック本文を自動追記するため、手動での書き直しは不要
   - **今回の復旧**:
     - `node scripts/maintenance.js sanitize --slugs=nursing-assistant-mental-care-support --force-links` を実行し、当該記事に再び「まとめ」セクションを挿入
     - コマンド後に `missing-summary` を再実行し、全記事0件を確認済み

30. ⚖️ **免責事項ブロックを「まとめ」直後に固定** (2025-11-08)
   - **背景**: 一部記事で免責事項が本文中に挟まれ、まとめより前に表示されていた
   - **実装内容**:
     - `ensureDisclaimerPlacement()` を新設し、メンテナンス時に免責事項を必ず記事末尾へ再配置
     - まとめ再配置後に必ず実行することで、「まとめ」の段落直後に免責事項を固定
     - ログと集計に「免責事項配置」カウンタを追加し、再発監視
   - **運用**:
     - `sanitize`（GitHub Actions含む）を走らせれば全記事で自動適用
     - 新規記事もメンテナンス後に自動で正しい位置へ移動

31. 📝 **H2見出しから「セラ」を自動排除し、一人称を「わたし」に統一** (2025-11-08)
   - **背景**: 記事を初めて読む人が「セラ？誰？」と感じて離脱するのを防ぐため、見出しではキャラクター名を出さない方針
   - **実装内容**:
     - `sanitizeBodyBlocks()` 内でH2見出しに含まれる「セラ」を検出し、自動的に「わたし」へ置換
     - 変更件数を `H2調整` としてログ・集計に追加し、週次メンテレポートで確認可能にした
     - 新ルールを「⚠️ 重要なルール」へ追記
   - **運用**:
     - `sanitize` 実行時に自動で置換されるため、手動編集時もH2内に「セラ」と書かない（個人的な語りは本文のみで「わたし」を使用）
    - **併せて実施**:
      - `addSourceLinksToArticle()` を非同期化し、HEAD/GETで到達できないURLには出典リンクを挿入しない
      - `normalizeReferenceLinks()` で解決不可だった一次資料ブロックは丸ごと削除し、404リンクを強制的に排除
      - `SOURCE_RULES` と `REFERENCE_MAPPINGS` を到達確認済みのURLに刷新

32. 💼 **アフィリエイト枠は最大2件（Amazon/Rakuten除く）＋枠内CTAに統一** (2025-11-08)
   - **背景**: 退職代行記事でCTA段落＋Embedが何度も重複し、さらに扱っていない案件（汐留パートナーズ）が差し込まれていた
   - **実装内容**:
     - `scripts/moshimo-affiliate-links.js` から `shiodome` 案件を削除し、Embed HTML にCTA/説明文を含めた枠デザインを生成
     - `addAffiliateLinksToArticle()` と `removeIrrelevantAffiliateBlocks()` で「Amazon/Rakuten以外は1記事2件まで」「同じリンクKeyは1回のみ」ルールを強制
     - `ensureAffiliateContextBlocks()` をノーオペ化し、枠外CTAや重複テキストを自動除去
   - **効果**:
     - 退職代行記事でも `弁護士法人みやび` / `退職代行 即ヤメ` の2件に揃い、CTA文は全て枠内に表示
     - 決まった案件のみ挿入されるため、ユーザーの指示と一致しない提携先が紛れ込むリスクを防止

33. 📚 **一次資料のホワイトリスト化とリンク検証** (2025-11-08)
    - **背景**: 自動で挿入された出典リンクが404だったり関連性が乏しく、SEO観点で逆効果になっていた
    - **実装内容**:
      - `SOURCE_RULES`/`REFERENCE_MAPPINGS` を厚労省jobtag・JNAガイドライン・NsPace Careerなどユーザー指定URLだけに限定し、HEAD/GETが200のときのみ採用
      - `addSourceLinksToArticle()` にタイトル/本文/カテゴリ/スラッグを渡してスコアリングし、トピックに最適な出典を1件に絞って挿入
      - `normalizeReferenceLinks()` が解決できなかった出典ブロックは削除し、ログに `出典削除` を記録
    - **効果**:
      - 404や無関係なリンクは自動的に除去され、常に省庁・専門団体・指定コラムのみを参照
      - 給与/退職/仕事内容などテーマ別に一貫した根拠ページを提示できるようになった

34. 🗂️ **カテゴリ語彙の正規化とStudio同期コマンド導入** (2025-11-09)
   - **背景**:
     - Sanity Studio 上に旧「転職・キャリア」「給与・待遇」などのカテゴリ名が残り、スクリプト側の公的語彙（離職理由・賃金水準…）と不一致だった
     - その結果、`selectBestCategory()` のスコアリングやリンク自動挿入が旧語彙に依存し、退職系/給与系の挙動が不安定だった
   - **実装内容**:
     - `scripts/utils/categoryMappings.js` を新設し、正規ラベル・キーワード・説明・参照スニペットを一元管理、`getNormalizedCategoryTitles()` を公開
     - `scripts/utils/postHelpers.js` / `scripts/maintenance.js` に正規化ロジックを導入し、カテゴリ判定・内部リンク・アフィリエイト判定が公式語彙で動くようにした
     - `maintenance.js` に `syncCategoryDefinitions()` を追加し、Studio内のカテゴリ文書を自動でリネーム＆説明差し替え
     - CLIコマンド `node scripts/maintenance.js sync-categories` を追加し、Pull直後や環境復旧時に1コマンドで同期できるようにした
     - 執筆ドキュメント（`ARTICLE_GUIDE.md` / `PROJECT_KNOWLEDGE_BASE.md`）を更新し、11カテゴリの正式名称と根拠URLを明示
   - **効果**:
     - すべてのスクリプトが「離職理由 / 賃金水準 / 就業移動（転職）…」といった公的語彙で統一され、出典リンクやアフィリエイト判定の精度が大幅に向上
     - Studioで旧名称を見かけた場合も `sync-categories` ですぐに復旧できる運用フローが整備された
     - 記事作成ガイドに正式カテゴリが掲載されたため、手動入稿時も迷わず同じ語彙を選べる

35. 🔧 **ポート番号を明示的に設定（toyamablogとの競合解消）** (2025-11-09)
   - **背景**: toyamablogとprorenataの両プロジェクトがデフォルトポート3000を競合し、意図しないプロジェクトが起動する問題が発生
   - **実装内容**:
     - prorenata: `package.json` に明示的なポート設定を追加
       - `dev: next dev -p 3000`（Next.js開発サーバー）
       - `dev:sanity: npx sanity dev --port 3333`（Sanity Studio）
     - toyamablog: 同様に明示的なポート設定を追加
       - `dev: next dev -p 4000`（Next.js開発サーバー）
       - `dev:sanity: npx sanity dev --port 4444`（Sanity Studio）
   - **効果**:
     - 両プロジェクトのポート番号が明確に分離され、競合が完全に解消
     - prorenata: http://localhost:3000 + http://localhost:3333
     - toyamablog: http://localhost:4000 + http://localhost:4444
     - プロジェクト切り替え時の混乱がなくなり、作業効率が向上

36. 📚 **医療用語データベースとメンテナンススクリプト追加** (2025-11-09)
   - **背景**: 医療用語記事の管理を効率化し、コンテンツ品質を向上させる必要があった
   - **実装内容**:
     - **新規スクリプト追加**（13ファイル）:
       - `check-medical-terms-article.cjs`: 医療用語記事の検証
       - `expand-medical-terms-claude.cjs`: Claude APIによる用語展開
       - `expand-medical-terms-manual.cjs`: 手動用語展開用ツール
       - `expand-medical-terms.cjs`: 基本用語展開機能
       - `update-*-section.cjs`: 各セクション更新スクリプト（9種類）
         - 略語、解剖、医療器具、薬剤、栄養・排泄、体位変換、医療処置、症状・観察、バイタルサイン
       - `verify-article-data.cjs`: 記事データ検証ツール
       - `utils/categoryMappings.js`: カテゴリマッピング定義
     - **既存ファイル更新**:
       - `ARTICLE_GUIDE.md`: 医療用語ガイドラインを更新
       - `PROJECT_KNOWLEDGE_BASE.md`: プロジェクト知識ベースに医療用語管理を追加
       - `scripts/maintenance.js`: メンテナンス機能を拡張
       - `scripts/utils/postHelpers.js`: ヘルパー関数を改善
   - **効果**:
     - 医療用語記事の更新作業が自動化され、作業効率が大幅に向上
     - 用語の一貫性とコンテンツ品質が向上
     - スクリプトによる検証で人為的ミスを削減
     - 医療用語データベースの拡張が容易に

37. 🔁 **全160記事のsanitize再実行（Flash Lite固定＋リンク強制挿入）** (2025-11-09)
   - **背景**:
     - 旧ブランド表現削除やカテゴリ正規化後に、全記事へ最新ルール（免責事項・リンク配置）を行き渡らせたい
     - 過去にGemini Pro／Vertexへフォールバックして高額請求になったため、モデル固定とコスト記録が必須
   - **実施内容**:
     - `MAINTENANCE_ENABLE_GEMINI=1 MAINTENANCE_FORCE_LINKS=1 node scripts/maintenance.js sanitize --force-links` を2回（1回目タイムアウト→再実行で完走）実行
     - Geminiモデルを `gemini-2.0-flash-lite-001` に固定し、スクリプト側も同モデルに切り替え
     - 各記事のまとめ最適化・免責事項配置・出典リンク・内部リンク・アフィリエイト枠を再構成
     - 退職/転職/アイテム記事は適切な案件のみ残し、Amazon/Rakuten以外のASPリンクは最大2件に収束
     - 404出典や重複CTAが検出された場合は自動削除し、最新テンプレートで再挿入
   - **結果/コスト**:
     - 160本すべて更新、Gemini呼び出しは1記事あたり約0.2円 → 合計約35円（$0.23）で完了
     - Pro/Vertexへのフォールバックは一切なし（ログ確認済み）、`geminiMaintainedAt` も最新化
     - 免責事項無し・リンク欠落・まとめ欠損といった再発ポイントを0件まで解消

38. 🛠️ **Sanity StudioでのMissing keys / Unknown field警告を根絶** (2025-11-10)
   - **背景**:
     - 自動生成された新規記事をStudioで開くと、Body・Categoriesに「Missing keys」、authorに「Unknown field found」が毎回表示されていた
     - Portable Textブロックやカテゴリ参照に `_key` が付与されておらず、スクリプト側でauthorフィールドを送信している一方でschemaからは削除されていた
   - **実装内容**:
     - `scripts/utils/keyHelpers.js` を追加し、Portable Text／参照配列に一意な `_key` を自動的に補う共通ヘルパーを実装
     - `run-daily-generation.cjs` と `scripts/create-post.js` で生成直後の本文に `_key` を付与し、カテゴリ参照にも `_key` を設定
     - `scripts/maintenance.js` の `sanitizeBodyBlocks()`、カテゴリ再割当箇所、手動メンテ系スクリプトにヘルパーを導入し、週次メンテでも欠落キーを再付与
     - Post schema に `author` フィールドを hidden + readOnly で復活させ、Studioフォームには表示しないまま警告だけ抑制
     - 仕上げに `MAINTENANCE_ENABLE_GEMINI=0` で `node scripts/maintenance.js sanitize` を再実行し、既存160本すべての Body / Categories に `_key` を付与
   - **効果**:
     - 新規記事を開いても Missing keys / Unknown field 警告が出なくなり、手動で「Add missing keys」を押す作業が不要に
     - 既存記事の Portable Text / カテゴリ参照にもキーが揃ったため、Studio/Preview どちらでも安全に編集可能
     - 今後どのスクリプトで記事を生成・更新しても `_key` が自動付与される仕組みが整備された

39. 🛍️ **ナースリー案件の無制限化とアフィリエイト間隔ルール追加** (2025-11-10)
   - **背景**: Amazon/Rakuten同様、ナースリーも複数アイテム紹介時に何度でも設置したい一方、通常記事でアフィリエイト枠が密集すると可読性が落ちる
   - **実装内容**:
     - `NON_LIMITED_AFFILIATE_KEYS` に `nursery` を追加し、ナースリーの枠を無制限カテゴリへ移行
     - `removeIrrelevantAffiliateBlocks()` に「アイテム紹介記事かどうか」を判定するロジックを追加し、通常記事ではアフィリエイトEmbedの間に最低2ブロックの本文を挟むよう制御
     - 「○○アイテム◯選」「便利グッズ特集」などのタイトル/スラッグのみ密集表示を許可
   - **効果**:
     - アイテム特化記事ではAmazon/Rakuten/ナースリーを必要数だけ掲載できる
     - それ以外の記事ではアフィリエイト枠が連続しなくなり、ユーザー体験とSEOの両立が可能に

40. 🔐 **内部限定記事フラグ（internalOnly）とNoIndex対応** (2025-11-10)
   - **背景**: 「退職代行３社のメリット・デメリット徹底比較」のように、各記事からのみ遷移できる内部資料を作りたいという要望
   - **実装内容**:
     - `schemas/post.ts` に `internalOnly` (boolean) フィールドを追加。Studioでチェックすると「一覧・検索・サイトマップに出さず、robots noindex」を自動適用
     - `src/lib/sanity.ts` のクエリ（一覧/検索/関連記事/カウント）を `internalOnly != true` でフィルタし、通常の露出から除外
     - 記事ページの `generateMetadata` が `internalOnly` を検知すると `<meta name="robots" content="noindex,nofollow">` を設定
     - サイトマップAPIも `internalOnly` 記事を出力しないよう更新
     - comparison-of-three-resignation-agencies（draft）に `internalOnly: true` をセットアップ
   - **運用**:
     - 内部限定にしたい記事はStudioでチェックを入れるだけ
     - maintenance/sanitize等は通常通り走る（リンク・出典は整備される）が、フロント露出・検索・サイトマップには載らない

41. 🔁 **退職記事は内部比較記事へ誘導＆退職代行ASPを除外** (2025-11-10)
   - **背景**: 退職カテゴリの記事では、今後はアフィリエイトではなく「退職代行３社のメリット・デメリット徹底比較」への内部リンクを貼りたい
   - **実装内容**:
     - `shouldAddResignationComparisonLink()` を追加し、離職系カテゴリや本文に「退職/辞めたい/退職代行」などのキーワードがある記事を検出
     - 対象記事では `removeIrrelevantAffiliateBlocks()` が退職代行系 ASP（みやび/即ヤメ）を全削除、`addAffiliateLinksToArticle()` も再挿入しない
     - 代わりに `/posts/comparison-of-three-resignation-agencies` への内部リンクブロックを `ensureResignationComparisonLink()` で必ず挿入
     - 内部リンクの前後2ブロック以内に退職代行ASPが残っている場合は自動で除去
   - **効果**:
     - 退職記事からは比較記事への動線が必ず確保され、ASPリンクは自然発生しない
     - 他カテゴリの記事では従来通り ASP が維持されるため、収益とユーザビリティの両方を担保

38. 🐛 **GitHub Actions maintenance_check エラー修正（2回の修正）** (2025-11-10)
   - **第1回修正: forceLinkMaintenance変数のスコープエラー**
     - **問題**: GitHub Actions の `maintenance_check` ワークフローで `ReferenceError: forceLinkMaintenance is not defined` エラーが発生
     - **原因**:
       - `forceLinkMaintenance` 変数が `sanitizeAllBodies` 関数（line 3259）で定義されていた
       - しかし `autoFixMetadata` 関数（line 2789, 2802）でも使用されており、そこでは未定義だった
       - JavaScriptのスコープ問題により ReferenceError が発生
     - **修正内容**:
       - `autoFixMetadata` 関数の冒頭（line 2650-2657）に `forceLinkMaintenance` 変数の定義を追加
       - 環境変数 `MAINTENANCE_FORCE_LINKS` から値を取得するロジックを実装
       - `sanitizeAllBodies` 関数と同じロジックで一貫性を保持
   - **第2回修正: sourceLinkDetails/affiliateLinksAdded変数のスコープエラー**
     - **問題**: 手動ワークフロー実行後、`ReferenceError: Cannot access 'sourceLinkDetails' before initialization` エラーが発生
     - **原因**:
       - `sourceLinkDetails` 変数が line 2815 で使用されているが line 2835 で宣言されていた（Temporal Dead Zone違反）
       - `affiliateLinksAdded` 変数も同様の問題があった
       - 重複したコードブロック（lines 2822-2842）が混乱を招いていた
     - **修正内容**:
       - `sourceLinkDetails` と `affiliateLinksAdded` を関数スコープに移動（lines 2696-2697）
       - 各ループ内で変数をリセット（lines 2708-2709）
       - 重複したコードブロックを削除（lines 2826-2838をコメントに置き換え）
   - **効果**:
     - GitHub Actions の週次メンテナンスワークフローが正常に動作
     - 変数スコープの問題を根本的に解決
     - 今後のメンテナンススクリプト実行時にエラーが発生しない

39. 🐛 **GitHub Actions メンテナンスワークフローのtotalAffiliateLinksInserted変数未定義エラーを修正** (2025-11-13)
   - **問題**: GitHub Actions の `maintenance_check` ワークフローで `ReferenceError: totalAffiliateLinksInserted is not defined` エラーが発生
   - **原因**:
     - `autoFixMetadata` 関数（line 3276）で `totalAffiliateLinksInserted` 変数が未定義
     - line 3467 で使用されているが、関数スコープで宣言されていなかった
     - 同様に `affiliateLinksInserted` 変数も未定義だった
   - **修正内容**:
     - `totalAffiliateLinksInserted` 変数を関数スコープに追加（line 3349）
     - `affiliateLinksInserted` 変数を関数スコープに追加（line 3348）
     - ループ内で `affiliateLinksInserted` をリセット（line 3364）
     - コミット: fcabe3c
   - **効果**:
     - GitHub Actions のメンテナンスワークフローが正常に動作
     - 変数スコープエラーを完全に解決
     - 週次メンテナンスが正常に実行可能に

40. 🐛 **メンテナンススクリプトの正規表現構文エラーを修正** (2025-11-13)
   - **問題**: GitHub Actions の `maintenance_check` ワークフローで新たに `SyntaxError: Invalid regular expression flags` エラーが発生
   - **原因**:
     - 232行目、246行目、287行目の正規表現で `\\` (バックスラッシュ2つ) が使用されていた
     - JavaScript正規表現リテラルではバックスラッシュ1つでエスケープすべき
     - Node.jsが `\\` を1つのバックスラッシュとして解釈し、その後の文字を正規表現フラグとして解釈しようとしてエラー
   - **修正内容**:
     - 232行目: `/prorenata\\.jp(\ \/posts\\/[^?#]+)/` → `/prorenata\.jp(\/posts\/[^?#]+)/`
     - 246行目: `/^\\/posts\\/` → `/^\/posts\//`
     - 287行目: `/^\\/posts\\/` → `/^\/posts\//`
     - コミット: 91e9a17
   - **効果**:
     - メンテナンススクリプトが構文エラーなしで正常に起動
     - GitHub Actions ワークフローが完全に正常動作
     - JavaScript正規表現の適切なエスケープ処理を確立

41. 🐛 **module.exportsの後の孤立したコードを削除** (2025-11-13)
   - **問題**: GitHub Actions の `maintenance_check` ワークフローで `ReferenceError: denseParagraphsSplit is not defined` エラーが発生
   - **原因**:
     - lines 5948-5952に `denseParagraphsSplit` 変数を参照するコードが存在
     - このコードはmodule.exports（line 5947）の後に配置されており、関数スコープの外にあった
     - 変数は関数内でのみ定義されているため、module.exports後のコードからはアクセスできずReferenceErrorが発生
   - **修正内容**:
     - lines 5948-5952の孤立したコードを完全に削除
     - 削除したコード：
       - `if (denseParagraphsSplit > 0) { totalDenseParagraphsSplit += denseParagraphsSplit }`
       - `if (denseParagraphsSplit > 0) { console.log(\`   長文段落を読みやすく分割: ${denseParagraphsSplit}箇所\`) }`
     - コミット: b5b7985
   - **効果**:
     - GitHub Actions の週次メンテナンスワークフローが正常に動作
     - module.exportsの後に実行可能なコードが存在しないことを保証
     - 変数スコープエラーを根本的に解決

42. 🐛 **sanitizeAllBodies関数にinternalLinkTitleMapの定義を追加** (2025-11-13)
   - **問題**: GitHub Actions の `maintenance_check` ワークフローで `ReferenceError: internalLinkTitleMap is not defined` エラーが発生
   - **原因**:
     - `sanitizeAllBodies` 関数（line 4224）で `internalLinkTitleMap` 変数が使用されていた
     - しかし、この変数は `autoFixMetadata` 関数内（line 3343）でのみ定義されており、`sanitizeAllBodies` 関数内では未定義だった
     - 異なる関数スコープで定義された変数を参照しようとしてReferenceErrorが発生
   - **修正内容**:
     - `sanitizeAllBodies` 関数内にも `internalLinkTitleMap` の定義を追加（line 4033）
     - `const internalLinkTitleMap = buildInternalLinkTitleMap(internalLinkCatalog)` を追加
     - `internalLinkCatalog` から `internalLinkTitleMap` を生成するロジックを実装
     - コミット: b36babc
   - **効果**:
     - GitHub Actions の週次メンテナンスワークフローが正常に動作
     - 関数スコープごとに必要な変数を適切に定義
     - 内部リンクのタイトル置換機能が正常に動作

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
  - `scripts/auto-post-to-x.js`: **Gemini API不使用**（Excerpt直接使用）
- **モデル移行履歴**:
  - 2025-11-04以前: `gemini-1.5-flash-001`（廃止により404エラー）
  - 2025-11-04以降: `gemini-2.0-flash-lite-001`（バージョン固定、最低コスト、Proフォールバック防止、Vertex AI禁止）
- 違反した場合は重大な課金が発生するため最重要違反となる

43. 🎯 **用語解説記事への転職アフィリエイト誤検出を防止** (2025-11-13)
   - **問題**: 「看護助手の用語ガイド」のような用語解説記事に転職アフィリエイトリンクが誤って挿入されていた
   - **原因**:
     - `isAffiliateRelevant()` 関数の転職判定で「キャリア」というキーワードが含まれていた
     - 用語解説記事でも「キャリア形成」「キャリアパス」などの文脈で「キャリア」が使われるため誤検出
     - 結果として、転職とは無関係な記事にも転職アフィリエイトが配置されていた
   - **修正内容**:
     - `maintenance.js` の `isAffiliateRelevant()` 関数（line 1066-1084）にネガティブキーワード判定を追加
     - 用語解説系キーワード検出: `/用語.*ガイド|用語.*解説|.*とは|.*の違い|定義|基礎知識|名称.*違い/`
     - スラッグ検出: `/terminology|glossary|definition/`
     - 該当する場合は転職アフィリエイトを不要と判定（`return false`）
   - **効果**:
     - 用語解説記事から転職アフィリエイトが確実に除外される
     - 他の記事（実際の転職文脈）には影響なし、収益機会を失わない
     - ユーザー体験が向上（無関係なアフィリエイトの削減）

44. 📚 **出典リンク配置ルールと参考リンク統合機能を追加** (2025-11-13)
   - **背景**: 出典リンクが見出し直下に配置されるなど、配置ルールが不明確だった
   - **実装内容**:
     - **出典リンク配置ルール追加** (`ARTICLE_GUIDE.md`)
       - H2/H3直下に「参考: …」を配置しないルールを追加
       - 必ず説明本文を書いてから出典を配置
       - 複数の参考リンクや内部リンクを連続させない（本文で区切る）
       - メンテナンススクリプトも同ルールで再配置
     - **参考リンク統合機能** (`scripts/maintenance.js`)
       - `combineReferenceGroup()` 関数を追加（約90行）
       - 連続する複数の参考リンクを1つの段落に統合
       - スラッシュ区切りで複数リンクを表示（例: 「参考: 資料A / 資料B / 資料C」）
       - ユーザビリティ向上のためリンク密集を防止
     - **.gitignore更新**
       - `maintenance-batch.log` をgit管理から除外
       - `scripts/tmp/` ディレクトリをgit管理から除外
   - **効果**:
     - 出典リンクの配置が適切になり、読みやすさが向上
     - 複数の参考リンクが1行にまとまり、視認性向上
     - ログファイルがgit管理から除外され、リポジトリがクリーンに
     - 週次メンテナンス（月曜AM3:00）で自動適用
   - **コミット**: 7da7749

45. 📊 **GA4・Search Console連携によるSEO分析システム構築** (2025-11-13)
   - **背景**: PDCAサイクル構築のため、GA4とSearch Consoleのデータを自動収集・分析する仕組みが必要
   - **実装内容**:
     - **Pythonスクリプト作成** (`scripts/analytics/`)
       - `fetch-gsc-data.py`: Search Consoleデータ取得（過去30日間）
         - クリック・表示回数・CTR・平均掲載順位
         - 日付・ページ・クエリ・国・デバイス別ディメンション
       - `fetch-ga4-data.py`: GA4データ取得（過去30日間）
         - セッション・ユーザー・イベント・エンゲージメント率
         - 日付・ページ・デバイス・国別ディメンション
       - `analyze-seo-performance.py`: SEO分析レポート生成
         - トップ10ページ分析
         - トップ20検索クエリ分析
         - CTR改善機会（表示多いが低CTR）
         - 掲載順位改善機会（4-10位で表示多い）
     - **GitHub Actionsワークフロー** (`.github/workflows/daily-analytics.yml`)
       - 実行時刻: 毎朝 09:00 JST（00:00 UTC）
       - 処理フロー: GSCデータ取得 → GA4データ取得 → 分析レポート生成 → コミット
       - エラー時: GitHub Issue自動作成
       - 手動実行も可能（workflow_dispatch）
     - **設定ファイル**
       - `requirements.txt`: Python依存関係（google-analytics-data, google-api-python-client等）
       - `README.md`: セットアップ・使用方法の詳細ドキュメント
       - `.gitignore`: データファイル（*.csv, *.md）除外
   - **設定値**:
     - GA4プロパティID: `504242963` （ProReNata）
     - GSCプロパティURL: `https://prorenata.jp/`
   - **次のステップ（ユーザー側で実施）**:
     1. GCPサービスアカウント作成＆JSONキー取得
     2. Search Console API・Analytics Data API有効化
     3. Search Console へサービスアカウントを招待（Full権限）
     4. GA4 へサービスアカウントを招待（Analyst/Editor権限）
     5. GitHub Secretsに `GCP_SERVICE_ACCOUNT_KEY` を設定
   - **効果**:
     - 毎日自動でSEOパフォーマンスデータを収集
     - データ駆動型の改善ポイント特定
     - PDCAサイクルを回せる基盤が整備
     - 完全無料（GitHub Actions無料枠内）
   - **コミット**: de06550

46. 🔧 **GitHub Actionsワークフロー修正（Analytics自動コミット対応）** (2025-11-14)
   - **問題**: GitHub Actionsで生成したAnalyticsデータファイルがコミットできない2つのエラーが発生
     - エラー1: `.gitignore`で`data/*.csv`と`data/*.md`が除外されていた
     - エラー2: Pythonキャッシュ設定が原因で「Post Setup Python」エラーが発生
   - **修正内容**:
     - **`.gitignore`修正** (commit: 66329f0)
       - `data/*.csv`と`data/*.md`の除外設定を削除
       - Analyticsデータファイルをgit管理対象に変更
       - GitHub Actionsの自動コミットが正常動作するように修正
     - **GitHub Actionsワークフロー修正** (commit: ed1f5af)
       - `.github/workflows/daily-analytics.yml`から`cache: 'pip'`と`cache-dependency-path`を削除
       - Pythonキャッシュエラーを解消
       - Python依存関係は軽量なためキャッシュ不要
   - **効果**:
     - GitHub Actionsでの自動データ収集・コミットが正常動作
     - 毎朝9:00 JSTに自動実行可能
     - PDCAサイクルのデータ蓄積が開始
   - **次のステップ**: ユーザー側でGCPサービスアカウント作成とAPI設定を実施

47. 🔁 **重複セクション検出コマンドと全件スキャン** (2025-11-15)
   - `scripts/maintenance.js` に `detectDuplicateSections()` ヘルパーと `findDuplicateContentIssues()` を追加し、CLIコマンド `duplicates`（`--slugs` / `--min-length` 対応）を実装
   - H2/H3見出しの重複、および80文字以上の段落の重複を洗い出しレポートする仕組みを整備
   - コマンドヘルプとエクスポート関数を更新し、他スクリプトからも利用可能に
   - 実行結果: 公開対象163件をスキャンし、90件で重複見出し・本文を検出（例: `/posts/nursing-assistant-care-guide-practice` など). 優先修正対象を把握できるようになった
48. 🪢 **CTAブロックと重複リライトの強化** (2025-11-15)
   - `scripts/moshimo-affiliate-links.js` でコンテキスト別CTAテンプレートを追加し、各アフィリエイトリンクの直前に `[PR]` 付き訴求文を自動挿入（転職/アイテム/個別キー対応）
   - CTAブロックもPortable Textとして生成するため、配置ルールとリンク削除ルールに干渉せずメンテナンスで再配置可能に
   - `nursing-assistant-career-change-school` を全面リライトし、進学ルート/準備ステップを1回ずつ説明。関連内部リンク（1日ルーティン、看護師ルート記事）と参考資料・免責事項を本文末尾に設置
   - `nursing-assistant-qualifications-needed` を `sanitize --force-links` で再整備し、新CTA表記・[PR]ブロックが適切に付与されることを確認
49. 🧩 **重複上位記事の再構成（パート勤務・ストレス対策）** (2025-11-15)
   - `/posts/nursing-assistant-part-time-day` と `/posts/nursing-assistant-stress-ranking` を完全再執筆し、H2/H3重複や冗長な箇条書きを排除。タイムライン→段取り→まとめのシンプル構成に変更
   - それぞれ適切な内部リンク（1日ルーティン記事、比較記事）と参考資料・免責事項をまとめ直後へ整理
   - `node scripts/maintenance.js duplicates --slugs=...` で重複0件を確認し、 `sanitize --force-links` を実行して新CTA・出典・内部リンク配置を強制適用
   - サニタイズ結果で残った文字数警告（1950文字帯）は追記済み。今後も `duplicates --top-views=20 --cooldown=7` を指標に同手順で順次リライトする
50. 🔒 **メンテナンス・バイブ自動編集ロックを追加** (2025-11-16)
   - `schemas/post.ts` に `maintenanceLocked` ブールを追加。Studioでは「自動編集ロック」トグルとして表示し、trueにすると自動処理対象から除外
   - `scripts/maintenance.js` の `PUBLIC_POST_FILTER` と `filterOutInternalPosts` を更新し、ロック済み記事をすべてのメンテ／duplicates／sanitize処理から排除（`--slugs=`指定時も取得しない）
   - `shouldAddResignationComparisonLink` など内部処理でもロック状態を尊重するように変更
51. 🧼 **アフィリエイトhrefの自動修復** (2025-11-16)
   - `sanitizeAllBodies` に `sanitizeLinkMarkDefs()` を追加し、`href` に `<a ...>` が残っている場合は正規表現で本来のURLを抽出して上書き。修復件数をログと統計に出力
   - 比較記事（退職代行３社／転職サービス３社）で発生していた「リンクが無効化される問題」の再発を防止

52. 🐛 **GitHub Actions メンテナンスワークフローのremovePersonaName関数エラー修正** (2025-11-17)
   - **問題**: GitHub Actions の `maintenance_check` ワークフローで `TypeError: removePersonaName is not a function` エラーが発生
   - **原因**: `scripts/utils/postHelpers.js` で `removePersonaName` 関数が定義されているが、`module.exports` に含まれていなかった
   - **修正内容**:
     - `scripts/utils/postHelpers.js:1788` に `removePersonaName` を `module.exports` に追加
     - `generateExcerpt` と `generateMetaDescription` で使用されている関数を正しくエクスポート
   - **テスト結果**:
     - ✅ インポートテスト成功
     - ✅ 「白崎セラです」→「看護助手です」の変換動作確認
     - ✅ 既存テキストへの影響なし確認
   - **効果**: 週次メンテナンスワークフロー（毎週月曜AM3:00 JST）が正常に実行可能に

53. 🐛 **MedicalTermQuizのビルドエラー修正** (2025-11-17)
   - **問題1**: Next.js ESLintエラー - `<a>`タグの使用
     - `./src/components/MedicalTermQuiz.tsx:331:13` で検出
     - 内部ナビゲーションに HTML `<a>` タグを使用していた
   - **問題2**: TypeScript型エラー - `currentTerm` がnullの可能性
     - `./src/components/MedicalTermQuiz.tsx:382:23` で検出
     - nullチェックが不十分で型推論が失敗
   - **修正内容**:
     - `import Link from 'next/link'` を追加
     - 2つの `<a>` タグを `<Link>` コンポーネントに置き換え（/quiz/rankings と /）
     - `currentTerm` のnullチェックを追加（lines 359-362）
   - **コミット**:
     - 7e259ba: Next.js ESLintエラー修正
     - 13f06a1: TypeScript nullチェックエラー修正
   - **効果**: GitHub Actionsビルドワークフローが成功

## ⚠️ 重要なルール

**🚫 UIデザイン変更の完全禁止**
- レイアウト、色、フォント、スタイルの変更は絶対禁止
- 詳細は `UI-DESIGN-LOCK.md` を参照
- 違反した場合は最重要事項の不遵守となる
