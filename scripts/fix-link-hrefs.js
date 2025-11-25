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
const HTML_HREF_REGEX = /href\s*=\s*["']([^"']+)["']/i

function decodeEntities(str = '') {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

function extractUrl(raw = '') {
  const trimmed = raw.trim()
  if (!trimmed.startsWith('<')) return decodeEntities(trimmed)
  const match = trimmed.match(HTML_HREF_REGEX)
  if (match && match[1]) {
    return decodeEntities(match[1])
  }
  return decodeEntities(trimmed)
}

async function run() {
  const posts = await client.fetch(`*[_type == "post" && defined(body)]{ _id, title, "slug": slug.current, body }`)
  let updated = 0

  for (const post of posts) {
    let changed = false
    const newBody = (post.body || []).map(block => {
      if (!block || !Array.isArray(block.markDefs) || block.markDefs.length === 0) {
        return block
      }

      const markDefs = block.markDefs.map(def => {
        if (!def || def._type !== 'link' || typeof def.href !== 'string') {
          return def
        }
        if (!def.href.includes('<')) {
          return def
        }
        const cleaned = extractUrl(def.href)
        if (!cleaned || cleaned === def.href) {
          return def
        }
        changed = true
        return {
          ...def,
          href: cleaned,
          openInNewTab: true,
        }
      })

      if (!changed) return block
      return { ...block, markDefs }
    })

    if (!changed) continue

    updated += 1
    console.log(`✏️  リンク修正: ${post.title} (${post.slug || post._id})`)
    if (!dryRun) {
      await client.patch(post._id).set({ body: newBody }).commit()
    }
  }

  console.log(`\n${dryRun ? '🔍 ドライラン' : '✅ 更新'}: ${updated}件の投稿でリンクを修正しました`)
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
