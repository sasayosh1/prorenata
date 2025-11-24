#!/usr/bin/env node
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')
const { addAffiliateLinksToArticle } = require('./utils/postHelpers')

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID || '72m8vhy2'
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_DATASET || 'production'
const token = process.env.SANITY_API_TOKEN || process.env.SANITY_WRITE_TOKEN
const apiVersion = '2024-01-01'

if (!token) {
  console.error('❌ SANITY_API_TOKEN もしくは SANITY_WRITE_TOKEN が必要です。')
  process.exit(1)
}

const client = createClient({ projectId, dataset, apiVersion, token, useCdn: false })

const dryRun = !process.argv.includes('--apply')
const includeLocked = process.argv.includes('--include-locked')
const slugArg = process.argv.find(arg => arg.startsWith('--slugs='))
const slugList = slugArg
  ? slugArg
      .replace('--slugs=', '')
      .split(',')
      .map(slug => slug.trim())
      .filter(Boolean)
  : null

const AFFILIATE_HOST_PATTERNS = [
  /moshimo\.com/i,
  /valuecommerce\.com/i,
  /px\.a8\.net/i,
  /ck\.jp\.ap\.valuecommerce\.com/i,
  /amazon\./i,
  /rakuten\./i,
  /humanlifecare/i,
  /kaigobatake/i,
  /renewcare/i,
  /miyabi/i,
  /sokuyame/i
]

function blockPlainText(block = {}) {
  if (!block || block._type !== 'block' || !Array.isArray(block.children)) return ''
  return block.children
    .map(child => (child && typeof child.text === 'string' ? child.text : ''))
    .join('')
    .trim()
}

function isInlineAffiliateBlock(block = {}) {
  if (!block || block._type !== 'block' || typeof block._key !== 'string') return false
  return block._key.startsWith('inline-cta-') || block._key.startsWith('inline-link-')
}

function hasAffiliateHref(block = {}) {
  if (!block || !Array.isArray(block.markDefs)) return false
  return block.markDefs.some(def => {
    if (!def || typeof def.href !== 'string') return false
    return AFFILIATE_HOST_PATTERNS.some(pattern => pattern.test(def.href))
  })
}

function isAffiliatePrParagraph(block = {}) {
  if (!block || block._type !== 'block') return false
  const firstChild = Array.isArray(block.children) ? block.children.find(child => child && typeof child.text === 'string' && child.text.trim().length > 0) : null
  if (!firstChild || typeof firstChild.text !== 'string') return false
  if (!firstChild.text.trim().startsWith('[PR]')) return false
  return hasAffiliateHref(block)
}

function stripAffiliateSections(blocks = []) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return { body: blocks || [], removedEmbed: 0, removedInline: 0, removedPrBlocks: 0 }
  }

  const sanitized = []
  let removedEmbed = 0
  let removedInline = 0
  let removedPrBlocks = 0

  for (const block of blocks) {
    if (!block) continue
    if (block._type === 'affiliateEmbed') {
      removedEmbed += 1
      continue
    }
    if (isInlineAffiliateBlock(block)) {
      removedInline += 1
      continue
    }
    if (isAffiliatePrParagraph(block)) {
      removedPrBlocks += 1
      continue
    }
    sanitized.push(block)
  }

  return { body: sanitized, removedEmbed, removedInline, removedPrBlocks }
}

async function fetchPosts() {
  const filterLocked = includeLocked ? '' : '&& (!defined(maintenanceLocked) || maintenanceLocked != true)'
  let query = `*[_type == "post" ${filterLocked}]{
    _id,
    title,
    body,
    "slug": slug.current,
    maintenanceLocked,
    internalOnly,
    "categories": categories[]->{title}
  }`
  const params = {}

  if (slugList && slugList.length > 0) {
    query = `*[_type == "post" && slug.current in $slugs ${filterLocked}]{
      _id,
      title,
      body,
      "slug": slug.current,
      maintenanceLocked,
      internalOnly,
      "categories": categories[]->{title}
    }`
    params.slugs = slugList
  }

  const posts = await client.fetch(query, params)
  if (!posts || posts.length === 0) {
    console.log('✅ 対象記事はありません。')
    process.exit(0)
  }
  console.log(`🔍 対象記事: ${posts.length}件${dryRun ? '（ドライラン）' : ''}`)
  return posts
}

async function run() {
  const posts = await fetchPosts()
  let updated = 0
  let totalRemoved = 0
  let totalInlineRemoved = 0
  let totalPrRemoved = 0
  let totalInserted = 0

  for (const post of posts) {
    if (!Array.isArray(post.body) || post.body.length === 0) {
      continue
    }

    const removalResult = stripAffiliateSections(post.body)
    const targetBody = removalResult.body
    const affiliateResult = addAffiliateLinksToArticle(targetBody, post.title || '', post)

    const needsUpdate =
      removalResult.removedEmbed > 0 ||
      removalResult.removedInline > 0 ||
      removalResult.removedPrBlocks > 0 ||
      affiliateResult.addedLinks > 0

    if (!needsUpdate) {
      continue
    }

    updated += 1
    totalRemoved += removalResult.removedEmbed
    totalInlineRemoved += removalResult.removedInline
    totalPrRemoved += removalResult.removedPrBlocks
    totalInserted += affiliateResult.addedLinks

    console.log(`\n✏️  ${post.title} (${post.slug || post._id})`)
    if (removalResult.removedEmbed > 0) {
      console.log(`   - affiliateEmbed を ${removalResult.removedEmbed} 件削除`)
    }
    if (removalResult.removedInline > 0) {
      console.log(`   - インラインCTA/リンクを ${removalResult.removedInline} 件削除`)
    }
    if (removalResult.removedPrBlocks > 0) {
      console.log(`   - [PR] パラグラフを ${removalResult.removedPrBlocks} 件削除`)
    }
    if (affiliateResult.addedLinks > 0) {
      console.log(`   + 新規アフィリエイトセクションを ${affiliateResult.addedLinks} 件挿入`)
    } else {
      console.log('   ⚠️ 新規アフィリエイト候補が見つかりませんでした')
    }

    if (dryRun) {
      console.log('   （ドライランのため保存しません）')
      continue
    }

    await client
      .patch(post._id)
      .set({ body: affiliateResult.body })
      .commit()
  }

  console.log('\n📊 実行結果')
  console.log(` - 更新対象: ${updated}件`)
  console.log(` - 削除: affiliateEmbed ${totalRemoved}件 / インライン ${totalInlineRemoved}件 / [PR]段落 ${totalPrRemoved}件`)
  console.log(` - 追加: 新規アフィリエイト ${totalInserted}件`)
  if (dryRun) {
    console.log('\n💡 --apply を付けて実行するとSanityへ保存します')
  }
}

run().catch(error => {
  console.error('❌ エラーが発生しました:', error)
  process.exit(1)
})
