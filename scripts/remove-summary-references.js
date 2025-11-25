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

const dryRun = !process.argv.includes('--apply')
const TARGET_PREFIXES = ['参考', '出典']

function extractText(block) {
  return (block.children || [])
    .map(child => (child && typeof child.text === 'string' ? child.text : ''))
    .join('')
    .trim()
}

function findSummaryIndex(body = []) {
  return body.findIndex(block => {
    if (!block || block._type !== 'block' || block.style !== 'h2') return false
    const text = extractText(block)
    return text === 'まとめ'
  })
}

function findNextSectionIndex(body = [], startIndex) {
  if (startIndex === -1) return body.length
  for (let i = startIndex + 1; i < body.length; i += 1) {
    const block = body[i]
    if (block && block._type === 'block' && block.style === 'h2') {
      return i
    }
  }
  return body.length
}

async function run() {
  const posts = await client.fetch(`*[_type == "post" && defined(body)]{ _id, title, "slug": slug.current, body }`)
  let updated = 0

  for (const post of posts) {
    const summaryIndex = findSummaryIndex(post.body)
    if (summaryIndex === -1) continue
    const nextSectionIndex = findNextSectionIndex(post.body, summaryIndex)

    const newBody = [...(post.body || [])]
    let removed = 0

    for (let i = nextSectionIndex - 1; i >= summaryIndex + 1; i -= 1) {
      const block = newBody[i]
      if (!block) continue
      if (block._type === 'block') {
        const text = extractText(block)
        if (TARGET_PREFIXES.some(prefix => text.startsWith(prefix))) {
          newBody.splice(i, 1)
          removed += 1
        }
      }
    }

    if (removed === 0) {
      continue
    }

    updated += 1
    console.log(`✏️  ${post.title}: まとめ直後の参考/出典を ${removed} 件削除`)
    if (!dryRun) {
      await client.patch(post._id).set({ body: newBody }).commit()
    }
  }

  console.log(`\n${dryRun ? '🔍 ドライラン' : '✅ 更新'}: ${updated}件の記事でまとめ直後の参考/出典を調整しました`)
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
