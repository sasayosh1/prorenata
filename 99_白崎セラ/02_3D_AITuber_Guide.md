# 白崎セラ 3D AITuber 移行ガイド

Meshy AI を活用して、既存の PNGTuber から 3D AITuber へアップグレードするための手順です。

## 1. Meshy AI での 3D モデル生成

### Image-to-3D (おすすめ)
以下のファイルを Meshy AI にアップロードして生成してください。
- **ベース画像**: `/Users/sasakiyoshimasa/prorenata/99_白崎セラ/白崎セラ三面図.png`

### Text-to-3D (補完用)
もし画像からの生成がうまくいかない場合は、以下のプロンプトを試してください。

**Prompt**:
> A high-quality 3D anime character of a 17-year-old girl named Sera Shirasaki. She has silver-white short bob hair (soft and fluffy), calm blue eyes, and a serene, professional expression. She is wearing a white and navy blue nursing assistant uniform. Clean textures, 4k resolution, game-asset style.

**Negative Prompt**:
> distorted face, messy hair, aggressive expression, low poly, blurry textures, saturated colors, western style.

---

## 2. YouTube 第1弾動画：構成案 (Sera's Monologue #0)

**タイトル案**: 「暗闇の中の、最初の火花」
**スタイル**: 画面中央に 3D のセラ。静かなピアノの BGM。

### 台本 (Mode B: モノローグ)
> 「……あ、映ってるかな。……よし。
> 
> はじめまして。白崎セラです。
> 精神科の病院で、看護助手をしています。
> 
> ここは、わたしの『独り言』を置いておく場所にしようと思って。
> 日々の仕事の中で、言葉にならなかったこと。
> 誰かに届けるほどでもないけれど、消してしまいたくない、小さな感情の機微。
> 
> ……そんなものを、少しずつ、ここに並べていきます。
> 
> もし、夜眠れなくて、誰かの体温が少しだけ恋しくなったら。
> わたしの独り言を、聞き流しに来てください。
> 
> それでは、また。……明日も、良いことがありますように。」

---

## 3. 動画書き出し・音声合成ワークフロー

3D モデルを動画にするための推奨構成です。

1.  **3D モデル形式**: Meshy からは `GLB` または `FBX` 形式で書き出し。
2.  **トラッキング・描画**: `VSeeFace` (無料) にモデルを読み込み、Webカメラやスマホのカメラで自分の動きを反映させます。
3.  **背景合成・録画**: `OBS Studio` を使用。
    *   3D モデル（VSeeFace）をソースに追加。
    *   背景に「淡色の抽象的な画像」や「3D空間」を設置。
4.  **音声**: `VOICEVOX` (四国めたん等の落ち着いた声) で台本を読み上げ、WAV 書き出し。
5.  **編集**: 動画と音声を `CapCut` や `DaVinci Resolve` で合成し、16:9 の MP4 で出力。

---
*このガイドは、プロジェクトの AI ツール戦略に基づいて作成されました。*
