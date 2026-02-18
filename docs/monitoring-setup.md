# ProReNata 監視設定ガイド

## 1. GitHub Actions による自動監視（設定済み）

### デプロイ後ヘルスチェック (`deploy.yml`)
- **トリガー**: `main` ブランチへの push ごと
- **内容**: デプロイ60秒後にサイトの死活確認
- **チェック項目**:
  - HTTP 200 レスポンス
  - ページに「ProReNata」「最新の記事」が含まれるか
  - Server Component エラー (`$RX`) がないか
- **失敗時**: GitHub Issue を自動作成（ラベル: `critical`, `deploy-health`）

### 定期ヘルスチェック (`uptime-monitor.yml`)
- **トリガー**: 30分間隔（cron）
- **内容**: サイトの死活確認（リトライ付き）
- **失敗時**: GitHub Issue を自動作成。既存の未解決 Issue がある場合はコメント追加（重複防止）
- **ラベル**: `critical`, `uptime-alert`

## 2. UptimeRobot（外部監視 — 推奨）

GitHub Actions の30分間隔では検出が遅れる場合があります。  
**UptimeRobot** を併用すると、5分間隔での監視 + メール即時通知が可能です。

### セットアップ手順
1. https://uptimerobot.com にアクセス
2. 無料アカウントを作成
3. 「Add New Monitor」をクリック
4. 以下を入力:
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: ProReNata
   - **URL**: `https://prorenata.jp`
   - **Monitoring Interval**: 5 minutes
5. **Alert Contacts**: メールアドレスを追加
6. 「Create Monitor」をクリック

### 無料プランの制限
- 最大50モニター
- 5分間隔（最短）
- メール通知のみ

> **TIP**: Slack やLINE への通知が必要な場合は、UptimeRobot の Webhook 機能を使うか、Better Stack (https://betterstack.com) を検討してください。

## 3. GitHub の通知設定

GitHub Issue が作成されるとメール通知が届きます。  
確実に受け取るために以下を確認:

1. GitHub Settings → Notifications
2. 「Email」が有効になっていること
3. リポジトリの Watch 設定が「All Activity」または「Issues」になっていること
