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
   - 120〜160文字（厳守）。
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
      const data = JSON.parse(jsonMatch[0])
      // Final length guard
      if (data.metaDescription && data.metaDescription.length > 160) {
        data.metaDescription = data.metaDescription.slice(0, 160)
        const lastPeriod = data.metaDescription.lastIndexOf('。')
        if (lastPeriod > 120) data.metaDescription = data.metaDescription.slice(0, lastPeriod + 1)
      }
      return data
    }
  } catch (error) {
    console.error(`Error generating metadata for "${title}":`, error)
  }
  return null
}

async function run() {
  const dryRun = process.argv.includes('--dry-run')
  console.log(`🚀 Final SEO Quality Fix ${dryRun ? '(DRY RUN)' : ''} starting...`)

  const query = `*[_type == "post" && !defined(internalOnly) || internalOnly == false] {
    _id,
    title,
    body,
    excerpt,
    metaDescription
  }`

  const posts = await client.fetch(query)
  console.log(`Auditing ${posts.length} posts for title and metadata quality.`)

  for (const post of posts) {
    const originalTitle = post.title || ''
    const cleanTitle = originalTitle.replace(/[、。]/g, ' ').replace(/\s+/g, ' ').trim()
    const titleNeedsFix = originalTitle !== cleanTitle

    const metaDescription = post.metaDescription || ''
    const isTooShort = metaDescription.length < 120
    const isTooLong = metaDescription.length > 160
    const isMissing = !post.excerpt || !metaDescription
    
    const LOW_QUALITY_PATTERNS = [
      /このブログでは、.*の視点で、/,
      /迷いやすいポイントも整理してお伝えします。/,
      /。少しでも参考になれば嬉しいです。/,
      /。一緒に考えていきましょう。/,
      /。皆さんのお役に立てれば幸いです。/
    ]
    const isRobotic = metaDescription && LOW_QUALITY_PATTERNS.some(p => p.test(metaDescription))

    if (titleNeedsFix || isTooShort || isTooLong || isMissing || isRobotic) {
      console.log(`\n📄 Post: ${originalTitle}`)
      const updates = {}

      if (titleNeedsFix) {
        console.log(`  🔸 Title Fix: "${originalTitle}" -> "${cleanTitle}"`)
        updates.title = cleanTitle
      }

      if (isTooShort || isTooLong || isMissing || isRobotic) {
        console.log(`  🔸 Meta Fix: ${isTooShort ? 'Too Short' : isTooLong ? 'Too Long' : isMissing ? 'Missing' : 'Robotic'} (${metaDescription.length} chars)`)
        
        let newExcerpt = post.excerpt
        let newMeta = metaDescription

        if (!dryRun) {
          const metadata = await generateMetadata(cleanTitle, post.body)
          if (metadata) {
            newExcerpt = metadata.excerpt
            newMeta = metadata.metaDescription
          }
        }

        // Strict clamp for anyone who hit this block
        if (newMeta && newMeta.length > 160) {
          newMeta = newMeta.slice(0, 160)
          const lastPeriod = newMeta.lastIndexOf('。')
          if (lastPeriod > 120) newMeta = newMeta.slice(0, lastPeriod + 1)
        }

        updates.excerpt = newExcerpt
        updates.metaDescription = newMeta
        console.log(`  ✅ Final Meta Length: ${newMeta ? newMeta.length : 0} chars`)
      }

      if (Object.keys(updates).length > 0) {
        if (!dryRun) {
          await client.patch(post._id).set(updates).commit()
          console.log(`  ✨ Updated Sanity`)
        } else {
          console.log(`  🔍 [Dry Run] Would update: ${JSON.stringify(updates)}`)
        }
      }

      // Rate limit help
      if (!dryRun) await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  console.log('\n✨ All done!')
}

run().catch(console.error)
