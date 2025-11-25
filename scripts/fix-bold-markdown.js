#!/usr/bin/env node
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')
const { randomUUID } = require('crypto')

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

function splitBoldSegments(text) {
  const segments = []
  let cursor = 0
  while (cursor < text.length) {
    const start = text.indexOf('**', cursor)
    if (start === -1) {
      const remaining = text.slice(cursor)
      if (remaining) {
        segments.push({ text: remaining, bold: false })
      }
      break
    }

    if (start > cursor) {
      segments.push({ text: text.slice(cursor, start), bold: false })
    }

    const end = text.indexOf('**', start + 2)
    if (end === -1) {
      const remaining = text.slice(start)
      if (remaining) segments.push({ text: remaining, bold: false })
      break
    }

    const boldText = text.slice(start + 2, end)
    if (boldText) {
      segments.push({ text: boldText, bold: true })
    }
    cursor = end + 2
  }

  return segments
}

function processBlock(block) {
  if (!block || block._type !== 'block' || !Array.isArray(block.children)) {
    return { block, changed: false }
  }

  let changed = false
  const newChildren = []

  for (const child of block.children) {
    if (!child || typeof child.text !== 'string') {
      newChildren.push(child)
      continue
    }

    if (!child.text.includes('**')) {
      newChildren.push(child)
      continue
    }

    const segments = splitBoldSegments(child.text)
    if (segments.length === 0) {
      newChildren.push(child)
      continue
    }

    const baseMarks = Array.isArray(child.marks) ? child.marks : []

    segments.forEach(segment => {
      if (!segment.text) return
      const updatedMarks = segment.bold
        ? Array.from(new Set([...baseMarks, 'strong']))
        : baseMarks
      newChildren.push({
        ...child,
        _key: `${child._key || 'span'}-${randomUUID()}`,
        text: segment.text,
        marks: updatedMarks,
      })
    })

    changed = true
  }

  if (!changed) {
    return { block, changed: false }
  }

  return { block: { ...block, children: newChildren }, changed: true }
}

async function run() {
  const posts = await client.fetch(`*[_type == "post" && defined(body)]{ _id, title, "slug": slug.current, body }`)
  let updated = 0

  for (const post of posts) {
    let blockChanged = false
    const newBody = (post.body || []).map(block => {
      const result = processBlock(block)
      if (result.changed) {
        blockChanged = true
      }
      return result.block
    })

    if (!blockChanged) {
      continue
    }

    updated += 1
    console.log(`✏️  太字変換: ${post.title} (${post.slug || post._id})`)

    if (!dryRun) {
      await client.patch(post._id).set({ body: newBody }).commit()
    }
  }

  console.log(`\n${dryRun ? '🔍 ドライラン' : '✅ 更新'}: ${updated}件の投稿で太字を修正しました`)
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
