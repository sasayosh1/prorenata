const path = require('path')
const { createClient } = require('@sanity/client')
const { GoogleGenerativeAI } = require('@google/generative-ai')
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

const { blocksToPlainText } = require('./utils/postHelpers')

async function generateMetadata(title, body) {
  const plainText = blocksToPlainText(body)
  const prompt = `
あなたは「白崎セラ」として、以下のブログ記事の「抜粋（excerpt）」と「メタディスクリプション（metaDescription）」を生成してください。

【白崎セラの設定】
- 20歳の看護助手。
- 一人称は「わたし」。
- 穏やかで丁寧、読者に寄り添う「隣の先輩」のようなトーン。
- 「肯定的な諦念」と「微細な救済」が核にある。

【生成ルール】
1. excerpt (抜粋):
   - 100〜150文字程度。
   - 記事の内容を要約しつつ、読者の不安に寄り添う一言を添える。
   - 文末は「…」で終わらせず、完結させる。

2. metaDescription (メタディスクリプション):
   - 120〜160文字。
   - SEOを意識し、主要なキーワードを含める。
   - 「白崎セラ」という名前は出さない。
   - 記事を読むメリットを提示する。
   - 省略記号（…）を使わず、必ず完全な文章で終わらせる。

【記事情報】
タイトル: ${title}
本文（冒頭）: ${plainText.substring(0, 2000)}

出力形式 (JSONのみ):
{
  "excerpt": "...",
  "metaDescription": "..."
}
`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch (error) {
    console.error(`Error generating metadata for "${title}":`, error)
  }
  return null
}

async function run() {
  console.log('🚀 Metadata Quality Improvement starting...')

  const query = `*[_type == "post" && !defined(internalOnly) || internalOnly == false] {
    _id,
    title,
    body,
    excerpt,
    metaDescription
  }`

  const posts = await client.fetch(query)
  console.log(`Auditing ${posts.length} posts for metadata quality.`)

  const LOW_QUALITY_PATTERNS = [
    /このブログでは、.*の視点で、/,
    /迷いやすいポイントも整理してお伝えします。/,
    /。少しでも参考になれば嬉しいです。/,
    /。一緒に考えていきましょう。/,
    /。皆さんのお役に立てれば幸いです。/
  ]

  for (const post of posts) {
    const isRobotic = post.metaDescription && LOW_QUALITY_PATTERNS.some(p => p.test(post.metaDescription))
    const isIdentical = post.excerpt && post.metaDescription && post.excerpt === post.metaDescription
    const isMissing = !post.excerpt || !post.metaDescription

    if (isRobotic || isIdentical || isMissing) {
      console.log(`🔄 Regenerating: ${post.title} (${isRobotic ? 'Robotic' : isIdentical ? 'Identical' : 'Missing'})`)
      const metadata = await generateMetadata(post.title, post.body)
      
      if (metadata) {
        await client
          .patch(post._id)
          .set({
            excerpt: metadata.excerpt,
            metaDescription: metadata.metaDescription
          })
          .commit()
        console.log(`✅ Updated: ${post.title}`)
      }
      // Rate limit help
      await new Promise(resolve => setTimeout(resolve, 800))
    }
  }

  console.log('✨ All done!')
}

run()
