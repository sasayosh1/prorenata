# noteサムネイル生成ガイド (`note_サムネイル.md`)

> **目的**: note記事のサムネイル（アイキャッチ画像）において、セラの「生活の匂い」と「情緒的な空気感」を安定して再現するための決定版ガイド。

## 1. ビジュアル・リファレンス (Visual Benchmarks)
以下の画像が、顔立ち・色味・雰囲気の「正解」です。
- `ぬるくなったカフェオレと、星の王子さま.png`
- `夜勤明けコンビニのカフェラテ_v2.png`
- `ブログでは書けない、制服を脱いだ「素」の私.png`

## 2. キャラクター定義: 白崎セラ (OFFモード)
*   **顔立ち**: **丸顔のベビーフェイス**。20歳だが17〜18歳に見える「可愛さ7：美しさ3」の比率。
*   **口元（最重要）**: **唇のラインやテカリ、ハイライトを一切描かない**。シンプルなアニメ調の線のみ。唇を描き込むと別人化（大人びすぎる）するため厳禁。
*   **髪型**: 銀白色のショートボブ。長さは**あごのライン（Chin-length）**で切り揃え、毛先を軽く内側に巻いた「ゆふわ（Airy）」な質感。肩にかかる長さはNG。
*   **瞳**: 透明感のある水色。きらきらしたハイライトが必須。
*   **服装**: ペールトーン、アイボリー、グレージュなどの淡い色の「もこもこした部屋着」や「柔らかいオーバーサイズのニット」。

## 3. 画風・タッチ (Art Style)
*   **スタイル**: **高品質な2Dアニメイラスト (2D Anime Illustration)**。
*   **特徴**: 主線を綺麗に出しつつ、塗りは「水彩のような透明感」や「柔らかなグラデーション」を重視。
*   **NG**: 3D的な質感、リアルな肌のテクスチャ、油彩風の重い塗り、実写合成。

## 4. 構図と演出 (Composition & Lighting)
*   **構図**: セラを中央に配置せず、左右に寄せた「三分割法」を基本とする。
*   **視点（Peeking）**: 手前に家具、マグカップ、窓枠などをぼかして配置し（Foreground blur）、彼女のプライベートを少し離れた場所から見守るような「覗き見」のアングル。
*   **目線**: **カメラ目線を避ける**。手元の本、飲み物、あるいは窓の外を見て思索に耽る様子を描く（Gaze away）。
*   **ライティング**: オレンジ色の暖かな室内灯と、窓の外の青白い夜（または夕暮れ）の「温度差」によるコントラストを多用する。
*   **文字（ProReNata等）**: **一切入れない**。イラストの空気感のみでブランドを表現する。

## 5. マスタープロンプト構成 (DALL-E3 / Niji)
```text
Masterpiece, best quality, ultra-detailed 2D anime illustration. 
Scene: [Specific Scene Description].
Character: Sera Shirasaki, 17-18 years old beautiful girl, round baby face. 
Hair: Silver-white chin-length short bob, airy and fluffy. 
Eyes: Large light blue eyes with highlights. 
Mouth: Minimal anime style, NO lip lines, NO lipstick. 
Pose: Looking away, thoughtful expression, [Action]. 
Outfit: Soft and fluffy loungewear in ivory or greige. 
Atmosphere: Quiet, intimate, slightly melancholy but warm. 
Lighting: Warm orange lamp light vs cool blue night outside through a window, soft bokeh. 
Composition: Rule of thirds, non-centered, foreground blur for depth. 
Style: Clean line art, soft digital watercolor coloring. NO text.
## 6. 失敗例と言語化 (Negative Examples & Pitfalls)
過去の失敗例を分析し、生成の際に出現しやすい「エラー」を言語化しました。

### A. 3D・写実的・シネマティックすぎるスタイル
- **特徴**: 質感（肌、服、髪）が立体的すぎたり、照明がリアルすぎる。ライトノベル的な「2Dイラスト感」がなくなる。
- **NG理由**: 既存の情緒的なイラスト群と並んだ際に、人工的な浮き方をしてしまい、「ProReNataの世界観」が崩れる。

### B. 文字（ProReNataロゴ等）の混入
- **特徴**: 画像内に "ProReNata" やその他のアルファベット、記号がデザインとして入る。
- **NG理由**: noteのリスト画面で記事タイトルと重複し、視認性が低下する。また、商業的な「広告感」が出てしまい、セラのプライベートな独白感を損なう。

### C. 唇の描き込み（別人化）
- **特徴**: 唇に明確なラインがある、リップのテカリやハイライトが入る、少し開いた色っぽい口元。
- **NG理由**: セラのチャームポイントである「ベビーフェイス」と「透明感」が失われ、大人びすぎた、あるいは艶めかしい印象になってしまう。

### D. 髪の長さと質感の間違い
- **特徴**: 髪が肩まである（セミロング）、あるいは毛先がストレートすぎて鋭い。
- **NG理由**: セラの「あごラインのショートボブ」というアイデンティティが失われる。毛先は必ず「ゆふわ（Airy）」な内巻きでなければならない。

### E. 正面からの機械的な構図
- **特徴**: キャラクターがど真ん中に大きく配置され、カメラをじっと見つめている。
- **NG理由**: 視聴者に「見られている」という意識を強要し、セラの日常を「覗き見る」ような温度感が消え、汎用的なキャラクター画像に見えてしまう。

---
*これらをネガティブプロンプトや、プロンプト内の詳細指示（No lip definition, Peerking perspective等）に盛り込むことで、失敗を回避してください。*

## 7. 保存先ルール (Storage)
*   生成されたサムネイル画像は、原則として以下のディレクトリに保存すること。
    *   `/Users/sasakiyoshimasa/prorenata/画像/note/サムネイル/`
*   ファイル名は `記事タイトル.png` の形式とする。
