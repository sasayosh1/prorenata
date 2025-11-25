#!/usr/bin/env node
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')

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

function needsFix(block) {
  if (!block || block._type !== 'block' || block.style !== 'h2') return false
  const text = (block.children || [])
    .map(child => (child && typeof child.text === 'string' ? child.text : ''))
    .join('')
    .trim()
  if (!text) return false
  if (text === 'まとめ') return false
  return text.includes('まとめ') && text.includes('次のステップ')
}

function replaceHeading(block) {
  const newChild = {
    _type: 'span',
    _key: block.children?.[0]?._key || `summary-span-${Date.now()}`,
    marks: [],
    text: 'まとめ',
  }
  return { ...block, children: [newChild] }
}

async function run() {
  const posts = await client.fetch(`*[_type == "post"]{ _id, title, "slug": slug.current, body }`)
  let updated = 0

  for (const post of posts) {
    let changed = false
    const newBody = (post.body || []).map(block => {
      if (needsFix(block)) {
        changed = true
        return replaceHeading(block)
      }
      return block
    })

    if (!changed) continue

    await client.patch(post._id).set({ body: newBody }).commit()
    updated += 1
    console.log(`✏️  ${post.title} (${post.slug || post._id}) の見出しを「まとめ」に修正`)
  }

  console.log(`\n✅ 修正完了: ${updated}件`)
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
