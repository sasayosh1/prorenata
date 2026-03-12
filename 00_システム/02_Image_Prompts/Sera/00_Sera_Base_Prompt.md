# 00_Sera_Base_Prompt.md (白崎セラ ベースプロンプト)

> **目的**: AI画像生成において、白崎セラ（Sera Shirasaki）の容姿を完全に固定し、別人化を防ぐための「マスタープロンプト（核）」です。
> **最重要（安定化のための改善案）**: テキストプロンプトだけでは限界があるため、生成ツールに**必ず「正解の画像（favicon、三面図）」をビジュアル・リファレンス（参照画像）として渡してください。**

## 1. Visual Reference Files (参照すべき正解画像)
1.  **顔の正解**: `public/sera/favicon_source - 編集済み.png`
2.  **制服・全身の正解**: `public/sera/白崎セラ三面図.png`

## 1. English Prompt (Midjourney / Niji・DALL-E3 推奨)
```text
Masterpiece, best quality, ultra-detailed 2D anime illustration.
Character: "Sera Shirasaki", a 20-year-old beautiful female (looks 17-18, "Cute 60% : Beauty 40%" ratio).
Hair: Silver-white short bob strictly at **jawline length**. Straight hime-cut bangs. Hair ends are **curved softly inwards**, airy, and fluffy ("yu-fuwa"). Side hair nicely frames her face.
Eyes: Large, wide, highly detailed light blue (cyan/amethyst) eyes with beautiful highlights.
Lips: **Minimal lip definition. NO visible lip lines, NO lipstick.** Simple anime-style mouth.
Expression: Calm, intelligent, gentle, and softly smiling but resolute.
Style: High-end modern VTuber character design, clean line work, soft and rich digital coloring with gentle gradients, clear lighting. No text. 
```

## 2. 日本語プロンプト (ChatGPT / Claude 用の指示書き)
```text
以下の設定を持つ架空のキャラクター「白崎セラ」の高品質な2Dアニメ風イラストを生成してください。

【キャラクターの容姿設定（厳守）】
*   **年齢・印象**: 20歳の女性ですが、見た目は17〜18歳くらい。「可愛さ6：美しさ4」のバランスで、聡明さと優しさを兼ね備えています。
*   **髪型・髪色**: 銀白色（シルバーホワイト）のショートボブ。**髪の長さは厳格にあごのラインまで。** まっすぐに切り揃えられた前髪（姫カット風）と、顔の横にかかるサイドの髪が特徴。毛先はストレートではなく、**内側に軽くカーブした「ゆふわ（Airy）」な質感**です。
*   **瞳**: 大きくぱっちりとした、透明感のある水色（シアン系のライトブルー）。ハイライトが綺麗に入っています。
*   **口元**: **唇のラインを描かないこと（リップ表現NG）。** シンプルなアニメ調の口元にしてください。唇の質感を出すと「美しさ」が勝ってしまうため、避けること。
*   **画風**: 現代的で高品質なVTuberデザインのようなアニメ塗り。主線が綺麗で、柔らかいグラデーションと光の表現が美しいこと。文字は入れないでください。
```

## 3. Negative Prompts (禁止事項 - 厳守)
- **Clothing**: **NO name tags**, **NO ID badges**, **NO shoulder patches**, **NO logos**, **NO medical crosses**. The uniform must be clean and plain as per the character sheet.
- **Expression**: **NO triumphant or aggressive expressions**. Avoid "shouting" or "overly confident" looks. Stick to "Calm, Analytical, Gentle, and Serene."
- **Art Style**: NO muddy colors, NO overly dark shadows, NO text on background.

## 4. Color Palette & Tone
- **Tone**: Soft, clean, transparent, and bright.
- **Colors**: White, Navy Blue (for uniform), Light Blue/Cyan (for eyes), Silver-white (for hair), soft skin tones. Avoid high-contrast or neon colors.
