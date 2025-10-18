#!/usr/bin/env node
/**
 * clean-affiliate-sections.js
 *
 * - Removes deprecated affiliate CTAs (e.g. リニューケア, パソナライフケア) from article bodies
 * - Removes self-referential links pointing to the same article
 * - Ensures each "まとめ" セクションに要約本文を挿入する
 *
 * Run after updating SANITY_API_TOKEN with update 権限.
 */

require('dotenv').config({ path: ['.env.local', '.env'] })
const { createClient } = require('@sanity/client')
const { randomUUID } = require('crypto')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

const BANNED_TEXT_PATTERNS = [
  /リニューケア/, // old Kansai affiliate
  /パソナライフケア/, // old Pasona affiliate
  /関西圏に特化した転職サービス/, // CTA copy
]

const BANNED_LINK_PATTERNS = [
  /a_id=5207862/i, // リニューケア
  /a_id=5207867/i, // パソナライフケア
]

function blockText(block) {
  if (!block || block._type !== 'block' || !Array.isArray(block.children)) return ''
  return block.children.map((child) => child.text || '').join('')
}

function hasBannedText(block) {
  const text = blockText(block)
  return BANNED_TEXT_PATTERNS.some((pattern) => pattern.test(text))
}

function buildSummaryBlock(title) {
  return {
    _type: 'block',
    _key: `summary-${randomUUID()}`,
    style: 'normal',
    markDefs: [],
    children: [
      {
        _type: 'span',
        _key: `span-${randomUUID()}`,
        marks: [],
        text: `この記事「${title}」で紹介したポイントを踏まえ、自分の働き方やキャリアの希望に合った選択肢を見極めてください。気になるテーマは上記の各セクションを参考にしながら、必要に応じて専門家や支援サービスに相談し、無理のない形で次のステップにつなげましょう。`,
      },
    ],
  }
}

function isHeading(block) {
  return block?._type === 'block' && (block.style === 'h2' || block.style === 'h3')
}

function isSummaryHeading(block) {
  if (!isHeading(block)) return false
  const text = blockText(block).trim()
  return text === 'まとめ'
}

function removeBannedMarks(block, slug) {
  if (!block || block._type !== 'block') return block

  const markDefs = block.markDefs || []
  const bannedLinkKeys = new Set()
  const keepMarkDefs = []

  for (const def of markDefs) {
    if (def._type === 'link' && def.href) {
      const href = def.href
      const isSelfLink = href.includes(`/posts/${slug}`)
      const isBannedAffiliate = BANNED_LINK_PATTERNS.some((pattern) => pattern.test(href))

      if (isSelfLink || isBannedAffiliate) {
        bannedLinkKeys.add(def._key)
        continue
      }
    }
    keepMarkDefs.push(def)
  }

  if (bannedLinkKeys.size === 0) {
    return block
  }

  const filteredChildren = (block.children || []).filter((child) => {
    if (!child.marks) return true
    const remainingMarks = child.marks.filter((mark) => !bannedLinkKeys.has(mark))
    child.marks = remainingMarks
    return remainingMarks.length > 0 || !(child.text || '').trim()
  })

  const hasMeaningfulText = filteredChildren.some((child) => (child.text || '').trim().length > 0)

  if (!hasMeaningfulText) {
    return null
  }

  return {
    ...block,
    children: filteredChildren,
    markDefs: keepMarkDefs,
  }
}

function processBody(body, slug, title) {
  const cleaned = []

  for (const block of body) {
    if (hasBannedText(block)) {
      continue
    }

    const sanitizedBlock = removeBannedMarks(block, slug)
    if (!sanitizedBlock) {
      continue
    }

    const text = blockText(sanitizedBlock)
    if (text && text.trim().length === 0) {
      continue
    }

    cleaned.push(sanitizedBlock)
  }

  for (let i = 0; i < cleaned.length; i++) {
    const block = cleaned[i]
    if (!isSummaryHeading(block)) {
      continue
    }

    const nextBlock = cleaned[i + 1]
    if (!nextBlock || nextBlock._type !== 'block' || nextBlock.style !== 'normal' || blockText(nextBlock).trim().length === 0) {
      cleaned.splice(i + 1, nextBlock && nextBlock.style === 'normal' ? 1 : 0, buildSummaryBlock(title))
    }
  }

  return cleaned
}

async function run() {
  console.log('Fetching posts...')
  const posts = await client.fetch(`*[_type == "post" && defined(body)]{_id, title, slug, body}`)
  console.log(`Found ${posts.length} posts`)

  let updated = 0
  let tx = client.transaction()
  let counter = 0

  for (const post of posts) {
    const slug = post.slug?.current || ''
    const newBody = processBody(post.body || [], slug, post.title)

    if (JSON.stringify(newBody) === JSON.stringify(post.body)) {
      continue
    }

    tx.patch(post._id, { set: { body: newBody } })
    counter += 1
    updated += 1

    if (counter >= 20) {
      await tx.commit()
      tx = client.transaction()
      counter = 0
    }
  }

  if (counter > 0) {
    await tx.commit()
  }

  console.log(`Cleaned affiliate sections in ${updated} posts`)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
