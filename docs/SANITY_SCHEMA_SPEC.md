# Sanity スキーマ定義書

> 最終更新: 2026-04-07
> スキーマファイル: `schemas/`

---

## 1. post（記事）

最重要スキーマ。全スクリプト・ワークフローが参照する。

| フィールド | 型 | 必須 | 制約 | 管理 |
|-----------|-----|------|------|------|
| `title` | string | ✅ | 最大120文字 | 手動 / 自動生成 |
| `slug` | slug | ✅ | 最大96文字、英数字とハイフンのみ | 自動生成（titleから） |
| `body` | array | ✅ | PortableText（後述） | 手動 / 自動生成 |
| `categories` | reference[] | ✅ | 最小1件、1件のみ推奨 | 手動 / 自動生成 |
| `metaDescription` | text | ✅ | 120〜160文字推奨 | 自動生成 |
| `excerpt` | text | — | 最大200文字 | 自動生成 |
| `tags` | array | — | 最大15個（10個程度推奨） | 自動生成 |
| `publishedAt` | datetime | — | デフォルト: 現在時刻 | 手動 |
| `mainImage` | image | — | — | 手動 |
| `faq` | faqItem[] | — | — | スクリプト自動生成 |
| `showDisclaimer` | boolean | — | デフォルト: true | 手動 |
| `showTrustBlock` | boolean | — | デフォルト: true | 手動 |
| `maintenanceLocked` | boolean | — | デフォルト: false | 手動（重要） |
| `internalOnly` | boolean | — | デフォルト: false | 手動 |
| `views` | number | — | 読取専用 | 自動（閲覧カウント） |
| `geminiMaintainedAt` | datetime | — | 読取専用・非表示 | 自動（スクリプト） |
| `author` | reference | — | 読取専用・非表示 | 自動付与 |

### 保護フラグの意味

| フラグ | true のとき |
|--------|-----------|
| `maintenanceLocked` | **すべての自動スクリプトが編集をスキップ**（最重要） |
| `internalOnly` | 一覧・検索・サイトマップから除外、robots noindex 付与 |

### スクリプトが使う GROQ フィルタ（必須パターン）
```groq
*[_type == "post"
  && (!defined(maintenanceLocked) || maintenanceLocked == false)
  && (!defined(internalOnly) || internalOnly == false)
  && defined(slug.current)
]
```

### 保護スラッグ（絶対に編集禁止）
```js
const PROTECTED_REVENUE_SLUGS = [
  'comparison-of-three-resignation-agencies',
  'nursing-assistant-compare-services-perspective',
]
```

---

## 2. newsletter（メルマガ）

| フィールド | 型 | 必須 | 制約 | 管理 |
|-----------|-----|------|------|------|
| `subject` | string | ✅ | 最大100文字 | 手動 |
| `emailNumber` | number | ✅ | 配信順序（1, 2, 3…） | 手動 |
| `body` | array | — | PortableText（H2/H3 禁止） | スクリプト生成 |
| `theme` | string | — | 例: 給与・待遇 / 人間関係 / キャリア | 手動 |
| `scheduledAt` | datetime | — | 配信予定日時 | 手動 |
| `sent` | boolean | — | デフォルト: false | 自動（配信後） |
| `sentAt` | datetime | — | 読取専用 | 自動（配信後） |
| `notes` | text | — | 内部メモ | 手動 |

### 品質基準
- `body` ブロック数: **最低15ブロック以上**
- 見出しは **H2を3〜5個**（H3は使わない）
- `emailNumber` は重複不可（シリーズ分岐時のみ同番号を許容）

---

## 3. subscriber（購読者）

| フィールド | 型 | 必須 | 管理 |
|-----------|-----|------|------|
| `email` | string | ✅ | 自動（フォーム登録） |
| `subscribedAt` | datetime | — | 自動 |
| `unsubscribedAt` | datetime | — | 自動（解除時） |
| `lastStepSent` | number | — | 自動（配信スクリプト更新） |

---

## 4. category（カテゴリ）

固定11ラベル。**追加・削除・改名は禁止**（SEO・出典ポリシーと直結）。

| フィールド | 型 | 必須 |
|-----------|-----|------|
| `title` | string | ✅ |
| `slug` | slug | ✅ |
| `description` | text | — |
| `order` | number | — |

レガシー名称が表示された場合は以下で同期：
```bash
SANITY_WRITE_TOKEN=$SANITY_WRITE_TOKEN node scripts/maintenance.js sync-categories
```

---

## 5. blockContent（PortableText 本文）

`post.body` と `newsletter.body` で使われる共通型。

| 要素 | 利用可能なスタイル |
|------|-----------------|
| block | Normal / H2 / H3 / H4 / Quote / Callout |
| リスト | Bullet のみ |
| マーク | Strong / Emphasis / リンク（href） |
| 埋め込み | affiliateEmbed / seraAdvice / youtube / image |

### newsletter での制約
- **H2・H3 タグは使用禁止**（すべて Normal で統一）

---

## 6. 補助スキーマ（object 型）

### faqItem
post.faq の要素。スクリプトが自動生成。

| フィールド | 型 | 必須 |
|-----------|-----|------|
| `question` | string | ✅ |
| `answer` | text | ✅ |

### affiliateEmbed
本文中のアフィリエイトリンク埋め込み。

| フィールド | 型 |
|-----------|-----|
| `provider` | string |
| `linkKey` | string |
| `label` | string |
| `html` | text |

### speechBubble
吹き出し表示。

| フィールド | 型 | 選択肢 |
|-----------|-----|--------|
| `speaker` | string | sera / patient / nurse |
| `emotion` | string | normal / happy / sad / thinking / angry |
| `position` | string | left / right |
| `text` | text | — |

### seraAdvice
セラからの助言ブロック。

| フィールド | 型 |
|-----------|-----|
| `content` | text |

### youtube

| フィールド | 型 | 必須 |
|-----------|-----|------|
| `url` | url | ✅ |
| `title` | string | — |
| `description` | text | — |

---

## 7. author / siteSettings

### author
| フィールド | 型 | 必須 |
|-----------|-----|------|
| `name` | string | ✅ |
| `avatar` | image | — |

### siteSettings
サイト全体の免責事項・信頼性ブロックを管理。

| フィールド | 型 | デフォルト |
|-----------|-----|----------|
| `disclaimerEnabled` | boolean | true |
| `disclaimerTitle` | string | '免責事項' |
| `disclaimerBody` | blockContent | — |
| `trustEnabled` | boolean | true |
| `trustTitle` | string | 'この記事について' |
| `trustBody` | blockContent | — |

---

## 関連ファイル

| ファイル | 内容 |
|---------|------|
| `schemas/post.ts` | post スキーマ本体 |
| `schemas/newsletter.ts` | newsletter スキーマ本体 |
| `scripts/maintenance.js` | スクリプト（`PUBLIC_POST_FILTER` でフィルタ定義） |
| `docs/NEWSLETTER_GUIDE.md` | メルマガ運用ガイド |
