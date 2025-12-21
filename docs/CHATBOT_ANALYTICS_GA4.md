# チャットボット（白崎セラ）簡易アナリティクス：GA4 設定手順

目的：チャットの**行動ログ**（本文は保存しない）をGA4で可視化し、改善・導線最適化・将来の配信施策の土台にする。

## 1) 収集されるイベント（実装済み）

実装：`src/components/AItuberWidget.tsx`

### イベント一覧

- `chat_open`
  - 入口ページ・参照元・UTM等（存在する場合）を記録
- `chat_close`
  - チャット滞在（ms）と送受信回数を記録
- `chat_message_send`
  - 送信回数・文字数（本文は送らない）
- `chat_message_receive`
  - 返信の文字数・レイテンシ（ms）
- `chat_link_click`
  - チャット内リンクのクリック（内部は `pathname`、外部は `hostname` のみ）
- `chat_navigation`
  - チャット利用後のページ遷移（`from_path` → `to_path`）

### 共通パラメータ（付与されるもの）

- `chat_session_id`：チャットセッションID（30分無操作で更新）
- `page_path`：イベント発生ページのパス（例：`/posts/foo`）

## 2) GA4「カスタムディメンション」登録（必須）

GA4 管理画面で「イベントパラメータ」を登録すると、探索レポートで使えます。

1. GA4 → **管理** → **カスタム定義** → **カスタム ディメンション** → **作成**
2. スコープ：**イベント**
3. 以下を追加（推奨セット）

### 推奨ディメンション（イベント）

- `chat_session_id`
- `page_path`
- `from_path`（`chat_navigation`）
- `to_path`（`chat_navigation`）
- `referrer_host`（`chat_open`）
- `link_type`（`chat_link_click`：`internal/external/unknown`）
- `link_value`（`chat_link_click`：内部は`/path`、外部は`hostname`）
- `message_length`（`chat_message_send`）
- `response_length`（`chat_message_receive`）
- `duration_ms`（`chat_close`）
- `latency_ms`（`chat_message_receive` / `chat_error`）
- `status`（`chat_message_receive`：`ok/http_error`）

### UTM等（任意）

`utm_source` / `utm_medium` / `utm_campaign` / `utm_content` / `utm_term` / `gclid` / `fbclid`

※ すでにGA4標準で取れていることも多いですが、「チャット起点」で見たい場合は登録しておくと便利です。

## 3) 探索（Explore）で見る：テンプレ

GA4 → **探索** から以下を作るのが最短です。

### A. チャット利用ファネル（導線）

**ファネル手順（例）**
1. `chat_open`
2. `chat_message_send`（任意：1回以上）
3. `chat_link_click`（任意）
4. `page_view`（または `chat_navigation`）
5. `/posts/` 配下閲覧（`page_path` でフィルタ）
6. `/posts/nursing-assistant-compare-services-perspective` or `/posts/comparison-of-three-resignation-agencies` への到達（必要なら）

**ポイント**
- 「チャット→記事→比較→離脱」が数字で見えます。

### B. “詰まり”の可視化（テーマ発見）

**見方（例）**
- イベント：`chat_message_send`
- 指標：イベント数 / ユーザー数 / 平均 `message_length`
- 分割：`page_path`、`referrer_host`、`utm_campaign`

**ポイント**
- 入口別・ページ別に「相談が多い場所」が分かります。

### C. 返答の刺さり（体験品質）

**見方（例）**
- `chat_close` の `duration_ms` を分布で確認
- `chat_message_receive` の `latency_ms` を監視（遅いと離脱増）

## 4) オーディエンス（将来のLINE/メルマガ導線に使う）

GA4 → **管理** → **オーディエンス**

例：
- 「チャット滞在が長い」：`chat_close` かつ `duration_ms >= 90000`（90秒など）
- 「複数回相談」：`chat_message_send` が 3回以上
- 「比較記事へ遷移」：`chat_navigation` の `to_path` が対象slug

※ 実際の配信施策（LINE/メルマガ）に繋げる場合は、**煽らない**・**本人の意思を尊重**・**過度なセグメントで決めつけない**運用にする。

## 5) 重要：保存しないもの（設計方針）

- チャットの**本文**はGA4にも送らない（`message_length` 等のメタ情報のみ）。
- 外部リンクは `hostname` のみ（フルURLは送らない）。

## 6) トラブルシュート

- イベントが見えない：デプロイ反映後、**数分〜最大24時間**のラグがあります。
- 開発環境：`NEXT_PUBLIC_GA_ID` が無いと送信されません。

