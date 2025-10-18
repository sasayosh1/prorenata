# ProReNata プロジェクト現状報告 (2025-10-18)

## 最新の重要な変更

### 📝 文字数不足記事の自動加筆完了 ✅
- **日時**: 2025-10-19
- **内容**: Gemini APIを使用して文字数不足記事を自動加筆
- **実施内容**:
  1. **加筆スクリプト作成** - `scripts/expand-short-posts.js`
     - Gemini 2.0 Flash Experimental モデル使用
     - YMYL準拠のコンテンツ生成（断定表現回避、柔らかい表現使用）
     - 既存の記事構造を維持しながらセクションごとに内容追加
     - Sanity Portable Text形式への自動変換
     - DRY RUNモード（プレビュー）と--applyモード（実行）
  2. **103記事を一括加筆**
     - 対象: 2000文字未満の記事103件
     - 加筆完了: 103件（成功率100%）
     - エラー: 0件
     - 平均文字数増加: **+2,408文字/記事**
     - APIレート制限対策: 各リクエスト後に2秒待機
  3. **検証完了**
     - 2000文字未満の記事: **0件**（完全解消！）
     - 生成コンテンツの品質確認済み（自然な日本語、適切な見出し構造）
- **コスト**: 約30円（Gemini API有料範囲内）
- **使用モデル**: gemini-2.0-flash-exp
- **重要度**: SEO強化（文字数確保）、ユーザー価値向上

### 🏥 YMYL対策完了 ✅
- **日時**: 2025-10-18
- **内容**: 医療・健康分野のGoogle品質基準（YMYL）に準拠した記事品質向上施策を完了
- **完了項目**:
  1. **断定表現の修正** - 37記事
     - 「絶対」「必ず」「間違いなく」などの断定表現を柔らかい表現に変更
     - スクリプト: `scripts/fix-absolute-expressions.js`
  2. **統計データ出典リンク追加** - 14記事、16件の出典追加
     - 給与・施設統計データに厚生労働省等の公的機関出典を追加
     - スクリプト: `scripts/add-citations.js`
  3. **医療行為の制限セクション追加** - 47記事
     - 「看護助手ができないこと（重要）」セクションを追加
     - 注射・投薬など医療行為の禁止事項を明記
     - スクリプト: `scripts/add-medical-restrictions.js`
- **重要度**: Google検索品質向上のための最重要施策

### 📊 アフィリエイトリンク最適化完了 ✅
- **日時**: 2025-10-18
- **コミット**: (保存予定)
- **内容**: 記事内アフィリエイトリンクの品質改善を実施
- **第1フェーズ**: 52記事で111リンク削除
  - **連続リンク削減**: 55リンク削除（2つ以上連続するリンクの間引き）
  - **無関係リンク削除**: 23リンク削除（退職代行リンクを非退職記事から削除）
  - **過剰リンク削減**: 33リンク削除（1記事あたり最大3リンクに制限）
- **第2フェーズ**: 残り19記事を追加最適化完了
  - 合計13記事を最適化（6記事は既に最適化済み）
  - 連続リンク削減、無関係リンク削除を実施
- **第3フェーズ**: 孤立した訴求文（CTA）の削除完了
  - 74記事から119個の孤立したCTAブロックを削除
  - リンク削除後に残っていた「退職でお悩みの方へ」「について詳しくはこちら」等の訴求文を整理
- **最終結果**（maintenance.js reportより）:
  - **連続リンク**: 35件 → **1件**（97%改善！）
  - **リンク多すぎ**: 40件 → **0件**（100%解消！）
  - **関連性低い**: 48件 → **10件**（79%改善！）
- **新規スクリプト**:
  - `scripts/optimize-affiliate-links.js`
  - `scripts/remove-orphaned-ctas.js`
- **重要度**: ユーザー体験向上とGoogle品質評価改善

### 🔗 内部リンク自動設置完了 ✅
- **日時**: 2025-10-18
- **内容**: 全記事に適切な内部リンクを自動設置し、SEO強化とユーザビリティ向上を実現
- **実施内容**:
  1. **内部リンク自動設置スクリプト作成** - `scripts/add-internal-links.js`
     - キーワードベースの関連記事検出システム（30+キーワードマッピング）
     - セクション（H2/H3）ごとの内容分析
     - 最大2リンク/セクションで過剰配置を防止
     - 📖 アイコン付きの視認性向上デザイン
  2. **全142記事に639個の内部リンクを設置**
     - セクション末尾または項目後に自然に配置
     - 記事内容との関連性を考慮した適切なリンク選定
  3. **maintenance.jsに内部リンクチェック機能追加**
     - 内部リンク数チェック（推奨: 2個以上）
     - 壊れた内部リンクの検出
- **最終結果**（maintenance.js internallinksチェックより）:
  - **内部リンク不足**: 142記事中わずか7記事のみ（95%が適切なリンク数を確保）
  - **壊れたリンク**: 0件（完璧！）
- **スクリプト**:
  - `scripts/add-internal-links.js` - 内部リンク自動設置
- **重要度**: SEO強化（内部リンク構造改善）、ユーザー回遊率向上

### 🔧 環境設定更新 ✅
- **日時**: 2025-10-18（2回目更新）
- **内容**: Sanity API Tokenを新しいEditorトークンに更新
- **ファイル**: `.env.local`
- **新トークン**: skfM8OirMvwXssxg7zFZ9h0vqAFjNlvuJLbKoENsfr5k0XTuUqI9zz7liwUR8036qr3ufUhtlvEcwoOK3QsDKkuTlbsFfcMmEousWhzynyGG49eXXFL3GeAwdhO3ESGD6KvwhYR2SfDCqxD3vMWhEKizPbzJf0BhlSFSiyvboPhvL17O0W3G
- **テスト結果**: 正常に動作確認完了（maintenance.js report実行成功）

### 🚨 重大インシデント：Git保存漏れによる他環境での作業停止 ⚠️
- **日時**: 2025-10-18
- **インシデント内容**:
  - YMYL対策とアフィリエイトリンク最適化の作業完了後、ユーザーから「全部保存」の指示があったにも関わらず、git commit & pushを実行せず
  - その結果、他の環境で作業を継続できず、大きな時間のムダが発生
  - ドキュメント更新(PROJECT_STATUS.md)とmaintenance.js修正も保存されていなかった
- **原因**:
  - 「全部保存」の指示を受けた時点で即座にgit保存を実行しなかった
  - 作業完了時の自動保存プロトコルが徹底されていなかった
- **対策**:
  - **今後は作業完了時に必ず自動的に `git add -A && git commit && git push` を実行**
  - ユーザーへの確認は不要、自動実行を徹底
  - 「全部保存」「保存」などの指示があった時点で即座に実行
- **影響**: ユーザーの貴重な時間を無駄にした重大なミス
- **再発防止**: このインシデントをPROJECT_STATUS.mdに記録し、今後同様のミスを防止

---

## 以前の重要な変更

### 1. 楽天市場アフィリエイトリンク移行完了 ✅
- **日時**: 2025-10-13
- **コミット**: f4f00b7
- **内容**: 楽天市場リンク31件を直接リンクからもしも経由に一括変更
- **旧URL**: `https://search.rakuten.co.jp/search/mall/...`
- **新URL**: `//af.moshimo.com/af/c/click?a_id=5207851&p_id=54&pc_id=54&pl_id=621`
- **対象**: 11記事31リンク（成功率100%）
- **重要度**: 最重要インシデント級タスク（コードミスは重大事故）

### 2. アフィリエイトリンク管理スクリプト追加 ✅
新規作成されたスクリプト：
- `scripts/analyze-affiliate-links.js` - 全記事のアフィリエイトリンク分析
- `scripts/list-unique-affiliate-links.js` - ユニークなリンク一覧
- `scripts/update-rakuten-links.js` - 楽天リンク一括更新
- `scripts/optimize-affiliate-links.js` - アフィリエイトリンク最適化（2025-10-18追加）
- `scripts/remove-orphaned-ctas.js` - 孤立したCTA訴求文削除（2025-10-18追加）
- `scripts/add-internal-links.js` - 内部リンク自動設置（2025-10-18追加）
- `scripts/expand-short-posts.js` - 文字数不足記事自動加筆（2025-10-19追加）
- `scripts/check-images.js` - 記事内画像確認

実行方法：
```bash
SANITY_API_TOKEN=$SANITY_API_TOKEN node scripts/analyze-affiliate-links.js
SANITY_API_TOKEN=$SANITY_API_TOKEN node scripts/optimize-affiliate-links.js check
SANITY_API_TOKEN=$SANITY_API_TOKEN node scripts/optimize-affiliate-links.js optimize-all --apply
SANITY_API_TOKEN=$SANITY_API_TOKEN node scripts/remove-orphaned-ctas.js check
SANITY_API_TOKEN=$SANITY_API_TOKEN node scripts/remove-orphaned-ctas.js remove --apply
SANITY_API_TOKEN=$SANITY_API_TOKEN node scripts/add-internal-links.js check
SANITY_API_TOKEN=$SANITY_API_TOKEN node scripts/add-internal-links.js add-all --apply
SANITY_API_TOKEN=$SANITY_API_TOKEN GEMINI_API_KEY=$GEMINI_API_KEY node scripts/expand-short-posts.js check
SANITY_API_TOKEN=$SANITY_API_TOKEN GEMINI_API_KEY=$GEMINI_API_KEY node scripts/expand-short-posts.js expand <POST_ID> --apply
SANITY_API_TOKEN=$SANITY_API_TOKEN GEMINI_API_KEY=$GEMINI_API_KEY node scripts/expand-short-posts.js expand-all --apply
```

### 3. リンク表示UI改善 ✅
- **内部リンク背景色**: #fff4f4（薄ピンク）
- **アフィリエイトリンク背景色**: #f4ffff（薄シアン）
- **変更ファイル**:
  - `tailwind.config.js` - カスタムカラー追加
  - `src/components/PortableTextComponents.tsx` - スタイル適用

### 4. もしもアフィリエイト検出追加 ✅
- `PortableTextComponents.tsx`の`isAffiliateLink()`関数に`/moshimo\.com/i`パターン追加
- もしも経由リンクに📢アイコン表示

### 5. 画像表示機能追加 ✅
- `PortableTextComponents.tsx`に`types.image`ハンドラー追加
- Sanity CDN経由で画像を表示

### 6. アフィリエイトリンク一括置き換え完了 ✅
- **日時**: 2025-10-13
- **コミット**: 4a32232
- **内容**: 53記事61リンクを一括更新（成功率100%）
- **置き換え内訳**:
  1. パソナライフケア(24件) → アルバトロス転職 (a_id=5211244)
  2. リニューケア(17件) → アルバトロス転職 (a_id=5211244)
  3. クラースショップ(16件) → ナースリー (ValueCommerce sid=3755453)
  4. かいご畑コード更新(4件): a8mat=3ZAXGX → a8mat=2ZTT9A
- **新規追加スクリプト**:
  - `scripts/replace-affiliate-links.js`
  - `scripts/analyze-links-to-replace.js`

### 7. Gemini AIによる記事ドラフト生成 ✅
- **日時**: 2025-10-17
- **内容**: Gemini AIを使用して「看護助手 働きながら転職活動 成功のコツ」に関する記事ドラフトを生成し、Sanityに保存しました。
- **ドラフトID**: `drafts.gxyxv316c0oeG6AdOIZRvr`
- **特記事項**: 
  - 生成スクリプトのJSONパース問題を修正しました。
  - `gemini-pro-latest`モデルと`apiVersion: 'v1'`を使用するように設定しました。

---

## 現在のアフィリエイトリンク状況

### 統計（2025-10-13時点）
- **総リンク数**: 170件 (※置き換えにより内訳変動)
- **アフィリエイトを含む記事**: 63記事

### ドメイン別内訳
- **もしも経由** (moshimo.com): 102件 (※一部置き換え)
- **Amazon**: 31件（tag=ptb875pmj49-22）
- **楽天市場**: 31件（もしも経由に移行済み）
- **A8.net**: 6件 (※一部更新)

### 使用中のアフィリエイトコード
1. ヒューマンライフケア: `a_id=5207863` (43回)
2. アルバトロス転職: `a_id=5211244` (24件 + 17件 = 41回) ← **NEW** (パソナライフケア、リニューケアから置き換え)
3. ナースリー: `sid=3755453` (16回) ← **NEW** (クラースショップから置き換え)
4. 楽天市場: `a_id=5207851` (31回)
5. Amazon: `tag=ptb875pmj49-22` (31回)
6. かいご畑: `a8mat=2ZTT9A` (4回) ← **UPDATED** (旧コード: `a8mat=3ZAXGX`)

---

## 技術スタック

- **フレームワーク**: Next.js 15.5.4
- **CMS**: Sanity 4.10.2
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **React**: 19.1.0
- **本番URL**: https://prorenata.jp
- **Sanity Project**: 72m8vhy2 (production dataset)

---

## 重要な環境変数

```bash
SANITY_API_TOKEN=skPFlui2yNjyM39wGsffTHiC5yOPj0nwCA0Kw31sRVZAiijcOq1A6S8Gnr1KDa4mY9HJIxCXGGJcsOs45AWgsUQSmTbwBARZHaMvBSUwqgR8FMLwQZS8cH1NQ5qJg1A6gDs5ug7bImqm0rSONuGQYrFr3NdJ5bVKwVOr88KXzWBw7KLLcnAh
```

---

## 未解決の課題

### 1. リンク背景色が表示されない問題 ⚠️
- **状況**: tailwind.config.jsに色を追加したが、ブラウザで表示されない
- **試行済み**:
  - .nextキャッシュクリア
  - dev server再起動（複数回）
  - `backgroundColor` → `colors` に変更
- **次のステップ**: さらなるトラブルシューティングが必要

### 2. 他のアフィリエイトコード更新 📋
ユーザーから提供された新しいコード（まだ未実装）：
- アルバトロス転職（新規）
- ナースリー（ValueCommerce新規）
- パソナライフケア、リニューケア、クラースショップ（削除検討？）

---

## 禁止事項（絶対厳守）

### 🚫 UIデザイン変更の完全禁止
- レイアウト、色、フォント、スタイルの変更は絶対禁止
- 詳細: `UI-DESIGN-LOCK.md`

### 🚫 SEOフィールド設定の変更禁止
- excerpt, metaDescription, tagsのみ使用
- 詳細: `SEO-FIELDS-LOCK.md`

### 🚨 Google Analytics/Search Console コード改変の完全禁止
- 測定ID: G-HV2JLW3DPB
- DNS TXT確認レコード

### 🚨 Sanity Studio プレビューボタン機能の完全保護
- `src/sanity/actions/PreviewAction.tsx`の削除禁止
- `sanity.config.ts`のPreviewAction設定の削除・変更禁止

---

## 直近のgit履歴

```
4a32232 feat: アフィリエイトリンク一括置き換え完了（最重要インシデント級）
ea0b248 docs: プロジェクト現状報告書を追加
f4f00b7 feat: 楽天市場アフィリエイトリンク移行とリンク表示改善
8f8924b Remove duplicate hero description line
886731a feat: Meta Description一括修正機能を追加
7dee9b2 feat: 商品リンクのUI改善と記事品質ガイドライン追加
```

---

## 次のタスク候補

1. ✅ 楽天市場リンク移行 - **完了**
2. ✅ アフィリエイトリンク一括置き換え - **完了**
3. ✅ Gemini AIによる記事ドラフト生成 - **完了**
4. ✅ YMYL対策（断定表現、出典リンク、医療行為制限） - **完了**
5. ✅ アフィリエイトリンク最適化（全記事完了） - **完了**
6. ✅ maintenance.jsの「次のステップ」チェック無効化 - **完了** (RelatedPostsコンポーネントで自動表示済み)
7. ✅ 「まとめ」セクションガイドライン追加 - **完了**
8. ✅ 孤立したCTA訴求文削除（74記事、119ブロック削除） - **完了**
9. ✅ 内部リンク自動設置（142記事、639リンク） - **完了**
10. ✅ 文字数不足記事の自動加筆（103記事、Gemini API使用） - **完了**
11. 📋 Excerpt/MetaDescription自動生成（8記事、Gemini API使用）
12. ⚠️ リンク背景色表示問題の解決
13. 📋 画像表示機能の動作確認

---

生成日時: 2025-10-13
最終更新: 2025-10-19 (文字数不足記事自動加筆完了)
