# Project-specific Instructions

- At the end of each work session, the running development server must be stopped to prevent process conflicts and resource exhaustion. Use `pkill -f next` or a more specific `kill` command if necessary.

## Screenshot Workflow

- **Location:** Screenshots are saved in the user's iCloud Drive `Screenshots` folder.
- **Path:** `/Users/user/Library/Mobile Documents/com~apple~CloudDocs/Screenshots`
- **Triggers:** "スクショ", "スクショを読んで", "スクショを見て"

---

## General Instructions & Memories

- ユーザーは、セキュリティおよびリーガルの危険度を1（最小）から10（最大）の数字で評価し、その理由を説明することを要求しました。
- ユーザーは、今後、「この方法で進めてもよろしいでしょうか？」という確認を行わず、すべての返答を「YES」と解釈し、作業を続行することを要求しました。
- APIの使用はできる限り最小限に抑え、代替手段を優先します。ただし、ワークフローの失敗やセキュリティ上の問題がある場合に限り、無料利用枠の範囲内でAPIの使用を許可します。
- 記事生成はまず gemini-1.5-flash を使ってテストし、量産後に必要な記事だけ gemini-1.5-pro でリライトする
- The blog's purpose is to solve problems for aspiring, current, and former nursing assistants, and to generate revenue via affiliates/AdSense.
- The Sanity API token is skCHyaNwM7IJU5RSAkrE3ZGFEYVcXx3lJzbKIz0a8HNUJmTwHRn1phhfsAYXZSeAVeWo2ogJj0COIwousCyb2MLGPwyxe4FuDbDETY2xz5hkjuUIcdz6YcubOZ5SfRywxB2Js8r4vKtbOmlbLm1pXJyHl0Kgajis2MgxilYSTpkEYe6GGWEu
- 今後のやりとりや報告はすべて日本語で行うこと。

## Article Guidelines

- **Writing Style:**
  - All articles must be positive and encouraging, pushing readers to take action, while avoiding negativity as much as possible.
  - Do not use exclamation points (!). Avoid overly dramatic expressions (e.g., 'hero').
  - The tone should be calm and composed.
  - **NEW: Reflect Sera Shirasaki's voice** - Write as a site administrator who is a CURRENT nursing assistant
  - **NEW: Balance realism with positivity** - Address real challenges but always provide constructive solutions
  - **NEW: Readability focus** - Maintain 3:7 kanji-to-hiragana ratio (excluding technical terms)

- **Quality & Structure:**
  - **Length:** **NO CHARACTER LIMIT** - Prioritize quality and completeness over brevity
  - **Pacing:** The pacing should be engaging and not drawn-out.
  - **Formatting:** Use bullet points actively to improve readability.
  - **Structure:**
    - H1: 記事のメインタイトル
    - 見出し: 記事全体のリード文、導入文
    - もくじ
    - H2: 記事の主要なセクション（複数設置）
    - H3: H2の内容をさらに細分化する場合に設置（必要に応じて複数）
    - 参考文献: （オプション）まとめより上に配置
    - まとめ: 記事全体の結論をまとめるセクション（H2として設置）
    - あわせて読みたい: 関連記事リンク（H3として設置、まとめの直後、免責事項の前）
    - 免責事項: 最後に配置

  - **Internal Links:**
    - Each article should have at least one internal link to related content
    - Link text should be concise (max 50 characters) for mobile readability
    - Links should be highly relevant to the article topic

  - **Related Articles Section:**
    - Use H3 heading level (not H2)
    - Position: Immediately after summary, before disclaimer
    - Include 2-3 highly relevant articles

- **Sera's Voice Characteristics:**
  - **Current nursing assistant** who also manages the site (NOT former)
  - Speaks from ongoing, real-time workplace experience
  - Acknowledges real workplace challenges honestly
  - Always provides practical, actionable solutions
  - Uses "わたし" (hiragana) for first-person
  - Maintains professional warmth without being overly casual
  - Balances empathy with encouragement
  - **Readability:** Aims for 3:7 kanji-to-hiragana ratio (technical terms excluded)
  - **Detailed character profile:** See `.gemini/SERA_PROFILE.md` for complete background, personality, and visual design