# リンク検証スクリプト

SEO対策とクローラー対策のため、サイト内リンクの有効性を定期的に検証するスクリプトです。

## 機能

- ✅ 全記事のスラッグ検証
- ✅ 関連記事リンクの有効性チェック
- ✅ 本文内の内部リンク検証
- ✅ 404エラーの検出
- ✅ 詳細なエラーレポート生成
- ✅ ログファイル自動保存

## スクリプト一覧

### 1. validate-links.js
メインの検証スクリプト（Node.js）

**実行方法:**
```bash
node scripts/validate-links.js
```

**検証項目:**
- スラッグの存在確認
- スラッグの有効性（空白チェックなど）
- 関連記事のリンク先存在確認
- 本文内の内部リンク（/posts/...）の検証

**出力:**
- 正常時: `✅ すべてのリンクが正常です！`
- エラー時: エラータイプ別の詳細レポート

### 2. run-link-validation.sh
定期実行用シェルスクリプト

**実行方法:**
```bash
./scripts/run-link-validation.sh
```

**機能:**
- validate-links.js を実行
- 実行ログを `logs/link-validation-YYYYMMDD-HHMMSS.log` に保存
- 30日以上前の古いログを自動削除
- エラー検出時に警告メッセージを表示

## 定期実行設定（cron）

### 設定方法

1. **crontabを開く:**
   ```bash
   crontab -e
   ```

2. **以下の設定を追加:**

   **毎日午前3時に実行:**
   ```
   0 3 * * * /Users/user/prorenata/scripts/run-link-validation.sh
   ```

   **毎週月曜日午前2時に実行:**
   ```
   0 2 * * 1 /Users/user/prorenata/scripts/run-link-validation.sh
   ```

   **毎月1日午前1時に実行:**
   ```
   0 1 1 * * /Users/user/prorenata/scripts/run-link-validation.sh
   ```

3. **保存して終了** (vi/vimの場合: `:wq`)

### cron時刻の書式

```
分 時 日 月 曜日 コマンド
* * * * * command
│ │ │ │ │
│ │ │ │ └─ 曜日 (0-7, 0と7は日曜日)
│ │ │ └─── 月 (1-12)
│ │ └───── 日 (1-31)
│ └─────── 時 (0-23)
└───────── 分 (0-59)
```

### 設定例

| 設定 | 説明 |
|------|------|
| `0 3 * * *` | 毎日午前3時 |
| `0 */6 * * *` | 6時間ごと |
| `0 2 * * 1` | 毎週月曜日午前2時 |
| `0 1 1 * *` | 毎月1日午前1時 |
| `*/30 * * * *` | 30分ごと |

### 現在のcron設定を確認

```bash
crontab -l
```

### cron設定を削除

```bash
crontab -r
```

## ログファイル

### ログ保存場所
```
logs/link-validation-YYYYMMDD-HHMMSS.log
```

### ログ例

**正常時:**
```
========================================
リンク検証開始: 2025-10-09 03:00:01
========================================

📚 全記事を取得中...
✅ 取得完了: 156件

🔗 記事リンクを検証中...
  チェック完了: 156件
  エラー: 0件

🔍 関連記事リンクを検証中...
  関連記事を持つ記事: 66件
  チェックした関連リンク: 132件
  エラー: 0件

📎 本文内の内部リンクを検証中...
  チェックした内部リンク: 45件
  エラー: 0件

============================================================
📊 検証レポート
============================================================

✅ すべてのリンクが正常です！

✨ 検証完了

========================================
リンク検証終了: 2025-10-09 03:00:15
終了コード: 0
========================================
```

**エラー検出時:**
```
============================================================
📊 検証レポート
============================================================

⚠️  合計 3件のエラーが見つかりました

【BROKEN_INTERNAL_LINK】 3件
------------------------------------------------------------

1. 看護助手の仕事内容
   リンク: /posts/non-existent-article
   詳細: 本文内のリンク先記事が存在しません

2. 看護助手の給料について
   リンク: /posts/old-deleted-post
   詳細: 本文内のリンク先記事が存在しません
```

## 手動実行

定期実行を待たずに今すぐ検証したい場合:

```bash
# Node.jsスクリプト直接実行（ログなし）
node scripts/validate-links.js

# シェルスクリプト実行（ログあり）
./scripts/run-link-validation.sh
```

## トラブルシューティング

### エラー: Permission denied

```bash
chmod +x scripts/run-link-validation.sh
```

### エラー: Sanity API接続エラー

`.env.local` ファイルの `SANITY_API_TOKEN` が正しく設定されているか確認:

```bash
cat .env.local | grep SANITY_API_TOKEN
```

### cronが実行されない

1. cronデーモンが起動しているか確認:
   ```bash
   sudo launchctl list | grep cron
   ```

2. ログを確認（macOS）:
   ```bash
   log show --predicate 'process == "cron"' --last 1h
   ```

3. 絶対パスを使用しているか確認:
   ```bash
   which node  # Node.jsのフルパスを確認
   ```

## Slack/メール通知の追加（オプション）

エラー検出時に通知を送りたい場合、`run-link-validation.sh` の以下の部分を編集:

```bash
# Slack通知例
if [ $EXIT_CODE -ne 0 ]; then
  curl -X POST -H 'Content-type: application/json' \
    --data "{\"text\":\"⚠️ リンクエラー検出: $LOG_FILE\"}" \
    YOUR_SLACK_WEBHOOK_URL
fi

# メール通知例
if [ $EXIT_CODE -ne 0 ]; then
  echo "リンクエラーが検出されました" | mail -s "ProReNata リンク検証エラー" your@email.com
fi
```

## メンテナンス

### ログファイルの手動削除

```bash
# 30日以上前のログを削除
find logs/ -name "link-validation-*.log" -mtime +30 -delete

# すべてのログを削除
rm logs/link-validation-*.log
```

### スクリプトの更新

スクリプトを更新した場合、cronで実行される前に手動テストを推奨:

```bash
./scripts/run-link-validation.sh
```

## 推奨スケジュール

- **小規模サイト（記事数 < 100）**: 週1回（毎週月曜日）
- **中規模サイト（記事数 100-500）**: 週2回（月曜・木曜）
- **大規模サイト（記事数 > 500）**: 毎日

現在の ProReNata は156記事のため、**週1回（毎週月曜日午前2時）**を推奨します。

```bash
# crontab -e で以下を追加
0 2 * * 1 /Users/user/prorenata/scripts/run-link-validation.sh
```
