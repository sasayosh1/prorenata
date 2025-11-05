const { createClient } = require('@sanity/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { randomUUID } = require('crypto');
const { SERA_FULL_PERSONA } = require('./utils/seraPersona');
require('dotenv').config({ path: '../.env.local' }); // For local testing

// --- Configuration ---
const SANITY_CONFIG = {
  projectId: '72m8vhy2',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN 
};

const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // Reverted to process.env.GEMINI_API_KEY

// --- Main Logic ---

async function generateAndSaveArticle() {
  console.log("Starting daily article generation process...");

  // 1. Initialize clients
  if (!SANITY_CONFIG.token || !GEMINI_API_KEY) {
    console.error("FATAL: SANITY_WRITE_TOKEN or GEMINI_API_KEY environment variables are not set.");
    process.exit(1);
  }
  const sanityClient = createClient(SANITY_CONFIG);
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite-001" }); // バージョン固定、Proフォールバック防止、Vertex AI禁止

  // 2. Select a topic
  console.log("Selecting a topic...");
  let selectedTopic;
  try {
    const query = `*[_type == "post" && defined(tags)].tags`;
    const tagsArrays = await sanityClient.fetch(query);
    const allTags = [].concat.apply([], tagsArrays);
    const uniqueTags = [...new Set(allTags)];
    if (uniqueTags.length === 0) {
      console.error("No tags found to select a topic from.");
      return;
    }
    const randomIndex = Math.floor(Math.random() * uniqueTags.length);
    selectedTopic = uniqueTags[randomIndex];
    console.log(`Topic selected: "${selectedTopic}"`);
  } catch (error) {
    console.error("Error selecting topic from Sanity:", error);
    return;
  }

  // 3. Determine keyword tail type (Short/Middle/Long)
  console.log("Determining keyword tail type...");
  let targetTail = 'long'; // Default to long tail
  try {
    const posts = await sanityClient.fetch(`*[_type == "post"] { title }`);

    const tailCount = { short: 0, middle: 0, long: 0 };
    posts.forEach(post => {
      const length = post.title.length;
      if (length <= 30) {
        tailCount.short++;
      } else if (length <= 45) {
        tailCount.middle++;
      } else {
        tailCount.long++;
      }
    });

    const total = posts.length;
    const shortPercent = (tailCount.short / total) * 100;
    const middlePercent = (tailCount.middle / total) * 100;
    const longPercent = (tailCount.long / total) * 100;

    // Target ratios from CLAUDE.md (Short 1 : Middle 3 : Long 5)
    const targetShort = 12.5; // 10-15%
    const targetMiddle = 37.5; // 35-40%
    const targetLong = 50; // 45-55%

    const shortDiff = targetShort - shortPercent;
    const middleDiff = targetMiddle - middlePercent;
    const longDiff = targetLong - longPercent;

    console.log(`現在のテール分布: ショート${shortPercent.toFixed(1)}%, ミドル${middlePercent.toFixed(1)}%, ロング${longPercent.toFixed(1)}%`);
    console.log(`目標比率: ショート${targetShort}%, ミドル${targetMiddle}%, ロング${targetLong}%`);

    // Select most deficient tail type
    if (longDiff > 0 && longDiff >= middleDiff && longDiff >= shortDiff) {
      targetTail = 'long';
      console.log(`テールバランス調整: ロングテール優先（${longDiff.toFixed(1)}%不足）`);
    } else if (middleDiff > 0 && middleDiff >= shortDiff) {
      targetTail = 'middle';
      console.log(`テールバランス調整: ミドルテール優先（${middleDiff.toFixed(1)}%不足）`);
    } else if (shortDiff > 0) {
      targetTail = 'short';
      console.log(`テールバランス調整: ショートテール優先（${shortDiff.toFixed(1)}%不足）`);
    } else {
      // All targets met, default to long tail (most valuable for SEO)
      targetTail = 'long';
      console.log(`テールバランス調整: すべて適正範囲、ロングテール生成（SEO最優先）`);
    }
  } catch (error) {
    console.error('Error analyzing tail distribution:', error);
    console.log('Defaulting to long tail...');
  }

  // 4. Generate content with Gemini
  console.log("Generating article content with Gemini AI...");
  console.log("Fetching 白崎セラ author document...");
  let authorReference;
  try {
    const authorDoc = await sanityClient.fetch(
      `*[_type == "author" && (name == $name || slug.current == $slug)][0]`,
      { name: '白崎セラ', slug: 'shirasaki-sera' }
    );

    if (!authorDoc?._id) {
      console.error('FATAL: Author "白崎セラ" not found in Sanity.');
      return;
    }

    authorReference = {
      _type: 'reference',
      _ref: authorDoc._id
    };
    console.log(`Author resolved: ${authorDoc.name} (${authorDoc._id})`);
  } catch (error) {
    console.error('Error fetching author document:', error);
    return;
  }

  // Define title length based on tail type
  let titleLengthGuide = '';
  let titleExample = '';
  let titleMinLength = 0;
  let titleMaxLength = 0;
  if (targetTail === 'short') {
    titleLengthGuide = '20〜30文字（シンプルで直接的）';
    titleExample = '例: 「看護助手の給料を徹底解説」（15文字）';
    titleMinLength = 20;
    titleMaxLength = 30;
  } else if (targetTail === 'middle') {
    titleLengthGuide = '31〜45文字（具体的で魅力的）';
    titleExample = '例: 「看護助手の給料が低い理由と年収アップの3つの方法」（27文字）';
    titleMinLength = 31;
    titleMaxLength = 45;
  } else { // long
    titleLengthGuide = '46〜65文字（超具体的でロングテール）';
    titleExample = '例: 「【2025年最新】看護助手の給料が低い理由とは？夜勤・資格・転職で年収アップする完全ガイド」（50文字）';
    titleMinLength = 46;
    titleMaxLength = 65;
  }

  const prompt = `
${SERA_FULL_PERSONA}

# 記事要件
- テーマ: 「看護助手と${selectedTopic}」
- 文字数: 1500〜2200文字、Portable Textブロック形式
- 構成: 導入 → H2見出し3〜4個 → まとめ
- **重要**: まとめでは「次回〜」「お楽しみに」など次回への言及は不要
- 実務的なアドバイス、断定回避（「〜とされています」等）
- **タイトル文字数（SEO戦略・絶対厳守）**:
  **${titleLengthGuide}**
  **最低${titleMinLength}文字、最大${titleMaxLength}文字**
  ${titleExample}

# 出力形式（JSON、コードブロックなし）
{
  "title": "（${titleLengthGuide}で読者メリットが伝わるタイトル）",
  "tags": ["${selectedTopic}", "看護助手"],
  "body": [
    {"_type": "block", "style": "normal", "children": [{"_type": "span", "text": "白崎セラです。〜"}]},
    {"_type": "block", "style": "h2", "children": [{"_type": "span", "text": "(H2見出し1)"}]},
    {"_type": "block", "style": "normal", "children": [{"_type": "span", "text": "(本文)"}]},
    {"_type": "block", "style": "h2", "children": [{"_type": "span", "text": "まとめ"}]},
    {"_type": "block", "style": "normal", "children": [{"_type": "span", "text": "今日もお疲れさまでした。〜"}]}
  ]
}
  `;

  let generatedArticle;
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Extract JSON part using regex
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch && jsonMatch[1]) {
      text = jsonMatch[1];
    } else {
      // Fallback if not wrapped in ```json
      const genericJsonMatch = text.match(/```\n([\s\S]*?)\n```/);
      if (genericJsonMatch && genericJsonMatch[1]) {
        text = genericJsonMatch[1];
      }
    }

    generatedArticle = JSON.parse(text);
    console.log("Successfully generated article content.");
  } catch (error) {
    console.error("Error generating content with Gemini AI:", error);
    return;
  }

  // 5. カテゴリとExcerptは空で保存（メンテナンススクリプトで自動生成）
  console.log("Saving generated article as a draft to Sanity...");
  const draft = {
    _type: 'post',
    _id: `drafts.${randomUUID()}`,
    author: authorReference,
    publishedAt: new Date().toISOString(),
    title: generatedArticle.title,
    tags: generatedArticle.tags,
    body: generatedArticle.body,
    categories: [], // メンテナンスで自動選択
    excerpt: '',    // メンテナンスで自動生成
  };

  try {
    const createdDraft = await sanityClient.create(draft);
    console.log("\n--- Process Complete ---");
    console.log(`Successfully created new draft in Sanity with ID: ${createdDraft._id}`);

    // Verify tail type
    const titleLength = generatedArticle.title.length;
    let actualTail = '';
    if (titleLength <= 30) {
      actualTail = 'short';
    } else if (titleLength <= 45) {
      actualTail = 'middle';
    } else {
      actualTail = 'long';
    }

    console.log(`Title: "${generatedArticle.title}" (${titleLength}文字)`);
    console.log(`Target tail: ${targetTail.toUpperCase()} / Actual tail: ${actualTail.toUpperCase()}`);

    if (actualTail === targetTail) {
      console.log(`✅ テールタイプが正しく生成されました（${targetTail}）`);
    } else {
      console.log(`⚠️  テールタイプが異なります（目標: ${targetTail}, 実際: ${actualTail}）`);
    }

    console.log(`📝 カテゴリとExcerptはメンテナンススクリプトで自動生成されます`)
  } catch (error) {
    console.error("Error saving draft to Sanity:", error);
  }
}

generateAndSaveArticle();
