# ProReNata プロジェクト現状報告 (2025-10-13)

## 最新の重要な変更

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
- `scripts/check-images.js` - 記事内画像確認

実行方法：
```bash
SANITY_API_TOKEN=$SANITY_API_TOKEN node scripts/analyze-affiliate-links.js
SANITY_API_TOKEN=$SANITY_API_TOKEN node scripts/update-rakuten-links.js
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

---

## 現在のアフィリエイトリンク状況

### 統計（2025-10-13時点）
- **総リンク数**: 170件
- **アフィリエイトを含む記事**: 63記事

### ドメイン別内訳
- **もしも経由** (moshimo.com): 102件
- **Amazon**: 31件（tag=ptb875pmj49-22）
- **楽天市場**: 31件（もしも経由に移行済み）
- **A8.net**: 6件

### 使用中のアフィリエイトコード
1. ヒューマンライフケア: `a_id=5207863` (43回)
2. パソナライフケア: `a_id=5207867` (23回)
3. リニューケア: `a_id=5207862` (16回)
4. クラースショップ: `a_id=5207866` (16回)
5. 楽天市場: `a_id=5207851` (31回) ← **NEW**
6. Amazon: `tag=ptb875pmj49-22` (31回)

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
SANITY_API_TOKEN=sk0JHLbzLymgI7SU6goYNL4xy0y8TjZqpgR8PrcBVuDmgY1Lh828ppX3vBhbArJkZyJV7OvwUK9kKH9mojEOxboJQ9c8MXxVQ3onQ9HgGWxUywl34xYCC18jsQWmjTEzaYvCqcqGn9uHrD13E0v7f5SUFdQBxWz8jWpHcfioQ3zLd9yhCnJi
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
f4f00b7 feat: 楽天市場アフィリエイトリンク移行とリンク表示改善
8f8924b Remove duplicate hero description line
886731a feat: Meta Description一括修正機能を追加
7dee9b2 feat: 商品リンクのUI改善と記事品質ガイドライン追加
```

---

## 次のタスク候補

1. ✅ 楽天市場リンク移行 - **完了**
2. ⚠️ リンク背景色表示問題の解決
3. 📋 他のアフィリエイトコード更新（ユーザー指示待ち）
4. 📋 画像表示機能の動作確認

---

生成日時: 2025-10-13
最終更新: Claude Code
