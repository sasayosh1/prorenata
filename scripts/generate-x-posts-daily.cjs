const fs = require('fs');
const path = require('path');
const { createClient } = require('@sanity/client');
const { Anthropic } = require('@anthropic-ai/sdk');
require('dotenv').config({ path: '.env.local' });

// --- Configuration ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SANITY_API_TOKEN = process.env.SANITY_API_TOKEN;
const SANITY_PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID || '72m8vhy2';
const SANITY_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_DATASET || 'production';
const { spawnSync } = require('child_process');
const NOTE_DRAFTS_DIR = path.join(process.cwd(), 'note/articles');
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
 * Sanityから閲覧数上位30件を取得し、そこからランダムに指定件数ピックアップ
 */
async function getRandomBlogPosts(count = 4) {
    // 閲覧数（views）が多い順に30件取得。viewsがnullの場合は0として扱う。
    const query = `*[_type == "post" && !(_id in path("drafts.**")) && !(slug.current match "*test*") && !(title match "*テスト*")] | order(coalesce(views, 0) desc)[0...30] {
      title,
      "slug": slug.current,
      body,
      views
    }`;

    let posts;
    try {
        posts = await sanityClient.fetch(query);
    } catch (error) {
        if (error.statusCode === 401 && SANITY_API_TOKEN) {
            console.warn("⚠️ Sanity token is invalid or session expired. Retrying without token...");
            sanityClient = createSanityClient(null);
            posts = await sanityClient.fetch(query);
        } else {
            throw error;
        }
    }

    if (!posts || posts.length === 0) return [];

    console.log(`📊 Found ${posts.length} top-viewed articles in Sanity.`);

    // Shuffle top 30 and pick requested count
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
 * RSSからランダムに1件の公開済みnote記事を取得
 */
async function getRandomPublishednote() {
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
        console.error("Failed to fetch note RSS:", e);
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

    console.log("🔍 Fetching latest note post from RSS...");
    const notePublished = await getRandomPublishednote();
    if (notePublished) {
        console.log(`✅ Fetched note post: "${notePublished.title}"`);
    } else {
        console.warn("⚠️ No note post found via RSS.");
    }

    const sources = [...blogPosts];
    if (notePublished) sources.push(notePublished);

    if (sources.length === 0) {
        console.error("❌ No articles found to process. Sanity or note might be down.");
        process.exit(1);
    }

    const anthropicKey = process.env.ANTHROPIC_API_KEY || process.env.GEMINI_API_KEY;
    const anthropic = new Anthropic({ apiKey: anthropicKey });
    const model = process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest";

    const date = new Date();
    const displayDate = date.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Tokyo' }).replace(/\//g, '-');

    const masterContextPath = path.join(process.cwd(), '00_システム/UserProfile/00_Master_Context.md');
    const memoriesPath = path.join(process.cwd(), '00_システム/UserProfile/07_セラの記憶(Character_Event_Registry).md');
    const calendarPath = path.join(process.cwd(), '00_システム/UserProfile/08_Sera_Lifestyle_Calendar.md');
    const stylePath = path.join(process.cwd(), '00_システム/UserProfile/03_執筆スタイル(Style_Guidelines).md');

    const masterContext = fs.readFileSync(masterContextPath, 'utf8');
    const memories = fs.readFileSync(memoriesPath, 'utf8');
    const calendar = fs.readFileSync(calendarPath, 'utf8');
    const styleGuidelines = fs.readFileSync(stylePath, 'utf8');

    const promptTemplatePath = path.join(process.cwd(), '00_システム/Prompts/15_X投稿生成プロンプト.md');
    const promptTemplate = fs.readFileSync(promptTemplatePath, 'utf8');

    const sourcesContext = sources.map((s, i) => `【記事${i+1}】\nタイトル: ${s.title}\nURL: ${s.url}\n内容要約: ${s.excerpt}`).join('\n\n');

    const prompt = `
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

    console.log("🧠 Sending to Claude 3.5 Sonnet...");

    const response = await anthropic.messages.create({
      model: model,
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    });
    let outputText = response.content[0].text.trim();
    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;

    // NOTE: Image generation is currently disabled due to Gemini API key expiration.
    console.log("⚠️ 画像生成はGemini APIキーの期限切れのためスキップされました。");

    // Calculate costs in JPY
    const inputCostJPY = (inputTokens / 1000000) * INPUT_COST_PER_1M;
    const outputCostJPY = (outputTokens / 1000000) * OUTPUT_COST_PER_1M;
    const totalCostJPY = inputCostJPY + outputCostJPY;

    const costDisclaimer = `> **💰 AI API消費コスト概算 (Claude 3.5 Sonnet)**
> - 入力トークン: ${inputTokens}
> - 出力トークン: ${outputTokens}
> - **合計コスト: Claude Pro 予算内で運用中**

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
