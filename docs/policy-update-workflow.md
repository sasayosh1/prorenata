# 制度・トレンド記事の即時更新フロー

白崎セラの「読者さんへの約束」に基づき、制度やトレンド情報は**必要なタイミングですぐ更新する**。週1の自動記事生成とは切り離し、以下の手順で運用する。

---

## 1. 監視対象

| 分類 | 監視方法 | 備考 |
| --- | --- | --- |
| 厚生労働省看護課 通知・政策 | https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000177221.html RSS/ブックマーク | 新通知・ガイドライン改定を毎朝チェック |
| 日本看護協会 お知らせ | https://www.nurse.or.jp/home/information/index.html | 看護補助者関連の声明やガイドライン改訂 |
| 政府統計 e-Stat | https://www.e-stat.go.jp/stat-search | 賃金構造基本統計/就業動向の更新確認 |
| 主要医療ニュース | PRTimes 医療カテゴリ、医事新報など | 新サービス・制度トレンドを早期把握 |

発見したトピックは `docs/policy-update-workflow.md` の末尾に日付付きでメモするか、GitHub Issue を立てて一次情報リンクを記録する。

---

## 2. 更新手順

1. **一次情報を確認**  
   - リリース文/通知PDFを読み、読者に影響するポイントを整理する。  
   - 機密・個人情報を含まないことを確認。

2. **対象記事を特定**  
   - `node scripts/manual-content-helper.js --search "制度名"` などで関連記事を抽出。  
   - 必要なら新規記事を `generate-content-for-existing-titles.js` で生成。

3. **本文を更新**  
   - 公式リンクと施行日を必ず記載。  
   - 現場での注意点（手順変更・提出書類など）を白崎セラ目線で解説。  
   - Gemini 使用時は `gemini-2.5-flash-lite-001` のみ／必要な段落に限定。

4. **出典ブロックを挿入**  
   - 厚労省・JNA・政府統計など一次情報URLを1件以上。  
   - `addSourceLinksToArticle()` が既に追加した場合も、リンク先が正しいか手動確認。

5. **最終更新日・メモ**  
   - 記事末尾に `最終更新日: YYYY/MM/DD` を追記。  
   - 変更内容を `PROJECT_STATUS.md` か Issue コメントに残し、次回の確認目安を記録。

---

## 3. チェックリスト

- [ ] 公式ソースで根拠を確認した  
- [ ] 記事中に影響範囲と読者が取れるアクションを明記  
- [ ] 出典リンクを1件以上挿入（厚労省/JNA優先）  
- [ ] `sanitize --force-links` 実行でリンク配置を再調整  
- [ ] Gemini を `2.5-flash-lite-001` で最小回数のみ使用  
- [ ] 変更ログをドキュメント or Issue に残した

---

## 4. 参考リンクテンプレート

```
参考資料：厚生労働省 看護政策情報・通知一覧
https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000177221.html
```

```
参考資料：日本看護協会 看護補助者活用ガイドライン
https://www.nurse.or.jp/nursing/kango_seido/guideline/index.html
```

必要に応じて `ymyl-citation-templates.md` の統計テンプレートも併用すること。
