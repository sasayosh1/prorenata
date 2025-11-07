#!/usr/bin/env node
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN || process.env.SANITY_WRITE_TOKEN,
  useCdn: false
})

function blockText(block = {}) {
  return (block.children || [])
    .map(child => child?.text || '')
    .join('')
    .trim()
}

function cleanseBlock(block) {
  if (!block || block._type !== 'block') {
    return { block, removed: false, removedBlock: false }
  }

  const originalMarkDefs = Array.isArray(block.markDefs) ? block.markDefs : []
  const linkMarkKeys = new Set(
    originalMarkDefs.filter(def => def?._type === 'link').map(def => def._key)
  )

  const cleansedMarkDefs = originalMarkDefs.filter(def => def?._type !== 'link')
  let childrenChanged = false
  const cleansedChildren = (block.children || []).map(child => {
    if (!child || !Array.isArray(child.marks)) {
      return child
    }
    const filteredMarks = child.marks.filter(mark => !linkMarkKeys.has(mark))
    if (filteredMarks.length !== child.marks.length) {
      childrenChanged = true
      return { ...child, marks: filteredMarks }
    }
    return child
  })

  const textContent = blockText({ ...block, children: cleansedChildren })
  const isReferenceLine = /^参考資料[:：]/.test(textContent)
  const isInternalContext = block._key?.startsWith('internal-link-')
  const isAffiliateContext = block._key?.startsWith('affiliate-context-')
  const looksLikeCta = linkMarkKeys.size > 0 && /[:：]/.test(textContent) && textContent.length < 120

  if (isReferenceLine || isInternalContext || isAffiliateContext || looksLikeCta) {
    return { block: null, removed: true, removedBlock: true }
  }

  const removed = linkMarkKeys.size > 0 || childrenChanged || originalMarkDefs.length !== cleansedMarkDefs.length
  return {
    block: { ...block, markDefs: cleansedMarkDefs, children: cleansedChildren },
    removed,
    removedBlock: false
  }
}

async function purgeLinks() {
  if (!client.config().token) {
    throw new Error('SANITY_API_TOKEN または SANITY_WRITE_TOKEN が必要です')
  }

  const posts = await client.fetch('*[_type == "post"] { _id, "slug": slug.current, body }')
  console.log(`📚 対象記事: ${posts.length}件\n`)

  let totalUpdated = 0
  let totalAffiliateEmbeds = 0
  let totalBlocksRemoved = 0

  for (const post of posts) {
    const body = Array.isArray(post.body) ? post.body : []
    const newBody = []
    let changed = false

    for (const block of body) {
      if (block?._type === 'affiliateEmbed') {
        totalAffiliateEmbeds += 1
        changed = true
        continue
      }

      const { block: cleansedBlock, removed, removedBlock } = cleanseBlock(block)
      if (removedBlock) {
        totalBlocksRemoved += 1
        changed = true
        continue
      }

      if (removed) {
        changed = true
      }

      if (cleansedBlock) {
        newBody.push(cleansedBlock)
      }
    }

    if (!changed) {
      continue
    }

    await client.patch(post._id).set({ body: newBody }).commit()
    totalUpdated += 1
    console.log(`🧼 リンク除去: ${post.slug || post._id}`)
  }

  console.log('\n✅ 完了')
  console.log(`   更新記事数: ${totalUpdated}`)
  console.log(`   削除した affiliateEmbed: ${totalAffiliateEmbeds}`)
  console.log(`   削除したリンク用ブロック: ${totalBlocksRemoved}`)
}

purgeLinks().catch(err => {
  console.error(err)
  process.exit(1)
})
