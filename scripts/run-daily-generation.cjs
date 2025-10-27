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

  // 4. Fetch categories and determine priority category
  console.log("Fetching categories...");
  let categories;
  let categoryNames;
  let priorityCategory = null;
  try {
    categories = await sanityClient.fetch(`*[_type == "category"] | order(title asc) { _id, title, description }`);
    categoryNames = categories.map(cat => cat.title).join('、');
    console.log(`Categories loaded: ${categories.length}種類`);

    // Get post count per category to balance distribution
    const posts = await sanityClient.fetch(`*[_type == "post"] { "categories": categories[]->title }`);
    const categoryCount = {};
    categories.forEach(cat => {
      categoryCount[cat.title] = 0;
    });

    posts.forEach(post => {
      if (post.categories && post.categories.length > 0) {
        post.categories.forEach(catTitle => {
          if (categoryCount[catTitle] !== undefined) {
            categoryCount[catTitle]++;
          }
        });
      }
    });

    // Sort categories by post count (ascending) and pick from bottom 5
    const sortedCategories = Object.entries(categoryCount)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 5); // Get 5 least populated categories

    // Randomly select one from the bottom 5
    const randomIndex = Math.floor(Math.random() * sortedCategories.length);
    const [priorityCategoryTitle, count] = sortedCategories[randomIndex];
    priorityCategory = categories.find(cat => cat.title === priorityCategoryTitle);

    console.log(`カテゴリバランス調整: "${priorityCategory.title}" を優先（現在${count}件）`);
    console.log(`記事数が少ないカテゴリTOP5: ${sortedCategories.map(([name, cnt]) => `${name}(${cnt})`).join(', ')}`);
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
- 医療・法律に関わる内容は「〜とされています」「〜と感じました」のように断定を避ける。
- **カテゴリ選択（重要）**: 利用可能なカテゴリ: ${categoryNames}
  **優先カテゴリ**: 「${priorityCategory.title}」を最優先で選択してください（現在記事数が少ないため）。
  テーマと合致する場合は必ず「${priorityCategory.title}」を選択し、どうしても合わない場合のみ他のカテゴリを選んでください。
- **タイトル文字数（SEO戦略・絶対厳守）**:
  **${titleLengthGuide}**
  **最低${titleMinLength}文字、最大${titleMaxLength}文字**
  ${titleExample}

  **【重要】タイトルは必ず${titleMinLength}文字以上${titleMaxLength}文字以内で作成してください。**
  **これはSEO戦略（ショート1:ミドル3:ロング5）の根幹であり、絶対に守ってください。**
  **${titleMinLength}文字未満のタイトルは不合格です。必ず${titleMinLength}文字以上にしてください。**

# 出力形式
以下のJSONをコードブロックなしで返してください。本文(body)はSanity Portable Textの配列として生成します。
{
  "title": "（${titleLengthGuide}で読者メリットが伝わるタイトル）",
  "category": "（上記のカテゴリリストから1つ選択。完全一致で記載）",
  "tags": ["${selectedTopic}", "看護助手", "(関連タグを3つ)"],
  "excerpt": "（120〜160文字の要約。白崎セラの視点で読者の悩みに触れる）",
  "body": [
    {"_type": "block", "style": "normal", "children": [{"_type": "span", "text": "白崎セラです。〜"}]},
    {"_type": "block", "style": "normal", "children": [{"_type": "span", "text": "導入文2"}]},
    {"_type": "block", "style": "h2", "children": [{"_type": "span", "text": "(H2見出し1)"}]},
    {"_type": "block", "style": "normal", "children": [{"_type": "span", "text": "(セクション本文。わたし視点で具体的に)"}]},
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

    if (categoryReference) {
      const catTitle = categories.find(c => c._id === categoryReference[0]._ref)?.title;
      console.log(`Category: ${catTitle}`);

      // Check if priority category was respected
      if (catTitle === priorityCategory.title) {
        console.log(`✅ 優先カテゴリ「${priorityCategory.title}」が正しく選択されました`);
      } else {
        console.log(`⚠️  優先カテゴリ「${priorityCategory.title}」ではなく「${catTitle}」が選択されました`);
      }
    }
  } catch (error) {
    console.error("Error saving draft to Sanity:", error);
  }
}

generateAndSaveArticle();
