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
    const styleGuidelines = fs.readFileSync('00_システム/UserProfile/03_執筆スタイル(Style_Guidelines).md', 'utf8');
    const promptTemplate = fs.readFileSync('00_システム/Prompts/15_X投稿生成プロンプト.md', 'utf8');

    const sourcesContext = articles.map((a, i) => `【記事${i+1}】\nタイトル: ${a.title}\nURL: https://prorenata.jp/posts/${a.slug}\n内容要約: ${extractExcerpt(a.body).substring(0, 400)}`).join('\n\n');

    const finalPrompt = `
${promptTemplate}

## 今日のコンテキストデータ
【マスターコンテキスト】
${masterContext}

【セラの日常・執筆スタイル補足】
${calendar}
${styleGuidelines}

【セラの直近の記憶】
${memories}

【紹介する記事リスト】
${sourcesContext}

さあ、白崎セラとして、最高に「刺さる」投稿を紡いでください。
`;

    const result = await model.generateContent(finalPrompt);
    const response = await result.response;
    let output = response.text();

    const dateStr = new Date().toISOString().split('T')[0];
    const imageDir = path.join(X_POSTS_DIR, 'images');
    if (!fs.existsSync(imageDir)) fs.mkdirSync(imageDir, { recursive: true });

    // --- Image Generation Logic ---
    const imageModel = genAI.getGenerativeModel({ model: "gemini-3.1-flash-image-preview" });
    const imagePromptRegex = /\[Image Prompt:\s*(.*?)\]/g;
    let match;
    let imageIndex = 1;

    console.log("🎨 Generating associated images...");
    const matches = [...output.matchAll(imagePromptRegex)];
    
    for (const m of matches) {
        const fullTag = m[0];
        const prompt = m[1];
        const imageFileName = `post_${imageIndex}.png`;
        const imagePath = path.join(imageDir, imageFileName);
        const relativeImagePath = `./images/${imageFileName}`;

        try {
            console.log(`  - Generating image for slot ${imageIndex}...`);
            const imgResult = await imageModel.generateContent(prompt);
            const imgResp = await imgResult.response;
            if (imgResp.candidates && imgResp.candidates[0].content.parts[0].inlineData) {
                const imageData = imgResp.candidates[0].content.parts[0].inlineData.data;
                fs.writeFileSync(imagePath, Buffer.from(imageData, 'base64'));
                // Insert image link after the prompt tag in Markdown
                output = output.replace(fullTag, `${fullTag}\n![Generated Image](${relativeImagePath})`);
                console.log(`  ✅ Saved: ${imagePath}`);
            }
        } catch (e) {
            console.error(`  ❌ Failed to generate image ${imageIndex}:`, e.message);
        }
        imageIndex++;
    }

    const filePath = path.join(X_POSTS_DIR, `${dateStr}_Enhanced_X_Posts.md`);
    if (!fs.existsSync(X_POSTS_DIR)) fs.mkdirSync(X_POSTS_DIR);
    fs.writeFileSync(filePath, `# ProReNata Enhanced X Posts (${dateStr})\n\n${output}`);
    
    console.log(`✅ Enhanced posts with images generated: ${filePath}`);
}

generateEnhancedXPosts().catch(console.error);
