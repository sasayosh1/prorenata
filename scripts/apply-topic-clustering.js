const path = require('path')
const { createClient } = require('@sanity/client')
const { GoogleGenerativeAI } = require('@google/generative-ai')
const { randomUUID } = require('crypto')
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') })

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
})

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite-001' })

const PILLAR_MAP = {
  'category-work': { id: 'G2Y6JXdwXQRnotb29XN0MV', slug: 'nursing-assistant-job-description-beginners', title: '看護助手の仕事内容を新人でもわかりやすく解説' },
  'IGbvz95LMMbfxWk7tzM25u': { id: 'VcGv9zZ6obDRZ14YHcUUZ0', slug: 'nursing-assistant-average-salary-data', title: '看護助手の平均給料はいくら？最新データまとめ' },
  'category-license': { id: 'VcGv9zZ6obDRZ14YHcUUw4', slug: 'nursing-assistant-qualifications-needed', title: '看護助手に資格は必要？未経験でも働ける？' },
  'category-career-change': { id: 'nursing-assistant-interview-resume-roadmap', slug: 'nursing-assistant-interview-resume-roadmap', title: '【完全版】看護助手の面接・履歴書ロードマップ｜採用されるための5つのステップ' },
  'ce8e049b-26ee-42b9-b896-e0d589e37aa4': { id: '0674c4f8-605b-42bb-9b33-b7652ececbce', slug: 'nursing-assistant-resignation-advice-workplace', title: '看護助手の円満退職完全ガイド｜同僚への伝え方から有給消化まで' },
  'category-wellbeing': { id: 'VcGv9zZ6obDRZ14YHcUUcEy', slug: 'nursing-assistant-stress-relief', title: '看護助手のストレス解消法ベスト5' }
};

const PILLAR_SLUGS = new Set(Object.values(PILLAR_MAP).map(p => p.slug));

async function getLinkContext(postTitle, pillarTitle) {
  const prompt = `
あなたは20歳の看護助手「白崎セラ」です。
現在読んでいる記事「${postTitle}」の最後に、関連するまとめ記事「${pillarTitle}」への誘導文を1文だけ、穏やかで寄り添う口調（〜ですよね、〜してみてくださいね、など）で作成してください。
自然な流れになるように、短く簡潔にお願いします。
出力は誘導文のみにしてください。
`
  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text().trim().replace(/^「|」$/g, '');
  } catch (error) {
    return 'こちらも合わせて参考にしてみてくださいね。';
  }
}

async function run() {
  console.log('🏗️ Topic Clustering starting...')

  const query = `*[_type == "post" && (!defined(internalOnly) || internalOnly == false)] {
    _id,
    title,
    "slug": slug.current,
    "categoryId": categories[0]->_id,
    body
  }`

  const posts = await client.fetch(query)
  console.log(`Auditing ${posts.length} posts for clustering.`)

  for (const post of posts) {
    const pillarResult = PILLAR_MAP[post.categoryId];
    if (!pillarResult || PILLAR_SLUGS.has(post.slug)) continue;

    const pillarSlug = pillarResult.slug;
    const bodyText = JSON.stringify(post.body || []);
    
    // Check if already linked
    if (bodyText.includes(pillarSlug)) {
        continue;
    }

    console.log(`🔗 Clustering: ${post.title} -> ${pillarResult.title}`)
    const contextText = await getLinkContext(post.title, pillarResult.title);

    const pillarLinkBlock = {
      _type: 'block',
      _key: `cluster-link-${randomUUID()}`,
      style: 'normal',
      markDefs: [
        {
          _key: `link-${randomUUID()}`,
          _type: 'link',
          href: `/posts/${pillarSlug}`
        }
      ],
      children: [
        {
          _type: 'span',
          _key: `span-${randomUUID()}`,
          marks: [],
          text: `${contextText}\n\n参考：`
        },
        {
          _type: 'span',
          _key: `span-${randomUUID()}`,
          marks: [bodyText.match(new RegExp(`cluster-link-${randomUUID()}`)) ? 'dummy' : bodyText.match(/markDefs/) ? 'link-' + (post.body.length) : 'link-1'], // Simplified mark key
          text: pillarResult.title
        }
      ]
    };
    
    // Actually constructing the link block correctly
    const linkMarkKey = `link-${randomUUID()}`;
    const constructedLinkBlock = {
      _type: 'block',
      _key: `cluster-link-${randomUUID()}`,
      style: 'normal',
      markDefs: [
        {
          _key: linkMarkKey,
          _type: 'link',
          href: `/posts/${pillarSlug}`
        }
      ],
      children: [
        {
          _type: 'span',
          _key: `span-${randomUUID()}`,
          marks: [],
          text: `${contextText} `
        },
        {
          _type: 'span',
          _key: `span-${randomUUID()}`,
          marks: [linkMarkKey],
          text: pillarResult.title
        }
      ]
    };

    // Find summary insert point (before 'まとめ' or at end)
    const newBody = [...(post.body || [])];
    const summaryIndex = newBody.findIndex(b => b.style === 'h2' && (b.children?.[0]?.text?.includes('まとめ') || b.children?.[0]?.text?.includes('最後に')));
    const insertIndex = summaryIndex !== -1 ? summaryIndex : newBody.length;

    newBody.splice(insertIndex, 0, constructedLinkBlock);

    await client
      .patch(post._id)
      .set({ body: newBody })
      .commit()
    
    console.log(`✅ Linked: ${post.title}`)
    await new Promise(resolve => setTimeout(resolve, 800))
  }

  console.log('✨ All done!')
}

run()
