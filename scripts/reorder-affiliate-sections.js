#!/usr/bin/env node
/**
 * reorder-affiliate-sections.js
 *
 * Ensures each H3 section follows the structure:
 * H3 → explanatory paragraphs → bullet lists (optional) → CTA paragraph → affiliate link paragraph.
 * For blocks containing affiliate links, any surrounding call-to-action text is moved into a
 * preceding paragraph so that the actual link appears last in the section.
 */

require('dotenv').config({ path: ['.env.local', '.env'] })
const { createClient } = require('@sanity/client')
const { randomUUID } = require('crypto')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
})

const AFFILIATE_PATTERNS = [
  /af\.moshimo\.com/i,
  /a8mat=/i,
  /valuecommerce/i,
  /tcs-asp\.net/i,
  /af\.afb\.jp/i,
  /link-ag\.jp/i,
  /h.accesstrade/i,
]

function isHeading(block) {
  return block?._type === 'block' && (block.style === 'h2' || block.style === 'h3')
}

function isH3(block) {
  return block?._type === 'block' && block.style === 'h3'
}

function isBullet(block) {
  return block?.listItem === 'bullet'
}

function isAffiliateLinkDef(markDef) {
  if (!markDef || markDef._type !== 'link' || !markDef.href) return false
  return AFFILIATE_PATTERNS.some((pattern) => pattern.test(markDef.href))
}

function getAffiliateMarkKeys(block) {
  if (!block?.markDefs?.length) return new Set()
  return new Set(block.markDefs.filter(isAffiliateLinkDef).map((def) => def._key))
}

function splitAffiliateBlock(block) {
  if (!block || block._type !== 'block') return { introBlock: null, linkBlock: null }
  const affiliateKeys = getAffiliateMarkKeys(block)
  if (!affiliateKeys.size) return { introBlock: block, linkBlock: null }

  const introChildren = []
  const linkChildren = []

  for (const child of block.children || []) {
    const hasAffiliateMark = child.marks?.some((mark) => affiliateKeys.has(mark))
    if (hasAffiliateMark) {
      linkChildren.push(child)
    } else {
      introChildren.push(child)
    }
  }

  const introBlock = introChildren.length
    ? {
        ...block,
        _key: `${block._key}-intro-${randomUUID()}`,
        children: introChildren,
        markDefs: (block.markDefs || []).filter((def) =>
          introChildren.some((child) => child.marks?.includes(def._key))
        ),
      }
    : null

  const linkBlock = linkChildren.length
    ? {
        ...block,
        _key: `${block._key}-link-${randomUUID()}`,
        children: linkChildren,
        markDefs: (block.markDefs || []).filter((def) => affiliateKeys.has(def._key)),
      }
    : null

  return { introBlock, linkBlock }
}

function reorderSection(blocks) {
  const preBullet = []
  const bulletBlocks = []
  const postBullet = []
  const affiliateBlocks = []
  let encounteredBullet = false

  for (const block of blocks) {
    if (isBullet(block)) {
      bulletBlocks.push(block)
      encounteredBullet = true
      continue
    }

    if (block?._type === 'block') {
      const affiliateKeys = getAffiliateMarkKeys(block)
      if (affiliateKeys.size) {
        const { introBlock, linkBlock } = splitAffiliateBlock(block)
        if (introBlock) {
          postBullet.push(introBlock)
        }
        if (linkBlock) {
          affiliateBlocks.push(linkBlock)
        }
        continue
      }
    }

    if (encounteredBullet) {
      postBullet.push(block)
    } else {
      preBullet.push(block)
    }
  }

  return [...preBullet, ...bulletBlocks, ...postBullet, ...affiliateBlocks]
}

function reorderBody(body) {
  const result = []
  let i = 0
  while (i < body.length) {
    const block = body[i]
    result.push(block)
    i += 1

    if (!isH3(block)) {
      continue
    }

    const section = []
    while (i < body.length && !isHeading(body[i])) {
      section.push(body[i])
      i += 1
    }

    if (section.length === 0) {
      continue
    }

    const reordered = reorderSection(section)
    result.push(...reordered)
  }

  return result
}

async function run() {
  console.log('Fetching posts...')
  const posts = await client.fetch(`*[_type == "post" && defined(body)]{_id, body}`)
  console.log(`Found ${posts.length} posts`)

  let updatedCount = 0
  let batch = client.transaction()
  let batchSize = 0

  for (const post of posts) {
    const reordered = reorderBody(post.body)
    const originalStr = JSON.stringify(post.body)
    const reorderedStr = JSON.stringify(reordered)

    if (originalStr === reorderedStr) {
      continue
    }

    batch.patch(post._id, { set: { body: reordered } })
    batchSize += 1
    updatedCount += 1

    if (batchSize >= 20) {
      await batch.commit()
      batch = client.transaction()
      batchSize = 0
    }
  }

  if (batchSize > 0) {
    await batch.commit()
  }

  console.log(`Reordered affiliate sections in ${updatedCount} posts`)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
