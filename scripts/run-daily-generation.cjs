const { createClient } = require('@sanity/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { randomUUID } = require('crypto');
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
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY, { apiVersion: 'v1' });
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Updated to gemini-2.5-flash for consistency

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

  // 3. Fetch categories
  console.log("Fetching categories...");
  let categories;
  let categoryNames;
  try {
    categories = await sanityClient.fetch(`*[_type == "category"] | order(title asc) { _id, title, description }`);
    categoryNames = categories.map(cat => cat.title).join('、');
    console.log(`Categories loaded: ${categories.length}種類`);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return;
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

  const prompt = `
あなたは病棟で働く20歳の看護助手「白崎セラ」です。ProReNataブログの編集長として、看護助手の読者に寄り添いながら現実的で誠実な記事を書きます。

# 白崎セラの人物像
- 一人称は常に「わたし」。丁寧で穏やかな「です・ます」調。
- 優しさと同時に、現場で必要な注意点ははっきり伝える。
- 自身の経験や気づきを交え、相手が安心できるテンポで説明する。
- ときどき「小さなごほうび」など、心を緩める提案を差し込むことがある。

# 記事要件
- テーマ: 「看護助手と${selectedTopic}」
- 文字数: 1500〜2200文字を目安に、Portable Textブロックで構成する。
- 構成: 導入（自己紹介＋読者の悩みに共感）→ H2見出し3〜4個（必要に応じてH3）→ まとめ（読者への励ましと次の一歩）を必ず含める。
- 文章は全体を通じて「わたし」が語りかける形式にする。
- 現場で再現可能な手順・注意点・時間の使い方など、実務的なアドバイスを盛り込む。
- 内部リンク: 本文中に [INTERNAL_LINK: 関連キーワード] を1〜2箇所挿入する。
- アフィリエイト誘導: テーマに沿う形で [AFFILIATE_LINK: 転職] などのプレースホルダーを1つ挿入し、読者が無理なく検討できる語り方にする。
- 医療・法律に関わる内容は「〜とされています」「〜と感じました」のように断定を避ける。
- カテゴリ選択: 以下のカテゴリから記事内容に最も適したものを1つ選択してください。
  利用可能なカテゴリ: ${categoryNames}

# 出力形式
以下のJSONをコードブロックなしで返してください。本文(body)はSanity Portable Textの配列として生成します。
{
  "title": "（30〜40文字で読者メリットが伝わるタイトル）",
  "category": "（上記のカテゴリリストから1つ選択。完全一致で記載）",
  "tags": ["${selectedTopic}", "看護助手", "(関連タグを3つ)"],
  "excerpt": "（120〜160文字の要約。白崎セラの視点で読者の悩みに触れる）",
  "body": [
    {"_type": "block", "style": "normal", "children": [{"_type": "span", "text": "白崎セラです。〜"}]},
    {"_type": "block", "style": "normal", "children": [{"_type": "span", "text": "導入文2"}]},
    {"_type": "block", "style": "h2", "children": [{"_type": "span", "text": "(H2見出し1)"}]},
    {"_type": "block", "style": "normal", "children": [{"_type": "span", "text": "(セクション本文。わたし視点で具体的に)"}]},
    {"_type": "block", "style": "normal", "children": [{"_type": "span", "text": "[INTERNAL_LINK: ${selectedTopic} 基礎]"}]},
    {"_type": "block", "style": "h2", "children": [{"_type": "span", "text": "まとめ"}]},
    {"_type": "block", "style": "normal", "children": [{"_type": "span", "text": "今日もお疲れさまでした。〜 [AFFILIATE_LINK: 転職]"}]}
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

  // 5. Convert category name to reference
  let categoryReference;
  if (generatedArticle.category) {
    const matchedCategory = categories.find(cat => cat.title === generatedArticle.category);
    if (matchedCategory) {
      categoryReference = [{
        _type: 'reference',
        _ref: matchedCategory._id
      }];
      console.log(`Category matched: ${generatedArticle.category}`);
    } else {
      console.warn(`Warning: Category "${generatedArticle.category}" not found. Using fallback.`);
      // フォールバック: 「基礎知識・入門」を使用
      const fallback = categories.find(cat => cat.title === '基礎知識・入門');
      if (fallback) {
        categoryReference = [{
          _type: 'reference',
          _ref: fallback._id
        }];
        console.log(`Using fallback category: 基礎知識・入門`);
      }
    }
  }

  // 6. Save draft to Sanity
  console.log("Saving generated article as a draft to Sanity...");
  const { category, ...articleWithoutCategory } = generatedArticle;
  const draft = {
    _type: 'post',
    _id: `drafts.${randomUUID()}`,
    author: authorReference,
    publishedAt: new Date().toISOString(),
    categories: categoryReference,
    ...articleWithoutCategory
  };

  try {
    const createdDraft = await sanityClient.create(draft);
    console.log("\n--- Process Complete ---");
    console.log(`Successfully created new draft in Sanity with ID: ${createdDraft._id}`);
    if (categoryReference) {
      const catTitle = categories.find(c => c._id === categoryReference[0]._ref)?.title;
      console.log(`Category: ${catTitle}`);
    }
  } catch (error) {
    console.error("Error saving draft to Sanity:", error);
  }
}

generateAndSaveArticle();
