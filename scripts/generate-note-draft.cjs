const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

// --- Configuration ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const NOTE_DRAFTS_DIR = path.join(process.cwd(), 'note_drafts');
const PROMPTS_DIR = path.join(process.cwd(), '00_システム/01_Prompts/Note記事作成ワークフロー');

// --- Helper: Read Prompt File ---
function readPrompt(filename) {
    const filepath = path.join(PROMPTS_DIR, filename);
    if (!fs.existsSync(filepath)) {
        throw new Error(`Prompt file not found: ${filepath}`);
    }
    return fs.readFileSync(filepath, 'utf-8');
}

// --- Helper: Generate with Gemini ---
async function generate(model, prompt, inputInfo = "") {
    const fullPrompt = `${prompt}\n\n---\n\n${inputInfo}`;
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text().trim();
}

// --- Helper: Specific Generation Functions ---
async function createStructure(topic, pastMemory, model) {
    let prompt = readPrompt('1_Note構成案作成プロンプト.md');
    prompt += `\n\n## 入力トピック\n${topic}`;
    if (pastMemory) {
        prompt += `\n\n## 【過去の記憶（ランダム）】\nこの記憶が現在のトピックと少しでも関連する場合のみ、\n「ふと思い出した」ようなニュアンスで構成に取り入れてください。\n（無理に関連付ける必要はありません。自然な場合のみ使用してください）\n\n${pastMemory}`;
    }
    return await generate(model, prompt);
}

async function writeDraft(structure, pastMemory, model) {
    let prompt = readPrompt('2_Note執筆プロンプト.md');
    if (pastMemory) {
        prompt += `\n\n## 【過去の記憶（ランダム）】\nこの記憶が現在のトピックと少しでも関連する場合のみ、\n「ふと思い出した」ようなニュアンスで構成に取り入れてください。\n（無理に関連付ける必要はありません。自然な場合のみ使用してください）\n\n${pastMemory}`;
    }
    return await generate(model, prompt, structure);
}

async function refineDraft(draft, model) {
    const prompt = readPrompt('3_Note推敲・強化プロンプト.md');
    return await generate(model, prompt, draft);
}

async function finalizeContent(refinedContent, model) {
    const prompt = readPrompt('4_Note最終仕上げプロンプト.md');
    return await generate(model, prompt, refinedContent);
}

async function selectProduct(content, model) {
    const prompt = readPrompt('5_Note商品選定プロンプト.md');
    const result = await generate(model, prompt, content);
    const keyword = result.trim();
    return keyword === 'None' ? null : keyword;
}

// --- Helper: Get Random Past Memory ---
function getRandomPastMemory() {
    const memoryFilesDir = NOTE_DRAFTS_DIR;
    // ... (rest of function remains unchanged, implied context)
    if (!fs.existsSync(memoryFilesDir)) {
        return null; // Should not happen given main check
    }
    const files = fs.readdirSync(memoryFilesDir).filter(file => file.endsWith('.md'));
    // Constraint: Only start recalling when we have enough history (e.g., 10+ articles)
    if (files.length < 10) {
        return null;
    }

    // 20% chance to recall a past memory
    if (Math.random() > 0.2) return null;

    const randomFile = files[Math.floor(Math.random() * files.length)];
    return fs.readFileSync(path.join(memoryFilesDir, randomFile), 'utf-8');
}

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

    console.log(`\n🚀 Starting Note generation for topic: "${topic}"`);

    // 0. Get Past Memory (Context)
    const pastMemory = getRandomPastMemory();
    if (pastMemory) {
        console.log(`🧠 Recalling past memory: ${pastMemory.split('\n')[1]}`);
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

        // Save
        const titleMatch = finalContent.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1] : "無題";

        // Clean filename
        const safeTitle = title.replace(/[\/\\:*?"<>|]/g, '').slice(0, 30);
        const dateStr = new Date().toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            timeZone: 'Asia/Tokyo'
        }).replace(/\//g, '-');
        const filename = `${dateStr}_${safeTitle}.md`;
        const filepath = path.join(NOTE_DRAFTS_DIR, filename);

        fs.writeFileSync(filepath, finalContent);
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

generateNoteDraft(topic);
