# Gemini API モデル選択に関する技術情報共有

## 📋 現状の問題

**対象ファイル**: `prorenata/src/app/api/chat/route.ts` (line 34)

現在、以下のモデル指定が使用されています：
```typescript
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",  // ⚠️ バージョン指定なし
    systemInstruction: SYSTEM_PROMPT,
});
```

## ⚠️ 重大な課題

### 1. バージョン指定なしモデルの危険性
- `gemini-2.5-flash-lite` というモデルは**存在しない**
- Google AI APIは存在しないモデル名に対して、自動的に**Gemini Pro**にフォールバックする
- Proモデルは料金が**Flash比で17〜67倍高額**

### 2. 過去のインシデント（2025-10-28）
- 同様の問題で月間課金が予算の50%（¥545）に到達
- 全費用の100%がGemini API使用料（想定の10倍以上）
- 原因: `gemini-2.5-flash` → 自動的にGemini 2.5 **Pro**にフォールバック
- Vertex AI経由で課金され、通常APIの数十倍の料金が発生

## 📊 コスト比較

| モデル | 料金（1M output tokens） | 相対コスト |
|--------|-------------------------|-----------|
| gemini-2.0-flash-lite-001 | $0.075 | 1x（最低） |
| gemini-2.0-flash-001 | $0.30 | 4x |
| gemini-2.5-pro | $5.00 | 67x |

## ✅ 推奨される解決策

### オプション1: gemini-2.0-flash-lite-001（推奨）
```typescript
const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-lite-001",  // ✅ バージョン固定、最低コスト
    systemInstruction: SYSTEM_PROMPT,
});
```
- **メリット**: 最低コスト、Proフォールバック防止
- **デメリット**: 品質がやや低い可能性（要検証）
- **用途**: チャットボット・AIチューバーなど軽量タスク

### オプション2: gemini-2.0-flash-001
```typescript
const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-001",  // ✅ バージョン固定、標準品質
    systemInstruction: SYSTEM_PROMPT,
});
```
- **メリット**: バランスの取れた品質とコスト
- **デメリット**: lite版の4倍のコスト
- **用途**: 品質が重要なタスク

## 🔍 検証が必要な項目

1. **AIチューバーウィジェットの品質要件**
   - 現在の応答品質は満足できるか？
   - lite-001で品質が低下するか？
   - ユーザー体験への影響は？

2. **使用頻度とコスト影響**
   - 月間のAPI呼び出し回数は？
   - 現在の課金額は？
   - lite-001への変更による削減額は？

3. **プロジェクト内の他の使用箇所**
   ```bash
   # 確認コマンド
   grep -r "gemini-2.5-flash-lite" prorenata/
   grep -r "GoogleGenerativeAI" prorenata/
   ```

## 📝 実装手順（提案）

### ステップ1: 現状確認
1. `prorenata/src/app/api/chat/route.ts` の使用状況確認
2. 他にGemini APIを使用している箇所の洗い出し
3. 現在の月間API使用量とコストの確認

### ステップ2: テスト実装
1. 開発環境で `gemini-2.0-flash-lite-001` に変更
2. AIチューバーウィジェットの応答品質を検証
3. 必要に応じて `gemini-2.0-flash-001` でも検証

### ステップ3: デプロイ
1. 品質が許容範囲なら lite-001 を採用
2. 品質が不足なら flash-001 を採用
3. 環境変数化も検討（モデル名を `.env` で管理）

## 🚨 絶対に避けるべき事項

❌ **バージョン指定なしのモデル名**
- `gemini-2.5-flash-lite`
- `gemini-2.5-flash`
- `gemini-1.5-flash`

❌ **Proモデル**
- `gemini-2.5-pro`
- `gemini-1.5-pro`

❌ **Vertex AI経由のAPI**

## 📌 参考情報

**プロジェクト内の現在の標準**:
- 記事自動生成: `gemini-2.0-flash-lite-001`
- メンテナンススクリプト: Gemini API不使用
- X自動投稿: Gemini API不使用（Excerpt直接使用）

**関連ドキュメント**:
- `prorenata/CLAUDE.md` - ルール42（Gemini API絶対ルール）
- 過去のインシデント記録: CLAUDE.md #16, #17

---

## 🤝 次のアクション

以下を検討・決定してください：

1. **優先順位**: コスト重視 vs 品質重視
2. **テスト方針**: lite-001 で十分か、flash-001 が必要か
3. **環境変数化**: モデル名をハードコードするか、環境変数で管理するか
4. **モニタリング**: API使用量とコストの継続的な監視方法

**質問や懸念事項があれば共有してください。一緒に最良の方法を模索しましょう。**

---

## 📅 作成日時
2025-11-29

## 👥 関係者
- Claude Code (ProReNata)
- Antigravity
- Codex
