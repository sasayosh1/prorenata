const fs = require('fs');
const path = require('path');
const { Anthropic } = require('@anthropic-ai/sdk');
require('dotenv').config({ path: '.env.local' });

// --- Configuration ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const NOTE_DRAFTS_DIR = path.join(process.cwd(), 'note/articles');
const NEWSLETTER_CTA_FOOTER = `
---
[白崎セラの公式メルマガ（無料）はこちら]
https://prorenata.jp
※登録特典：スタンプイラストのスマホ壁紙プレゼント🌙
---
`;
const PROMPTS_DIR = path.join(process.cwd(), '00_システム/Prompts/Note記事作成ワークフロー');

// --- Helper: Read Prompt File ---
function readPrompt(filename) {
    const filepath = path.join(PROMPTS_DIR, filename);
    if (!fs.existsSync(filepath)) {
        throw new Error(`Prompt file not found: ${filepath}`);
    }
    return fs.readFileSync(filepath, 'utf-8');
}

// --- Helper: Generate with Claude ---
async function generate(anthropic, model, prompt, inputInfo = "") {
    const fullPrompt = `${prompt}\n\n---\n\n${inputInfo}`;
    const response = await anthropic.messages.create({
        model: model,
        max_tokens: 4000,
        messages: [{ role: 'user', content: fullPrompt }]
    });
    return response.content[0].text.trim();
}

// --- Helper: Get Lifestyle Context ---
function getLifestyleContext() {
    const lifestylePath = '/Users/sasakiyoshimasa/Library/Mobile Documents/iCloud~md~obsidian/Documents/sasayoshi/00_System/UserProfile/08_セラの季節感(Sera_Lifestyle).md';
    if (fs.existsSync(lifestylePath)) {
        return fs.readFileSync(lifestylePath, 'utf-8');
    }
    console.warn(`⚠️ Lifestyle context not found at: ${lifestylePath}. Skipping seasonal context.`);
    return "";
}

// --- Helper: Specific Generation Functions ---
async function createStructure(anthropic, topic, pastMemory, model) {
    let prompt = readPrompt('1_Note構成案作成プロンプト.md');
    prompt += `\n\n## 入力トピック\n${topic}`;
    const lifestyleCtx = getLifestyleContext();
    if (lifestyleCtx) {
        prompt += `\n\n## 【セラの生活・季節感データ（衣・食・住）】\n以下の辞書はセラの現在のライフスタイル設定です。この中のすべての要素を毎回の記事に無理に登場させる必要はありません。今回のトピックや感情に自然に寄り添う要素（飲み物だけ、環境だけ、など）を0〜2つ程度だけ選び、さりげなく情景描写に活用してください。不自然な要素の詰め込みは厳禁です。\n\n${lifestyleCtx}`;
    }
    if (pastMemory) {
        prompt += `\n\n## 【過去の記憶（ランダム）】\nこの記憶が現在のトピックと少しでも関連する場合のみ、\n「ふと思い出した」ようなニュアンスで構成に取り入れてください。\n（無理に関連付ける必要はありません。自然な場合のみ使用してください）\n\n${pastMemory}`;
    }

    // Character Registry
    const registryPath = path.join(process.cwd(), '00_システム/UserProfile/07_セラの記憶(Character_Event_Registry).md');
    if (fs.existsSync(registryPath)) {
        const registry = fs.readFileSync(registryPath, 'utf-8');
        prompt += `\n\n## 【登場人物・重要事象レジストリ】\n以下の設定（性格、背景、過去の出来事）を「セラの記憶」として尊重し、物語の整合性を保ってください。既存の人物を登場させることで深みを出してください。\n\n${registry}`;
    }

    return await generate(anthropic, model, prompt);
}

async function writeDraft(anthropic, structure, pastMemory, model) {
    let prompt = readPrompt('2_Note執筆プロンプト.md');
    if (pastMemory) {
        prompt += `\n\n## 【過去の記憶（ランダム）】\nこの記憶が現在のトピックと少しでも関連する場合のみ、\n「ふと思い出した」ようなニュアンスで構成に取り入れてください。\n（無理に関連付ける必要はありません。自然な場合のみ使用してください）\n\n${pastMemory}`;
    }
    return await generate(anthropic, model, prompt, structure);
}

async function refineDraft(anthropic, draft, model) {
    const prompt = readPrompt('3_Note推敲・強化プロンプト.md');
    return await generate(anthropic, model, prompt, draft);
}

async function finalizeContent(anthropic, refinedContent, model) {
    const prompt = readPrompt('4_Note最終仕上げプロンプト.md');
    return await generate(anthropic, model, prompt, refinedContent);
}

async function selectProduct(anthropic, content, model) {
    const prompt = readPrompt('5_Note商品選定プロンプト.md');
    const result = await generate(anthropic, model, prompt, content);
    const keyword = result.trim();
    return keyword === 'None' ? null : keyword;
}

// --- Helper: Get All Markdown Files Recursively ---
function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            if (file.endsWith('.md')) {
                arrayOfFiles.push(path.join(dirPath, "/", file));
            }
        }
    });

    return arrayOfFiles;
}

// --- Helper: Get Random Past Memory ---
function getRandomPastMemory() {
    if (!fs.existsSync(NOTE_DRAFTS_DIR)) {
        return null;
    }
    const files = getAllFiles(NOTE_DRAFTS_DIR);
    // Constraint: Only start recalling when we have enough history (e.g., 10+ articles)
    if (files.length < 10) {
        return null;
    }

    // 20% chance to recall a past memory
    if (Math.random() > 0.2) return null;

    const randomFile = files[Math.floor(Math.random() * files.length)];
    return fs.readFileSync(randomFile, 'utf-8');
}

// --- Main Logic ---
async function generatenoteDraft(topic) {
    if (!GEMINI_API_KEY) {
        console.error("FATAL: GEMINI_API_KEY is not set.");
        process.exit(1);
    }

    const authKey = process.env.ANTHROPIC_API_KEY || process.env.GEMINI_API_KEY;
    const anthropic = new Anthropic({ apiKey: authKey });
    const model = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest";

    console.log(`\n🚀 Starting note generation for topic: "${topic}"`);

    // 0. Get Past Memory (Context)
    const pastMemory = getRandomPastMemory();
    if (pastMemory) {
        console.log(`🧠 Recalling past memory: ${pastMemory.split('\n')[1] || "..."}`);
    } else {
        console.log(`🧠 No specific past memory recall this time.`);
    }

    try {
        // 1. Structure
        console.log("1️⃣  Creating structure...");
        const structure = await createStructure(topic, pastMemory, model);

        // 2. Draft
        console.log("2️⃣  Writing draft...");
        const draft = await writeDraft(structure, pastMemory, model); // context passed but main input is structure

        // 3. Refine
        console.log("3️⃣  Refining...");
        const refined = await refineDraft(draft, model);

        // 4. Finalize
        console.log("4️⃣  Finalizing...");
        let finalContent = await finalizeContent(refined, model);

        /*
        // 5. Select Product & Insert Affiliate Link
        console.log("5️⃣  Selecting product & generating link...");
        const selectionResult = await selectProduct(finalContent, model);

        if (selectionResult) {
            console.log(`🛒 Selection Result: ${selectionResult}`);
            const associateTag = 'ptb875pmj49-22';
            let finalUrl = '';
            let debugLog = '';

            if (selectionResult.startsWith('ASIN:')) {
                const asin = selectionResult.replace('ASIN:', '').trim();
                finalUrl = `https://www.amazon.co.jp/dp/${asin}?tag=${associateTag}`;
                debugLog = `ASIN Link (Embed Card capable): ${asin}`;
            } else if (selectionResult.startsWith('KEYWORD:')) {
                const keyword = selectionResult.replace('KEYWORD:', '').trim();
                finalUrl = `https://www.amazon.co.jp/s?k=${encodeURIComponent(keyword)}&tag=${associateTag}`;
                debugLog = `Search Link (Text fallback): ${keyword}`;
            }

            if (finalUrl) {
                console.log(`🔗 ${debugLog}`);
                // Note: Placing a raw URL on its own line triggers the Embed Card (Image).
                const affiliateBlock = `\n\n${finalUrl}\n`;

                const lastSeparatorIndex = finalContent.lastIndexOf('\n---');
                if (lastSeparatorIndex !== -1) {
                    finalContent = finalContent.slice(0, lastSeparatorIndex) + affiliateBlock + finalContent.slice(lastSeparatorIndex);
                } else {
                    finalContent += affiliateBlock;
                }
            }
        } else {
            console.log(`🛒 No specific product selected.`);
        }
        */

        // Save
        const titleMatch = finalContent.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1] : "無題";

        // Clean filename
        const safeTitle = title.replace(/[\/\\:*?"<>|]/g, '').slice(0, 30);
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const folderName = `${yyyy}-${mm}`;
        const outputDir = path.join(NOTE_DRAFTS_DIR, folderName);

        if (!fs.existsSync(outputDir)) {
            console.log(`📁 Creating directory: ${outputDir}`);
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const filename = `${yyyy}-${mm}-${dd}_${safeTitle}.md`;
        const filepath = path.join(outputDir, filename);

        // Add Common Footer
        const finalContentWithFooter = finalContent + NEWSLETTER_CTA_FOOTER;

        fs.writeFileSync(filepath, finalContentWithFooter);
        console.log(`\n✨ Successfully generated new article: ${filepath}`);

    } catch (error) {
        console.error("\n❌ Generation failed:", error);
        process.exit(1);
    }
}

// Ensure a topic is provided
const topic = process.argv[2];
if (!topic) {
    console.error("Usage: node scripts/generate-note-draft.cjs <topic>");
    process.exit(1);
}

generatenoteDraft(topic);


const structure = await createStructure(anthropic, topic, pastMemory, model);
