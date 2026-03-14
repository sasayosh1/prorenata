const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') })
const { createClient } = require('@sanity/client')
const { addAffiliateLinksToArticle } = require('./utils/postHelpers')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
})

async function main() {
  console.log('🚀 Starting Affiliate Optimization bulk update...\n')

  const posts = await client.fetch(`*[_type == "post" && !(_id in path("drafts.**"))] {
    _id,
    title,
    body,
    slug,
    "categories": categories[]->title
  }`)

  console.log(`Found ${posts.length} articles to process.\n`)

  for (const post of posts) {
    if (!post.body) continue

    console.log(`Processing: ${post.title}`)
    
    // 現在のリンクを一旦削除して再追加（重複防止と位置修正のため）
    // 注意: affiliateEmbed ブロックのみを削除対象とする
    const bodyWithoutEmbeds = post.body.filter(block => block._type !== 'affiliateEmbed')
    
    const result = addAffiliateLinksToArticle(bodyWithoutEmbeds, post.title, post)

    if (result.addedLinks > 0) {
      console.log(`   ✅ Added ${result.addedLinks} links to "${post.title}"`)
      await client.patch(post._id)
        .set({ body: result.body })
        .commit()
    } else {
      console.log(`   ℹ️ No links added to "${post.title}"`)
    }
  }

  console.log('\n✨ Done!')
}

main().catch(console.error)
