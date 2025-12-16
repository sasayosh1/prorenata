#!/usr/bin/env node

/**
 * Move reference blocks (参考/出典) out of the Summary section.
 *
 * Policy:
 * - References inside the "まとめ" section are prohibited.
 * - We preserve blocks by moving them to just BEFORE the "まとめ" heading.
 *
 * Usage:
 *   node scripts/cleanup-summary-references.cjs --dry-run
 *   node scripts/cleanup-summary-references.cjs --apply
 *
 * Env:
 *   SANITY_API_TOKEN (or SANITY_WRITE_TOKEN) via .env.local/.env.private
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

function blockPlainText(block) {
  if (!block || block._type !== 'block') return ''
  const children = Array.isArray(block.children) ? block.children : []
  return children.map((c) => (typeof c?.text === 'string' ? c.text : '')).join('').trim()
}

function isReferenceBlock(block) {
  if (!block || block._type !== 'block') return false
  const text = blockPlainText(block)
  return text.startsWith('参考') || text.startsWith('出典')
}

function relocateSummaryReferences(body) {
  const blocks = Array.isArray(body) ? body : []
  const summaryIdx = blocks.findIndex(
    (b) => b?._type === 'block' && b.style === 'h2' && blockPlainText(b) === 'まとめ'
  )
  if (summaryIdx === -1) return { body: blocks, moved: 0 }

  let summaryEnd = blocks.length
  for (let i = summaryIdx + 1; i < blocks.length; i += 1) {
    const b = blocks[i]
    if (b?._type === 'block' && b.style === 'h2') {
      summaryEnd = i
      break
    }
  }

  const refs = []
  const keep = []
  for (let i = 0; i < blocks.length; i += 1) {
    const b = blocks[i]
    if (i > summaryIdx && i < summaryEnd && isReferenceBlock(b)) {
      refs.push(b)
      continue
    }
    keep.push(b)
  }

  if (refs.length === 0) return { body: blocks, moved: 0 }

  // insert refs right before summary heading
  const insertAt = keep.findIndex(
    (b) => b?._type === 'block' && b.style === 'h2' && blockPlainText(b) === 'まとめ'
  )
  if (insertAt === -1) return { body: blocks, moved: 0 }

  keep.splice(insertAt, 0, ...refs)
  return { body: keep, moved: refs.length }
}

async function main() {
  const { apply, dryRun, limit } = parseArgs(process.argv)
  const range = limit > 0 ? `[0...${limit}]` : ''

  const posts = await client.fetch(
    `*[_type==\"post\" && ${PUBLIC_POST_FILTER} && defined(slug.current)] | order(_updatedAt desc) ${range} { _id, title, \"slug\": slug.current, body }`
  )

  const changes = []
  for (const post of posts) {
    const result = relocateSummaryReferences(post.body)
    if (result.moved > 0) {
      changes.push({ _id: post._id, slug: post.slug, title: post.title, moved: result.moved, body: result.body })
    }
  }

  console.log(`posts=${posts.length} changed=${changes.length} dryRun=${dryRun}`)
  if (changes.length > 0) console.log('sample:', changes.slice(0, 10).map((c) => ({ slug: c.slug, moved: c.moved })))

  const reportDir = path.join(process.cwd(), '.analytics')
  fs.mkdirSync(reportDir, { recursive: true })
  const reportPath = path.join(reportDir, 'summary-reference-cleanup-report.json')
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        ranAt: new Date().toISOString(),
        dryRun,
        total: posts.length,
        changed: changes.length,
        items: changes.map((c) => ({ _id: c._id, slug: c.slug, moved: c.moved })),
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

