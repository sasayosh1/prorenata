#!/usr/bin/env node
/* eslint-disable no-console */
const { createClient } = require('@sanity/client')
const { buildFallbackSummaryBlocks } = require('./utils/postHelpers')

const GENERIC_NEEDLES = [
  'でお伝えした内容を振り返ると',
  'あわてず一歩ずつ',
  'すぐに試しやすい行動のヒントは次の通りです'
]

const FALLBACK_NEEDLES = [
  '看護助手の視点で整理しました。',
  '看護助手の視点でまとめました。',
  '今日の勤務につながる一歩から始めていきましょう。',
  '全部を一度に変えなくても大丈夫です。',
  '迷ったら、今の状況と困っている点を短く共有してみましょう。'
]

function extractBlockText(block) {
  if (!block || block._type !== 'block' || !Array.isArray(block.children)) return ''
  return block.children.map(child => (child && typeof child.text === 'string' ? child.text : '')).join('').trim()
}

function findSummaryRange(blocks) {
  if (!Array.isArray(blocks)) return { summaryIndex: -1, endIndex: -1 }
  let summaryIndex = -1
  for (let i = 0; i < blocks.length; i += 1) {
    const b = blocks[i]
    if (b && b._type === 'block' && b.style === 'h2' && extractBlockText(b) === 'まとめ') {
      summaryIndex = i
      break
    }
  }
  if (summaryIndex === -1) return { summaryIndex: -1, endIndex: -1 }
  let endIndex = blocks.length
  for (let j = summaryIndex + 1; j < blocks.length; j += 1) {
    const b = blocks[j]
    if (b && b._type === 'block' && b.style === 'h2') {
      endIndex = j
      break
    }
  }
  return { summaryIndex, endIndex }
}

function isGenericSummary(summaryBlocks) {
  const text = (summaryBlocks || [])
    .filter(b => b && b._type === 'block')
    .map(extractBlockText)
    .filter(Boolean)
    .join('\n')
  return GENERIC_NEEDLES.some(needle => text.includes(needle))
}

function parseArgs(argv) {
  const args = { apply: false, limit: 0, regenerateFallback: false }
  for (const token of argv.slice(2)) {
    if (token === '--apply') args.apply = true
    if (token === '--regenerate-fallback') args.regenerateFallback = true
    if (token.startsWith('--limit=')) {
      const n = parseInt(token.slice('--limit='.length), 10)
      if (Number.isFinite(n) && n > 0) args.limit = n
    }
  }
  return args
}

async function main() {
  const args = parseArgs(process.argv)
  const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN || process.env.SANITY_TOKEN
  if (!token) {
    console.error('ERROR: SANITY_WRITE_TOKEN (or SANITY_API_TOKEN) is required')
    process.exit(1)
  }

  const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    token,
    useCdn: false
  })

  const posts = await client.fetch(
    `*[_type=="post" && (!defined(internalOnly)||internalOnly==false) && defined(slug.current)]{_id,title,"slug":slug.current,body}`
  )

  const targets = []
  for (const post of posts) {
    const { summaryIndex, endIndex } = findSummaryRange(post.body)
    if (summaryIndex === -1) continue
    const summaryBlocks = post.body.slice(summaryIndex + 1, endIndex)
    const isGeneric = isGenericSummary(summaryBlocks)
    if (!isGeneric) {
      if (!args.regenerateFallback) continue
      const text = summaryBlocks
        .filter(b => b && b._type === 'block')
        .map(extractBlockText)
        .filter(Boolean)
        .join('\n')
      if (!FALLBACK_NEEDLES.some(needle => text.includes(needle))) continue
    }
    targets.push({ post, summaryIndex, endIndex })
  }

  console.log(
    JSON.stringify(
      { mode: args.apply ? 'apply' : 'dry-run', scanned: posts.length, targets: targets.length },
      null,
      2
    )
  )

  if (!args.apply) {
    console.log('\nExample slugs:')
    targets.slice(0, 20).forEach(t => console.log(`- ${t.post.slug}`))
    console.log('\nRun with: DOTENV_CONFIG_PATH=.env.local node -r dotenv/config scripts/fix-generic-summaries.cjs --apply')
    console.log('If you want to regenerate existing fallback summaries too: add --regenerate-fallback')
    return
  }

  let updated = 0
  const limit = args.limit > 0 ? args.limit : targets.length

  for (const target of targets.slice(0, limit)) {
    const { post, summaryIndex, endIndex } = target
    const before = post.body
    const oldSummaryBlocks = before.slice(summaryIndex + 1, endIndex)
    const leadingBlocks = before.slice(0, summaryIndex)

    const newSummaryBlocks = buildFallbackSummaryBlocks({
      articleTitle: post.title || '',
      summaryBlocks: oldSummaryBlocks,
      leadingBlocks
    })

    const nextBody = [
      ...before.slice(0, summaryIndex + 1),
      ...newSummaryBlocks,
      ...before.slice(endIndex)
    ]

    await client.patch(post._id).set({ body: nextBody }).commit()

    // draft/published 両方が存在する場合があるため、片方が失敗しても続行
    const id = post._id
    const publishedId = id.startsWith('drafts.') ? id.slice('drafts.'.length) : id
    const draftId = id.startsWith('drafts.') ? id : `drafts.${id}`
    if (id === publishedId) {
      await client.patch(draftId).set({ body: nextBody }).commit().catch(() => null)
    } else {
      await client.patch(publishedId).set({ body: nextBody }).commit().catch(() => null)
    }

    updated += 1
    if (updated % 10 === 0) console.log(`updated ${updated}/${limit}...`)
  }

  console.log(JSON.stringify({ updated, limit }, null, 2))
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
