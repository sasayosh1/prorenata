const { createClient } = require('@sanity/client');
const Anthropic = require('@anthropic-ai/sdk');
const { SERA_BRIEF_PERSONA } = require('./utils/seraPersona');
require('dotenv').config({ path: '../.env.local' });

const SANITY_CONFIG = {
  projectId: '72m8vhy2',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN
};

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

async function expandMedicalTermsArticle() {
  console.log('医療用語記事の拡充を開始します（Claude API使用）...\n');

  // 1. Initialize clients
  const sanityClient = createClient(SANITY_CONFIG);
  const anthropic = new Anthropic({
    apiKey: ANTHROPIC_API_KEY,
  });

  // 2. 既存記事を取得
  console.log('既存記事を取得中...');
  const post = await sanityClient.fetch(
    `*[_type == "post" && slug.current == $slug][0] {
      _id,
      _rev,
      title,
      slug,
      body,
      tags,
      categories,
      author,
      publishedAt,
      excerpt
    }`,
    { slug: 'nursing-assistant-medical-terms' }
  );

  if (!post) {
    console.error('記事が見つかりませんでした。');
    return;
  }

  console.log('記事取得完了:', post.title);

  // 3. Claudeで100個の医療用語を含む新しい記事bodyを生成
  console.log('\nClaudeで記事を拡充中（100個の医療用語）...');

  const prompt = `${SERA_BRIEF_PERSONA}

# 依頼内容
以下のタイトルの記事を、Portable Text形式で**100個の医療用語を網羅**した完全版として書き直してください。

**記事タイトル**: 看護助手に必要な医療用語100選｜現場でよく使われる略語も解説

# 記事の要件
- **医療用語を必ず100個含める**（これが最優先）
- 用語は看護助手の業務に関連するものを選ぶ
- 各用語に簡潔な説明を付ける
- カテゴリ分けして整理する（H2, H3見出しを使用）
- 白崎セラの語り口で、初心者にも分かりやすく
- 「がんばる」系の表現は使用しない

# カテゴリの例（各カテゴリに10～15個の用語を含める）
1. バイタルサインに関する用語
2. 身体・解剖に関する用語
3. 症状・病態に関する用語
4. 検査・処置に関する用語
5. 医療器具・物品に関する用語
6. 薬剤・治療に関する用語
7. 体位・移動に関する用語
8. 栄養・排泄に関する用語
9. よく使われる略語

# 記事構成
- 導入（なぜ医療用語が重要か）
- H2: 【完全版】看護助手が知っておくべき医療用語100選
  - H3: バイタルサインに関する用語（10個）
  - H3: 身体・解剖に関する用語（15個）
  - H3: 症状・病態に関する用語（15個）
  - H3: 検査・処置に関する用語（15個）
  - H3: 医療器具・物品に関する用語（10個）
  - H3: 薬剤・治療に関する用語（10個）
  - H3: 体位・移動に関する用語（5個）
  - H3: 栄養・排泄に関する用語（5個）
  - H3: よく使われる略語（15個）
- H2: 医療用語を効率よく覚えるための学習法
- H2: まとめ

# 出力形式（Portable Text、JSONのみ）
{
  "body": [
    {"_type": "block", "style": "normal", "children": [{"_type": "span", "text": "白崎セラです。〜（導入文）"}]},
    {"_type": "block", "style": "h2", "children": [{"_type": "span", "text": "【完全版】看護助手が知っておくべき医療用語100選"}]},
    {"_type": "block", "style": "h3", "children": [{"_type": "span", "text": "バイタルサインに関する用語"}]},
    {"_type": "block", "style": "normal", "children": [{"_type": "span", "text": "現場で最も頻繁に使用される用語です。"}]},
    {"_type": "block", "style": "normal", "listItem": "bullet", "children": [{"_type": "span", "text": "体温（BT: Body Temperature）：身体の温度。正常値は36.0〜37.0℃。"}]},
    {"_type": "block", "style": "normal", "listItem": "bullet", "children": [{"_type": "span", "text": "脈拍（P: Pulse）：心臓の拍動数。正常値は60〜100回/分。"}]},
    ... (100個の用語を箇条書きで)
  ]
}

**重要**:
- JSON形式のみを出力してください
- コードブロック（\`\`\`json）は不要です
- 必ず100個の用語を含めてください`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 16000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const responseText = message.content[0].text;
    console.log('✅ Claudeでの生成完了');

    // JSONの抽出
    let jsonText = responseText;
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch && jsonMatch[1]) {
      jsonText = jsonMatch[1];
    } else {
      const genericMatch = responseText.match(/```\n([\s\S]*?)\n```/);
      if (genericMatch && genericMatch[1]) {
        jsonText = genericMatch[1];
      }
    }

    const generatedContent = JSON.parse(jsonText);

    // 4. 記事を更新
    console.log('\nSanityに記事を保存中...');

    const updatedPost = {
      ...post,
      body: generatedContent.body,
      _type: 'post'
    };

    // _revを除外して更新
    delete updatedPost._rev;

    const result = await sanityClient.createOrReplace(updatedPost);

    console.log('\n✅ 記事の更新が完了しました！');
    console.log('記事ID:', result._id);
    console.log('総ブロック数:', generatedContent.body.length);

    // 用語数をカウント
    const termCount = generatedContent.body.filter(block => block.listItem === 'bullet' || block.listItem === 'number').length;
    console.log('用語数（概算）:', termCount);

  } catch (error) {
    console.error('エラーが発生しました:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

expandMedicalTermsArticle();
