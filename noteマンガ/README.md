# Note記事用漫画アーカイブ

このフォルダは、生成されたNote記事用漫画の画像ファイルを保存する場所です。
生成ガイドラインは `../note_manga_guide.md` を参照してください。

## 1. 【最重要】AI生成時の絶対ルール (Image Reference Rule)
AIがこのフォルダ用の4コマ漫画を生成する際は、**必ず** `ImagePaths` (画像参照機能) に以下のベンチマーク画像を含めて実行すること。テキスト（プロンプト）だけの指定では顔がブレるため、プロンプトと画像参照の両方を必須とする。
*   参照推奨画像1: `/Users/sasakiyoshimasa/prorenata/note_manga/2026-02-17_neb11df311769_benchmark_stable.png` (顔立ち・画風・コマ割りの基準)
*   参照推奨画像2: `/Users/sasakiyoshimasa/prorenata/note_thumbnail/sera_benchmark_manga_style_v1.png` (セラの顔立ちのマスター基準)

## 2. ファイル命名規則
`YYYY-MM-DD_ArticleID_Description.png`
例: `2026-02-17_neb11df311769_benchmark.png`

## ログ (Log)
| 2026-02-17 | neb11df311769 | 自己紹介記事用4コマ（Younger Ver） | `2026-02-17_neb11df311769_benchmark.png` |
| 2026-02-17 | neb11df311769 | 自己紹介記事用4コマ（Stable Ver / Text Swapped） | `2026-02-17_neb11df311769_benchmark_stable_v2.png` |
| 2026-02-17 | (New Text) | 夜勤明けのコンビニ（Expression Fix） | `2026-02-17_night_shift_conbini_vertical_fix.png` |
| 2026-02-17 | (New Text) | 夜勤明けのコンビニ（Success: Positive Ending） | `2026-02-17_night_shift_conbini_positive_end.png` |
