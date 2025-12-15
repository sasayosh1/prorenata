#!/usr/bin/env node

/**
 * Remove item affiliate embeds (amazon/rakuten/nursery) from posts that are not item-focused.
 *
 * Policy:
 * - Item affiliates are shown only when the article clearly discusses items (detected by extractMainItemFromArticle).
 * - For other articles, these embeds are noise and may harm UX.
 *
 * Usage:
 *   node scripts/cleanup-irrelevant-item-affiliates.cjs --dry-run
 *   node scripts/cleanup-irrelevant-item-affiliates.cjs --apply
 */

require('dotenv').config({ path: '.env.local' })
require('dotenv').config({ path: '.env.private' })

const fs = require('fs')
const path = require('path')
const { createClient } = require('@sanity/client')
const { extractMainItemFromArticle } = require('./moshimo-affiliate-links')

const token = process.env.SANITY_API_TOKEN || process.env.SANITY_WRITE_TOKEN
if (!token) {
  console.error('SANITY_API_TOKEN (or SANITY_WRITE_TOKEN) is required')
  process.exit(1)
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01',
  token,
  useCdn: false,
})

const PUBLIC_POST_FILTER = '(!defined(internalOnly) || internalOnly == false)'

const ITEM_KEYS = new Set(['amazon', 'rakuten', 'nursery'])
const PROTECTED_REVENUE_SLUGS = new Set([
  'nursing-assistant-compare-services-perspective',
  'comparison-of-three-resignation-agencies',
])

function parseArgs(argv) {
  const args = new Set(argv.slice(2))
  return {
    apply: args.has('--apply'),
    dryRun: args.has('--dry-run') || !args.has('--apply'),
    limit: (() => {
      const idx = argv.indexOf('--limit')
      if (idx === -1) return 0
      const value = Number(argv[idx + 1])
      return Number.isFinite(value) && value > 0 ? value : 0
    })(),
  }
}

function blocksToPlainText(blocks) {
  const list = Array.isArray(blocks) ? blocks : []
  return list
    .map((b) => {
      if (b?._type !== 'block') return ''
      const children = Array.isArray(b.children) ? b.children : []
      return children.map((c) => (typeof c?.text === 'string' ? c.text : '')).join('')
    })
    .filter(Boolean)
    .join('\n')
    .trim()
}

function removeItemAffiliateEmbeds(body) {
  const blocks = Array.isArray(body) ? body : []
  let removed = 0
  const next = blocks.filter((b) => {
    if (b?._type !== 'affiliateEmbed') return true
    if (typeof b.linkKey !== 'string') return true
    if (!ITEM_KEYS.has(b.linkKey)) return true
    removed += 1
    return false
  })
  return { body: next, removed }
}

async function main() {
  const { apply, dryRun, limit } = parseArgs(process.argv)
  const range = limit > 0 ? `[0...${limit}]` : ''

  const posts = await client.fetch(
    `*[_type==\"post\" && ${PUBLIC_POST_FILTER} && defined(slug.current)] | order(_updatedAt desc) ${range} { _id, title, \"slug\": slug.current, body }`
  )

  const changes = []
  for (const post of posts) {
    if (!post?.slug || PROTECTED_REVENUE_SLUGS.has(post.slug)) continue
    const bodyText = blocksToPlainText(post.body)
    const mainItem = extractMainItemFromArticle(post.title || '', bodyText)
    if (mainItem && mainItem.item) continue

    const { body, removed } = removeItemAffiliateEmbeds(post.body)
    if (removed > 0) {
      changes.push({ _id: post._id, slug: post.slug, removed, body })
    }
  }

  console.log(`posts=${posts.length} changed=${changes.length} dryRun=${dryRun}`)
  if (changes.length > 0) console.log('sample:', changes.slice(0, 10).map((c) => ({ slug: c.slug, removed: c.removed })))

  const reportDir = path.join(process.cwd(), '.analytics')
  fs.mkdirSync(reportDir, { recursive: true })
  const reportPath = path.join(reportDir, 'irrelevant-item-affiliates-report.json')
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        ranAt: new Date().toISOString(),
        dryRun,
        total: posts.length,
        changed: changes.length,
        items: changes.map((c) => ({ _id: c._id, slug: c.slug, removed: c.removed })),
      },
      null,
      2
    )
  )
  console.log(`report: ${reportPath}`)

  if (dryRun) return
  if (!apply) {
    console.error('Refusing to apply without --apply')
    process.exit(1)
  }

  let applied = 0
  for (const change of changes) {
    await client.patch(change._id).set({ body: change.body }).commit({ autoGenerateArrayKeys: true })
    applied += 1
    if (applied % 10 === 0) console.log(`applied ${applied}/${changes.length}`)
    await new Promise((r) => setTimeout(r, 150))
  }

  console.log(`DONE: applied ${applied}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

