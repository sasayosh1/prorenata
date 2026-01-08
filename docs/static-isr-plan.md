---
title: Posts/Categories Static/ISR 再導入メモ
status: proposal
---

# 目的
現状は `force-dynamic` を優先して 500 回避と安定稼働を重視している。将来的にパフォーマンス最適化のため `static/ISR` へ段階的に戻すための設計メモ。

# 対象
- `src/app/posts/[slug]/page.tsx`
- `src/app/categories/[slug]/page.tsx`

# 現状が dynamic である理由
## /posts/[slug]
- `draftMode()` を使用しており、`headers()` を読み取る動作に依存するため。
- 過去に「Page changed from static to dynamic at runtime」を発生させたため、`force-dynamic` で明示的に固定。

## /categories/[slug]
- 本来は静的化可能だが、再発防止のため `force-dynamic` を付けて動的に固定。

# static/ISR に戻す条件
## 共通条件
- `headers()` / `cookies()` / `draftMode()` / `searchParams` を参照しない。
- `force-dynamic` を外しても実行時に動的要因を踏まない。
- `revalidate` 設定と `fetch` のキャッシュ戦略が整合している。

## /posts/[slug]
- Preview を使わない運用（または preview 専用ルートに分離）。
- `draftMode()` の参照を削除 or preview フラグで完全に分岐させる。
- ISR であれば `revalidate` を適切な値に設定し、Sanity の publish 通知で再生成できるようにする。

## /categories/[slug]
- `generateStaticParams()` が有効であれば静的化しやすい。
- `revalidate` を設定して ISR 化しても良い。

# 想定リスク（再発ポイント）
- `draftMode()` / `headers()` / `cookies()` を追加すると静的化が崩れる。
- `searchParams` の参照を追加すると動的化が発生する。
- `fetch` のキャッシュ戦略（`no-store` 等）を導入すると static/ISR が崩れる。
- `generateStaticParams()` の戻り値不足や Sanity 側の大量更新でビルド負荷が増える。

# 段階導入プラン（例）
1. **categories を ISR 化**
   - `force-dynamic` を外す。
   - `revalidate` を設定して、最小限の再生成で確認。
   - Vercel Logs で `static->dynamic` エラーが出ないことを確認。
2. **posts を ISR 化**
   - `draftMode` の整理が終わっていることを前提に切り替え。
   - まずは `revalidate` を長めに設定し、段階的に短縮。
   - エラーが出たら即時ロールバックできる仕組みを用意。

# feature flag での切替案（設計のみ）
## 推奨 env 名（サーバーサイドのみ）
- `POSTS_ISR_ENABLED` (true/false)
- `CATEGORIES_ISR_ENABLED` (true/false)

## 切替箇所（想定）
- `dynamic` の値を env で切替。
  - `POSTS_ISR_ENABLED=true` なら `force-dynamic` を解除して ISR に。
  - `false` の場合は現行通り `force-dynamic` を維持。

## ロールバック運用
- Vercel の Environment Variables を変更 → 再デプロイで即時切替。
- Logs に `Page changed from static to dynamic at runtime` が出たら即 OFF。

# 次のアクション（将来タスク）
- Preview モードの分離設計（/posts/[slug] の `draftMode()` を除去できる構成へ）。
- Sanity の Publish Webhook で `revalidate` の呼び出しを検討。
