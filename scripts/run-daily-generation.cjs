const { createClient } = require('@sanity/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');
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
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY, { apiVersion: 'v1' }); // Kept apiVersion: 'v1'
  const model = genAI.getGenerativeModel({ model: "gemini-pro-latest" }); // Kept gemini-pro-latest

  // 2. Select a topic
  console.log("Selecting a topic...");
  let selectedTopic; // Reverted to random topic selection
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

  // 3. Generate content with Gemini
  console.log("Generating article content with Gemini AI...");
  const prompt = `
    あなたはプロのWebライターです。以下の指示に従って、看護助手向けのブログ記事を生成してください。

    # 指示
    - テーマ: "看護助手と${selectedTopic}"
    - 文字数: 本文全体で1500〜2500文字
    - 構成: 導入文、H2見出し3〜5個、まとめのH2見出し、その下に「より良い職場環境を探している方へ」というH3見出しを必ず含めること。
    - トーン: 読者に寄り添う、プロフェッショナルかつ共感的な「です・ます」調。
    - 内部リンク: 本文中に、関連しそうな他の記事へのリンクを [INTERNAL_LINK: 関連キーワード] という形式で1〜2箇所挿入してください。
    - アフィリエイトリンク: 「より良い職場環境を探している方へ」のH3セクションに、テーマに合ったアフィリエイトリンクのプレースホルダーを [AFFILIATE_LINK: 転職] や [AFFILIATE_LINK: 退職代行] の形式で1〜2個挿入してください。

    # 出力形式
    以下のJSON形式で、キーは英語、値は日本語で出力してください。本文(body)はSanityのPortable Text形式に従ってください。
    {
      "title": "【${selectedTopic}】(ここに30〜40文字の魅力的なタイトル)",
      "tags": ["${selectedTopic}", "(その他3〜4個の関連タグ)"],
      "excerpt": "(120〜160文字の記事の要約)",
      "body": [
        {"_type": "block", "style": "normal", "children": [{"_type": "span", "text": "(導入文の段落1)"}]},
        {"_type": "block", "style": "normal", "children": [{"_type": "span", "text": "(導入文の段落2)"}]},
        {"_type": "block", "style": "h2", "children": [{"_type": "span", "text": "(H2見出し1)"}]},
        {"_type": "block", "style": "normal", "children": [{"_type": "span", "text": "(セクション1の本文)"}]},
        // ... more blocks ...
        {"_type": "block", "style": "h2", "children": [{"_type": "span", "text": "まとめ"}]},
        {"_type": "block", "style": "normal", "children": [{"_type": "span", "text": "(まとめの本文)"}]},
        {"_type": "block", "style": "h3", "children": [{"_type": "span", "text": "より良い職場環境を探している方へ"}]},
        {"_type": "block", "style": "normal", "children": [{"_type": "span", "text": "(アフィリエイト誘導文) [AFFILIATE_LINK: 転職]"}]}
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

  // 4. Save draft to Sanity
  console.log("Saving generated article as a draft to Sanity...");
  const draft = {
    _type: 'post',
    _id: 'drafts.',
    author: { _type: 'reference', _ref: 'aefbe415-6b34-4085-97b2-30b2aa12a6fa' },
    publishedAt: new Date().toISOString(),
    ...generatedArticle
  };

  try {
    const createdDraft = await sanityClient.create(draft);
    console.log("\n--- Process Complete ---");
    console.log(`Successfully created new draft in Sanity with ID: ${createdDraft._id}`);
  } catch (error) {
    console.error("Error saving draft to Sanity:", error);
  }
}

generateAndSaveArticle();