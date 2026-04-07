# GitHub Actions ワークフロー一覧

> 最終更新: 2026-04-07
> 合計: 17本

---

## 🟢 定期実行（有効）

| ファイル | ワークフロー名 | スケジュール（JST） | 主な処理 | 外部サービス |
|---------|-------------|-----------------|--------|------------|
| `daily-article-generation.yml` | Daily Article Generation | 毎日 02:00 | Gemini + Anthropic で記事を自動生成し Sanity に保存 | Sanity, Gemini, Anthropic |
| `send-step-emails.yml` | Send Step Emails | 毎日 09:00 | メルマガのステップ配信 + ニュースレター健康チェック | Sanity, Gmail |
| `uptime-monitor.yml` | Site Health Check | 30分ごと | サイト疎通確認・HTTP ステータス検証、異常時 Issue 自動作成 | — |
| `weekly-analytics-health-check.yml` | Weekly Analytics Health Check | 毎週月曜 10:00 | GA4/GSC のヘルスチェック、`analytics/health.json` を更新 | — |
| `weekly-revenue-optimize.yml` | Weekly Revenue Optimization | 毎週火曜 11:00 | GSC/GA4 データをもとに収益最適化を Gemini が提案・Sanity に反映 | Sanity, Gemini |
| `weekly-sera-tone.yml` | Weekly Sera Tone Check | 毎週水曜 11:00 | 記事のセラトーンスコアを算出、低スコア記事を Gemini で自動改述 | Sanity, Gemini |
| `weekly-summary-personalize.yml` | Weekly Summary Personalize | 毎週木曜 11:00 | 記事サマリーを Gemini で個別化・最適化 | Sanity, Gemini |
| `update-lifestyle.yml` | Update Sera Lifestyle | 3/6/9/12月末 21:00 UTC | 季節に応じたセラの生活情報（服装・食事など）を Gemini で生成・更新 | Gemini |

---

## 🔴 無効化中（定期実行を停止、手動実行は可能）

| ファイル | ワークフロー名 | 停止理由 | 手動実行 |
|---------|-------------|--------|--------|
| `daily-maintenance.yml` | Daily Article Maintenance Check | 24時間安全ガード（誤実行防止） | ✅ 可 |
| `daily-analytics.yml` | Daily Analytics & SEO Report | コスト削減（GCP 未設定） | ✅ 可 |
| `note-draft-daily.yml` | Daily note Draft (Sera Essay) | コスト管理 | ✅ 可 |

---

## 🔵 手動実行専用（cron なし）

| ファイル | ワークフロー名 | 主な処理 | 注意事項 |
|---------|-------------|--------|--------|
| `cleanup-duplicates.yml` | Cleanup Duplicate Drafts | Sanity の重複ドラフト削除 | 削除確認の bool 入力あり |
| `cleanup-spam.yml` | Manual Spam Cleanup | Sanity のスパム記事クリーンアップ | — |
| `sanity-auth-check.yml` | Sanity Auth Check | Sanity 読み取り/書き込みトークンの検証 | — |
| `sync-subscribers-auto.yml` | Auto-Sync Newsletter Subscribers | Sanity から購読者 CSV を同期 | `repository_dispatch` でも起動可 |

---

## ⚙️ CI/CD（コードイベントトリガー）

| ファイル | ワークフロー名 | トリガー | 主な処理 |
|---------|-------------|--------|--------|
| `build.yml` | Build | PR → main | npm build テスト |
| `deploy.yml` | Deploy | push → main | npm build + Vercel デプロイ + ヘルスチェック |

---

## 必要な Secrets 一覧

| Secret | 使用ワークフロー数 | 主な用途 |
|--------|-----------------|--------|
| `SANITY_WRITE_TOKEN` | 多数 | Sanity へのパッチ・保存 |
| `SANITY_READ_TOKEN` | 一部 | Sanity からの読み取り（記事生成時） |
| `SANITY_API_TOKEN` | 一部 | 購読者同期・メール配信 |
| `SANITY_PROJECT_ID` | 一部 | Sanity プロジェクト識別 |
| `SANITY_DATASET` | 一部 | Sanity データセット名 |
| `SANITY_API_VERSION` | 一部 | Sanity API バージョン |
| `GEMINI_API_KEY` | 8本 | Gemini API 呼び出し |
| `ANTHROPIC_API_KEY` | 2本 | Claude API 呼び出し（記事生成・note） |
| `GMAIL_USER` | 1本 | メルマガ送信元アカウント |
| `GMAIL_APP_PASSWORD` | 1本 | Gmail アプリパスワード |
| `MAIL_TO` | 1本 | 送信先メールアドレス |
| `VERCEL_TOKEN` | 1本 | Vercel デプロイ |
| `VERCEL_ORG_ID` | 1本 | Vercel 組織 ID |
| `VERCEL_PROJECT_ID` | 1本 | Vercel プロジェクト ID |

---

## 月次コスト目安

| カテゴリ | ワークフロー | 月間実行回数 | 推定コスト |
|--------|-----------|-----------|---------|
| 記事生成 | `daily-article-generation` | 週1回（CLAUDE.mdより） | ¥6〜10 |
| セラトーン改述 | `weekly-sera-tone` | 月4回 | ¥1〜5 |
| 収益最適化 | `weekly-revenue-optimize` | 月4回 | ¥1〜3 |
| サマリー個別化 | `weekly-summary-personalize` | 月4回 | ¥1〜3 |
| メルマガ配信 | `send-step-emails` | 月30回 | ¥0（無料枠） |
| 死活監視 | `uptime-monitor` | 月1,440回 | ¥0（無料枠） |
| **合計** | | | **¥9〜21/月** |

---

## 失敗時の対応

| ワークフロー | 失敗時の挙動 | 確認場所 |
|-----------|-----------|--------|
| `uptime-monitor` | GitHub Issue を自動作成 | リポジトリ Issues |
| `daily-article-generation` | GitHub Actions ログ | Actions タブ |
| `send-step-emails` | ログ出力のみ（メール未送信） | Actions タブ |
| `deploy` | デプロイ停止（main へのマージはロールバック不要） | Actions タブ + Vercel ダッシュボード |
| その他 | ログ出力のみ | Actions タブ |

---

## ワークフロー追加時のルール

1. **Gemini モデルは `gemini-2.0-flash-lite-001` 固定**（Pro・バージョン未指定は絶対禁止）
2. **時刻・タイムゾーン設定の変更は禁止**（インシデント履歴あり → `CLAUDE.md` 参照）
3. **保護スラッグへの書き込みは禁止**（`PROTECTED_REVENUE_SLUGS` を必ずハードコード）
4. **`maintenanceLocked: true` の記事は編集対象から除外**
5. **新規ワークフロー追加時はこの一覧表を更新すること**
