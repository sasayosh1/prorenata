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

  let body = Array.isArray(post.body) ? [...post.body] : []
  let changed = false

  const disallowedKeys = new Set(['pasonalifecare', 'renewcare'])
  body = body.filter(block => {
    if (block?._type === 'affiliateEmbed' && disallowedKeys.has(block.linkKey)) {
      changed = true
      return false
    }
    if (
      block?._type === 'block' &&
      blockText(block) &&
      (blockText(block).includes('パソナライフケア') || blockText(block).includes('リニューケア'))
    ) {
      changed = true
      return false
    }
    return true
  })

  // 3社目（パソナライフケア）の記述が無ければ追加
  const hasAlbatrossMention = body.some(block => blockText(block).includes('アルバトロス転職'))
  if (!hasAlbatrossMention) {
    const secondHeadingIndex = body.findIndex(block => block?._type === 'block' && /２．/.test(blockText(block)))
    const insertIndex = secondHeadingIndex > 0 ? secondHeadingIndex : 3

    const bullet = createTextBlock('**アルバトロス転職**：LINEのみで完結する相談スタイル。夜勤前後でもスマホ一つで条件提示や日程調整ができるので、忙しい看護助手でも時間を確保しやすい。', {
      style: 'normal',
      listItem: 'bullet',
      level: 1
    })
    const bridgeParagraph = createTextBlock('夜勤や家事、子育てと両立しながら転職活動を進めたい場合は、チャットで完結するアルバトロス転職を併用しておくと安心です。')
    const ctaBlock = createTextBlock('[PR] LINEだけで転職相談を完結させたいなら、アルバトロス転職のチャットサポートで条件整理から日程調整まで任せてみてください。 アルバトロス転職で相談する')

    body.splice(insertIndex, 0, bullet, bridgeParagraph, ctaBlock)
    changed = true
  } else {
    // existing mention but ensure context paragraph exists
    if (!body.some(block => blockText(block).includes('チャットで完結するアルバトロス転職'))) {
      const insertionPoint = body.findIndex(block => blockText(block).includes('働き方を試しながら'))
      const bridgeParagraph = createTextBlock('夜勤や家事、子育てと両立しながら転職活動を進めたい場合は、チャットで完結するアルバトロス転職を併用しておくと安心です。')
      body.splice(insertionPoint > -1 ? insertionPoint + 1 : body.length, 0, bridgeParagraph)
      changed = true
    }
    if (!body.some(block => blockText(block).includes('アルバトロス転職で相談する'))) {
      const insertionPoint = body.findIndex(block => blockText(block).includes('チャットで完結するアルバトロス転職'))
      const ctaBlock = createTextBlock('[PR] LINEだけで転職相談を完結させたいなら、アルバトロス転職のチャットサポートで条件整理から日程調整まで任せてみてください。 アルバトロス転職で相談する')
      body.splice(insertionPoint > -1 ? insertionPoint + 1 : body.length, 0, ctaBlock)
      changed = true
    }
  }

  const humanChanged = ensureAffiliateBlocks(body, 'ヒューマンライフケアの求人サポートを見る', 'humanlifecare')
  const albatrossChanged = ensureAffiliateBlocks(body, 'アルバトロス転職で相談する', 'albatross')

  if (!changed && !humanChanged && !albatrossChanged) {
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
