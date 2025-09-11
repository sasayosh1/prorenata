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
- The Sanity API token is ske49I6aVSAalmMmqchf6PLTnXgrbZSlYybgGAXwI0gLfzhpftcrjRM94V4kiOuvlCSnuyFLwR0EJDwYzH88enr0F7m8hbA1dxsiW3hOKiKmd3cBQquqU4V16uJkHdCEKVWZFflta2rOQSpoVpX2K5th9kRgITmisY86NHDcU8jmNsguHiyg
- 今後のやりとりや報告はすべて日本語で行うこと。

## Article Guidelines

- **Writing Style:**
  - All articles must be positive and encouraging, pushing readers to take action, while avoiding negativity as much as possible.
  - Do not use exclamation points (!). Avoid overly dramatic expressions (e.g., 'hero').
  - The tone should be calm and composed.

- **Quality & Structure:**
  - **Length:** 1500-2000 characters.
  - **Pacing:** The pacing should be engaging and not drawn-out.
  - **Structure:**
    - H1: 記事のメインタイトル
    - 見出し: 記事全体のリード文、導入文
    - もくじ
    - H2: 記事の主要なセクション（複数設置）
    - H3: H2の内容をさらに細分化する場合に設置（必要に応じて複数）
    - まとめ: 記事全体の結論をまとめるセクション（H2として設置）
    - アフィリエイトリンクや他の記事への訴求（関連性のある内部リンクへ）
