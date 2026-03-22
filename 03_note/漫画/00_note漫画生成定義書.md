# noteマンガ制作ガイド (`00_noteマンガ定義書.md`)

> **目的**: note記事に挿入する4コマ漫画において、セラの「感情の変化」と「物語性」を安定して再現するための決定版ガイド。

## 1. キャラクター定義: 白崎セラ (Sera Shirasaki)
*   **年齢**: 20歳（**見た目は16〜18歳**）。「可愛さ6：美しさ4」の比率。
*   **顔立ち**:
    *   **完全なベビーフェイス（丸顔）**。大きな丸い瞳（透明感のある青色）。
    *   唇のラインやハイライトを一切描かないシンプルなアニメ調。
    *   **NG**: 幼すぎる（Child/Loli）、大人すぎる（Mature/Adult）、面長。
*   **髪型**: 銀白色の**ショートボブ**。
    *   長さは**あごのライン（CHIN-LENGTH）**できっかり止める。肩にかかるのはNG。毛先は少し内巻きで、ゆふわ（Airy）。
*   **服装**:
    *   **基本**: **医療用チュニック（Medical Tunic）**。ベースは白。襟（ハイネックスタンドカラー）、両肩のパッチ、袖のライン、ポケットの縁取りが**「ネイビーブルー（紺色）」**の配色。
    *   **冬**: ネイビーのダッフルコート、マフラー。
    *   **夏**: Tシャツ、パーカー等（ラフな格好）。

## 2. マンガスタイル (Art Style & Layout)
*   **画風**: **透明感のあるライトノベル表紙風**。線画を明確に残しつつ、水彩のような透明感のある塗り。
*   **形式**: フルカラー。
*   **コマ割り**: **ダイナミックなコマ割り（斜め・変形ゴマ）を必須とする**。単調な等間隔の4コマ（田の字）は禁止。
*   **読み順**: 日本の漫画形式（右→左、上→下）。欧米式のZ字は禁止。
    *   最も「右上」からスタートし、最も「左下」で終わる。
    *   1コマ内のセリフも「右上 → 左下」の順。

## 3. 構成・ストーリーの鉄則
*   **【超重要】ワンテーマ至上主義**:
    *   記事全体から1つの核となる感情やシーンを抽出し、4コマかけてその変化（タメ・時間の流れ）を描く。要素の羅列（スライドショー）は禁止。
*   **セリフ (Nano Banana v2)**:
    *   **縦書き日本語**必須。
    *   1コマにつき吹き出し1つ。吹き出しは白背景、文字は濃いグレー（#333333）。
    *   1セリフ15文字以内。句読点（、。）は使用せず改行でリズムを作る。
    *   指定外の文字（背景・看板・効果音・英語等）は描かない。

## 4. AI生成時の絶対ルール & キーワード
AI生成時は必ず以下のベンチマーク画像を参照し、キーワードを適用すること。

### 必須キーワード
`Nano Banana Benchmark`, `Silver-white Short Bob`, `CHIN-LENGTH`, `Late Teen (17-18)`, `Baby face (Cute 6: Beautiful 4)`, `Japanese Text`, `Soft Rounded Gothic`.

### 成功プロンプトの構成要素
*   **Clothing**: `White medical tunic with Navy Blue high-neck stand collar, Navy shoulder accents, Navy lines on sleeves.`
*   **Setting**: `Hospital staff cafeteria (clean, modern, white tables), sunset light.` (学校の教室に見えないよう指定)

## 5. 参照リファレンス (Reference Assets)
*   **視覚的リファレンス (Visual Truth)**:
    *   `sera_benchmark_manga_style_v1.png` (**漫画スタイルの正解ベンチマーク**)
    *   `neb11df311769_benchmark_stable.png` (顔立ち・画風・コマ割りの基準)
    *   `night_shift_conbini_positive_end.png` (表情とポジティブな構成の基準)
    *   `sera_reference_thumbnail.png` (正解の顔立ち)

## 6. 失敗の定義 (Definition of Failure)
*   **透過処理の侵入 (Transparency Bleed)**: 白い服や明るいパーツに背景透過が侵入して黒ずんでしまう状態。
*   **キャラクターの別人化**: 幼児すぎる、大人すぎる、面長、または唇の描き込みがある状態。
*   **レイアウトの単調さ**: 等間隔のグリッド配置。
*   **文字の乱れ**: 句読点の混入、英語の混入、誤字、フォントの不整合。

## 7. 保存先・命名規則 (Storage & Naming)
*   保存先: `/Users/sasakiyoshimasa/prorenata/画像/note/マンガ/`
*   ファイル名: `記事名.png` または `ArticleID_記事名.png` (日付は含めない)

## 8. 生成履歴 (Log)
| 記事ID | 内容 | ファイル名 |
| :--- | :--- | :--- |
| neb11df311769 | 自己紹介記事用4コマ | `neb11df311769_benchmark_stable.png` |
| (New Text) | 夜勤明けのコンビニ | `night_shift_conbini_vertical_fix.png` |
| (New Text) | 夜勤明けのコンビニ（成功例） | `night_shift_conbini_positive_end.png` |

