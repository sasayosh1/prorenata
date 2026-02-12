const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

// --- Configuration ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const NOTE_DRAFTS_DIR = path.join(process.cwd(), 'note_drafts');

// --- Main Logic ---
async function generateNoteDraft(topic) {
    if (!GEMINI_API_KEY) {
        console.error("FATAL: GEMINI_API_KEY is not set.");
        process.exit(1);
    }

    // Ensure output directory exists
    if (!fs.existsSync(NOTE_DRAFTS_DIR)) {
        fs.mkdirSync(NOTE_DRAFTS_DIR, { recursive: true });
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite-001" });

    console.log(`Generating Note draft for topic: "${topic}"...`);

    const prompt = `
あなたは「白崎セラ」です。精神科病院で働く看護助手として、note（ノート）に投稿するエッセイを書いてください。

# ターゲット読者
- 同じように医療・介護現場で働き、疲れや理不尽さを感じている人
- 「辞めたい」と思っているけど、誰にも言えない人

# コンテンツの方向性（SEO記事との違い）
- ❌ 「解決策」「ノウハウ」「正しい情報」を書こうとしない。
- ⭕ **「感情」「主観」「弱音」「小さな願い」**を書く。
- ⭕ 読者が「それ、わかる...」と泣けるような、静かな共感を目指す。
- ⭕ 綺麗な文章でなくていい。独り言のように、ポツリポツリと語る。

# 文体・トーン
- 一人称: 「わたし」
- 語尾: 「〜だよね」「〜でした」「〜思うんです」。ブログ（です・ます）より少し崩した、親しい人に手紙を書くような距離感。
- 禁止: 箇条書き、太字の多用、見出しの多用（エッセイなので、段落分けだけで読ませる）。

# テーマ
「${topic}」について、あなたの経験や想いを自由に語ってください。
（具体的なエピソードを1つ混ぜてください。患者さんとのふれあい、夜勤明けの朝日、同僚との愚痴など）

# 出力形式
タイトルと本文のみを出力してください。Markdown形式で、タイトルは見出し（#）にせず、1行目にそのまま書いてください。
本文は2行目から始めてください。
`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();

        // Separate title and body
        const lines = text.split('\n');
        let title = lines[0].replace(/^#\s*/, '').trim(); // Remove # if present
        const body = lines.slice(1).join('\n').trim();

        // Clean filename
        const safeTitle = title.replace(/[\/\\:*?"<>|]/g, '').slice(0, 50);
        const dateStr = new Date().toISOString().split('T')[0];
        const filename = `${dateStr}_${safeTitle}.md`;
        const filepath = path.join(NOTE_DRAFTS_DIR, filename);

        const fileContent = `# ${title}\n\n${body}`;

        fs.writeFileSync(filepath, fileContent);
        console.log(`\n✨ Note draft generated successfully!`);
        console.log(`📂 Saved to: ${filepath}`);
        console.log(`-----------------------------------`);
        console.log(`Title: ${title}`);
        console.log(`-----------------------------------`);

    } catch (error) {
        console.error("Error generating Note draft:", error);
        process.exit(1);
    }
}

// Ensure a topic is provided
const topic = process.argv[2];
if (!topic) {
    console.error("Usage: node scripts/generate-note-draft.cjs <topic>");
    console.error("Example: node scripts/generate-note-draft.cjs '夜勤明けのコンビニ'");
    process.exit(1);
}

generateNoteDraft(topic);
