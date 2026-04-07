# FAQ自動生成 仕様書

> 最終更新: 2026-04-07
> スクリプト: `scripts/generate-top-faq.cjs`

---

## 1. 目的と概要

記事に FAQPage 構造化データ（JSON-LD）を付与し、Google 検索での強調表示（リッチリザルト）獲得を狙う。
FAQ は Gemini で自動生成し、Sanity の `post.faq` フィールドに保存する。

```
[手動実行 or GitHub Actions]
  └─ Sanity から対象記事を取得
  └─ 記事タイトル + 本文（先頭2,000文字）を Gemini に渡す
  └─ FAQ 3問を JSON で受け取る
  └─ Sanity にパッチ（post.faq フィールドを上書き）
  └─ フロントエンドが自動的に構造化データとして出力
```

---

## 2. Sanity スキーマ

### faqItem（`schemas/faqItem.ts`）

| フィールド | 型 | 必須 | 説明 |
|-----------|----|------|------|
| `question` | string | ✅ | 質問文 |
| `answer` | text | ✅ | 回答文（80〜120文字目安） |
| `_key` | string | ✅ | UUID（自動生成） |
| `_type` | string | ✅ | `"faqItem"` 固定 |

### post.faq フィールド（`schemas/post.ts`）

```ts
defineField({
  name: 'faq',
  title: 'FAQ (Frequently Asked Questions)',
  type: 'array',
  of: [{ type: 'faqItem' }],
  description: '記事に関連するよくある質問（構造化データとして出力されます）',
})
```

---

## 3. 対象記事の選定ルール

### 対象条件（すべて満たすもの）
- `_type == "post"`
- `published == true` 相当（`internalOnly != true`）
- `maintenanceLocked != true`
- `slug.current` が定義済み

### 優先順位
- `views` 降順（アクセス数が多い記事を優先）

### 除外条件
| 条件 | 理由 |
|------|------|
| `PROTECTED_SLUGS` に含まれる | 収益最重要記事は手動管理 |
| `internalOnly == true` | 非公開記事 |
| `maintenanceLocked == true` | 自動編集ロック対象 |
| すでに `faq` が存在する | 再生成しない（上書き禁止） |

### 保護スラッグ（ハードコード）
```js
const PROTECTED_SLUGS = [
  'comparison-of-three-resignation-agencies',
  'nursing-assistant-compare-services-perspective',
]
```

### 実行件数
- 1回の実行で最大 **9件**（上位 9件の中から FAQ 未設定のもののみ）

---

## 4. FAQ の品質基準

### 質問文
- 読者が実際に Google 検索しそうな自然な疑問文
- 「〜とは？」「〜はどうすれば？」「〜は何ですか？」など
- 記事の主要トピックを網羅すること（重複しない）

### 回答文
- 80〜120文字（目安）
- 具体的かつ完結した内容
- 記事本文の内容に沿っていること
- **白崎セラの一人称「わたし」は使わない**（サイト側の客観的な文体）
- 断定的すぎる表現を避ける（「必ず〜」「絶対〜」禁止）
- 医療的な断定は禁止（「治ります」「診断できます」等）

### 1記事あたりの問数
- **3問固定**（SEO 構造化データとして最低限有効な数）

---

## 5. Gemini プロンプト仕様

### モデル
```
gemini-2.0-flash-lite-001（固定・変更禁止）
```

### 入力
- 記事タイトル（全文）
- 記事本文（先頭 2,000文字、PortableText をプレーンテキストに変換）

### 出力形式（JSON のみ）
```json
[
  {"question": "質問1", "answer": "回答1"},
  {"question": "質問2", "answer": "回答2"},
  {"question": "質問3", "answer": "回答3"}
]
```

### パース処理
- コードブロック（` ```json ` 等）を除去してから JSON.parse
- 末尾カンマ・文字列内改行を自動サニタイズ
- `question` と `answer` が両方存在するアイテムのみ採用

---

## 6. Sanity へのパッチ方法

```js
await sanityClient.patch(article._id).set({ faq }).commit()
```

- `set` を使用（既存 faq を上書き）
- `patch(...).setIfMissing` は**使わない**（既存データを残すと古いFAQが混在するため）
- パッチ間のウェイト: **1,500ms**（Sanity API レート制限対策）

---

## 7. フロントエンドでの出力

### 構造化データ（JSON-LD）
`src/components/StructuredData.tsx` の `FAQStructuredData` コンポーネントが出力。
`src/app/posts/[slug]/page.tsx` から呼び出される。

```tsx
<FAQStructuredData faqItems={faqItems} />
```

- `faqItems` が空配列または null の場合は何も出力しない
- 型チェック: `question` と `answer` が両方 string のものだけ渡す

### ページ上の表示
現在は構造化データのみ（`<script type="application/ld+json">`）。
ページ上に FAQ セクションとして表示する場合は別途コンポーネント追加が必要。

---

## 8. 実行タイミング

### 現在の運用（手動）
```bash
node scripts/generate-top-faq.cjs
```

### GitHub Actions への組み込み（未実装・要検討）
- 週次 or 月次で実行（新着記事の faq が空の場合のみ対象）
- コスト目安: 約 ¥0（9件 × 3問 × 小トークン）

---

## 9. コスト試算

| 処理 | トークン目安 | コスト |
|------|------------|--------|
| 入力（タイトル + 本文2,000文字） | 約 800〜1,000 tokens | ≒ ¥0 |
| 出力（JSON 3問） | 約 150〜200 tokens | ≒ ¥0 |
| **9件合計** | 約 9,000〜11,000 tokens | **≒ ¥0〜0.1** |

---

## 10. 再生成ルール

| ケース | 対応 |
|--------|------|
| FAQ が空（未生成） | 自動生成対象 |
| FAQ がすでに存在する | **スキップ（再生成しない）** |
| FAQ の質を上げたい場合 | Sanity Studio で手動削除 → 再実行 |
| 記事内容を大幅リライトした場合 | 手動で faq フィールドをクリア → 再実行 |

---

## 11. エラーハンドリング

- JSON パース失敗: `console.error` を出力してその記事をスキップ（全体は継続）
- 本文が空: スキップ
- Sanity パッチ失敗: `console.error` を出力してスキップ
- プロセス全体のエラー: `process.exit(1)` でワークフローに失敗を通知

---

## 関連ファイル

| ファイル | 役割 |
|---------|------|
| `scripts/generate-top-faq.cjs` | 実装スクリプト |
| `schemas/faqItem.ts` | Sanity スキーマ定義 |
| `schemas/post.ts` | post.faq フィールド定義 |
| `src/components/StructuredData.tsx` | FAQPage 構造化データ出力 |
| `src/app/posts/[slug]/page.tsx` | 記事ページでの呼び出し |
