const fs = require('fs');
const path = require('path');
const { createClient } = require('@sanity/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

// --- Configuration ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SANITY_API_TOKEN = process.env.SANITY_API_TOKEN;
const SANITY_PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID || '72m8vhy2';
const SANITY_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_DATASET || 'production';
const { spawnSync } = require('child_process');
const NOTE_DRAFTS_DIR = path.join(process.cwd(), 'note_drafts');
const X_POSTS_DIR = path.join(process.cwd(), 'X投稿');

// Budget Guard
const budget = spawnSync(process.execPath, [path.resolve(__dirname, 'budget-guard.cjs'), '--reserve-jpy', '2'], {
    stdio: 'inherit',
    env: process.env
});
if (budget.status !== 0) {
    console.warn('⚠️ Budget guard error. Skipping generation.');
    process.exit(0);
}

// Cost rates for Gemini 1.5 Flash (approx per 1M tokens in USD)
const USD_TO_JPY = 150; // Approximated exchange rate
const INPUT_COST_PER_1M = 0.075 * USD_TO_JPY;
const OUTPUT_COST_PER_1M = 0.30 * USD_TO_JPY;

// --- Sanity Client ---
const createSanityClient = (token = SANITY_API_TOKEN) => createClient({
    projectId: SANITY_PROJECT_ID,
    dataset: SANITY_DATASET,
    apiVersion: '2024-01-01',
    token: token,
    useCdn: true // 読み取り専用なのでキャッシュを有効化
});

let sanityClient = createSanityClient();

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
    const query = `*[_type == "post" && !(_id in path("drafts.**")) && !(slug.current match "*test*") && !(title match "*テスト*")] | order(publishedAt desc)[0...50] {
      title,
      "slug": slug.current,
      body
    }`;

    let posts;
    try {
        // 1回目：設定されたトークンで試行
        posts = await sanityClient.fetch(query);
    } catch (error) {
        // 401エラー（Unauthorized）の場合、トークンなしで再試行
        if (error.statusCode === 401 && SANITY_API_TOKEN) {
            console.warn("⚠️ Sanity token is invalid or session expired. Retrying without token...");
            sanityClient = createSanityClient(null);
            posts = await sanityClient.fetch(query);
        } else {
            throw error;
        }
    }

    if (!posts || posts.length === 0) return [];

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

    console.log("🔍 Fetching blog posts from Sanity...");
    const blogPosts = await getRandomBlogPosts(4);
    console.log(`✅ Fetched ${blogPosts.length} blog posts.`);

    console.log("🔍 Fetching latest Note post from RSS...");
    const notePublished = await getRandomPublishedNote();
    if (notePublished) {
        console.log(`✅ Fetched Note post: "${notePublished.title}"`);
    } else {
        console.warn("⚠️ No Note post found via RSS.");
    }

    const sources = [...blogPosts];
    if (notePublished) sources.push(notePublished);

    if (sources.length === 0) {
        console.error("❌ No articles found to process. Sanity or Note might be down.");
        process.exit(1);
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite-001" });

    const date = new Date();
    const dateStr = date.toISOString().split('T')[0];
    const displayDate = date.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Tokyo' }).replace(/\//g, '-');

    let promptData = `本日は ${displayDate} です。以下の ${sources.length} 件の記事について、それぞれX（旧Twitter）で紹介するための投稿文を作成してください。\n\n`;
    promptData += `【最重要ルール（セラのペルソナとテキストアート）】\n`;
    promptData += `- あなたは「白崎セラ」（20歳の精神科病院の看護助手、読書好き、少し疲れているが前向き）です。\n`;
    promptData += `- **一人称は必ず「わたし」（ひらがな）を使用してください。「私」は禁止です。**\n`;
    promptData += `- **「がんばる」からの卒業 (原則使用禁止)**: 自分、読者どちらに対しても「がんばる」「頑張る」は使わず、「歩き続ける」「向き合う」「進める」といった持続的な表現を使ってください。\n`;
    promptData += `- **漢字の開き（ひらがな化）ルール：**\n`;
    promptData += `  - 「後」→「**あと**」を使用してください（例：夜勤のあと、〇〇したあと）。\n`;
    promptData += `  - 「一つ一つ」→「**ひとつひとつ**」を使用してください。\n`;
    promptData += `  - 「朝一番」→「**朝イチ**」を使用してください。\n`;
    promptData += `  - 「寂しい」→「**さみしい**」を使用してください。\n`;
    promptData += `- **【X向けのフック（興味付け）】**「がんばらなくていい」と言いながら自分が「がんばる」と言う矛盾を避け、あえて少しビターな「独白」としてつぶやいてください。決して「〜という記事です」とは言わないこと。\n`;
    promptData += `- **【時間軸と温かみの同期（重要）】** すべての投稿を同じトーンにせず、読者の生活リズムとセラの日常を同期させてください。以下のシーンを想定して全 ${sources.length} 件を振り分けて作成してください：\n`;
    promptData += `  1. **朝の空気（起床・準備）**: 静かな決意や、少し重い体。リンクなしの独白推奨。\n`;
    promptData += `  2. **通勤・通学の窓から**: バスの窓、流れる景色。記事 ${sources[0] ? '「' + sources[0].title + '」' : '紹介'} へ繋げる。\n`;
    promptData += `  3. **昼休みの休息**: ほっと一息、おにぎりやコーヒー。リンクなしの短い独白。\n`;
    promptData += `  4. **帰路・夕暮れ**: 疲れと安堵、コンビニの灯り。記事 ${sources[1] ? '「' + sources[1].title + '」' : '紹介'} へ繋げる。\n`;
    promptData += `  5. **夜の静寂（寝る前）**: 暗い部屋、自分との対話。深い共感。リンクなし、または note記事（あれば）へ繋げる。\n`;
    promptData += `- **【リンク頻度】** 全 ${sources.length} 件のうち、**2〜3件はURLを含めない純粋な独白（Monologue）**にしてください。\n`;
    promptData += `- **【レイアウトの美学（超重要）】**\n`;
    promptData += `⭕️ 良い例（2〜3文をまとめ、投稿内に必ず1つ適度な空行を挟んで美しいアート性を持たせる）:\n`;
    promptData += `夜勤明けの朝、外の空気はこんなに爽やかなのに、自分の心だけが重く沈んでいる。どれだけ休んでも取れない「心の疲れ」。\n\n夜勤のしんどさって、一体なんなんだろう。わたしが夜勤で一番感じる「孤独感」のお話。\n\n`;
    promptData += `- 文字数はURLを含めず、1投稿あたり100文字〜140文字程度で、上記「⭕️ 良い例」のように**投稿の中で必ず1回は空行（段落分け）**を入れてください。\n`;
    promptData += `- URLを含める投稿の場合、出力の最後には、**必ず1行の空行を空けてから**URLを単独の行として含めてください。その際、必ずURLの末尾に \`?t=1\` をそのまま付け足してください。\n`;
    promptData += `- URLを含めない「独白」投稿の場合は、URL行を一切含めず、文章のみで完結させてください。\n`;
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

    const finalStr = `# ProReNata X投稿アイデア (${displayDate})\n\n` + costDisclaimer + outputText;

    if (!fs.existsSync(X_POSTS_DIR)) {
        console.log(`📁 Creating directory: ${X_POSTS_DIR}`);
        fs.mkdirSync(X_POSTS_DIR, { recursive: true });
    }

    const filepath = path.join(X_POSTS_DIR, `${displayDate}_ProReNata_X_Posts.md`);
    console.log(`📝 Writing X posts to: ${filepath}`);
    fs.writeFileSync(filepath, finalStr);

    console.log(`\n✨ X Post generated successfuly: ${filepath}`);
    console.log(`💰 Cost: ~${totalCostJPY.toFixed(3)} JPY`);
}

generateXPosts().catch(err => {
    console.error(err);
    process.exit(1);
});
