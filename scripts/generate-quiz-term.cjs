const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: '../.env.local' });

// --- Configuration ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const TERMS_FILE_PATH = path.join(__dirname, '../src/data/medical-terms.ts');

// カテゴリ定義
const CATEGORIES = {
  'vital-signs': 'バイタルサイン',
  'medication': '薬剤',
  'anatomy': '解剖',
  'equipment': '医療器具',
  'procedures': '処置・ケア'
};

// 難易度定義
const DIFFICULTIES = {
  1: '基礎',
  2: '標準',
  3: '応用'
};

// --- Helper Functions ---

function slugify(text) {
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-') // non letters/numbers -> hyphen
    .replace(/^-+|-+$/g, '') // trim hyphens
    .replace(/-+/g, '-'); // collapse
}

function makeUniqueId(preferredId, existingIds, fallbackText = '') {
  let base = slugify(preferredId || fallbackText);
  if (!base) {
    base = `term-${crypto.randomUUID().slice(0, 8)}`;
  }

  let candidate = base;
  let counter = 2;
  while (existingIds.includes(candidate)) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }
  return candidate;
}

/**
 * 既存の医療用語データを読み込む
 */
function loadExistingTerms() {
  try {
    const fileContent = fs.readFileSync(TERMS_FILE_PATH, 'utf-8');

    // export const medicalTerms: MedicalTerm[] = [ ... ] の部分を抽出
    const match = fileContent.match(/export const medicalTerms: MedicalTerm\[\] = \[([\s\S]*?)\n\]/);
    if (!match) {
      console.error('医療用語データの形式が正しくありません');
      return [];
    }

    // JSONとして解析できるように変換（簡易版）
    const termsString = match[1];

    // term, reading, meaning を抽出してIDリストを作成
    const termIds = [];
    const termTexts = [];
    const idMatches = termsString.matchAll(/id:\s*['"]([^'"]+)['"]/g);
    const termMatches = termsString.matchAll(/term:\s*['"]([^'"]+)['"]/g);

    for (const match of idMatches) {
      termIds.push(match[1]);
    }

    for (const match of termMatches) {
      termTexts.push(match[1]);
    }

    console.log(`既存の医療用語: ${termIds.length}件`);
    return { ids: termIds, terms: termTexts };
  } catch (error) {
    console.error('医療用語データの読み込みに失敗しました:', error);
    return { ids: [], terms: [] };
  }
}

/**
 * カテゴリ別の用語数を集計
 */
function analyzeCategoryBalance() {
  try {
    const fileContent = fs.readFileSync(TERMS_FILE_PATH, 'utf-8');
    const categoryCounts = {};

    for (const category in CATEGORIES) {
      const regex = new RegExp(`category:\\s*['"]${category}['"]`, 'g');
      const matches = fileContent.match(regex) || [];
      categoryCounts[category] = matches.length;
    }

    console.log('\n=== カテゴリ別集計 ===');
    for (const [category, count] of Object.entries(categoryCounts)) {
      console.log(`${CATEGORIES[category]}: ${count}件`);
    }

    // 最も少ないカテゴリを返す
    const sortedCategories = Object.entries(categoryCounts).sort((a, b) => a[1] - b[1]);
    return sortedCategories[0][0];
  } catch (error) {
    console.error('カテゴリ分析に失敗しました:', error);
    return 'vital-signs';
  }
}

/**
 * Gemini APIで新しい医療用語を生成
 */
async function generateNewTerm(targetCategory, existingIds, existingTerms) {
  console.log(`\nカテゴリ「${CATEGORIES[targetCategory]}」の用語を生成中...`);

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite-001" });

  const prompt = `あなたは看護助手向けの医療用語クイズを作成する専門家です。

【カテゴリ】
${targetCategory} (${CATEGORIES[targetCategory]})

【既存の用語（重複禁止）】
${existingTerms.slice(0, 10).join(', ')}...など${existingTerms.length}件

【既存のID（絶対に重複禁止）】
${existingIds.slice(0, 20).join(', ')}...など${existingIds.length}件
※ これらのIDは既に使用されています。必ず異なるIDを生成してください。

【指示】
1. カテゴリ「${CATEGORIES[targetCategory]}」に関連する医療用語を1つ生成してください
2. 看護助手が現場でよく使う・聞く用語を優先してください
3. 既存の用語と重複しないようにしてください
4. **重要**: IDは既存のIDリストと絶対に重複しないようにしてください
5. IDは用語の内容を表す分かりやすい英数字（例: heart-rate, bp-check, insulin-injection）
6. 難易度は1（基礎）、2（標準）、3（応用）のいずれかを設定してください
7. 3択問題として、正解1つ + 誤答2つを含めてください

【出力形式（JSON）】
{
  "id": "英数字のID（例: heart-rate, oxygen-mask-use）※既存IDと重複禁止",
  "term": "用語名（例: HR（エイチアール））",
  "reading": "ひらがな読み（例: えいちあーる）",
  "meaning": "意味の説明（例: 心拍数（Heart Rate））",
  "distractors": ["誤答1", "誤答2"],
  "difficulty": 1または2または3
}

必ずJSON形式のみで出力してください。説明文は不要です。`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // JSONを抽出
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('JSON形式の応答が得られませんでした');
    }

    const termData = JSON.parse(jsonMatch[0]);

    // 重複を避けるため、AI提案IDをベースにユニークIDを付与
    const uniqueId = makeUniqueId(termData.id, existingIds, termData.term || termData.reading || '');
    if (uniqueId !== termData.id) {
      console.warn(`警告: ID「${termData.id}」が重複していたため、"${uniqueId}" に変更しました。`);
    }
    termData.id = uniqueId;

    if (existingTerms.some(t => t.includes(termData.term.split('（')[0]))) {
      console.warn(`警告: 用語「${termData.term}」は既に存在する可能性があります。`);
    }

    // カテゴリを追加
    termData.category = targetCategory;

    console.log(`✅ 生成成功: ${termData.term}`);
    return termData;
  } catch (error) {
    console.error('用語生成に失敗しました:', error);
    return null;
  }
}

/**
 * 新しい用語をデータファイルに追加
 */
function appendTermToFile(newTerm) {
  try {
    let fileContent = fs.readFileSync(TERMS_FILE_PATH, 'utf-8');

    // 新しい用語のコードを生成
    const termCode = `  {
    id: '${newTerm.id}',
    term: '${newTerm.term}',
    reading: '${newTerm.reading}',
    meaning: '${newTerm.meaning}',
    distractors: [${newTerm.distractors.map(d => `'${d}'`).join(', ')}],
    category: '${newTerm.category}',
    difficulty: ${newTerm.difficulty}
  },`;

    // export const medicalTerms の配列の最後に追加
    const marker = '\n]\n\nexport const categories';
    const insertPosition = fileContent.indexOf(marker);

    if (insertPosition === -1) {
      console.error('挿入位置が見つかりませんでした');
      return false;
    }

    const newContent =
      fileContent.slice(0, insertPosition) +
      '\n' + termCode +
      fileContent.slice(insertPosition);

    fs.writeFileSync(TERMS_FILE_PATH, newContent, 'utf-8');
    console.log(`✅ データファイルに追加しました: ${TERMS_FILE_PATH}`);
    return true;
  } catch (error) {
    console.error('データファイルへの追加に失敗しました:', error);
    return false;
  }
}

// --- Main Logic ---

async function main() {
  console.log('=== 医療用語クイズ問題自動生成 ===\n');

  // 1. 環境変数チェック
  if (!GEMINI_API_KEY) {
    console.error('エラー: GEMINI_API_KEY環境変数が設定されていません');
    process.exit(1);
  }

  // 2. 既存の用語を読み込む
  const { ids: existingIds, terms: existingTerms } = loadExistingTerms();

  // 3. カテゴリバランスを分析
  const targetCategory = analyzeCategoryBalance();
  console.log(`\n優先カテゴリ: ${CATEGORIES[targetCategory]}`);

  // 4. 新しい用語を生成
  let newTerm = null;
  let attempts = 0;
  const maxAttempts = 3;

  while (!newTerm && attempts < maxAttempts) {
    attempts++;
    console.log(`\n生成試行 ${attempts}/${maxAttempts}...`);
    newTerm = await generateNewTerm(targetCategory, existingIds, existingTerms);

    if (!newTerm) {
      console.log('再試行します...');
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2秒待機
    }
  }

  if (!newTerm) {
    console.error('\n❌ 用語の生成に失敗しました');
    process.exit(1);
  }

  // 5. データファイルに追加
  const success = appendTermToFile(newTerm);

  if (success) {
    console.log('\n=== 生成完了 ===');
    console.log(`カテゴリ: ${CATEGORIES[newTerm.category]}`);
    console.log(`用語: ${newTerm.term}`);
    console.log(`意味: ${newTerm.meaning}`);
    console.log(`難易度: ${DIFFICULTIES[newTerm.difficulty]}`);
    console.log(`\n総問題数: ${existingIds.length + 1}件`);
  } else {
    console.error('\n❌ データファイルへの追加に失敗しました');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('予期しないエラーが発生しました:', error);
  process.exit(1);
});
