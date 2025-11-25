#!/usr/bin/env node
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')
const { createMoshimoLinkBlocks } = require('./moshimo-affiliate-links')

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

const slugArg = process.argv.find(arg => arg.startsWith('--slug='))
const linkArg = process.argv.find(arg => arg.startsWith('--link='))
const dryRun = !process.argv.includes('--apply')

if (!slugArg || !linkArg) {
  console.error('使用方法: node scripts/insert-affiliate-block.js --slug=your-slug --link=linkKey [--apply]')
  process.exit(1)
}

const slug = slugArg.replace('--slug=', '').trim()
const linkKey = linkArg.replace('--link=', '').trim()

function findSummaryIndex(body = []) {
  return body.findIndex(block => {
    if (!block || block._type !== 'block' || block.style !== 'h2') return false
    const text = (block.children || [])
      .map(child => (child && typeof child.text === 'string' ? child.text.trim() : ''))
      .join('')
    return text === 'まとめ'
  })
}

function findInsertPosition(body = [], summaryIndex) {
  if (summaryIndex === -1) return body.length
  let position = body.length
  for (let i = summaryIndex + 1; i < body.length; i += 1) {
    const block = body[i]
    if (block && block._type === 'affiliateEmbed') {
      continue
    }
    if (block && block._type === 'block') {
      const text = (block.children || [])
        .map(child => (child && typeof child.text === 'string' ? child.text.trim() : ''))
        .join('')
      if (text.startsWith('参考') || text.startsWith('免責事項')) {
        position = i
        break
      }
    }
    position = i
    break
  }
  return position
}

async function run() {
  const doc = await client.fetch(`*[_type == "post" && slug.current == $slug][0]{ _id, title, body }`, { slug })
  if (!doc) {
    console.error(`❌ 記事が見つかりません: ${slug}`)
    process.exit(1)
  }

  if ((doc.body || []).some(block => block?._type === 'affiliateEmbed' && block.linkKey === linkKey)) {
    console.log(`✅ 既に ${linkKey} のaffiliateが存在します。処理をスキップします。`)
    return
  }

  const generatedBlocks = createMoshimoLinkBlocks(linkKey, 'まとめ')
  if (!generatedBlocks || generatedBlocks.length === 0) {
    console.error(`❌ ${linkKey} のブロックを生成できませんでした。`)
    process.exit(1)
  }

  const summaryIndex = findSummaryIndex(doc.body)
  const insertIndex = findInsertPosition(doc.body, summaryIndex)

  const newBody = [...(doc.body || [])]
  newBody.splice(insertIndex, 0, ...generatedBlocks)

  console.log(`✏️  ${doc.title} に ${linkKey} のaffiliateを挿入します (挿入位置: ${insertIndex})`)

  if (!dryRun) {
    await client.patch(doc._id).set({ body: newBody }).commit()
    console.log('✅ 反映しました')
  }
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
