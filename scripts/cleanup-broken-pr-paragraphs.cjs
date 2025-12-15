#!/usr/bin/env node

/**
 * Cleanup broken [PR] paragraphs in Sanity post bodies.
 *
 * Problem:
 * - Some posts contain plain text blocks like "[PR] Amazonで看護助手グッズを探す"
 *   but without any link markDefs, so they look like affiliate blocks but are not clickable.
 *
 * Behavior:
 * - Removes PortableText blocks whose plain text starts with "[PR]" AND have no valid link markDefs.
 * - Skips protected revenue slugs.
 *
 * Usage:
 *   node scripts/cleanup-broken-pr-paragraphs.cjs --dry-run
 *   node scripts/cleanup-broken-pr-paragraphs.cjs --apply
 *
 * Env:
 *   .env.local / .env.private loaded
 *   SANITY_API_TOKEN (or SANITY_WRITE_TOKEN) required for --apply
 */

require('dotenv').config({ path: '.env.local' })
require('dotenv').config({ path: '.env.private' })

const fs = require('fs')
const path = require('path')
const { createClient } = require('@sanity/client')

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

function extractPlainText(block) {
  if (!block || block._type !== 'block') return ''
  const children = Array.isArray(block.children) ? block.children : []
  return children.map((c) => (typeof c?.text === 'string' ? c.text : '')).join('').trim()
}

function hasValidLink(block) {
  if (!block || block._type !== 'block') return false
  const markDefs = Array.isArray(block.markDefs) ? block.markDefs : []
  return markDefs.some(
    (def) => def?._type === 'link' && typeof def.href === 'string' && def.href.trim().length > 0
  )
}

function removeBrokenPrParagraphs(body) {
  const blocks = Array.isArray(body) ? body : []
  let removed = 0
  const next = blocks.filter((b) => {
    const text = extractPlainText(b)
    if (!text.startsWith('[PR]')) return true
    if (hasValidLink(b)) return true
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
    const { body, removed } = removeBrokenPrParagraphs(post.body)
    if (removed > 0) {
      changes.push({ _id: post._id, slug: post.slug, title: post.title, removed, body })
    }
  }

  console.log(`posts=${posts.length} changed=${changes.length} dryRun=${dryRun}`)
  if (changes.length > 0) {
    console.log('sample:', changes.slice(0, 10).map((c) => ({ slug: c.slug, removed: c.removed })))
  }

  const reportDir = path.join(process.cwd(), '.analytics')
  fs.mkdirSync(reportDir, { recursive: true })
  const reportPath = path.join(reportDir, 'broken-pr-cleanup-report.json')
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        ranAt: new Date().toISOString(),
        dryRun,
        total: posts.length,
        changed: changes.length,
        items: changes.map((c) => ({ _id: c._id, slug: c.slug, title: c.title, removed: c.removed })),
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

