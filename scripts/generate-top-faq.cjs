/**
 * トップ人気記事9件にFAQを自動生成してSanityにパッチするスクリプト
 * 使用モデル: gemini-2.0-flash-lite-001（無料枠内）
 * 推定コスト: ¥0
 */

const { createClient } = require('@sanity/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { randomUUID } = require('crypto');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local'), override: true });

const GEMINI_MODEL = 'gemini-2.0-flash-lite-001';
const PROTECTED_SLUGS = [
  'comparison-of-three-resignation-agencies',
  'nursing-assistant-compare-services-perspective',
];

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_DATASET || 'production',
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || process.env.SANITY_API_VERSION || '2024-01-01',
  token: process.env.SANITY_API_TOKEN || process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

function toPlainText(blocks = []) {
  if (!Array.isArray(blocks)) return '';
  return blocks
    .map(block => {
      if (block._type !== 'block' || !block.children) return '';
      return block.children.map(child => child.text || '').join('');
    })
    .join('\n')
    .trim();
}

async function generateFaq(title, bodyText) {
  const prompt = `
あなたは看護助手向け情報サイトのSEO専門家です。
以下の記事タイトルと本文を読んで、読者が実際に検索しそうなFAQを3問生成してください。

# 記事タイトル
${title}

# 記事本文（抜粋）
${bodyText.substring(0, 2000)}

# 要件
- 質問は読者が実際にGoogle検索しそうな自然な疑問文
- 回答は80〜120文字程度で具体的かつ完結
- 記事の内容に沿った内容にすること
- 白崎セラ（看護助手キャラ）の一人称「わたし」は使わない（サイト側の客観的な文体）

# 出力形式（JSONのみ、コードブロックなし）
[
  {"question": "質問1", "answer": "回答1"},
  {"question": "質問2", "answer": "回答2"},
  {"question": "質問3", "answer": "回答3"}
]
`;

  const result = await model.generateContent(prompt);
  let text = result.response.text().trim();
  text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error(`FAQ parse error: ${text.substring(0, 100)}`);

  // 末尾カンマ・文字列内改行を除去（Geminiが出力することがある）
  const sanitized = match[0]
    .replace(/,\s*([\]}])/g, '$1')          // trailing commas
    .replace(/"([^"]*)\n([^"]*)"/g, '"$1 $2"') // newlines inside strings
    .replace(/\r?\n/g, ' ')                 // remaining newlines
    .replace(/\s{2,}/g, ' ');              // multiple spaces

  const faqArray = JSON.parse(sanitized);
  return faqArray
    .filter(item => item.question && item.answer)
    .map(item => ({
      _type: 'faqItem',
      _key: randomUUID(),
      question: item.question,
      answer: item.answer,
    }));
}

async function main() {
  console.log('=== トップ人気記事 FAQ 自動生成 ===\n');

  // トップ9記事を取得（views順、FAQなし）
  const articles = await sanityClient.fetch(`
    *[_type == "post"
      && (!defined(internalOnly) || internalOnly == false)
      && (!defined(maintenanceLocked) || maintenanceLocked == false)
      && defined(slug.current)
    ]
    | score(views > 0)
    | order(views desc, _score desc, publishedAt desc)
    [0...9] {
      _id,
      title,
      "slug": slug.current,
      views,
      faq,
      body
    }
  `);

  console.log(`対象候補: ${articles.length}件`);

  const targets = articles.filter(a => {
    if (PROTECTED_SLUGS.includes(a.slug)) return false;
    if (Array.isArray(a.faq) && a.faq.length > 0) {
      console.log(`  スキップ（FAQ済み）: ${a.title}`);
      return false;
    }
    return true;
  });

  console.log(`FAQ生成対象: ${targets.length}件\n`);

  let successCount = 0;
  for (const article of targets) {
    console.log(`処理中: "${article.title}"`);
    try {
      const bodyText = toPlainText(article.body);
      if (!bodyText) {
        console.log('  ⚠️  本文が空のためスキップ');
        continue;
      }

      const faq = await generateFaq(article.title, bodyText);
      console.log(`  生成されたFAQ: ${faq.length}問`);

      await sanityClient.patch(article._id).set({ faq }).commit();
      console.log(`  ✅ Sanityにパッチ完了: ${article._id}`);
      successCount++;

      // レート制限対策
      await new Promise(r => setTimeout(r, 1500));
    } catch (err) {
      console.error(`  ❌ エラー: ${err.message}`);
    }
  }

  console.log(`\n=== 完了: ${successCount}/${targets.length}件 ===`);
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
