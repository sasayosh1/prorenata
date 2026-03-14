const fs = require('fs');
const path = require('path');
const { createClient } = require('@sanity/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

// --- Configuration ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SANITY_API_TOKEN = process.env.SANITY_API_TOKEN;
const SANITY_PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2';
const SANITY_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const X_POSTS_DIR = path.join(process.cwd(), 'X投稿');

const sanityClient = createClient({
    projectId: SANITY_PROJECT_ID,
    dataset: SANITY_DATASET,
    apiVersion: '2024-01-01',
    token: SANITY_API_TOKEN,
    useCdn: false
});

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite-001" });

// --- Data Fetchers ---
async function fetchTopArticles(count = 3) {
    const query = `*[_type == "post" && !defined(internalOnly) || internalOnly == false] | order(coalesce(views, 0) desc)[0...20] {
        title, "slug": slug.current, body
    }`;
    const posts = await sanityClient.fetch(query);
    return posts.sort(() => 0.5 - Math.random()).slice(0, count);
}

function extractExcerpt(body) {
    if (!body || !Array.isArray(body)) return '';
    return body
        .filter(b => b._type === 'block' && b.children)
        .map(b => b.children.map(c => c.text).join(''))
        .join(' ')
        .substring(0, 500);
}

// --- Generator ---
async function generateEnhancedXPosts() {
    console.log("🚀 Starting Enhanced X Generation...");
    
    const articles = await fetchTopArticles(3);
    
    // Read Context Files
    const masterContext = fs.readFileSync('00_システム/UserProfile/00_Master_Context.md', 'utf8');
    const memories = fs.readFileSync('00_システム/UserProfile/07_セラの記憶(Character_Event_Registry).md', 'utf8');
    const calendar = fs.readFileSync('00_システム/UserProfile/08_Sera_Lifestyle_Calendar.md', 'utf8');
    const seraBaseImage = fs.readFileSync('00_システム/Image_Prompts/Sera/00_Sera_Base_Prompt.md', 'utf8');

    const prompt = `
あなたは20歳の看護助手「白崎セラ」です。
以下の情報を踏まえて、今日のX（旧Twitter）向けの投稿を5件作成してください。

【コンテキスト】
1. セラの基本情報・物語:
${masterContext}

2. セラの記憶（登場人物・出来事）:
${memories}

3. セラの日常リズム:
${calendar}

4. 紹介する記事:
${articles.map((a, i) => `記事${i+1}: ${a.title} (https://prorenata.jp/posts/${a.slug})\n内容抜粋: ${extractExcerpt(a.body).substring(0, 300)}`).join('\n\n')}

【生成ルール】
- 投稿1: 朝（日勤前または夜勤明け）。独白のみ。
- 投稿2: 昼（休憩中）。記事1を紹介。
- 投稿3: 夕方（帰路）。記事2を紹介。
- 投稿4: 夜（ひとり時間、猫のリンクと）。独白のみ。
- 投稿5: 深夜（静寂、自分との対話）。記事3またはnoteの雰囲気で紹介。

【ライティングの掟】
- 一人称は「わたし」。
- 「がんばる」「頑張る」は**絶対に使用禁止**です。「歩き続ける」「向き合う」「整える」「進める」などの持続的な表現に言い換えてください。
- 漢字は適度に開き（ひらがな化）、美しく静かなテキストアートを目指す。
- 2〜3文を1ブロックとし、空行は1つまで。
- URLは最後に空行を挟んで配置。URL末尾に \`?t=1\` を付与。

出力形式:
---
## 投稿[n]: [時間帯]
[投稿本文]

[URL (あれば)]
---
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const output = response.text();

    const dateStr = new Date().toISOString().split('T')[0];
    const filePath = path.join(X_POSTS_DIR, `${dateStr}_Enhanced_X_Posts.md`);
    
    if (!fs.existsSync(X_POSTS_DIR)) fs.mkdirSync(X_POSTS_DIR);
    fs.writeFileSync(filePath, `# ProReNata Enhanced X Posts (${dateStr})\n\n${output}`);
    
    console.log(`✅ Enhanced posts generated: ${filePath}`);
}

generateEnhancedXPosts().catch(console.error);
