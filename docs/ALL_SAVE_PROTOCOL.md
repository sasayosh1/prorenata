# 「全部保存」プロトコル

このリポジトリでユーザーから **「全部保存」** の指示があった場合は、以下を必ず満たす。

## 必須

1. `npm run build` が通る（最低限）
2. 変更がある場合は **必ず** `git add -A && git commit && git push` まで行う
3. 変更内容に応じて、ルール・ドキュメントも同時に更新する

## ルール/ドキュメント更新の目安

- `scripts/maintenance.js` / `scripts/utils/postHelpers.js` / `scripts/run-daily-generation.cjs` を変更した場合  
  → `ARTICLE_GUIDE.md` と `RULES.md` の差分確認（ルール変更があるなら更新）

- チャットボット（`src/components/AItuberWidget.tsx`）の挙動/計測を変更した場合  
  → `docs/CHATBOT_ANALYTICS_GA4.md` の更新

## ローカル補助コマンド

チェックをまとめて実行：

- `npm run all-save`

ビルドを飛ばす（急ぎの差分確認用）：

- `npm run all-save -- --skip-build`

