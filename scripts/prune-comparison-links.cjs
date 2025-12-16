#!/usr/bin/env node
/* eslint-disable no-console */
const { createClient } = require('@sanity/client')
const { getNormalizedCategoryTitles } = require('./utils/categoryMappings')
const { blocksToPlainText } = require('./utils/postHelpers')

const CAREER_HREF = '/posts/nursing-assistant-compare-services-perspective'
const RESIGN_HREF = '/posts/comparison-of-three-resignation-agencies'

function normalizeHref(href = '') {
  if (!href || typeof href !== 'string') return ''
  return href
    .trim()
    .replace(/^https?:\/\/prorenata\.jp/i, '')
    .replace(/#.*$/, '')
}

function blockContainsHref(block, targetHref) {
  if (!block || block._type !== 'block' || !Array.isArray(block.markDefs)) return false
  const normalizedTarget = targetHref.toLowerCase()
  return block.markDefs.some(def => {
    if (!def || def._type !== 'link' || typeof def.href !== 'string') return false
    return normalizeHref(def.href).toLowerCase() === normalizedTarget
  })
}

function countHref(body, targetHref) {
  if (!Array.isArray(body)) return 0
  let count = 0
  for (const block of body) {
    if (blockContainsHref(block, targetHref)) count += 1
  }
  return count
}

function pruneComparisonBlocks(body, keepType) {
  if (!Array.isArray(body) || body.length === 0) return { body, removed: 0 }

  const keepCareer = keepType === 'career'
  const keepResignation = keepType === 'resignation'

  let careerKept = false
  let resignationKept = false
  let removed = 0
  const result = []

  for (const block of body) {
    const isCareer = blockContainsHref(block, CAREER_HREF)
    const isResignation = blockContainsHref(block, RESIGN_HREF)

    if (!isCareer && !isResignation) {
      result.push(block)
      continue
    }

    if (isCareer) {
      if (!keepCareer || careerKept) {
        removed += 1
        continue
      }
      careerKept = true
      result.push(block)
      continue
    }

    if (isResignation) {
      if (!keepResignation || resignationKept) {
        removed += 1
        continue
      }
      resignationKept = true
      result.push(block)
    }
  }

  return { body: result, removed }
}

function decideKeepType(post = {}) {
  const normalizedCategories = getNormalizedCategoryTitles(
    (post.categories || []).map(category => (typeof category === "string" ? category : category?.title || ''))
  )

  // UX優先: 退職文脈があれば退職代行比較を優先（同一記事に2本入れない）
  if (normalizedCategories.includes('退職')) return 'resignation'
  if (normalizedCategories.includes('転職')) return 'career'

  const slug = typeof post.slug === 'string' ? post.slug : post.slug?.current || ''
  const text = `${post.title || ''} ${slug} ${blocksToPlainText(post.body || [])}`.toLowerCase()

  const retirementKeywords = [
    '退職',
    '退社',
    '離職',
    '辞め',
    '退職代行',
    '有給消化',
    '退職届',
    '退職願',
    '引き継ぎ',
    '円満'
  ]
  for (const keyword of retirementKeywords) {
    if (text.includes(keyword)) return 'resignation'
  }

  const careerKeywordRegex = /求人|就職|応募|志望動機|面接|履歴書|職務経歴書|エージェント|紹介会社|内定|入社|career|job|apply|interview/
  if (careerKeywordRegex.test(text)) return 'career'

  return null
}

function parseArgs(argv) {
  const args = { apply: false, slugs: null }
  for (const token of argv.slice(2)) {
    if (token === '--apply') args.apply = true
    if (token.startsWith('--slugs=')) {
      const value = token.slice('--slugs='.length).trim()
      args.slugs = value ? value.split(',').map(s => s.trim()).filter(Boolean) : []
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

  const query = args.slugs
    ? `*[_type=="post" && slug.current in $slugs]{_id,title,"slug":slug.current,"categories":categories[]->title,body}`
    : `*[_type=="post" && (!defined(internalOnly)||internalOnly==false) && defined(slug.current)]{_id,title,"slug":slug.current,"categories":categories[]->title,body}`

  const params = args.slugs ? { slugs: args.slugs } : {}
  const posts = await client.fetch(query, params)

  const candidates = []
  for (const post of posts) {
    const careerCount = countHref(post.body, CAREER_HREF)
    const resignationCount = countHref(post.body, RESIGN_HREF)
    if (careerCount > 0 || resignationCount > 0) candidates.push({ post, careerCount, resignationCount })
  }

  console.log(
    JSON.stringify(
      {
        mode: args.apply ? 'apply' : 'dry-run',
        scanned: posts.length,
        candidates: candidates.length
      },
      null,
      2
    )
  )

  if (!args.apply) {
    if (candidates.length > 0) {
      console.log('\nFirst 10 candidates:')
      candidates.slice(0, 10).forEach(({ post, careerCount, resignationCount }) => {
        console.log(`- ${post.slug?.current || post.slug} (career=${careerCount}, resignation=${resignationCount})`)
      })
      console.log('\nRun with: node scripts/prune-comparison-links.cjs --apply')
    }
    return
  }

  let updated = 0
  let removedBlocks = 0
  let keptCareer = 0
  let keptResignation = 0
  let keptNone = 0

  for (const { post } of candidates) {
    const keepType = decideKeepType(post)
    if (keepType === 'career') keptCareer += 1
    else if (keepType === 'resignation') keptResignation += 1
    else keptNone += 1

    const before = post.body
    const pruned = pruneComparisonBlocks(before, keepType)
    if (pruned.removed === 0) continue

    const nextBody = pruned.body
    removedBlocks += pruned.removed

    await client.patch(post._id).set({ body: nextBody }).commit()
    updated += 1

    // draft/published 両方の存在を想定（片方が失敗しても続行）
    const id = post._id
    const publishedId = id.startsWith('drafts.') ? id.slice('drafts.'.length) : id
    const draftId = id.startsWith('drafts.') ? id : `drafts.${id}`
    if (id === publishedId) {
      await client.patch(draftId).set({ body: nextBody }).commit().catch(() => null)
    } else {
      await client.patch(publishedId).set({ body: nextBody }).commit().catch(() => null)
    }
  }

  console.log(
    JSON.stringify(
      {
        updated,
        removedBlocks,
        kept: { career: keptCareer, resignation: keptResignation, none: keptNone }
      },
      null,
      2
    )
  )
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
