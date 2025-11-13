# Analytics & SEO Performance System

ProReNataのGA4とSearch Consoleデータを収集・分析し、SEOパフォーマンスレポートを自動生成するシステムです。

## セットアップ

### 1. GCPサービスアカウント作成（ユーザー側で実施）

1. **GCPプロジェクト作成**（既存でも可）
2. **API有効化**
   - Search Console API
   - Analytics Data API (GA4)
3. **サービスアカウント作成**
   - IAM & Admin > Service Accounts → Create
   - 名前: `ga4-gsc-reporter` など
   - JSONキーをダウンロード

### 2. Search Console への招待（ユーザー側で実施）

1. [Search Console](https://search.google.com/search-console) を開く
2. プロパティ: `https://prorenata.jp/` を選択
3. Settings > Users and permissions → Add user
4. サービスアカウントのメールアドレスを入力
5. 権限: **Full** で追加

### 3. GA4 への招待（ユーザー側で実施）

1. [Google Analytics](https://analytics.google.com/) を開く
2. Admin → Property Access Management → Add users
3. サービスアカウントのメールアドレスを入力
4. 権限: **Analyst** または **Editor** で追加
5. プロパティID: `504242963` （ProReNata）

### 4. GitHub Secrets 設定（ユーザー側で実施）

GitHub リポジトリの Settings > Secrets and variables > Actions で以下を追加：

| Secret名 | 値 | 説明 |
|----------|---|------|
| `GCP_SERVICE_ACCOUNT_KEY` | JSONファイル全文 | GCPサービスアカウントのJSONキー |

**重要**: JSONファイル全文をそのままコピー＆ペーストしてください。

## 実行スケジュール

### 自動実行（GitHub Actions）

- **実行時刻**: 毎朝 09:00 JST（00:00 UTC）
- **実行内容**:
  1. Search Consoleデータ取得（過去30日間）
  2. GA4データ取得（過去30日間）
  3. SEO分析レポート生成
  4. データとレポートをリポジトリにコミット

- **手動実行**: GitHub ActionsのWorkflowsタブから「Run workflow」で即座に実行可能

### ローカル実行

```bash
# Python依存関係インストール
pip install -r scripts/analytics/requirements.txt

# 環境変数設定
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
export GA4_PROPERTY_ID="504242963"
export GSC_SITE_URL="https://prorenata.jp/"

# データ取得
python scripts/analytics/fetch-gsc-data.py
python scripts/analytics/fetch-ga4-data.py

# レポート生成
python scripts/analytics/analyze-seo-performance.py
```

## 出力ファイル

### データファイル（`data/`）

- `gsc_last30d.csv`: Search Consoleデータ（過去30日間）
  - date, page, query, country, device
  - clicks, impressions, ctr, position

- `ga4_last30d.csv`: GA4データ（過去30日間）
  - date, pagePath, deviceCategory, country
  - sessions, totalUsers, eventCount, engagementRate

### レポートファイル（`data/`）

- `seo_report_YYYY-MM-DD.md`: 日次SEOパフォーマンスレポート
  - 全体指標サマリー
  - トップ10ページ
  - トップ20検索クエリ
  - 改善機会（CTR、掲載順位）

## スクリプト詳細

### `fetch-gsc-data.py`

Search Console Search Analytics APIを使用して、過去30日間の検索パフォーマンスデータを取得します。

**取得データ**:
- クリック数
- 表示回数
- CTR（クリック率）
- 平均掲載順位
- ディメンション: 日付、ページ、クエリ、国、デバイス

### `fetch-ga4-data.py`

GA4 Data APIを使用して、過去30日間のアナリティクスデータを取得します。

**取得データ**:
- セッション数
- ユーザー数
- イベント数
- エンゲージメント率
- 平均セッション時間
- ディメンション: 日付、ページパス、デバイス、国

### `analyze-seo-performance.py`

GSCとGA4のデータを統合し、SEOパフォーマンスレポートを生成します。

**分析内容**:
1. **トップページ分析**: クリック数上位10ページの詳細
2. **検索クエリ分析**: クリック数上位20クエリ
3. **CTR改善機会**: 表示回数多いが低CTRのクエリ
4. **掲載順位改善機会**: 4-10位で表示回数多いクエリ

## トラブルシューティング

### エラー: "API not enabled"

→ GCP Console > APIs & Services > Library で以下を有効化：
- Search Console API
- Analytics Data API

### エラー: "Permission denied"

→ サービスアカウントがSearch ConsoleとGA4に招待されているか確認

### エラー: "Invalid credentials"

→ GitHub Secretsの `GCP_SERVICE_ACCOUNT_KEY` が正しいJSON全文か確認

## 参考リンク

- [Search Console API ドキュメント](https://developers.google.com/webmaster-tools/search-console-api-original)
- [GA4 Data API ドキュメント](https://developers.google.com/analytics/devguides/reporting/data/v1)
- [GCP サービスアカウント](https://cloud.google.com/iam/docs/service-accounts)
