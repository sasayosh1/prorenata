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

async function run() {
  const post = await client.fetch('*[_type == "post" && slug.current == $slug][0]{ _id, body }', { slug })
  if (!post || !post._id) {
    console.error('記事が見つかりませんでした')
    process.exit(1)
  }

  const body = Array.isArray(post.body) ? [...post.body] : []
  let changed = false

  // 3社目（パソナライフケア）の記述が無ければ追加
  const hasPasonaMention = body.some(block => blockText(block).includes('パソナライフケア'))
  if (!hasPasonaMention) {
    const secondHeadingIndex = body.findIndex(block => block?._type === 'block' && /２．/.test(blockText(block)))
    const insertIndex = secondHeadingIndex > 0 ? secondHeadingIndex : 3

    const bullet = createTextBlock('**パソナライフケア**：派遣・紹介予定派遣に強く、「ありがとう」が嬉しい職場を探したい人向け。扶養内や短時間など柔軟な働き方を提案してくれる。', {
      style: 'normal',
      listItem: 'bullet',
      level: 1
    })
    const bridgeParagraph = createTextBlock('感謝を大切にしながら働き方を柔軟に調整したいなら、派遣と紹介予定派遣を併用できるパソナライフケアを合わせて検討しておくと安心です。')
    const ctaBlock = createTextBlock('[PR] 感謝を力に変えられる職場を探すなら、パソナライフケアの派遣・紹介予定派遣サポートで働き方の希望を整理してみてください。 パソナライフケアの求人サポートを見る')

    body.splice(insertIndex, 0, bullet, bridgeParagraph, ctaBlock)
    changed = true
  } else {
    // CTAが見つからない場合は追加
    if (!body.some(block => blockText(block).includes('パソナライフケアの求人サポートを見る'))) {
      const insertionPoint = body.findIndex(block => blockText(block).includes('働き方を試しながら探したい'))
      const ctaBlock = createTextBlock('[PR] 感謝を力に変えられる職場を探すなら、パソナライフケアの派遣・紹介予定派遣サポートで働き方の希望を整理してみてください。 パソナライフケアの求人サポートを見る')
      body.splice(insertionPoint > -1 ? insertionPoint + 1 : body.length, 0, ctaBlock)
      changed = true
    }
  }

  const humanChanged = ensureAffiliateBlocks(body, 'ヒューマンライフケアの求人サポートを見る', 'humanlifecare')
  const renewChanged = ensureAffiliateBlocks(body, 'リニューケアの転職支援に相談する', 'renewcare')
  const pasonaChanged = ensureAffiliateBlocks(body, 'パソナライフケアの求人サポートを見る', 'pasonalifecare')

  if (!changed && !humanChanged && !renewChanged && !pasonaChanged) {
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
