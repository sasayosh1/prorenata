# 運用ルール（Google / アフィリエイト監視）

## チェック頻度
- **毎日（営業日ベース）** : Google Search Console / Google Analytics / Google AdSense / アフィリエイト管理画面
- **随時** : 重大な通知メールを受け取った際は即確認

## 1. Google Search Console
1. `https://search.google.com/search-console` にログイン
2. プロパティ `sasakiyoshimasa.com` / `prorenata.jp` を切り替えて確認
3. 確認する項目
   - **カバレッジ** : エラー URL がないか
   - **ステータス通知** : セキュリティ問題、手動対策が出ていないか
   - **インデックス登録** : 新規記事の URL がインデックスされているか（必要に応じて「URL 検査」→「インデックス登録をリクエスト」）
4. 異常時対応
   - エラー URL を修正（リダイレクト / noindex / HTML 修正など）
   - 手動対策が出た場合は原因を特定し修正後「審査をリクエスト」
   - セキュリティ問題は該当ページを調査し、原因を除去後に再審査依頼

## 2. Google Analytics（GA4）
1. `https://analytics.google.com/analytics/web/`
2. プロパティ `sasakiyoshimasa.com` / `prorenata` を確認
3. 主要指標
   - リアルタイムユーザー数（0が続いた場合、計測タグを疑う）
   - 直近日のセッション数・イベント計測状況
   - 設定 > データストリームから「過去 48 時間に受信したイベント」
4. 異常時対応
   - サイトの `<head>` に GA4 タグが残っているか確認（タブ：Network で `collect` 送信を確認）
   - vtag / consent 表示などでブロックされていないか確認
   - `measurement_id` が .env / 環境変数と一致しているか確認

## 3. Google AdSense
1. `https://www.google.com/adsense/`
2. アカウントのホーム画面アラートを確認（ads.txt / ポリシー違反など）
3. 推定収益が 0 の日が続く場合は広告配信状況を確認
4. 異常時対応
   - ads.txt の警告 → `public/ads.txt` / デプロイ先のルートに正しい `ca-pub-xxxxx` を記載し 24-48h 待機
   - ポリシー違反 → 該当ページを修正し再審査
   - 広告配信が完全停止 → サイトの自動広告設定 / 広告ユニットのコード有無を確認

## 4. アフィリエイトリンク
- 主要 ASP の管理画面（例：A8.net、もしもアフィリエイト等）にログイン
- クリック数 / 成果が異常に 0 の場合、リンク落ちを疑う
- ルーティング確認
  - ブラウザでリンククリック → 正しい LP に遷移するか
  - `rel="nofollow"` `rel="sponsored"` が付いているか
- 期限切れ広告は差し替え

## 5. 共通ログ・モニタリング
- Vercel 監視：`https://vercel.com/sasayoshis-projects` の `toyamablog` / `prorenata` のデプロイ状況
- エラーログ：`npm run lint` / `npm run build` で開発時に検知したエラーを GitHub issue 等で記録

## 6. 緊急時連絡フロー
1. 発見時に Slack / メールでサイト名・事象・影響範囲を共有
2. 応急処置 → 再発防止策 → ルール更新（必要なら本書を更新）

## 7. ドキュメント更新
- ルール変更時は `RULES.md` を更新し、変更ログ（日時・変更者・内容）を記録
- 変更内容はチームに共有

