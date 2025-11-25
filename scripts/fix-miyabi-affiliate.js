#!/usr/bin/env node
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')
const { MOSHIMO_LINKS } = require('./moshimo-affiliate-links')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN,
  useCdn: false,
})

if (!client.config().token) {
  console.error('❌ SANITY_WRITE_TOKEN もしくは SANITY_API_TOKEN が必要です')
  process.exit(1)
}

const dryRun = !process.argv.includes('--apply')
const miyabiEmbed = MOSHIMO_LINKS.miyabi

if (!miyabiEmbed) {
  console.error('❌ MOSHIMO_LINKS に miyabi が見つかりません')
  process.exit(1)
}

async function run() {
  const posts = await client.fetch(`*[_type == "post" && defined(body[_type == "affiliateEmbed" && linkKey == "miyabi"])]{
    _id,
    title,
    "slug": slug.current,
    body
  }`)

  let updated = 0

  for (const post of posts) {
    let changed = false
    const newBody = (post.body || []).map(block => {
      if (block?._type === 'affiliateEmbed' && block.linkKey === 'miyabi') {
        if (block.html !== miyabiEmbed.html) {
          changed = true
          return {
            ...block,
            provider: miyabiEmbed.name,
            label: miyabiEmbed.linkText,
            html: miyabiEmbed.html,
          }
        }
      }
      return block
    })

    if (!changed) continue

    updated += 1
    console.log(`✏️  miyabiコード更新: ${post.title} (${post.slug || post._id})`)
    if (!dryRun) {
      await client.patch(post._id).set({ body: newBody }).commit()
    }
  }

  console.log(`\n${dryRun ? '🔍 ドライラン' : '✅ 更新'}: ${updated}件の投稿でみやびコードを更新しました`)
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
