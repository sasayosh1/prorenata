#!/usr/bin/env node
/**
 * clean-affiliate-sections.js
 *
 * - Removes deprecated affiliate CTAs (e.g. リニューケア, パソナライフケア) from article bodies
 * - Removes self-referential links pointing to the same article
 * - Ensures each "まとめ" セクションに要約本文を挿入する
 *
 * Run after updating SANITY_API_TOKEN with update 権限.
 */

require('dotenv').config({ path: ['.env.local', '.env'] })
const { createClient } = require('@sanity/client')
const { randomUUID } = require('crypto')
const { GoogleGenerativeAI } = require('@google/generative-ai')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

const BANNED_TEXT_PATTERNS = [
  /リニューケア/, // old Kansai affiliate
  /パソナライフケア/, // old Pasona affiliate
  /関西圏に特化した転職サービス/, // CTA copy
]

const BANNED_LINK_PATTERNS = [
  /a_id=5207862/i, // リニューケア
  /a_id=5207867/i, // パソナライフケア
]

function blockText(block) {
  if (!block || block._type !== 'block' || !Array.isArray(block.children)) return ''
  return block.children.map((child) => child.text || '').join('')
}

function hasBannedText(block) {
  const text = blockText(block)
  return BANNED_TEXT_PATTERNS.some((pattern) => pattern.test(text))
}

function buildSummaryBlock(title) {
  return {
    _type: 'block',
    _key: `summary-${randomUUID()}`,
    style: 'normal',
    markDefs: [],
    children: [
      {
        _type: 'span',
        _key: `span-${randomUUID()}`,
        marks: [],
        text: `この記事「${title}」の要点を踏まえ、自分の働き方や体力・希望条件を整理し、ムリのない判断につなげてください。気になるテーマは各セクションを振り返り、必要に応じて関連情報を確認したうえで次の一歩へ。`,
      },
    ],
  }
}

async function buildSmartSummaryBlocks(title, body) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return [buildSummaryBlock(title)]

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  // 直近の本文から要約に使える文を抽出
  const lastBlocks = []
  for (let i = body.length - 1; i >= 0 && lastBlocks.length < 40; i--) {
    const b = body[i]
    if (b && b._type === 'block') lastBlocks.push(blockText(b))
  }
  const context = lastBlocks.reverse().join('\n')

  const prompt = `以下は日本語の記事の抜粋です。記事タイトルは「${title}」。
抜粋内容から、読者の行動につながる実用的なまとめを作成してください。
条件:
- 冒頭に2〜3文の要約（です・ます調）
- 続けて ● で始まる箇条書きを3項目（読者が次に取れる行動・確認ポイント）
- 最後に中立的で自然な訴求文(1文)。アフィリエイト訴求は行わない。
出力はテキストのみ。

【抜粋】\n${context}`

  try {
    const res = await model.generateContent(prompt)
    const txt = (await res.response.text()).trim()
    const lines = txt.split(/\n+/).map((l) => l.trim()).filter(Boolean)
    const blocks = []
    for (const line of lines) {
      if (/^●/.test(line)) {
        blocks.push({
          _type: 'block',
          _key: `li-${randomUUID()}`,
          style: 'normal',
          listItem: 'bullet',
          level: 1,
          markDefs: [],
          children: [
            { _type: 'span', _key: `sp-${randomUUID()}`, marks: [], text: line.replace(/^●\s*/, '') },
          ],
        })
      } else {
        blocks.push({
          _type: 'block',
          _key: `p-${randomUUID()}`,
          style: 'normal',
          markDefs: [],
          children: [{ _type: 'span', _key: `s-${randomUUID()}`, marks: [], text: line }],
        })
      }
    }
    return blocks.length ? blocks : [buildSummaryBlock(title)]
  } catch (e) {
    return [buildSummaryBlock(title)]
  }
}

function isHeading(block) {
  return block?._type === 'block' && (block.style === 'h2' || block.style === 'h3')
}

function isSummaryHeading(block) {
  if (!isHeading(block)) return false
  const text = blockText(block).trim()
  return text === 'まとめ'
}

function removeBannedMarks(block, slug) {
  if (!block || block._type !== 'block') return block

  const markDefs = block.markDefs || []
  const bannedLinkKeys = new Set()
  const keepMarkDefs = []

  for (const def of markDefs) {
    if (def._type === 'link' && def.href) {
      const href = def.href
      const isSelfLink = href.includes(`/posts/${slug}`)
      const isBannedAffiliate = BANNED_LINK_PATTERNS.some((pattern) => pattern.test(href))

      if (isSelfLink || isBannedAffiliate) {
        bannedLinkKeys.add(def._key)
        continue
      }
    }
    keepMarkDefs.push(def)
  }

  if (bannedLinkKeys.size === 0) {
    return block
  }

  const filteredChildren = (block.children || []).filter((child) => {
    if (!child.marks) return true
    const remainingMarks = child.marks.filter((mark) => !bannedLinkKeys.has(mark))
    child.marks = remainingMarks
    return remainingMarks.length > 0 || !(child.text || '').trim()
  })

  const hasMeaningfulText = filteredChildren.some((child) => (child.text || '').trim().length > 0)

  if (!hasMeaningfulText) {
    return null
  }

  return {
    ...block,
    children: filteredChildren,
    markDefs: keepMarkDefs,
  }
}

async function processBody(body, slug, title) {
  const cleaned = []

  for (const block of body) {
    if (hasBannedText(block)) {
      continue
    }

    const sanitizedBlock = removeBannedMarks(block, slug)
    if (!sanitizedBlock) {
      continue
    }

    const text = blockText(sanitizedBlock)
    if (text && text.trim().length === 0) {
      continue
    }

    cleaned.push(sanitizedBlock)
  }

  for (let i = 0; i < cleaned.length; i++) {
    const block = cleaned[i]
    if (!isSummaryHeading(block)) {
      continue
    }

    const nextBlock = cleaned[i + 1]
    const needSmart = () => {
      if (!nextBlock) return true
      if (nextBlock._type !== 'block' || nextBlock.style !== 'normal') return true
      const t = blockText(nextBlock).trim()
      if (!t) return true
      if (/この記事「.+」/u.test(t)) return true // 旧汎用テキストを検出
      return false
    }
    if (needSmart()) {
      const smart = await buildSmartSummaryBlocks(title, cleaned.slice(0, i))
      if (nextBlock && nextBlock._type === 'block' && nextBlock.style === 'normal') {
        cleaned.splice(i + 1, 1, ...smart)
      } else {
        cleaned.splice(i + 1, 0, ...smart)
      }
    }
  }

  return cleaned
}

async function run() {
  console.log('Fetching posts...')
  const posts = await client.fetch(`*[_type == "post" && defined(body)]{_id, title, slug, body}`)
  console.log(`Found ${posts.length} posts`)

  let updated = 0
  let tx = client.transaction()
  let counter = 0

  for (const post of posts) {
    const slug = post.slug?.current || ''
    const newBody = await processBody(post.body || [], slug, post.title)

    if (JSON.stringify(newBody) === JSON.stringify(post.body)) {
      continue
    }

    tx.patch(post._id, { set: { body: newBody } })
    counter += 1
    updated += 1

    if (counter >= 20) {
      await tx.commit()
      tx = client.transaction()
      counter = 0
    }
  }

  if (counter > 0) {
    await tx.commit()
  }

  console.log(`Cleaned affiliate sections in ${updated} posts`)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
