#!/usr/bin/env node
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')
const { randomUUID } = require('crypto')
const { createMoshimoLinkBlocks } = require('./moshimo-affiliate-links')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN || process.env.SANITY_WRITE_TOKEN,
  useCdn: false
})

const slug = 'nursing-assistant-compare-services-perspective'

const SERVICE_CONFIGS = [
  {
    key: 'humanlifecare',
    bulletText: '**ヒューマンライフケア**：全国展開で施設型求人が多く、教育制度や研修の情報まで併せて提案してくれる。',
    supportText: '全国規模で求人を比較したいときは、教育体制や福利厚生まで一緒に見てくれる窓口を押さえておきましょう。',
    ctaText: '[PR] 全国規模で施設求人を比較したいなら、ヒューマンライフケアが教育体制や福利厚生を丁寧に教えてくれます。 ヒューマンライフケアの求人サポートを見る',
    embedMatch: 'ヒューマンライフケアの求人サポートを見る'
  },
  {
    key: 'renewcare',
    bulletText: '**リニューケア**：関西圏や都市部の非公開求人に強く、夜勤回数や給与条件の細かい交渉を任せたいときに頼りになる。',
    supportText: '都市部や関西圏の非公開求人を探したいときは、条件交渉に強い担当者が頼りになります。',
    ctaText: '[PR] 関西圏や都市部の非公開求人を知りたいときは、リニューケアに条件交渉も相談すると安心です。 リニューケアの転職支援に相談する',
    embedMatch: 'リニューケアの転職支援に相談する'
  },
  {
    key: 'kaigobatake',
    bulletText: '**かいご畑**：無資格・未経験OKの求人が中心で、資格取得支援を使いながらステップアップしたい人に向いている。',
    supportText: '無資格や未経験から看護助手をめざす場合は、資格取得支援があるサービスを選ぶと学びと実務を両立させやすくなります。',
    ctaText: '[PR] 無資格や未経験から求人を探すなら、かいご畑の資格取得支援を活用して条件を整理してみてください。 かいご畑で介護職・看護助手の求人を探す',
    embedMatch: 'かいご畑で介護職・看護助手の求人を探す'
  }
]

function blockText(block) {
  if (!block || block._type !== 'block') return ''
  return (block.children || [])
    .map(child => child?.text || '')
    .join('')
}

function headingContext(body, index) {
  for (let i = index; i >= 0; i--) {
    const block = body[i]
    if (block?._type === 'block' && block.style?.startsWith('h')) {
      return blockText(block)
    }
  }
  return '転職サービス比較'
}

function ensureAffiliateBlocks(body, matchText, linkKey) {
  let changed = false
  for (let i = 0; i < body.length; i++) {
    const block = body[i]
    if (block?._type !== 'block') continue
    const text = blockText(block)
    if (!text.includes(matchText)) continue

    const next = body[i + 1]
    if (next && next._type === 'affiliateEmbed' && next.linkKey === linkKey) {
      continue
    }

    const context = headingContext(body, i)
    const blocks = createMoshimoLinkBlocks(linkKey, context)
    if (blocks && blocks.length) {
      body.splice(i + 1, 0, ...blocks)
      changed = true
    }
  }
  return changed
}

function createTextBlock(text, { style = 'normal', listItem, level } = {}) {
  return {
    _type: 'block',
    _key: randomUUID(),
    style,
    listItem,
    level,
    markDefs: [],
    children: [
      {
        _type: 'span',
        _key: randomUUID(),
        marks: [],
        text
      }
    ]
  }
}

function removeDisallowedContent(body) {
  const disallowedKeys = new Set(['albatross', 'pasonalifecare'])
  const disallowedText = [/アルバトロス転職/, /パソナライフケア/]
  let changed = false

  const filtered = body.filter(block => {
    if (block?._type === 'affiliateEmbed' && disallowedKeys.has(block.linkKey)) {
      changed = true
      return false
    }
    if (
      block?._type === 'block' &&
      disallowedText.some(pattern => pattern.test(blockText(block)))
    ) {
      changed = true
      return false
    }
    return true
  })

  return { body: filtered, changed }
}

function ensureServiceIntro(body) {
  const headingIndex = body.findIndex(
    block => block?._type === 'block' && /１．/.test(blockText(block))
  )
  let insertPosition = headingIndex >= 0 ? headingIndex + 1 : 0
  let changed = false

  for (const service of SERVICE_CONFIGS) {
    if (!body.some(block => blockText(block).includes(service.bulletText))) {
      body.splice(insertPosition, 0, createTextBlock(service.bulletText, { style: 'normal', listItem: 'bullet', level: 1 }))
      insertPosition += 1
      changed = true
    } else {
      insertPosition = body.findIndex(block => blockText(block).includes(service.bulletText)) + 1
    }

    if (service.supportText && !body.some(block => blockText(block).includes(service.supportText))) {
      body.splice(insertPosition, 0, createTextBlock(service.supportText))
      insertPosition += 1
      changed = true
    }

    if (service.ctaText && !body.some(block => blockText(block).includes(service.ctaText))) {
      body.splice(insertPosition, 0, createTextBlock(service.ctaText))
      insertPosition += 1
      changed = true
    }

    const embedsAdded = ensureAffiliateBlocks(body, service.embedMatch, service.key)
    if (embedsAdded) changed = true
  }

  return changed
}

async function run() {
  const post = await client.fetch('*[_type == "post" && slug.current == $slug][0]{ _id, body }', { slug })
  if (!post || !post._id) {
    console.error('記事が見つかりませんでした')
    process.exit(1)
  }

  let body = Array.isArray(post.body) ? [...post.body] : []
  let changed = false

  const filteredResult = removeDisallowedContent(body)
  body = filteredResult.body
  if (filteredResult.changed) changed = true

  if (ensureServiceIntro(body)) {
    changed = true
  }

  if (!changed) {
    console.log('変更はありません')
    return
  }

  await client.patch(post._id).set({ body }).commit()
  console.log('✅ 転職比較記事のアフィリエイトブロックを復旧しました')
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
