const fs = require('fs');
const path = require('path');
const { createClient } = require('@sanity/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

// --- Configuration ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SANITY_API_TOKEN = process.env.SANITY_API_TOKEN;
const NOTE_DRAFTS_DIR = path.join(process.cwd(), 'note_drafts');
const X_POSTS_DIR = path.join(process.cwd(), 'X投稿');

// Cost rates for Gemini 1.5 Flash (approx per 1M tokens in USD)
const USD_TO_JPY = 150; // Approximated exchange rate
const INPUT_COST_PER_1M = 0.075 * USD_TO_JPY;
const OUTPUT_COST_PER_1M = 0.30 * USD_TO_JPY;

// --- Sanity Client ---
const sanityClient = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    token: SANITY_API_TOKEN,
    useCdn: false
});

/**
 * 記事本文からテキストを抽出（最初の数ブロックのみ）
 */
function extractTextExcerpt(body, maxLength = 500) {
    if (!body || !Array.isArray(body)) return '';
    let text = '';
    for (const block of body) {
        if (block._type === 'block' && block.children) {
            for (const child of block.children) {
                if (child.text) text += child.text + ' ';
            }
        }
        if (text.length > maxLength) break;
    }
    return text.substring(0, maxLength) + '...';
}

/**
 * Sanityからランダムに4件の公開済み記事を取得
 */
async function getRandomBlogPosts(count = 4) {
    // 最新50件からランダムに選出
    const posts = await sanityClient.fetch(
        `*[_type == "post" && !(_id in path("drafts.**"))] | order(publishedAt desc)[0...50] {
      title,
      "slug": slug.current,
      body
    }`
    );

    if (posts.length === 0) return [];

    // Shuffle and pick 4
    const shuffled = posts.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count);

    return selected.map(post => ({
        type: 'blog',
        title: post.title,
        url: `https://prorenata.jp/posts/${post.slug}`,
        excerpt: extractTextExcerpt(post.body)
    }));
}

/**
 * RSSからランダムに1件の公開済みNote記事を取得
 */
async function getRandomPublishedNote() {
    try {
        const response = await fetch('https://note.com/prorenata/rss');
        if (!response.ok) return null;
        const xml = await response.text();

        const itemRegex = /<item>[\s\S]*?<\/item>/g;
        const items = [...xml.matchAll(itemRegex)].map(m => m[0]);
        if (items.length === 0) return null;

        const randomItem = items[Math.floor(Math.random() * items.length)];
        const titleMatch = randomItem.match(/<title>(.*?)<\/title>/);
        const linkMatch = randomItem.match(/<link>(.*?)<\/link>/);
        const descMatch = randomItem.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/);

        const title = titleMatch ? titleMatch[1] : '無題';
        const url = linkMatch ? linkMatch[1] : 'URL不明';

        let excerpt = '';
        if (descMatch) {
            excerpt = descMatch[1].replace(/<[^>]+>/g, '').trim();
            excerpt = excerpt.substring(0, 500) + '...';
        }

        return {
            type: 'note',
            title: title,
            url: url,
            excerpt: excerpt
        };
    } catch (e) {
        console.error("Failed to fetch Note RSS:", e);
        return null;
    }
}

/**
 * GeminiでXポスト生成
 */
async function generateXPosts() {
    if (!GEMINI_API_KEY) {
        console.error("❌ GEMINI_API_KEY is missing.");
        process.exit(1);
    }

    console.log("🔍 Fetching articles...");
    const blogPosts = await getRandomBlogPosts(4);
    const notePublished = await getRandomPublishedNote();

    const sources = [...blogPosts];
    if (notePublished) sources.push(notePublished);

    if (sources.length === 0) {
        console.error("❌ No articles found to process.");
        process.exit(1);
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite-001" });

    const dateStr = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Tokyo' }).replace(/\//g, '-');

    let promptData = `本日は ${dateStr} です。以下の ${sources.length} 件の記事について、それぞれX（旧Twitter）で紹介するための投稿文を作成してください。\n\n`;
    promptData += `【ルール】\n`;
    promptData += `- ProReNataブログ記事（4件）とNoteエッセイ記事（1件）があります。\n`;
    promptData += `- 文字数は1投稿あたり100文字〜140文字程度。\n`;
    promptData += `- セラのキャラクター（20歳の看護助手、読書好き、少し疲れているが前向き、柔らかい話し方）に合わせてください。\n`;
    promptData += `- ハッシュタグ（#）は絶対に使用しないでください。\n`;
    promptData += `- 出力の最後には必ず記事のURLを含めてください。\n`;
    promptData += `- マークダウン形式（## 投稿1：...）で出力してください。\n\n`;

    sources.forEach((source, index) => {
        promptData += `--- 記事${index + 1} (${source.type}) ---\n`;
        promptData += `タイトル: ${source.title}\n`;
        promptData += `URL: ${source.url}\n`;
        promptData += `内容抜粋: ${source.excerpt}\n\n`;
    });

    const prompt = promptData;

    console.log("🧠 Sending to Gemini 1.5 Flash...");

    // Calculate Input Tokens
    const countResult = await model.countTokens(prompt);
    const inputTokens = countResult.totalTokens;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const outputText = response.text().trim();

    // Try to estimate output tokens
    const outputTokensCount = await model.countTokens(outputText);
    const outputTokens = outputTokensCount.totalTokens;

    // Calculate costs in JPY
    const inputCostJPY = (inputTokens / 1000000) * INPUT_COST_PER_1M;
    const outputCostJPY = (outputTokens / 1000000) * OUTPUT_COST_PER_1M;
    const totalCostJPY = inputCostJPY + outputCostJPY;

    const costDisclaimer = `> **💰 AI API消費コスト概算 (Gemini 2.0 Flash Lite)**
> - 入力トークン: ${inputTokens} (${inputCostJPY.toFixed(3)}円)
> - 出力トークン: ${outputTokens} (${outputCostJPY.toFixed(3)}円)
> - **合計コスト: 約 ${totalCostJPY.toFixed(3)}円**

`;

    const finalStr = `# ProReNata X投稿アイデア (${dateStr})\n\n` + costDisclaimer + outputText;

    if (!fs.existsSync(X_POSTS_DIR)) {
        fs.mkdirSync(X_POSTS_DIR, { recursive: true });
    }

    const filepath = path.join(X_POSTS_DIR, `${dateStr}_ProReNata_X_Posts.md`);
    fs.writeFileSync(filepath, finalStr);

    console.log(`\n✨ X Post generated: ${filepath}`);
    console.log(`💰 Cost: ~${totalCostJPY.toFixed(3)} JPY`);
}

generateXPosts().catch(err => {
    console.error(err);
    process.exit(1);
});
