# ニュースレター生成・管理ガイド

> 📋 **対象者**: Claude Code（AI assistant）と編集者
> 📅 **最終更新**: 2026-04-04
> 🔗 **参照**: CLAUDE.md (ニュースレター管理セクション)

---

## 📌 目次

1. [ニュースレール定義](#ニュースレター定義)
2. [仕様・品質基準](#仕様・品質基準)
3. [生成フロー](#生成フロー)
4. [Sanity スキーマ詳細](#sanity-スキーマ詳細)
5. [編集手順](#編集手順)
6. [メンテナンスチェックリスト](#メンテナンスチェックリスト)
7. [トラブルシューティング](#トラブルシューティング)

---

## ニュースレター定義

### 概要
ProReNata のニュースレターは、登録ユーザーに定期配信される**メールマガジン型コンテンツ**です。

| 項目 | 詳細 |
|------|------|
| **配信対象** | メルマガ登録者（`subscriber` document） |
| **形式** | PortableText（Sanity CMS標準） |
| **対象記事数** | 少数・重要度高（3-6件程度） |
| **更新頻度** | 月1-2回程度 |
| **キャラクター** | 白崎セラ（一人称「わたし」） |

### 用途別ニュースレター

| emailNumber | シリーズ名 | 対象読者 | 役割 |
|-------------|-----------|--------|------|
| **1** | メイン＆サイドコンテンツ | 全購読者 | 様々なテーマの記事（複数branch） |
| **2** | 転職検討層シリーズ | 転職関心層 | 転職準備・決断サポート |
| **3** | 就職検討層シリーズ | 就職希望者 | 看護助手職紹介・準備ガイド |

**注**: emailNumber=1 は1つの記事ではなく、複数の「ブランチ」（サブシリーズ）を持つことがあります。

---

## 仕様・品質基準

### 必須フィールド

#### 1. `subject` (メール件名)
- **型**: テキスト（最大100文字）
- **例**:
  - "今の職場でモヤモヤしている看護助手さんへ"
  - "【第2号】転職を迷っているあなたへ"
  - "看護助手に興味があるあなたへ"
- **ルール**:
  - 絵文字・装飾記号は避ける
  - キーワードを自然に含める
  - 受信者が内容を想像できる程度に具体的に

#### 2. `emailNumber` (配信順序)
- **型**: 数値（必須）
- **値**: 1, 2, 3...
- **例**:
  - `1`: メインニュースレター（複数ブランチ可）
  - `2`: 転職シリーズ第2号
  - `3`: 就職シリーズ第3号
- **ルール**:
  - 複数のemailNumber=1があってもOK（異なるブランチ）
  - emailNumber を重複させない（同じ号を複数作らない）

#### 3. `body` (メール本文)
- **型**: PortableText 配列
- **最小要件**:
  - ブロック数: **最低15ブロック以上**（500語相当）
  - 見出し数: **H2見出し 3-5個**
  - 構成: オープニング → 複数セクション（見出し＋説明）→ クロージング
- **ルール**:
  - 1セクション = 1H2見出し + 説明文（複数段落可）
  - 各セクション間に空行（空ブロック）を挿入
  - 記事内リンク・アフィリエイトリンク不可
  - 画像・動画は基本的に不推奨（メール体験を損なうため）

#### 4. `theme` (テーマ)
- **型**: テキスト
- **例**:
  - "給与・待遇"
  - "人間関係"
  - "キャリア"
  - "メンタルケア"
- **ルール**:
  - 記事カテゴリとの連携（任意）
  - 内部メモとしても利用

#### 5. `scheduledAt` (配信予定日時)
- **型**: 日時
- **例**: "2026-04-15T09:00:00Z"
- **ルール**:
  - UTC またはローカルタイムで設定
  - GitHub Actions / 自動メール送信の基準
  - 未設定でもOK（手動配信の場合）

#### 6. `sent` / `sentAt` (配信済みフラグ)
- **型**: boolean / 日時（readOnly）
- **用途**: 配信完了履歴
- **ルール**:
  - 手動で変更しない（読み取り専用）
  - 配信システムが自動更新

### 品質基準チェックリスト

```
本文内容 (Body):
  ☑ ブロック数 ≥ 15 個（500語以上）
  ☑ H2見出し 3-5 個
  ☑ 各見出しに説明文が続いている
  ☑ 開き括弧と閉じ括弧が対応している
  ☑ 読んで自然か、違和感がないか

キャラクター性:
  ☑ 一人称は「わたし」を使用
  ☑ 見出しに「セラ」という固有名詞がない
  ☑ 白崎セラのキャラ設定（docs/character-shirasaki-sera.md）に合致
  ☑ 過度にカジュアルでない

技術仕様:
  ☑ PortableText 形式が正しい（JSONスキーマ準拠）
  ☑ _type, _key, style, children が正しく構造化
  ☑ 無効なマークアップ（HTML <a> タグなど）がない
  ☑ リンクは href フィールドに含まれている

メタデータ:
  ☑ subject が 30-60 文字（受信トレイに全表示）
  ☑ emailNumber が明記（配信順序）
  ☑ theme が適切（分類・検索用）
```

---

## 生成フロー

### 推奨ワークフロー

```
┌─────────────────────────────────────────────┐
│ 1️⃣  コンテンツ企画                          │
│   - テーマ・対象読者を決定                   │
│   - emailNumber を決定                      │
│   - 件名・構成案を作成                       │
└────────────┬────────────────────────────────┘
             │
┌────────────▼────────────────────────────────┐
│ 2️⃣  コンテンツ生成                          │
│   実行: scripts/generate-newsletter-bodies.js│
│   出力: JSON (PortableText blocks)           │
│   検査: ブロック数、見出し数を確認           │
└────────────┬────────────────────────────────┘
             │
┌────────────▼────────────────────────────────┐
│ 3️⃣  Sanity へのパッチ適用                   │
│   実行: MCP patch_document_from_json         │
│   確認: Sanity Studio で本文を目視確認       │
└────────────┬────────────────────────────────┘
             │
┌────────────▼────────────────────────────────┐
│ 4️⃣  品質チェック（自動）                    │
│   実行: scripts/newsletter-health-check.cjs  │
│   検査: 本文完全性、ブロック数警告           │
└────────────┬────────────────────────────────┘
             │
┌────────────▼────────────────────────────────┐
│ 5️⃣  配信準備                                │
│   - scheduledAt を設定（必要な場合）        │
│   - プレビューメール送信（テスト配信）      │
│   - sent フラグを確認                       │
└─────────────────────────────────────────────┘
```

### ステップ詳細

#### **ステップ 2: コンテンツ生成**

```bash
# JSON PortableText を生成
node scripts/generate-newsletter-bodies.js

# 出力:
# {
#   "newsletter1": {
#     "id": "drafts.xxx",
#     "blockCount": 25,
#     "body": [...]
#   },
#   "newsletter2": { ... },
#   ...
# }
```

**生成時の注意**:
- Markdown → PortableText 自動変換は使用禁止（トークン制限で切り詰められるため）
- 直接 PortableText JSON を生成すること
- `createBlock()` / `createHeading()` ヘルパーを使用

#### **ステップ 3: Sanity へのパッチ適用**

```bash
# MCP パッチツールを使用（推奨）
# 以下の MCP を実行:
#   mcp__4072b774-4bb1-49f7-b272-7893cf2e83da__patch_document_from_json
#
# パラメータ:
#   - documentId: "drafts.d4daaf7a-..." (対象ニュースレターID)
#   - set: [{ path: "body", value: [...PortableTextブロック...] }]
```

**確認事項**:
1. Sanity Studio でドキュメントを開く
2. 本文が完全に表示されているか確認
3. 見出し・段落が正しく構造化されているか視認

#### **ステップ 4: 品質チェック（自動）**

```bash
# ニュースレター健康チェック実行
node scripts/newsletter-health-check.cjs

# 出力例:
# ✅ Newsletter #1: 25 blocks (OK)
# ⚠️  Newsletter #2: 8 blocks (SUSPICIOUSLY FEW - investigate)
# ❌ Newsletter #3: empty body (ERROR)
```

---

## Sanity スキーマ詳細

### スキーマ定義ファイル
**位置**: `schemas/newsletter.ts`

```typescript
export default defineType({
  name: 'newsletter',
  title: 'Newsletter',
  type: 'document',
  fields: [
    // ... 詳細は schemas/newsletter.ts を参照
  ]
})
```

### フィールドごとの技術仕様

| フィールド | 型 | 制約 | 説明 |
|-----------|-----|------|------|
| `subject` | string | max: 100 | メール件名 |
| `emailNumber` | number | min: 1 | 配信順序 |
| `theme` | string | - | テーマ分類（任意） |
| `body` | array | blockContent | メール本文（PortableText） |
| `scheduledAt` | datetime | - | 配信予定日時 |
| `sent` | boolean | - | 配信完了フラグ |
| `sentAt` | datetime | readOnly | 配信完了日時 |
| `notes` | text | - | 内部メモ |

### PortableText ブロック構造

```json
{
  "_type": "block",
  "_key": "abc123",
  "style": "normal",
  "children": [
    {
      "_type": "span",
      "_key": "def456",
      "text": "段落テキスト",
      "marks": []
    }
  ],
  "markDefs": []
}
```

**見出しの場合**:
```json
{
  "_type": "block",
  "_key": "xyz789",
  "style": "h2",  // h1, h2, h3, h4, blockquote, callout 可
  "children": [
    {
      "_type": "span",
      "_key": "abc001",
      "text": "見出しテキスト",
      "marks": []
    }
  ],
  "markDefs": []
}
```

---

## 編集手順

### 手動編集（Sanity Studio）

1. **Sanity Studio にログイン**
   - https://sanity.studio/ → ProReNata project

2. **Newsletter ドキュメントを検索**
   - 左サイドバー「Newsletter」クリック
   - emailNumber でフィルタ（例: emailNumber = 1）

3. **本文を編集**
   - 「メール本文」フィールドをクリック
   - エディタで段落・見出しを追加・削除
   - 自動的に PortableText に変換

4. **プレビュー確認**
   - 「プレビュー」ボタンをクリック（あれば）
   - メール形式での表示を確認

5. **保存**
   - 「公開」または「ドラフト保存」をクリック

### プログラムによる編集

**推奨ツール**: MCP `patch_document_from_json`

```
実行フロー:
  1. PortableText JSON を生成（scripts/generate-newsletter-bodies.js）
  2. MCP patch_document_from_json でパッチ適用
  3. Sanity Studio で目視確認
  4. 問題なければ確定
```

---

## メンテナンスチェックリスト

### 週次チェック（毎週月曜 AM 3:00 JST）

- [ ] `scripts/newsletter-health-check.cjs` を実行
- [ ] エラー・警告がないか確認
  - エラー: 本文が空の記事がないか
  - 警告: ブロック数が少なすぎないか（< 10）
- [ ] すべてのニュースレターが完全な状態か確認

### 月次チェック（月初）

- [ ] 前月配信したニュースレター数を集計
- [ ] 読者数の増減を確認（`subscriber` document から）
- [ ] 未配信のドラフトがないか確認
- [ ] archiveや古いドラフトの削除検討

### 配信前チェック

- [ ] subject が 30-60 文字か確認
- [ ] emailNumber が正しく設定されているか確認
- [ ] body が 15 ブロック以上か確認
- [ ] 見出しが 3-5 個か確認
- [ ] プレビューメールを送信（テスト配信）
- [ ] 件名・本文に誤字がないか確認
- [ ] リンク・記号が正しく表示されるか確認

---

## トラブルシューティング

### Q1: 本文が途中で切れている（重要）

**原因**: PortableText JSON が不完全、または API エラー

**対処**:
1. Sanity Studio でドキュメントを開く
2. 本文の最後を確認（「応援しています」など、クロージングがあるか）
3. ない場合:
   - `scripts/generate-newsletter-bodies.js` で新しい JSON を生成
   - MCP `patch_document_from_json` で再パッチ
   - Sanity Studio で目視確認

**予防**:
- Markdown → PortableText 変換を使わない（このステップで切り詰められる可能性）
- 直接 PortableText JSON を生成する

### Q2: エラー「Newsletter has empty body」

**原因**: `body` フィールドが空、または null

**対処**:
1. 対象ニュースレターを特定（emailNumber）
2. 生成スクリプトで新しい本文を生成
3. MCP パッチで再適用

### Q3: 警告「Newsletter has suspiciously few blocks (< 10)」

**原因**: ブロック数が 10 個未満（品質基準以下）

**対処**:
1. 対象記事を開く
2. 本文をスクロール確認
3. 足りないセクション・説明を追加
4. 見出し数が 3-5 個になるまで充実

### Q4: PortableText JSON のバリデーションエラー

**原因**: JSON 構造が不正（`_type`, `_key` の誤り など）

**対処**:
1. JSON ファイルをテキストエディタで開く
2. ブレース `{}` の対応を確認
3. `_type`: "block", `_key`: 一意のIDか確認
4. 必要に応じて `scripts/generate-newsletter-bodies.js` を修正

### Q5: Sanity API エラー（401 Unauthorized など）

**原因**: SANITY_WRITE_TOKEN が未設定、または期限切れ

**対処**:
1. `.env.local` で `SANITY_WRITE_TOKEN` を確認
2. トークンの有効期限を確認（Sanity Dashboard）
3. 必要に応じて新しいトークンを生成

---

## リファレンス

### 関連ファイル
- **Schema**: `schemas/newsletter.ts`
- **生成スクリプト**: `scripts/generate-newsletter-bodies.js`
- **健康チェック**: `scripts/newsletter-health-check.cjs`
- **修復スクリプト（レガシー）**: `scripts/fix-newsletter-truncation.js`

### キャラクター設定
- **設定ファイル**: `docs/character-shirasaki-sera.md`
- **基本設定**: 20歳の看護助手、一人称「わたし」、親近感重視

### メール配信システム
- **ステップメール**: `scripts/send-step-emails.js`
- **健康チェック（統合）**: `scripts/newsletter-health-check.cjs`
- **GitHub Workflow**: `.github/workflows/` 配下

---

## FAQ

**Q: ニュースレターに画像を入れたい**
A: メール配信の場合、画像は受信トレイで表示されないことが多いため推奨しません。代わりに本文で説明的なテキストを充実させてください。

**Q: 複数のemailNumber=1を持つニュースレターを作りたい**
A: 問題ありません。同じemailNumber=1でも、異なるtheme（「給与」「人間関係」など）を持つ複数のニュースレターを作成可能です。

**Q: ニュースレターに他サイトへのリンクを入れたい**
A: 記事内部リンク（/posts/...）は可能ですが、アフィリエイトリンク・外部プロモリンクはメール規約上推奨しません。必要な場合は事前相談してください。

**Q: 配信済みのニュースレターを編集できるか**
A: できます。Sanity Studio で `sent: true` のドキュメントも編集可能です。ただし配信済みの内容を変更すると、既に読んだ読者との情報乖離が生じるため、変更理由をメモ欄に記録してください。

---

**最終更新**: 2026-04-04
**責務**: ProReNata 編集チーム / Claude Code
