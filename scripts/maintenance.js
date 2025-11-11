/**
 * 記事メンテナンスツール
 *
 * 記事の品質チェック・修正支援ツール
 * - 古い記事の検出
 * - メタデータ不足の記事検出
 * - 画像なし記事の検出
 * - 文字数不足の記事検出
 * - メタ情報に「白崎セラ」という固有名詞を出さないルールを強制
 */

const path = require('path')
const { spawn } = require('child_process')
const { randomUUID } = require('crypto')
const { createClient } = require('@sanity/client')
const { GoogleGenerativeAI } = require('@google/generative-ai')
const {
  blocksToPlainText,
  generateExcerpt,
  generateMetaDescription,
  generateSlugFromTitle,
  generateTags,
  selectBestCategory,
  removeGreetings,
  removeClosingRemarks,
  removePlaceholderLinks,
  separateAffiliateLinks,
  removeHashtagLines,
  addBodyToEmptyH3Sections,
  optimizeSummarySection,
  addAffiliateLinksToArticle,
  addSourceLinksToArticle,
  buildFallbackSummaryBlocks,
  findSummaryInsertIndex
} = require('./utils/postHelpers')
const {
  ensurePortableTextKeys,
  ensureReferenceKeys
} = require('./utils/keyHelpers')
const {
  CATEGORY_DESCRIPTIONS,
  CATEGORY_REFERENCE_SNIPPETS,
  CANONICAL_CATEGORY_TITLES,
  normalizeCategoryTitle,
  getNormalizedCategoryTitles
} = require('./utils/categoryMappings')
const { MOSHIMO_LINKS, NON_LIMITED_AFFILIATE_KEYS } = require('./moshimo-affiliate-links')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN || process.env.SANITY_WRITE_TOKEN || process.env.SANITY_TOKEN,
  useCdn: false
})

function normalizeTitle(title) {
  return (title || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

function getRecencyScore(post) {
  const updated = post._updatedAt ? new Date(post._updatedAt).getTime() : 0
  const created = post._createdAt ? new Date(post._createdAt).getTime() : 0
  return Math.max(updated, created)
}

function deepClone(value) {
  if (typeof structuredClone === 'function') {
    return structuredClone(value)
  }
  return JSON.parse(JSON.stringify(value))
}

function deepClone(value) {
  if (typeof structuredClone === 'function') {
    return structuredClone(value)
  }
  return JSON.parse(JSON.stringify(value))
}

const AFFILIATE_HOST_KEYWORDS = [
  'af.moshimo.com',
  'a8.net',
  'px.a8.net',
  'moshimo.com',
  'item.rakuten.co.jp',
  'hb.afl.rakuten.co.jp',
  'amazon.co.jp',
  'ck.jp.ap.valuecommerce.com',
  'fam-ad.com',
  'tcs-asp.net'
]

const ITEM_ROUNDUP_KEYWORDS = [
  'アイテム',
  'グッズ',
  '持ち物',
  '便利な道具',
  '便利グッズ',
  '必需品',
  '道具',
  'おすすめ',
  '必要なもの'
]
const ITEM_ROUNDUP_SELECTION_REGEX = /[0-9０-９]+\s*選/
const AFFILIATE_MIN_GAP_BLOCKS = 2

const CTA_TEXT_PATTERNS = [
  '転職・求人をお探しの方へ',
  '転職・求人をお探しの方は',
  '求人をお探しの方は',
  'やりがいのある仕事をお探しの方へ',
  '介護職・看護助手の求人なら',
  '求人サイトなどを活用',
  '求人情報を探している方は',
  '働き方改革に真剣に取り組んでいる職場を探している方は'
]

const PUBLIC_POST_FILTER = '!defined(internalOnly) || internalOnly == false'

function isInternalOnly(post) {
  return Boolean(post?.internalOnly)
}

function filterOutInternalPosts(posts = []) {
  return (posts || []).filter(post => !isInternalOnly(post))
}

const RESIGNATION_COMPARISON_SLUG = '/posts/comparison-of-three-resignation-agencies'
const RETIREMENT_AFFILIATE_KEYS = new Set(
  Object.entries(MOSHIMO_LINKS)
    .filter(([, link]) => link.category === '退職代行')
    .map(([key]) => key)
)
const RETIREMENT_KEYWORDS = [
  '退職',
  '辞めたい',
  '辞める',
  '退社',
  '円満退職',
  '有給',
  '退職代行'
]

const REFERENCE_MAPPINGS = [
  {
    keywords: ['職業情報提供サイト', 'job tag', '仕事内容', 'タスク'],
    url: 'https://shigoto.mhlw.go.jp/User/Occupation/Detail/246?utm_source=chatgpt.com',
    label: '厚生労働省 職業情報提供サイト（看護助手）'
  },
  {
    keywords: ['看護チーム', 'ガイドライン', '連携', '看護補助者活用'],
    url: 'https://www.nurse.or.jp/nursing/kango_seido/guideline/index.html?utm_source=chatgpt.com',
    label: '日本看護協会 看護チームにおける看護補助者活用ガイドライン'
  },
  {
    keywords: ['看護サービス', '療養生活', 'ケア', '患者'],
    url: 'https://www.nurse.or.jp/home/publication/pdf/guideline/way_of_nursing_service.pdf?utm_source=chatgpt.com',
    label: '日本看護協会 看護サービス提供体制のあり方'
  },
  {
    keywords: ['離職', '退職', '離職率', '処遇', '賃金'],
    url: 'https://www.nurse.or.jp/home/assets/20231005_nl01.pdf?utm_source=chatgpt.com',
    label: '日本看護協会 看護補助者の離職状況レポート'
  },
  {
    keywords: ['転職', '年収', 'キャリア', 'NsPace'],
    url: 'https://ns-pace-career.com/media/tips/01230/?utm_source=chatgpt.com',
    label: 'NsPace Career 看護助手の転職・年収コラム'
  },
  {
    keywords: ['給料', '年収', 'コメディカル'],
    url: 'https://www.co-medical.com/knowledge/article112/?utm_source=chatgpt.com',
    label: 'コメディカルドットコム 看護助手の給料解説'
  },
  {
    keywords: ['やめたほうがいい', '悩み', '看護助手ラボ'],
    url: 'https://nurse-aide-lab.jp/career/yametahougaii/?utm_source=chatgpt.com',
    label: '看護助手ラボ 悩みとキャリアの記事'
  },
  {
    keywords: ['仕事内容', '解説', '介護サーチプラス'],
    url: 'https://kaigosearch-plus.jp/columns/nursing-assistant-job-overview?utm_source=chatgpt.com',
    label: '介護サーチプラス 看護助手の仕事内容コラム'
  }
]

const YMYL_REPLACEMENTS = [
  { pattern: /絶対に/g, replacement: '基本的に' },
  { pattern: /絶対/g, replacement: '基本的に' },
  { pattern: /必ず/g, replacement: 'できるだけ' },
  { pattern: /間違いなく/g, replacement: 'ほとんどの場合' },
  { pattern: /100％/g, replacement: 'ほぼ' },
  { pattern: /100%/g, replacement: 'ほぼ' },
  { pattern: /誰でも/g, replacement: '多くの方が' },
  { pattern: /すべての人が/g, replacement: '多くの人が' },
  { pattern: /確実に/g, replacement: '着実に' },
  { pattern: /保証します/g, replacement: 'サポートします' },
  { pattern: /完璧/g, replacement: '十分' }
]

const DISCLAIMER_TEXT =
  '免責事項: この記事は、看護助手としての現場経験に基づく一般的な情報提供を目的としています。職場や地域、個人の状況によって異なる場合がありますので、詳細は勤務先や専門家にご確認ください。'

const NUMERIC_REFERENCE_HINTS = [
  {
    keywords: ['年収', '月給', '給与', '給料', '手当', '収入', '賃金', '賞与'],
    mapping: REFERENCE_MAPPINGS[0]
  },
  {
    keywords: ['離職', '退職', '労働力', '就業', '雇用'],
    mapping: REFERENCE_MAPPINGS[4]
  },
  {
    keywords: ['病院', '病床', '医療施設'],
    mapping: REFERENCE_MAPPINGS[2]
  },
  {
    keywords: ['資格', '研修', '学校', '進学'],
    mapping: REFERENCE_MAPPINGS[3]
  },
  {
    keywords: ['看護協会', '看護職員', '需給'],
    mapping: REFERENCE_MAPPINGS[6]
  }
]

const MEDICAL_KEYWORDS = [
  '注射',
  '点滴',
  '採血',
  '投薬',
  '医療行為',
  '処置',
  '診療',
  '血圧',
  'バイタル',
  '検温',
  '診断',
  '処方',
  '治療'
]

const MEDICAL_NOTICE_TEXT =
  '看護助手は注射や点滴などの医療行為を担当できません。必要な処置がある場合は、看護師に共有して指示を仰ぎましょう。'

/**
 * Portable Text ブロックからテキストを抽出
 * @param {Object} block
 * @returns {string}
 */
function extractBlockText(block) {
  if (!block || block._type !== 'block' || !Array.isArray(block.children)) {
    return ''
  }
  return block.children
    .map(child => (child && typeof child.text === 'string' ? child.text : ''))
    .join('')
    .trim()
}

function isReferenceBlock(block) {
  if (!block || block._type !== 'block') {
    return false
  }
  const text = extractBlockText(block)
  if (!text.startsWith('参考資料')) {
    return false
  }
  return Array.isArray(block.markDefs) && block.markDefs.some(def => def?._type === 'link')
}

function ensureSummarySection(blocks, title) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return { body: blocks, added: false }
  }
  const hasSummary = blocks.some(
    block => block?._type === 'block' && block.style === 'h2' && extractBlockText(block) === 'まとめ'
  )
  if (hasSummary) {
    return { body: blocks, added: false }
  }
  const summaryHeading = {
    _type: 'block',
    _key: `summary-heading-${randomUUID()}`,
    style: 'h2',
    markDefs: [],
    children: [
      {
        _type: 'span',
        _key: `summary-heading-span-${randomUUID()}`,
        marks: [],
        text: 'まとめ'
      }
    ]
  }
  const fallbackSummary = buildFallbackSummaryBlocks({
    articleTitle: title,
    summaryBlocks: [],
    leadingBlocks: blocks.slice(-40)
  })
  return {
    body: [...blocks, summaryHeading, ...fallbackSummary],
    added: true
  }
}

/**
 * ブロックが内部リンクのみで構成されているか判定
 * @param {Object} block
 * @returns {{isInternalLinkOnly: boolean, isInternalLink: boolean}}
 */
function analyseLinkBlock(block) {
  if (!block || block._type !== 'block' || !Array.isArray(block.children)) {
    return { isInternalLinkOnly: false, isInternalLink: false }
  }

  if (!Array.isArray(block.markDefs) || block.markDefs.length === 0) {
    return { isInternalLinkOnly: false, isInternalLink: false }
  }

  const linkMarks = new Map()
  block.markDefs.forEach(def => {
    if (def && def._type === 'link' && typeof def.href === 'string') {
      linkMarks.set(def._key, def.href)
    }
  })

  if (linkMarks.size === 0) {
    return { isInternalLinkOnly: false, isInternalLink: false }
  }

  let hasInternalLink = false
  let allChildrenAreLinks = true

  block.children.forEach(child => {
    if (!child || typeof child.text !== 'string') {
      return
    }
    const text = child.text.trim()
    const marks = Array.isArray(child.marks) ? child.marks : []
    const hasLinkMark = marks.some(markKey => {
      const href = linkMarks.get(markKey)
      if (typeof href !== 'string') return false
      return href.startsWith('/posts/') || href.includes('/posts/')
    })

    if (hasLinkMark) {
      hasInternalLink = true
    }

    if (text.length > 0 && !hasLinkMark) {
      allChildrenAreLinks = false
    }
  })

  return {
    isInternalLinkOnly: allChildrenAreLinks && hasInternalLink,
    isInternalLink: hasInternalLink
  }
}

function hasAffiliateLink(block) {
  if (!block) {
    return false
  }
  if (block._type === 'affiliateEmbed' && typeof block.linkKey === 'string') {
    return true
  }
  if (block._type !== 'block' || !Array.isArray(block.markDefs)) {
    return false
  }
  return block.markDefs.some(def => {
    if (!def || typeof def.href !== 'string') {
      return false
    }
    return AFFILIATE_HOST_KEYWORDS.some(keyword => def.href.includes(keyword))
  })
}

const INVALID_SLUG_SEGMENTS = new Set(['article', 'articles', 'blog', 'post'])

function needsSlugRegeneration(slug) {
  if (!slug || typeof slug !== 'string') return true
  const normalized = slug.trim().toLowerCase()
  if (!normalized.startsWith('nursing-assistant-')) return true
  if (/[^a-z-]/.test(normalized)) return true

  const remainder = normalized.replace(/^nursing-assistant-/, '')
  const segments = remainder.split('-').filter(Boolean)

  if (segments.length < 2 || segments.length > 3) {
    return true
  }

  return segments.some(segment => segment.length < 3 || INVALID_SLUG_SEGMENTS.has(segment))
}

function ensureHttpsUrl(url) {
  if (!url || typeof url !== 'string') {
    return null
  }
  let trimmed = url.trim()
  if (trimmed.startsWith('//')) {
    trimmed = `https:${trimmed}`
  }
  if (/^http:\/\//i.test(trimmed)) {
    trimmed = trimmed.replace(/^http:\/\//i, 'https://')
  }
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed.replace(/^\/+/, '')}`
  }
  return trimmed
}

function extractAffiliateHref(rawHref) {
  if (!rawHref || typeof rawHref !== 'string') {
    return rawHref
  }
  let target = rawHref.trim()
  if (!target) return target

  const anchorMatch = target.match(/href\s*=\s*"(https?:\/\/[^"\s<>]+|\/\/[^"\s<>]+)"/i)
  if (anchorMatch) {
    target = anchorMatch[1]
  } else {
    const urlMatch = target.match(/(https?:\/\/[^"'\s<>]+|\/\/[^"'\s<>]+)/i)
    if (urlMatch) {
      target = urlMatch[1]
    }
  }

  target = target.replace(/&amp;/g, '&')

  if (target.startsWith('//')) {
    target = `https:${target}`
  }

  return target
}

function normalizeAffiliateLinkMarks(blocks) {
  if (!Array.isArray(blocks)) {
    return { body: blocks, normalized: 0 }
  }

  let normalized = 0
  const normalizedBlocks = blocks.map(block => {
    if (!block || block._type !== 'block' || !Array.isArray(block.markDefs) || block.markDefs.length === 0) {
      return block
    }

    let blockChanged = false
    const markDefs = block.markDefs.map(def => {
      if (!def || def._type !== 'link' || typeof def.href !== 'string') {
        return def
      }

      const href = def.href.trim()
      if (!href) {
        return def
      }

      const normalizedHref = extractAffiliateHref(href)
      if (normalizedHref && normalizedHref !== href) {
        blockChanged = true
        return { ...def, href: normalizedHref }
      }
      return def
    })

    if (blockChanged) {
      normalized += 1
      return { ...block, markDefs }
    }
    return block
  })

  return { body: normalizedBlocks, normalized }
}

function isTopLevelUrl(url) {
  try {
    const parsed = new URL(url)
    return parsed.pathname === '/' || parsed.pathname === '' || parsed.pathname === '/index.html'
  } catch (error) {
    return false
  }
}

function matchReferenceMapping(label) {
  if (!label) return null
  const normalized = label.toLowerCase()
  for (const mapping of REFERENCE_MAPPINGS) {
    const match = mapping.keywords.every(keyword => normalized.includes(keyword.toLowerCase()))
    if (match) {
      return mapping
    }
  }
  return null
}

function findReferenceForText(text) {
  if (!text) return null
  const normalized = text.toLowerCase()

  for (const mapping of REFERENCE_MAPPINGS) {
    const match = mapping.keywords.every(keyword => normalized.includes(keyword.toLowerCase()))
    if (match) {
      return mapping
    }
  }

  for (const hint of NUMERIC_REFERENCE_HINTS) {
    const match = hint.keywords.some(keyword => normalized.includes(keyword.toLowerCase()))
    if (match && hint.mapping) {
      return hint.mapping
    }
  }

  const numericPattern = /\d{2,}\s*(万円|円|％|%|人|件|施設|時間|割|割合|ポイント)/g
  if (numericPattern.test(text)) {
    return REFERENCE_MAPPINGS[0]
  }

  if (normalized.includes('統計') || normalized.includes('調査') || normalized.includes('データ')) {
    return REFERENCE_MAPPINGS[5]
  }

  return null
}

function createReferenceBlock(mapping) {
  if (!mapping || !mapping.url) return null

  const linkKey = `link-${randomUUID()}`
  return {
    _type: 'block',
    _key: `reference-${randomUUID()}`,
    style: 'normal',
    markDefs: [
      {
        _key: linkKey,
        _type: 'link',
        href: ensureHttpsUrl(mapping.url)
      }
    ],
    children: [
      {
        _type: 'span',
        _key: `reference-span-label-${randomUUID()}`,
        text: '参考: ',
        marks: []
      },
      {
        _type: 'span',
        _key: `reference-span-link-${randomUUID()}`,
        text: mapping.label || mapping.url,
        marks: [linkKey]
      }
    ]
  }
}

function isReferenceBlock(block) {
  if (!block || block._type !== 'block' || !Array.isArray(block.children)) {
    return false
  }
  const text = extractBlockText(block).trim()
  return /^参考[:：]/.test(text)
}

function normalizeAffiliateUrl(url) {
  const normalized = ensureHttpsUrl(url)
  if (!normalized) return null
  return normalized.replace(/^https?:\/\//, '').replace(/\/$/, '')
}

function getAffiliateMetaFromBlock(block) {
  if (!block) return null

  if (block._type === 'affiliateEmbed' && typeof block.linkKey === 'string') {
    const link = MOSHIMO_LINKS[block.linkKey]
    if (link && link.active) {
      return { key: block.linkKey, ...link }
    }
    return null
  }

  if (!Array.isArray(block.markDefs)) return null

  for (const def of block.markDefs) {
    if (!def || def._type !== 'link' || typeof def.href !== 'string') continue
    const normalizedHref = normalizeAffiliateUrl(def.href)
    if (!normalizedHref) continue

    for (const [key, link] of Object.entries(MOSHIMO_LINKS)) {
      if (!link || !link.active) continue
      const normalizedLinkUrl = normalizeAffiliateUrl(link.url)
      if (!normalizedLinkUrl) continue

      if (
        normalizedHref.includes(normalizedLinkUrl) ||
        normalizedLinkUrl.includes(normalizedHref)
      ) {
        return { key, ...link }
      }
    }
  }

  return null
}

function createAffiliateContextBlock(meta) {
  if (!meta || !meta.appealText) return null
  const appeal = meta.appealText.replace(/：\s*$/, '').trim()
  const description = (meta.description || '').replace(/。$/u, '')
  const contextText = `${appeal}。${description}を紹介しています。`

  return {
    _type: 'block',
    _key: `affiliate-context-${randomUUID()}`,
    style: 'normal',
    markDefs: [],
    children: [
      {
        _type: 'span',
        _key: `affiliate-context-span-${randomUUID()}`,
        text: contextText,
        marks: []
      }
    ]
  }
}

function isAffiliateRelevant(meta, combinedText, currentPost) {
  if (!meta) return false
  if (!combinedText || typeof combinedText !== 'string') {
    return true
  }

  const text = combinedText.toLowerCase()
  const slug = (typeof currentPost?.slug === 'string'
    ? currentPost.slug
    : currentPost?.slug?.current || '').toLowerCase()
  const originalCategoryNames = (currentPost?.categories || [])
    .map(category => (typeof category === 'string' ? category : category?.title || ''))
    .join(' ')
    .toLowerCase()
  const normalizedCategoryNames = getNormalizedCategoryTitles(currentPost?.categories || [])
  const normalizedCategorySet = new Set(normalizedCategoryNames)

  if (meta.category === '退職代行') {
    const hasKeyword = /退職|離職|辞め|辞職|退社|退職代行/.test(text)
    const slugMatches = /retire|resign|quit/.test(slug)
    const categoryMatches =
      normalizedCategorySet.has('離職理由') ||
      /退職|辞め/.test(originalCategoryNames)
    if (!slugMatches && !categoryMatches) {
      return false
    }
    return hasKeyword || slugMatches || categoryMatches
  }

  if (meta.category === '就職・転職') {
    const hasKeyword = /転職|求人|就職|応募|面接|志望動機|キャリア|採用/.test(text)
    const slugMatches = /career|job|転職/.test(slug)
    const categoryMatches =
      normalizedCategorySet.has('就業移動（転職）') ||
      /転職|求人/.test(originalCategoryNames)
    if (!slugMatches && !categoryMatches) {
      return false
    }
    return hasKeyword || slugMatches || categoryMatches
  }

  if (meta.category === 'アイテム') {
    const hasKeyword = /グッズ|ユニフォーム|靴|シューズ|持ち物|アイテム|道具|備品/.test(text)
    const slugMatches = /goods|item|uniform/.test(slug)
    const categoryMatches =
      normalizedCategoryNames.some(name =>
        name === '日常業務プロトコル' || name === '業務範囲（療養生活上の世話）'
      ) ||
      /持ち物|アイテム|グッズ/.test(originalCategoryNames)
    if (!slugMatches && !categoryMatches) {
      return false
    }
    return hasKeyword || slugMatches || categoryMatches
  }

  return true
}

function isItemRoundupArticle(post = {}) {
  const title = (post?.title || '').toLowerCase()
  const slug = (typeof post?.slug === 'string'
    ? post.slug
    : post?.slug?.current || ''
  ).toLowerCase()

  if (ITEM_ROUNDUP_SELECTION_REGEX.test(title)) {
    return true
  }

  return ITEM_ROUNDUP_KEYWORDS.some(keyword => {
    const normalizedKeyword = keyword.toLowerCase()
    return title.includes(normalizedKeyword) || slug.includes(normalizedKeyword)
  })
}

function shouldAddResignationComparisonLink(post = {}, blocks = []) {
  if (!post || isInternalOnly(post)) return false

  const normalizedCategories = getNormalizedCategoryTitles(
    (post.categories || [])
      .map(category => (typeof category === 'string' ? category : category?.title || ''))
  )

  if (
    normalizedCategories.includes('離職理由') ||
    normalizedCategories.includes('就業移動（転職）')
  ) {
    return true
  }

  const slug = typeof post.slug === 'string' ? post.slug : post.slug?.current || ''
  const textSources = [
    post.title || '',
    slug || '',
    blocksToPlainText(blocks || [])
  ]
    .join(' ')
    .toLowerCase()

  return RETIREMENT_KEYWORDS.some(keyword => textSources.includes(keyword))
}

function blockContainsLink(block, targetHref) {
  if (!block || block._type !== 'block' || !Array.isArray(block.markDefs)) return false
  const normalizedTarget = targetHref.toLowerCase()
  return block.markDefs.some(
    def => def && def._type === 'link' && typeof def.href === 'string' && def.href.toLowerCase() === normalizedTarget
  )
}

function createResignationComparisonBlock(post = {}) {
  const linkKey = `link-${randomUUID()}`
  const leadText = '退職の段取りを進める前に、看護助手の視点で３社を比較した記事でチェックポイントを整理しておきましょう。'
  const linkText = '退職代行３社のメリット・デメリット徹底比較を読む'
  return {
    _type: 'block',
    _key: `resignation-comparison-${randomUUID()}`,
    style: 'normal',
    markDefs: [
      {
        _key: linkKey,
        _type: 'link',
        href: RESIGNATION_COMPARISON_SLUG
      }
    ],
    children: [
      {
        _type: 'span',
        _key: `resignation-comparison-lead-${randomUUID()}`,
        text: `${leadText} `,
        marks: []
      },
      {
        _type: 'span',
        _key: `resignation-comparison-link-${randomUUID()}`,
        text: linkText,
        marks: [linkKey]
      }
    ]
  }
}

function removeNearbyRetirementAffiliates(blocks, centerIndex, radius = 2) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return { body: blocks, removed: 0 }
  }

  const result = [...blocks]
  let removed = 0

  const isRetirementEmbed = block =>
    block &&
    block._type === 'affiliateEmbed' &&
    typeof block.linkKey === 'string' &&
    RETIREMENT_AFFILIATE_KEYS.has(block.linkKey)

  for (let i = result.length - 1; i >= 0; i -= 1) {
    if (Math.abs(i - centerIndex) > radius) {
      continue
    }

    if (isRetirementEmbed(result[i])) {
      result.splice(i, 1)
      removed += 1

      if (i - 1 >= 0 && result[i - 1]?._key?.startsWith('affiliate-context-')) {
        result.splice(i - 1, 1)
        removed += 1
        if (i - 1 <= centerIndex) {
          centerIndex -= 1
        }
      }

      if (i <= centerIndex) {
        centerIndex -= 1
      }
    }
  }

  return { body: result, removed }
}

function ensureResignationComparisonLink(blocks, post, options = {}) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return { body: blocks, inserted: false }
  }

  const shouldForce = Boolean(options.force)
  if (!shouldForce) {
    return { body: blocks, inserted: false }
  }

  const alreadyExists = blocks.some(block => blockContainsLink(block, RESIGNATION_COMPARISON_SLUG))
  if (alreadyExists) {
    return { body: blocks, inserted: false }
  }

  const insertionIndex = Math.max(0, findSummaryInsertIndex(blocks))
  const block = createResignationComparisonBlock(post)
  const updated = [...blocks]
  updated.splice(insertionIndex, 0, block)

  const cleaned = removeNearbyRetirementAffiliates(updated, insertionIndex, AFFILIATE_MIN_GAP_BLOCKS)
  return { body: cleaned.body, inserted: true }
}

function ensureAffiliateContextBlocks(blocks) {
  return { body: blocks, added: 0 }
}

function removeIrrelevantAffiliateBlocks(blocks, currentPost, options = {}) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return { body: blocks, removed: 0 }
  }

  const articlePlainText = blocksToPlainText(blocks)
  const combinedText = `${currentPost?.title || ''} ${articlePlainText}`.toLowerCase()
  const filtered = []
  let removed = 0
  const seenKeys = new Set()
  let serviceCount = 0
  const SERVICE_LIMIT = 2
  const allowDenseAffiliate = isItemRoundupArticle(currentPost)
  let lastAffiliateIndex = Number.NEGATIVE_INFINITY
  const removeRetirementAffiliates = Boolean(options.removeRetirementAffiliates)

  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i]

    if (block?._key?.startsWith('affiliate-context-')) {
      const nextBlock = blocks[i + 1]
      if (nextBlock && nextBlock._type === 'affiliateEmbed') {
        removed += 1
        continue
      }
    }

    if (hasAffiliateLink(block)) {
      const meta = getAffiliateMetaFromBlock(block)
      if (!isAffiliateRelevant(meta, combinedText, currentPost)) {
        removed += 1

        continue
      }

      const key = meta?.key
      const isNonLimited = key ? NON_LIMITED_AFFILIATE_KEYS.has(key) : false
      const isRetirementAffiliate = key ? RETIREMENT_AFFILIATE_KEYS.has(key) : false
      if (removeRetirementAffiliates && isRetirementAffiliate) {
        removed += 1
        continue
      }
      if (key) {
        if (seenKeys.has(key)) {
          removed += 1
          continue
        }
        if (!isNonLimited) {
          if (serviceCount >= SERVICE_LIMIT) {
            removed += 1
            continue
          }
          serviceCount += 1
        }
        seenKeys.add(key)
      }

      if (!allowDenseAffiliate) {
        const gapSinceLast = filtered.length - lastAffiliateIndex - 1
        if (Number.isFinite(lastAffiliateIndex) && gapSinceLast < AFFILIATE_MIN_GAP_BLOCKS) {
          removed += 1
          continue
        }
      }

      filtered.push(block)
      lastAffiliateIndex = filtered.length - 1

      continue
    }

    filtered.push(block)
  }

  return { body: filtered, removed }
}

function removeInvalidInternalLinks(blocks, validHrefSet) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return { body: blocks, removed: 0 }
  }
  if (!validHrefSet || validHrefSet.size === 0) {
    return { body: blocks, removed: 0 }
  }

  const result = []
  let removed = 0

  blocks.forEach(block => {
    if (!block || block._type !== 'block') {
      result.push(block)
      return
    }

    let hasInvalidLink = false
    if (Array.isArray(block.markDefs)) {
      block.markDefs.forEach(def => {
        if (def && def._type === 'link' && typeof def.href === 'string' && def.href.startsWith('/posts/')) {
          if (!validHrefSet.has(def.href)) {
            hasInvalidLink = true
          }
        }
      })
    }

    if (hasInvalidLink) {
      removed += 1
      return
    }

    result.push(block)
  })

  return { body: result, removed }
}

function ensureMedicalScopeNotice(blocks) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return { body: blocks, added: false }
  }

  const plainText = blocksToPlainText(blocks)
  const normalized = plainText.toLowerCase()
  const hasKeyword = MEDICAL_KEYWORDS.some(keyword => normalized.includes(keyword.toLowerCase()))

  if (!hasKeyword) {
    return { body: blocks, added: false }
  }

  if (/医療行為.*(できません|行えません)/.test(normalized) || /看護助手.*できない/.test(normalized)) {
    return { body: blocks, added: false }
  }

  const noticeBlock = {
    _type: 'block',
    _key: `medical-notice-${randomUUID()}`,
    style: 'normal',
    markDefs: [],
    children: [
      {
        _type: 'span',
        _key: `medical-notice-span-${randomUUID()}`,
        text: MEDICAL_NOTICE_TEXT,
        marks: []
      }
    ]
  }

  let insertIndex = blocks.length

  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i]
    if (!block || block._type !== 'block') continue
    const text = extractBlockText(block).toLowerCase()
    if (MEDICAL_KEYWORDS.some(keyword => text.includes(keyword.toLowerCase()))) {
      insertIndex = i + 1
      break
    }
  }

  const result = [...blocks]
  if (insertIndex >= result.length) {
    result.push(noticeBlock)
  } else {
    result.splice(insertIndex, 0, noticeBlock)
  }

  return { body: result, added: true }
}

function createSectionClosingBlock(title) {
  const normalizedTitle = title.replace(/^(H2:|#|##)\s*/, '').trim()
  const text = `${normalizedTitle || 'この内容'}では、看護師と連携しながら無理のない範囲で進めることが大切です。気になる点はその都度共有し、安全第一で取り組みましょう。`
  return {
    _type: 'block',
    _key: `section-closing-${randomUUID()}`,
    style: 'normal',
    markDefs: [],
    children: [
      {
        _type: 'span',
        _key: `section-closing-span-${randomUUID()}`,
        text,
        marks: []
      }
    ]
  }
}

function ensureSectionClosingParagraphs(blocks) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return { body: blocks, added: 0 }
  }

  const result = [...blocks]
  let added = 0
  let index = 0

  while (index < result.length) {
    const block = result[index]
    if (block && block._type === 'block' && block.style === 'h2') {
      const title = extractBlockText(block).trim()
      if (title === 'まとめ') {
        index += 1
        continue
      }

      let sectionEnd = index + 1
      let lastContentIndex = -1

      while (sectionEnd < result.length) {
        const nextBlock = result[sectionEnd]
        if (nextBlock && nextBlock._type === 'block' && nextBlock.style === 'h2') {
          break
        }
        if (nextBlock && nextBlock._type === 'block' && extractBlockText(nextBlock).trim().length > 0) {
          lastContentIndex = sectionEnd
        }
        sectionEnd += 1
      }

      if (lastContentIndex !== -1) {
        const lastBlock = result[lastContentIndex]
        if (lastBlock && lastBlock.listItem) {
          const nextBlock = result[lastContentIndex + 1]
          const nextText = nextBlock ? extractBlockText(nextBlock).trim() : ''

          if (!/無理のない範囲で/.test(nextText)) {
            const closingBlock = createSectionClosingBlock(title)
            result.splice(lastContentIndex + 1, 0, closingBlock)
            added += 1
            index = lastContentIndex + 2
            continue
          }
        }
      }
    }
    index += 1
  }

  return { body: result, added }
}

function createDisclaimerBlock() {
  return {
    _type: 'block',
    _key: `disclaimer-${randomUUID()}`,
    style: 'normal',
    markDefs: [],
    children: [
      {
        _type: 'span',
        _key: `disclaimer-span-${randomUUID()}`,
        text: DISCLAIMER_TEXT,
        marks: []
      }
    ]
  }
}

function replaceSeraWithWatashi(text) {
  if (!text || typeof text !== 'string') {
    return text
  }
  return text.replace(/セラ/g, 'わたし')
}

function normalizePersonaInHeading(block) {
  if (!block || block._type !== 'block' || block.style !== 'h2') {
    return { block, changed: false }
  }

  const originalText = extractBlockText(block)
  if (!originalText.includes('セラ')) {
    return { block, changed: false }
  }

  const newChildren = Array.isArray(block.children)
    ? block.children.map(child => {
        if (!child || typeof child.text !== 'string') {
          return child
        }
        return {
          ...child,
          text: replaceSeraWithWatashi(child.text)
        }
      })
    : block.children

  return {
    block: {
      ...block,
      children: newChildren
    },
    changed: true
  }
}

function isDisclaimerBlock(block) {
  if (!block || block._type !== 'block') {
    return false
  }
  const text = extractBlockText(block)
  if (!text) return false
  return /^免責事項[:：]/.test(text.trim())
}

function ensureDisclaimerPlacement(blocks) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return { body: blocks, moved: false, added: false }
  }

  const disclaimerBlocks = []
  const remainder = []
  let firstDisclaimerIndex = -1

  blocks.forEach((block, index) => {
    if (isDisclaimerBlock(block)) {
      disclaimerBlocks.push(block)
      if (firstDisclaimerIndex === -1) {
        firstDisclaimerIndex = index
      }
    } else {
      remainder.push(block)
    }
  })

  if (disclaimerBlocks.length === 1 && firstDisclaimerIndex === blocks.length - 1) {
    // すでに記事末尾にある場合は変更不要
    return { body: blocks, moved: false, added: false }
  }

  let disclaimerBlock = disclaimerBlocks[0]
  const added = !disclaimerBlock
  if (!disclaimerBlock) {
    disclaimerBlock = createDisclaimerBlock()
  }

  const finalBody = [
    ...remainder,
    {
      ...disclaimerBlock,
      _key: disclaimerBlock._key || `disclaimer-${randomUUID()}`
    }
  ]

  return {
    body: finalBody,
    moved: true,
    added
  }
}

function moveSummaryToEnd(blocks) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return { body: blocks, moved: false }
  }

  const summaryIndex = blocks.findIndex(block =>
    block &&
    block._type === 'block' &&
    block.style === 'h2' &&
    extractBlockText(block).trim() === 'まとめ'
  )

  if (summaryIndex === -1) {
    return { body: blocks, moved: false }
  }

  let nextSectionIndex = -1
  for (let i = summaryIndex + 1; i < blocks.length; i += 1) {
    const block = blocks[i]
    if (block && block._type === 'block' && block.style === 'h2') {
      nextSectionIndex = i
      break
    }
  }

  if (nextSectionIndex === -1) {
    return { body: blocks, moved: false }
  }

  const summarySlice = blocks.slice(summaryIndex, nextSectionIndex)
  const remaining = [...blocks.slice(0, summaryIndex), ...blocks.slice(nextSectionIndex)]

  let insertIndex = remaining.length
  const disclaimerIndex = remaining.findIndex(block =>
    block &&
    block._type === 'block' &&
    extractBlockText(block).trim().startsWith('免責事項')
  )

  if (disclaimerIndex !== -1) {
    insertIndex = disclaimerIndex
  }

  const newBody = [
    ...remaining.slice(0, insertIndex),
    ...summarySlice,
    ...remaining.slice(insertIndex)
  ]

  return { body: newBody, moved: true }
}

function replaceYMYLTerms(blocks) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return { body: blocks, replaced: 0 }
  }

  let replaced = 0
  const updated = blocks.map(block => {
    if (!block || block._type !== 'block' || !Array.isArray(block.children)) {
      return block
    }

    let blockModified = false
    const newChildren = block.children.map(child => {
      if (!child || typeof child.text !== 'string') {
        return child
      }

      let newText = child.text
      let childModified = false

      for (const { pattern, replacement } of YMYL_REPLACEMENTS) {
        pattern.lastIndex = 0
        const nextText = newText.replace(pattern, replacement)
        if (nextText !== newText) {
          newText = nextText
          childModified = true
        }
      }

      if (childModified) {
        blockModified = true
        replaced += 1
        return { ...child, text: newText }
      }

      return child
    })

    if (blockModified) {
      return { ...block, children: newChildren }
    }

    return block
  })

  return { body: updated, replaced }
}

function ensureReferenceBlocks(blocks) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return { body: blocks, added: 0 }
  }

  const existingReferenceUrls = new Set()
  blocks.forEach(block => {
    if (isReferenceBlock(block) && Array.isArray(block.markDefs)) {
      block.markDefs.forEach(def => {
        if (def && def._type === 'link' && def.href) {
          const normalizedUrl = ensureHttpsUrl(def.href)
          if (normalizedUrl) {
            existingReferenceUrls.add(normalizedUrl)
          }
        }
      })
    }
  })

  const result = []
  let added = 0

  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i]
    result.push(block)

    if (!block || block._type !== 'block' || isReferenceBlock(block)) {
      continue
    }

    const text = extractBlockText(block).trim()
    if (!text) continue

    const mapping = findReferenceForText(text)
    if (!mapping) continue

    let hasReferenceNearby = false
    for (let offset = 1; offset <= 2; offset += 1) {
      const nextBlock = blocks[i + offset]
      if (isReferenceBlock(nextBlock)) {
        hasReferenceNearby = true
        break
      }
    }

    if (hasReferenceNearby) {
      continue
    }

    const normalizedUrl = ensureHttpsUrl(mapping.url)
    if (existingReferenceUrls.has(normalizedUrl)) {
      continue
    }

    const referenceBlock = createReferenceBlock(mapping)
    if (referenceBlock) {
      result.push(referenceBlock)
      existingReferenceUrls.add(normalizedUrl)
      added += 1
    }
  }

  return { body: result, added }
}

function extractSlugSegments(slug) {
  return (slug || '')
    .replace(/^\/posts\//, '')
    .replace(/^nursing-assistant-/, '')
    .split('-')
    .map(seg => seg.trim())
    .filter(Boolean)
}

function extractTitleKeywords(title) {
  if (!title) return []
  const cleaned = title
    .replace(/[「」『』【】（）()［］\[\]]/g, ' ')
    .replace(/[!?！？]/g, ' ')
  return Array.from(
    new Set(
      cleaned
        .split(/[・\s、,。]+/)
        .map(token => token.trim())
        .filter(token => token.length >= 2 && token.length <= 20)
    )
  )
}

function countInternalLinks(blocks) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return 0
  }

  let count = 0
  blocks.forEach(block => {
    if (!block || block._type !== 'block') return
    const { isInternalLink } = analyseLinkBlock(block)
    if (isInternalLink) {
      count += 1
    }
  })
  return count
}

function createInternalLinkBlock(target) {
  if (!target || !target.slug) return null
  const href = target.slug.startsWith('/posts/')
    ? target.slug
    : `/posts/${target.slug}`
  const linkKey = `link-${randomUUID()}`
  const introText = '詳しくは'
  const outroText = 'でも現場のポイントを詳しく解説しています。'

  return {
    _type: 'block',
    _key: `internal-link-${randomUUID()}`,
    style: 'normal',
    markDefs: [
      {
        _key: linkKey,
        _type: 'link',
        href
      }
    ],
    children: [
      {
        _type: 'span',
        _key: `internal-link-span-intro-${randomUUID()}`,
        text: introText,
        marks: []
      },
      {
        _type: 'span',
        _key: `internal-link-span-title-${randomUUID()}`,
        text: `「${target.title}」`,
        marks: [linkKey]
      },
      {
        _type: 'span',
        _key: `internal-link-span-outro-${randomUUID()}`,
        text: outroText,
        marks: []
      }
    ]
  }
}

function selectInternalLinkTarget(currentPost, catalog) {
  if (!currentPost || !Array.isArray(catalog) || catalog.length === 0) {
    return null
  }

  const currentSlug = typeof currentPost.slug === 'string'
    ? currentPost.slug
    : currentPost.slug?.current
  const normalizedSlug = (currentSlug || '').replace(/^\/posts\//, '')
  const currentSegments = new Set(extractSlugSegments(normalizedSlug))
  const currentCategories = new Set(getNormalizedCategoryTitles(currentPost.categories || []))
  const currentTitle = (currentPost.title || '').toLowerCase()

  let best = null
  let bestScore = -Infinity

  for (const candidate of catalog) {
    if (!candidate.slug || candidate.slug === normalizedSlug) {
      continue
    }

    let score = 0

    candidate.categories.forEach(category => {
      if (currentCategories.has(category)) {
        score += 6
      }
    })

    const sharedSegments = candidate.slugSegments.filter(seg => currentSegments.has(seg))
    score += sharedSegments.length * 3

    candidate.titleKeywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase()
      if (keyword && currentTitle.includes(keywordLower)) {
        score += 2
      }
    })

    if (
      (candidate.slugSegments.includes('career') || candidate.slugSegments.includes('change')) &&
      (currentTitle.includes('転職') || currentTitle.includes('キャリア'))
    ) {
      score += 2
    }

    if (
      candidate.slugSegments.includes('salary') &&
      (currentTitle.includes('給料') || currentTitle.includes('年収'))
    ) {
      score += 2
    }

    if (score > bestScore || (score === bestScore && candidate.recency > (best?.recency || 0))) {
      best = candidate
      bestScore = score
    }
  }

  if (!best && catalog.length > 0) {
    best = catalog.find(item => item.slug !== normalizedSlug) || null
  }

  return best || null
}

function ensureInternalLinkBlock(blocks, currentPost, catalog) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return { body: blocks, added: false, target: null }
  }

  const internalLinkCount = countInternalLinks(blocks)
  if (internalLinkCount > 0) {
    return { body: blocks, added: false, target: null }
  }

  const target = selectInternalLinkTarget(currentPost, catalog)
  if (!target) {
    return { body: blocks, added: false, target: null }
  }

  const existingInternalLinkHref = new Set()
  blocks.forEach(block => {
    if (!block || block._type !== 'block' || !Array.isArray(block.markDefs)) return
    block.markDefs.forEach(def => {
      if (def && def._type === 'link' && typeof def.href === 'string' && def.href.startsWith('/posts/')) {
        existingInternalLinkHref.add(def.href)
      }
    })
  })

  const targetHref = target.slug.startsWith('/posts/')
    ? target.slug
    : `/posts/${target.slug}`

  if (existingInternalLinkHref.has(targetHref)) {
    return { body: blocks, added: false, target: null }
  }

  const linkBlock = createInternalLinkBlock(target)
  if (!linkBlock) {
    return { body: blocks, added: false, target: null }
  }

  const newBody = [...blocks]
  const summaryIndex = newBody.findIndex(block =>
    block &&
    block._type === 'block' &&
    block.style === 'h2' &&
    extractBlockText(block).trim() === 'まとめ'
  )

  const disclaimerIndex = newBody.findIndex(block =>
    block &&
    block._type === 'block' &&
    extractBlockText(block).trim().startsWith('免責事項')
  )

  let insertIndex = summaryIndex !== -1 ? summaryIndex : disclaimerIndex
  if (insertIndex === -1) {
    insertIndex = newBody.length
  }

  while (insertIndex > 0) {
    const previousBlock = newBody[insertIndex - 1]
    if (
      previousBlock &&
      (hasAffiliateLink(previousBlock) ||
        (previousBlock._key && previousBlock._key.startsWith('affiliate-context-')))
    ) {
      insertIndex -= 1
      continue
    }
    break
  }

  newBody.splice(insertIndex, 0, linkBlock)

  return { body: newBody, added: true, target }
}

async function fetchInternalLinkCatalog() {
  const posts = await client.fetch(`
    *[_type == "post"] {
      "slug": slug.current,
      title,
      _updatedAt,
      "categories": categories[]->{ title }
    }
  `)

  return posts
    .filter(post => typeof post.slug === 'string' && post.slug)
    .map(post => ({
      slug: post.slug,
      title: post.title || '',
      categories: getNormalizedCategoryTitles(post.categories || []),
      slugSegments: extractSlugSegments(post.slug),
      titleKeywords: extractTitleKeywords(post.title),
      recency: post._updatedAt ? new Date(post._updatedAt).getTime() : 0
    }))
}

async function resolveReferenceUrl(url, cache) {
  if (!url) return null
  const normalized = ensureHttpsUrl(url)
  if (!normalized) return null

  if (cache.has(normalized)) {
    return cache.get(normalized)
  }

  const attemptFetch = async (targetUrl, method) => {
    try {
      const response = await fetch(targetUrl, { method, redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0' } })
      if (response.ok && response.status < 400) {
        return response.url || targetUrl
      }
    } catch (error) {
      return null
    }
    return null
  }

  let finalUrl = await attemptFetch(normalized, 'HEAD')
  if (!finalUrl) {
    finalUrl = await attemptFetch(normalized, 'GET')
  }

  cache.set(normalized, finalUrl)
  return finalUrl
}

/**
 * Bodyブロックから関連記事セクションや重複段落を除去する
 * - 「関連記事」「関連リンク」などのセクションを削除
 * - 内部リンクブロックは1つに制限
 * - 同一段落の重複を除去
 * - 連続リンクブロックを削除
 *
 * @param {Array} blocks
 * @returns {{body: Array, removedRelated: number, removedDuplicateParagraphs: number, removedInternalLinks: number}}
 */
function sanitizeBodyBlocks(blocks) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return {
      body: blocks,
      removedRelated: 0,
      removedDuplicateParagraphs: 0,
      removedInternalLinks: 0,
      removedForbiddenSections: 0,
      removedSummaryHelpers: 0,
      removedAffiliateCtas: 0,
      removedSummaryHeadings: 0,
      disclaimerAdded: 0
    }
  }

  const cleaned = []
  const seenParagraphs = new Set()
  let removedRelated = 0
  let removedDuplicates = 0
  let removedInternalLinks = 0
  let removedForbiddenSections = 0
  let removedSummaryHelpers = 0
  let removedAffiliateCtas = 0
  let removedSummaryHeadings = 0
  let skipForbiddenSection = false
  let internalLinkCount = 0
  let affiliateLinkCount = 0
  let previousWasLinkBlock = false
  let summaryHeadingSeen = false
  let hasDisclaimer = false
  let personaHeadingsFixed = 0
  for (const block of blocks) {
    if (!block || block._type !== 'block') {
      if (skipForbiddenSection) {
        continue
      }
      cleaned.push(block)
      previousWasLinkBlock = false
      continue
    }

    const text = extractBlockText(block)
    const normalizedText = text.replace(/\s+/g, ' ').trim()

    if (skipForbiddenSection) {
      if (block.style === 'h2') {
        skipForbiddenSection = false
      } else {
        continue
      }
    }

    // 「関連記事」見出しやテキストを削除
    const isRelatedHeading =
      (block.style === 'h2' || block.style === 'h3' || block.style === 'h4') &&
      /関連記事|関連リンク|関連記事集/.test(normalizedText)

    const isRelatedParagraph =
      /関連記事|関連リンク|こちらの記事/.test(normalizedText) &&
      (!block.listItem || block.listItem === 'bullet')

    if (isRelatedHeading || isRelatedParagraph) {
      removedRelated += 1
      previousWasLinkBlock = false
      continue
    }

    // リスト項目内の関連記事リンクを削除
    if (block.listItem && /関連記事|関連リンク/.test(normalizedText)) {
      removedRelated += 1
      previousWasLinkBlock = false
      continue
    }

    const affiliateMarkDefs = Array.isArray(block.markDefs)
      ? block.markDefs.filter(
          def =>
            def &&
            def._type === 'link' &&
            typeof def.href === 'string' &&
            AFFILIATE_HOST_KEYWORDS.some(keyword => def.href.includes(keyword))
        )
      : []

    if (
      affiliateMarkDefs.length === 0 &&
      CTA_TEXT_PATTERNS.some(pattern => normalizedText.includes(pattern))
    ) {
      removedAffiliateCtas += 1
      previousWasLinkBlock = false
      continue
    }

    if (affiliateMarkDefs.length > 0) {
      const affiliateKeys = new Set(affiliateMarkDefs.map(def => def._key))
      const nonAffiliateChildren = []
      const affiliateChildrenByKey = new Map()

      block.children.forEach(child => {
        const childMarks = Array.isArray(child?.marks) ? child.marks : []
        const childAffiliateMarks = childMarks.filter(mark => affiliateKeys.has(mark))

        if (childAffiliateMarks.length === 0) {
          if (child?.text?.trim()) {
            nonAffiliateChildren.push({
              ...child,
              marks: childMarks.filter(mark => !affiliateKeys.has(mark))
            })
          }
          return
        }

        childAffiliateMarks.forEach(markKey => {
          if (!affiliateChildrenByKey.has(markKey)) {
            affiliateChildrenByKey.set(markKey, [])
          }
          affiliateChildrenByKey.get(markKey).push({
            ...child,
            _key: `${child._key || `child-${Date.now()}`}-${markKey}`
          })
        })
      })

      if (nonAffiliateChildren.length > 0) {
        cleaned.push({
          ...block,
          _key: `${block._key || `block-${Date.now()}`}-cta-text`,
          children: nonAffiliateChildren,
          markDefs: Array.isArray(block.markDefs)
            ? block.markDefs.filter(def => !affiliateKeys.has(def._key))
            : []
        })
      }

      for (const markKey of affiliateChildrenByKey.keys()) {
        const spans = affiliateChildrenByKey.get(markKey)
        if (!spans || spans.length === 0) {
          continue
        }

        if (affiliateLinkCount >= 2) {
          removedAffiliateCtas += spans.length
          continue
        }

        const markDef = affiliateMarkDefs.find(def => def._key === markKey)
        if (!markDef) {
          continue
        }

        cleaned.push({
          _type: 'block',
          _key: `${block._key || `block-${Date.now()}`}-cta-link-${markKey}`,
          style: 'normal',
          children: spans,
          markDefs: [markDef]
        })

        affiliateLinkCount += 1
        previousWasLinkBlock = true
      }

      previousWasLinkBlock = true
      continue
    }

    // 「看護助手ができないこと（重要）」などの禁止セクションを削除
    if (
      block.style === 'h2' &&
      /看護助手ができないこと|禁止行為/.test(normalizedText)
    ) {
      removedForbiddenSections += 1
      skipForbiddenSection = true
      previousWasLinkBlock = false
      continue
    }

    // 「今日のポイント」というテキストは削除（リスト含む）
    if (/今日のポイント/.test(normalizedText)) {
      removedSummaryHelpers += 1
      previousWasLinkBlock = false
      continue
    }

    // 最終更新日行を削除
    if (/^最終更新日/.test(normalizedText)) {
      removedSummaryHelpers += 1
      previousWasLinkBlock = false
      continue
    }

    if (block.style === 'h2' && /まとめ/.test(normalizedText)) {
      if (!summaryHeadingSeen) {
        summaryHeadingSeen = true
        const sanitizedHeading = {
          ...block,
          children: [
            {
              _type: 'span',
              _key: block.children?.[0]?._key || `${block._key || 'block'}-summary`,
              text: 'まとめ',
              marks: []
            }
          ]
        }
        cleaned.push(sanitizedHeading)
      } else {
        removedSummaryHeadings += 1
      }
      previousWasLinkBlock = false
      continue
    }

    if (block.style === 'h2') {
      const personaResult = normalizePersonaInHeading(block)
      if (personaResult.changed) {
        block = personaResult.block
        personaHeadingsFixed += 1
      }
    }

    if (normalizedText.startsWith('免責事項')) {
      hasDisclaimer = true
    }

    const { isInternalLinkOnly, isInternalLink } = analyseLinkBlock(block)

    if (isInternalLink) {
      internalLinkCount += 1

      // 2つ目以降の内部リンク、または連続リンクは削除
      if (internalLinkCount > 1 || previousWasLinkBlock) {
        removedInternalLinks += 1
        previousWasLinkBlock = previousWasLinkBlock || isInternalLinkOnly
        continue
      }

      previousWasLinkBlock = isInternalLinkOnly
      cleaned.push(block)
      continue
    }

    previousWasLinkBlock = false

    // 重複段落の除外（40文字以上の段落のみ）
    if (normalizedText.length >= 40) {
      if (seenParagraphs.has(normalizedText)) {
        removedDuplicates += 1
        continue
      }
      seenParagraphs.add(normalizedText)
    }

    cleaned.push(block)
  }

  if (!hasDisclaimer) {
    cleaned.push({
      _type: 'block',
      _key: `disclaimer-${Date.now()}`,
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: `disclaimer-span-${Date.now()}`,
          text: DISCLAIMER_TEXT,
          marks: []
        }
      ]
    })
  }

  const bodyWithKeys = ensurePortableTextKeys(cleaned)

  return {
    body: bodyWithKeys,
    removedRelated,
    removedDuplicateParagraphs: removedDuplicates,
    removedInternalLinks,
    removedForbiddenSections,
    removedSummaryHelpers,
    removedAffiliateCtas,
    removedSummaryHeadings,
    disclaimerAdded: hasDisclaimer ? 0 : 1,
    personaHeadingsFixed
  }
}

async function normalizeReferenceLinks(blocks, articleTitle = '') {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return { body: blocks, fixed: 0, unresolved: [], removed: 0 }
  }

  const clonedBlocks = deepClone(blocks)
  let fixed = 0
  const unresolved = []
  const cache = new Map()
  let removedInvalid = 0

  const getLabelForMark = (block, markKey) => {
    if (!block || !Array.isArray(block.children)) return ''
    return block.children
      .filter(child => Array.isArray(child?.marks) && child.marks.includes(markKey))
      .map(child => child.text || '')
      .join('')
      .trim()
  }

  for (let i = 0; i < clonedBlocks.length; i += 1) {
    const block = clonedBlocks[i]
    if (!block || block._type !== 'block') continue
    const text = extractBlockText(block)
    const normalized = text.replace(/\s+/g, ' ').trim()
    if (!normalized.startsWith('参考')) continue
    if (!Array.isArray(block.markDefs) || block.markDefs.length === 0) continue

    const referenceMarks = block.markDefs.filter(def => def && def._type === 'link' && typeof def.href === 'string')
    if (referenceMarks.length === 0) continue

    let blockModified = false
    let hasValidLink = false

    for (const markDef of referenceMarks) {
      const currentUrl = ensureHttpsUrl(markDef.href)
      const label = getLabelForMark(block, markDef._key) || normalized.replace(/^参考[:：]?\s*/, '')
      const mapping = matchReferenceMapping(label)

      let targetUrl = ensureHttpsUrl((mapping && mapping.url) || currentUrl)

      if (!targetUrl) {
        unresolved.push({ articleTitle, label, url: currentUrl })
        continue
      }

      let resolvedUrl = await resolveReferenceUrl(targetUrl, cache)
      if (!resolvedUrl && mapping?.url) {
        resolvedUrl = ensureHttpsUrl(mapping.url)
      }

      if (resolvedUrl && isTopLevelUrl(resolvedUrl) && mapping?.url) {
        resolvedUrl = ensureHttpsUrl(mapping.url)
      }

      if (!resolvedUrl || isTopLevelUrl(resolvedUrl)) {
        unresolved.push({ articleTitle, label, url: currentUrl })
        block.markDefs = block.markDefs.filter(def => def._key !== markDef._key)
        block.children = block.children.map(child => {
          if (!child || !Array.isArray(child.marks)) {
            return child
          }
          return {
            ...child,
            marks: child.marks.filter(markKey => markKey !== markDef._key)
          }
        })
        blockModified = true
        continue
      }

      hasValidLink = true
      if (resolvedUrl !== markDef.href) {
        markDef.href = resolvedUrl
        fixed += 1
        blockModified = true
      }
    }

    const uniqueDefs = []
    const seenKeys = new Set()
    block.markDefs.forEach(def => {
      if (!def || !def._key || seenKeys.has(def._key)) return
      seenKeys.add(def._key)
      uniqueDefs.push(def)
    })
    block.markDefs = uniqueDefs

    if (!hasValidLink) {
      clonedBlocks[i] = null
      removedInvalid += 1
    }
  }

  const filteredBlocks = clonedBlocks.filter(Boolean)

  return {
    body: filteredBlocks,
    fixed,
    unresolved,
    removed: removedInvalid
  }
}

function expandShortContent(blocks, title) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return { body: blocks, expanded: false }
  }

  let plain = blocksToPlainText(blocks)
  if (plain.length >= 2000) {
    return { body: blocks, expanded: false }
  }

  const hasPrimaryExpansion = blocks.some(
    block => block?._key && block._key.startsWith('auto-expansion-') && !block._key.startsWith('auto-expansion-extra-')
  )
  const hasExtraExpansion = blocks.some(
    block => block?._key && block._key.startsWith('auto-expansion-extra-')
  )

  const timestampBase = Date.now()
  const primaryTemplates = [
    index => [
      {
        _type: 'block',
        _key: `auto-expansion-${timestampBase}-${index}-h3`,
        style: 'h3',
        children: [{ _type: 'span', _key: `auto-expansion-${timestampBase}-${index}-h3-span`, text: '現場で意識したい追加の視点', marks: [] }],
        markDefs: []
      },
      {
        _type: 'block',
        _key: `auto-expansion-${timestampBase}-${index}-p1`,
        style: 'normal',
        children: [{ _type: 'span', _key: `auto-expansion-${timestampBase}-${index}-p1-span`, text: '看護助手として毎日を過ごすと、同じ業務が続いているように感じる場面もありますが、患者さんの変化やチームの状況は日々わずかに異なります。こまめに観察ポイントを記録し、後輩や看護師と共有するだけでも「気づきの循環」が生まれ、職場全体の安心感につながります。', marks: [] }],
        markDefs: []
      },
      {
        _type: 'block',
        _key: `auto-expansion-${timestampBase}-${index}-list1`,
        style: 'normal',
        listItem: 'bullet',
        level: 1,
        children: [{ _type: 'span', _key: `auto-expansion-${timestampBase}-${index}-list1-span`, text: '申し送り前に「患者さんの様子・動線・物品」の3点を再確認する', marks: [] }],
        markDefs: []
      },
      {
        _type: 'block',
        _key: `auto-expansion-${timestampBase}-${index}-list2`,
        style: 'normal',
        listItem: 'bullet',
        level: 1,
        children: [{ _type: 'span', _key: `auto-expansion-${timestampBase}-${index}-list2-span`, text: '忙しい時間帯ほど声かけを一言添えて、患者さんの安心感を維持する', marks: [] }],
        markDefs: []
      },
      {
        _type: 'block',
        _key: `auto-expansion-${timestampBase}-${index}-p2`,
        style: 'normal',
        children: [{ _type: 'span', _key: `auto-expansion-${timestampBase}-${index}-p2-span`, text: 'また、体力面への不安があるときは休憩の過ごし方を見直すのも大切です。短時間でもストレッチや水分補給を意識し、翌日の疲れを持ち越さない工夫を取り入れるだけで、患者さんへの対応にも余裕が生まれます。小さな工夫を積み重ねていけば、記事全体の内容もさらに実践的になりますよ。', marks: [] }],
        markDefs: []
      }
    ],
    index => [
      {
        _type: 'block',
        _key: `auto-expansion-${timestampBase}-${index}-h3b`,
        style: 'h3',
        children: [{ _type: 'span', _key: `auto-expansion-${timestampBase}-${index}-h3b-span`, text: 'セラが大切にしているフォローの工夫', marks: [] }],
        markDefs: []
      },
      {
        _type: 'block',
        _key: `auto-expansion-${timestampBase}-${index}-p3`,
        style: 'normal',
        children: [{ _type: 'span', _key: `auto-expansion-${timestampBase}-${index}-p3-span`, text: '忙しいシフトの中で患者さんや家族へ安心を届けるには、声のトーンやスピードを意識することも効果的です。「ゆっくり・落ち着いて・見守っていますよ」というサインを出すだけで、患者さんの表情が柔らかくなることがあります。', marks: [] }],
        markDefs: []
      },
      {
        _type: 'block',
        _key: `auto-expansion-${timestampBase}-${index}-list3`,
        style: 'normal',
        listItem: 'bullet',
        level: 1,
        children: [{ _type: 'span', _key: `auto-expansion-${timestampBase}-${index}-list3-span`, text: 'ナースコール対応後に短い振り返りをチームと共有し、次へ活かす', marks: [] }],
        markDefs: []
      },
      {
        _type: 'block',
        _key: `auto-expansion-${timestampBase}-${index}-list4`,
        style: 'normal',
        listItem: 'bullet',
        level: 1,
        children: [{ _type: 'span', _key: `auto-expansion-${timestampBase}-${index}-list4-span`, text: 'できたこと・うまくいかなかったことを素直にメモして振り返る', marks: [] }],
        markDefs: []
      },
      {
        _type: 'block',
        _key: `auto-expansion-${timestampBase}-${index}-p4`,
        style: 'normal',
        children: [{ _type: 'span', _key: `auto-expansion-${timestampBase}-${index}-p4-span`, text: '「完璧にやらなければ」と抱え込むより、チームで一緒に改善していく姿勢を大切にすると心も軽くなります。小さな成功を認め合い、「今日はここがスムーズだったね」と声を掛け合える空気をつくるのも、看護助手ができる立派な貢献です。', marks: [] }],
        markDefs: []
      }
    ],
    index => [
      {
        _type: 'block',
        _key: `auto-expansion-${timestampBase}-${index}-h3c`,
        style: 'h3',
        children: [{ _type: 'span', _key: `auto-expansion-${timestampBase}-${index}-h3c-span`, text: '学びを深めるためのセルフチェック', marks: [] }],
        markDefs: []
      },
      {
        _type: 'block',
        _key: `auto-expansion-${timestampBase}-${index}-p5`,
        style: 'normal',
        children: [{ _type: 'span', _key: `auto-expansion-${timestampBase}-${index}-p5-span`, text: '記事で紹介したポイントを振り返り、実際の勤務で活用するためのセルフチェックシートをつくるのもおすすめです。1週間ごとに「できたこと」「次に試したいこと」を書き出すだけでも、成長を可視化できます。', marks: [] }],
        markDefs: []
      },
      {
        _type: 'block',
        _key: `auto-expansion-${timestampBase}-${index}-list5`,
        style: 'normal',
        listItem: 'bullet',
        level: 1,
        children: [{ _type: 'span', _key: `auto-expansion-${timestampBase}-${index}-list5-span`, text: '1週間のうちで印象に残った患者さんとの関わりを振り返る', marks: [] }],
        markDefs: []
      },
      {
        _type: 'block',
        _key: `auto-expansion-${timestampBase}-${index}-list6`,
        style: 'normal',
        listItem: 'bullet',
        level: 1,
        children: [{ _type: 'span', _key: `auto-expansion-${timestampBase}-${index}-list6-span`, text: '自分が安心できたサポート例をチームで共有し、取り組みを増やす', marks: [] }],
        markDefs: []
      },
      {
        _type: 'block',
        _key: `auto-expansion-${timestampBase}-${index}-p6`,
        style: 'normal',
        children: [{ _type: 'span', _key: `auto-expansion-${timestampBase}-${index}-p6-span`, text: '「完璧さ」より「継続できる工夫」を意識して、患者さんと自分自身が心地よく過ごせるリズムを整えていきましょう。焦らず取り組む姿勢こそが、看護助手としての信頼とセラ感を育ててくれます。', marks: [] }],
        markDefs: []
      }
    ]
  ]

  const extraTemplates = [
    index => [
      {
        _type: 'block',
        _key: `auto-expansion-extra-${timestampBase}-${index}-h3`,
        style: 'h3',
        children: [{ _type: 'span', _key: `auto-expansion-extra-${timestampBase}-${index}-h3-span`, text: 'さらに安心感を高めるフォロー例', marks: [] }],
        markDefs: []
      },
      {
        _type: 'block',
        _key: `auto-expansion-extra-${timestampBase}-${index}-p1`,
        style: 'normal',
        children: [{ _type: 'span', _key: `auto-expansion-extra-${timestampBase}-${index}-p1-span`, text: 'セクションで紹介した内容に加えて、勤務後の振り返りノートを活用すると自分の成長や癖が見えてきます。たとえば「今日は患者さんの不安をどう受け止められたか」「次はどんな声かけを試したいか」を箇条書きで記録するだけでも、翌日のアクションが明確になります。', marks: [] }],
        markDefs: []
      },
      {
        _type: 'block',
        _key: `auto-expansion-extra-${timestampBase}-${index}-list1`,
        style: 'normal',
        listItem: 'bullet',
        level: 1,
        children: [{ _type: 'span', _key: `auto-expansion-extra-${timestampBase}-${index}-list1-span`, text: '勤務の前後で「今日意識したいこと」「できたこと」をそれぞれ3つ書き出す', marks: [] }],
        markDefs: []
      },
      {
        _type: 'block',
        _key: `auto-expansion-extra-${timestampBase}-${index}-list2`,
        style: 'normal',
        listItem: 'bullet',
        level: 1,
        children: [{ _type: 'span', _key: `auto-expansion-extra-${timestampBase}-${index}-list2-span`, text: '患者さんからの感謝や対応の工夫を小さく共有し、チーム全体で活用する', marks: [] }],
        markDefs: []
      },
      {
        _type: 'block',
        _key: `auto-expansion-extra-${timestampBase}-${index}-p2`,
        style: 'normal',
        children: [{ _type: 'span', _key: `auto-expansion-extra-${timestampBase}-${index}-p2-span`, text: 'こうした積み重ねは数値化しにくいものの、患者さんや同僚が安心して頼れる雰囲気づくりに直結します。忙しい日も、振り返りの2〜3分を確保することが自分の余裕にもつながるので、無理のない範囲で取り入れてみてくださいね。', marks: [] }],
        markDefs: []
      }
    ],
    index => [
      {
        _type: 'block',
        _key: `auto-expansion-extra-${timestampBase}-${index}-h3b`,
        style: 'h3',
        children: [{ _type: 'span', _key: `auto-expansion-extra-${timestampBase}-${index}-h3b-span`, text: '現場で役立つミニケーススタディ', marks: [] }],
        markDefs: []
      },
      {
        _type: 'block',
        _key: `auto-expansion-extra-${timestampBase}-${index}-p3`,
        style: 'normal',
        children: [{ _type: 'span', _key: `auto-expansion-extra-${timestampBase}-${index}-p3-span`, text: 'たとえば「夜勤帯で患者さんの不眠が続いた」ケースでは、環境調整と声かけのタイミングが重要になります。照明を一段落とし、声のトーンを落として状況を尋ねるだけでも緊張が和らぐことがあります。状況を看護師へ共有する際は、「いつ」「どんな状態だったか」を短くまとめ、必要時に医師へ相談できるよう準備しましょう。', marks: [] }],
        markDefs: []
      },
      {
        _type: 'block',
        _key: `auto-expansion-extra-${timestampBase}-${index}-list3`,
        style: 'normal',
        listItem: 'bullet',
        level: 1,
        children: [{ _type: 'span', _key: `auto-expansion-extra-${timestampBase}-${index}-list3-span`, text: '落ち着いた声で状況を確認し、患者さんの不安に寄り添う', marks: [] }],
        markDefs: []
      },
      {
        _type: 'block',
        _key: `auto-expansion-extra-${timestampBase}-${index}-list4`,
        style: 'normal',
        listItem: 'bullet',
        level: 1,
        children: [{ _type: 'span', _key: `auto-expansion-extra-${timestampBase}-${index}-list4-span`, text: '必要な情報（時間帯・症状・対応内容）を簡潔に整理して申し送る', marks: [] }],
        markDefs: []
      },
      {
        _type: 'block',
        _key: `auto-expansion-extra-${timestampBase}-${index}-p4`,
        style: 'normal',
        children: [{ _type: 'span', _key: `auto-expansion-extra-${timestampBase}-${index}-p4-span`, text: 'どの職場でも共有の質が高まるほど、安心して引き継ぎを受け取れるようになります。セラも新人時代は実例を先輩から教わりながら、少しずつ引き継ぎメモの品質を上げてきました。迷ったら一人で抱え込まず、チームの経験を頼って大丈夫ですよ。', marks: [] }],
        markDefs: []
      }
    ]
  ]

  const additions = []
  let expanded = false
  let currentBody = [...blocks]

  if (!hasPrimaryExpansion) {
    for (let i = 0; i < primaryTemplates.length; i += 1) {
      additions.push(...primaryTemplates[i](i))
      currentBody = [...blocks, ...additions]
      plain = blocksToPlainText(currentBody)
      expanded = true
      if (plain.length >= 2000) {
        break
      }
    }
  } else if (plain.length < 2000 && !hasExtraExpansion) {
    for (let i = 0; i < extraTemplates.length; i += 1) {
      additions.push(...extraTemplates[i](i))
      currentBody = [...blocks, ...additions]
      plain = blocksToPlainText(currentBody)
      expanded = true
      if (plain.length >= 2000) {
        break
      }
    }
  }

  if (!expanded) {
    return { body: blocks, expanded: false }
  }

  return { body: currentBody, expanded: true }
}

async function getCategoryResources() {
  try {
    let categories = await client.fetch(`*[_type == "category"] { _id, title, description }`)
    categories = await syncCategoryDefinitions(categories)
    const map = new Map()

    categories.forEach(category => {
      if (category?._id && category?.title) {
        const normalized = normalizeCategoryTitle(category.title)
        map.set(normalized, category._id)
      }
    })

    const fallbackTitle = '業務範囲（療養生活上の世話）'
    const fallback =
      categories.find(category => normalizeCategoryTitle(category.title) === fallbackTitle) ||
      categories[0] ||
      null

    return {
      categories,
      map,
      fallback,
    }
  } catch (error) {
    console.error('❌ カテゴリ取得エラー:', error.message)
    return { categories: [], map: new Map(), fallback: null }
  }
}

async function syncCategoryDefinitions(categories = []) {
  if (!Array.isArray(categories) || categories.length === 0) {
    return []
  }

  const synced = []
  const seenTitles = new Set()

  for (const category of categories) {
    if (!category?._id) {
      continue
    }

    const canonicalTitle = normalizeCategoryTitle(category.title || '') || (category.title || '')
    const desiredDescription = CATEGORY_DESCRIPTIONS[canonicalTitle] || category.description || ''

    const patch = {}
    if (canonicalTitle && canonicalTitle !== category.title) {
      patch.title = canonicalTitle
    }
    if (desiredDescription && desiredDescription !== (category.description || '')) {
      patch.description = desiredDescription
    }

    if (Object.keys(patch).length > 0) {
      console.log(`  ✏️  カテゴリ同期: ${category.title || '(untitled)'} → ${patch.title || canonicalTitle}`)
      await client.patch(category._id).set(patch).commit()
      synced.push({
        ...category,
        ...patch,
        title: patch.title || canonicalTitle,
        description: patch.description || desiredDescription
      })
    } else {
      synced.push({
        ...category,
        title: canonicalTitle,
        description: desiredDescription
      })
    }

    if (canonicalTitle) {
      seenTitles.add(canonicalTitle)
    }
  }

  const missing = CANONICAL_CATEGORY_TITLES.filter(title => !seenTitles.has(title))
  if (missing.length > 0) {
    console.warn(`  ⚠️  Sanityに存在しないカテゴリ: ${missing.join(', ')}`)
  }

  return synced
}

function sanitiseSlugValue(slug) {
  return (slug || '')
    .toLowerCase()
    .replace(/[^a-z-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

const SLUG_VARIANT_WORDS = [
  'insights',
  'journey',
  'support',
  'compass',
  'focus',
  'pathway',
  'practice',
  'navigator',
  'plan',
  'toolbox',
  'approach',
  'ideas'
]

async function ensureUniqueSlug(candidate, excludeId) {
  let base = sanitiseSlugValue(candidate)
  if (!base) {
    base = generateSlugFromTitle('看護助手-article')
  }

  if (!base.startsWith('nursing-assistant-')) {
    base = `nursing-assistant-${base.replace(/^nursing-assistant-?/, '')}`
  }

  let baseSegments = base.replace(/^nursing-assistant-/, '').split('-').filter(Boolean)
  if (baseSegments.length === 0) {
    baseSegments = ['care', 'guide']
  } else if (baseSegments.length === 1) {
    baseSegments.push('guide')
  } else if (baseSegments.length > 3) {
    baseSegments = baseSegments.slice(0, 3)
  }

  baseSegments = baseSegments.map(seg => seg.replace(/[^a-z]/g, '')).filter(Boolean)
  if (baseSegments.length < 2) {
    baseSegments = ['care', 'guide']
  }

  let attempt = 0

  for (;;) {
    let segments = [...baseSegments]

    if (attempt > 0) {
      const variantIndex = (attempt - 1) % SLUG_VARIANT_WORDS.length
      const cycle = Math.floor((attempt - 1) / SLUG_VARIANT_WORDS.length)
      let variantWord = SLUG_VARIANT_WORDS[variantIndex]
      if (cycle > 0) {
        const suffixChar = String.fromCharCode(97 + ((cycle - 1) % 26))
        variantWord = `${variantWord}${suffixChar}`
      }

      if (segments.length === 3) {
        segments[segments.length - 1] = variantWord
      } else {
        segments.push(variantWord)
      }
    }

    if (segments.length > 3) {
      segments = segments.slice(0, 3)
    }

    const slug = `nursing-assistant-${segments.join('-')}`

    // eslint-disable-next-line no-await-in-loop
    const existing = await client.fetch(
      `*[_type == "post" && slug.current == $slug && _id != $id][0] { _id }`,
      { slug, id: excludeId }
    )

    if (!existing) {
      return slug
    }

    attempt += 1
  }
}

async function removeDuplicatePosts(apply = false) {
  const query = `*[_type == "post"] {
    _id,
    title,
    "slug": slug.current,
    _createdAt,
    _updatedAt
  }`

  try {
    const posts = await client.fetch(query)
    const duplicateGroups = []
    const deletions = new Map()

    const collectDuplicates = (keyFn, type) => {
      const map = new Map()

      posts.forEach(post => {
        const key = keyFn(post)
        if (!key) return
        if (!map.has(key)) {
          map.set(key, [])
        }
        map.get(key)?.push(post)
      })

      map.forEach((group, key) => {
          if (!group || group.length < 2) return
          const sorted = group.sort((a, b) => getRecencyScore(b) - getRecencyScore(a))
          const keeper = sorted[0]
          const removed = sorted.slice(1)

          removed.forEach(post => {
            if (!deletions.has(post._id)) {
              deletions.set(post._id, { post, reason: `${type}:${key}`, keep: keeper })
            }
          })

          duplicateGroups.push({
            type,
            key,
            keep: keeper,
            remove: removed,
          })
      })
    }

    collectDuplicates(post => post.slug?.toLowerCase(), 'slug')
    collectDuplicates(post => normalizeTitle(post.title), 'title')

    if (duplicateGroups.length === 0) {
      console.log('\n✅ 重複するタイトル/Slugは見つかりませんでした。\n')
      return { duplicateGroups, deletions: [] }
    }

    console.log(`\n⚠️ 重複記事を検出: ${duplicateGroups.length}グループ / 削除候補 ${deletions.size}件\n`)

    duplicateGroups.forEach((group, index) => {
      console.log(`${index + 1}. 重複タイプ: ${group.type} (${group.key})`)
      console.log(`   残す記事: ${group.keep.title} (${group.keep._id})`)
      if (group.remove.length > 0) {
        group.remove.forEach(post => {
          console.log(`   削除候補: ${post.title} (${post._id}) 更新: ${post._updatedAt || 'N/A'}`)
        })
      }
      console.log('')
    })

    if (!apply) {
      console.log('ℹ️  削除を実行するには --apply オプションを付けて再実行してください。')
      return { duplicateGroups, deletions: Array.from(deletions.values()) }
    }

    console.log('\n🗑️  重複記事の削除を実行します...\n')
    for (const { post, reason, keep } of deletions.values()) {
      try {
        await client.delete(post._id)
        console.log(`✅ Deleted: ${post.title} (${post._id}) [${reason}] -> kept ${keep._id}`)
      } catch (error) {
        console.error(`❌ 削除失敗: ${post._id} (${reason}) - ${error.message}`)
      }
    }

    console.log('\n🎉 重複記事の処理が完了しました。\n')
    return { duplicateGroups, deletions: Array.from(deletions.values()) }
  } catch (error) {
    console.error('❌ 重複チェック中にエラーが発生しました:', error.message)
    return { duplicateGroups: [], deletions: [] }
  }
}

/**
 * 古い記事を検出（6ヶ月以上更新なし）
 */
async function findOldPosts(months = 6) {
  const monthsAgo = new Date()
  monthsAgo.setMonth(monthsAgo.getMonth() - months)
  const cutoffDate = monthsAgo.toISOString()

  const query = `*[_type == "post"
    && _updatedAt < $cutoffDate
  ] | order(_updatedAt asc) {
    _id,
    title,
    "slug": slug.current,
    _createdAt,
    _updatedAt,
    publishedAt,
    "categories": categories[]->title
  }`

  try {
    const posts = await client.fetch(query, { cutoffDate })

    console.log(`\n📅 ${months}ヶ月以上更新されていない記事: ${posts.length}件\n`)

    if (posts.length > 0) {
      posts.slice(0, 10).forEach((post, i) => {
        const lastUpdate = new Date(post._updatedAt)
        const daysSince = Math.floor((Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24))

        console.log(`${i + 1}. ${post.title}`)
        console.log(`   ID: ${post._id}`)
        console.log(`   最終更新: ${daysSince}日前 (${lastUpdate.toLocaleDateString('ja-JP')})`)
        console.log(`   カテゴリ: ${post.categories?.join(', ') || 'なし'}`)
        console.log(`   URL: /posts/${post.slug}\n`)
      })

      if (posts.length > 10) {
        console.log(`   ... 他${posts.length - 10}件\n`)
      }
    }

    return posts
  } catch (error) {
    console.error('❌ エラー:', error.message)
    return []
  }
}

/**
 * 必須フィールドとメタデータの包括的チェック
 * Slug、Categories、Tags、Excerpt、Meta Descriptionを検証
 */
async function findPostsMissingMetadata() {
  const query = `*[_type == "post"] {
    _id,
    title,
    slug,
    excerpt,
    metaDescription,
    tags,
    "categories": categories[]->title
  }`

  try {
    const posts = await client.fetch(query)

    const issues = {
      noSlug: [],
      noCategories: [],
      noTags: [],
      noExcerpt: [],
      noMetaDescription: [],
      excerptTooShort: [],
      metaDescriptionTooShort: [],
      metaDescriptionTooLong: []
    }

    posts.forEach(post => {
      // Slug チェック
      if (!post.slug || !post.slug.current) {
        issues.noSlug.push(post)
      }

      // Categories チェック
      if (!post.categories || post.categories.length === 0) {
        issues.noCategories.push(post)
      }

      // Tags チェック
      if (!post.tags || post.tags.length === 0) {
        issues.noTags.push(post)
      }

      // Excerpt チェック
      if (!post.excerpt) {
        issues.noExcerpt.push(post)
      } else if (post.excerpt.length < 50) {
        issues.excerptTooShort.push({ ...post, excerptLength: post.excerpt.length })
      }

      // Meta Description チェック（SEO）
      // 100-180文字を目安（ユーザビリティやSEO優先）
      if (!post.metaDescription) {
        issues.noMetaDescription.push(post)
      } else {
        const length = post.metaDescription.length
        if (length < 100) {
          issues.metaDescriptionTooShort.push({ ...post, metaLength: length })
        } else if (length > 180) {
          issues.metaDescriptionTooLong.push({ ...post, metaLength: length })
        }
      }
    })

    console.log('\n📋 必須フィールド・メタデータチェック:\n')
    console.log('【必須フィールド】')
    console.log(`  🔴 Slug なし: ${issues.noSlug.length}件`)
    console.log(`  🔴 Categories なし: ${issues.noCategories.length}件`)
    console.log(`  ⚠️  Tags なし: ${issues.noTags.length}件`)
    console.log(`  ⚠️  Excerpt なし: ${issues.noExcerpt.length}件`)
    console.log(`  ⚠️  Excerpt 短すぎ (<50文字): ${issues.excerptTooShort.length}件`)

    console.log('\n【SEO（Meta Description）】')
    console.log(`  🔴 Meta Description なし: ${issues.noMetaDescription.length}件`)
    console.log(`  ⚠️  Meta Description 短すぎ (<100文字): ${issues.metaDescriptionTooShort.length}件`)
    console.log(`  ⚠️  Meta Description 長すぎ (>180文字): ${issues.metaDescriptionTooLong.length}件`)

    const criticalIssues = new Set([
      ...issues.noSlug.map(p => p._id),
      ...issues.noCategories.map(p => p._id),
      ...issues.noMetaDescription.map(p => p._id)
    ]).size

    const totalIssues = new Set([
      ...issues.noSlug.map(p => p._id),
      ...issues.noCategories.map(p => p._id),
      ...issues.noTags.map(p => p._id),
      ...issues.noExcerpt.map(p => p._id),
      ...issues.noMetaDescription.map(p => p._id),
      ...issues.excerptTooShort.map(p => p._id),
      ...issues.metaDescriptionTooShort.map(p => p._id),
      ...issues.metaDescriptionTooLong.map(p => p._id)
    ]).size

    console.log(`\n  🔴 重大な問題: ${criticalIssues}件（Slug、Categories、Meta Description欠損）`)
    console.log(`  📊 合計: ${totalIssues}件の記事に何らかの不足\n`)

    // 最も問題が多い記事TOP10を表示
    const postIssueCount = {}
    posts.forEach(post => {
      let count = 0
      const problems = []

      if (!post.slug || !post.slug.current) { count++; problems.push('Slug') }
      if (!post.categories || post.categories.length === 0) { count++; problems.push('Categories') }
      if (!post.tags || post.tags.length === 0) { count++; problems.push('Tags') }
      if (!post.excerpt) { count++; problems.push('Excerpt') }
      else if (post.excerpt.length < 50) { count++; problems.push('Excerpt短') }
      if (!post.metaDescription) { count++; problems.push('MetaDesc') }
      else {
        const length = post.metaDescription.length
        if (length < 100) { count++; problems.push('MetaDesc短') }
        else if (length > 180) { count++; problems.push('MetaDesc長') }
      }

      if (count > 0) {
        postIssueCount[post._id] = { post, count, problems }
      }
    })

    const sorted = Object.values(postIssueCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    if (sorted.length > 0) {
      console.log('🎯 優先対応が必要な記事（TOP10）:\n')
      sorted.forEach((item, i) => {
        const { post, count, problems } = item

        console.log(`${i + 1}. ${post.title}`)
        console.log(`   ID: ${post._id}`)
        console.log(`   不足項目(${count}): ${problems.join(', ')}`)
        console.log(`   URL: /posts/${post.slug?.current || 'N/A'}\n`)
      })
    }

    return issues
  } catch (error) {
    console.error('❌ エラー:', error.message)
    return null
  }
}

async function recategorizeAllPosts() {
  console.log('\n🔄 全記事のカテゴリ再評価を開始します\n')

  const { categories, fallback } = await getCategoryResources()

  const rawPosts = await client.fetch(`
    *[_type == "post" && (${PUBLIC_POST_FILTER})] {
      _id,
      title,
      body,
      "categories": categories[]->{ _id, title },
      internalOnly
    }
  `)

  const posts = filterOutInternalPosts(rawPosts)

  if (!posts || posts.length === 0) {
    console.log('✅ 記事が見つかりません')
    return { total: 0, updated: 0, assignedToFallback: 0 }
  }

  console.log(`対象記事: ${posts.length}件\n`)

  let updated = 0
  let assignedToFallback = 0
  let unchanged = 0

  for (const post of posts) {
    const publishedId = post._id.startsWith('drafts.') ? post._id.replace(/^drafts\./, '') : post._id
    const currentCategories = Array.isArray(post.categories) ? post.categories.filter(Boolean) : []

    // 本文からテキスト抽出
    const plainText = blocksToPlainText(post.body)

    // 最適なカテゴリを選択
    let bestCategory = selectBestCategory(post.title, plainText, categories)

    if (!bestCategory && fallback) {
      bestCategory = fallback
      assignedToFallback++
    }

    if (!bestCategory) {
      console.log(`⚠️ ${post.title}`)
      console.log(`   カテゴリを自動選択できませんでした\n`)
      continue
    }

    // 現在のカテゴリと比較
    const currentCategoryId = currentCategories.length > 0 ? currentCategories[0]._id : null
    const currentCategoryTitle = currentCategories.length > 0 ? currentCategories[0].title : 'なし'

    if (currentCategoryId === bestCategory._id) {
      unchanged++
      continue
    }

    // カテゴリを更新
    const categoryRefs = ensureReferenceKeys([{ _type: 'reference', _ref: bestCategory._id }])

    await client
      .patch(post._id)
      .set({ categories: categoryRefs })
      .commit()

    if (post._id !== publishedId) {
      await client
        .patch(publishedId)
        .set({ categories: categoryRefs })
        .commit()
        .catch(() => null)
    }

    updated++
    console.log(`✅ ${post.title}`)
    console.log(`   カテゴリ変更: ${currentCategoryTitle} → ${bestCategory.title}\n`)
  }

  console.log(`\n🔄 カテゴリ再評価完了: ${updated}件を更新、${unchanged}件は変更なし、フォールバック適用: ${assignedToFallback}件（合計: ${posts.length}件）\n`)

  return { total: posts.length, updated, unchanged, assignedToFallback }
}

async function autoFixMetadata() {
  console.log('\n🛠️ メタデータ自動修復を開始します\n')

  // Gemini APIモデルのインスタンス化（H3セクション・まとめ最適化用）
  let geminiModel = null
  const enableGemini =
    process.env.MAINTENANCE_ENABLE_GEMINI === '1' ||
    process.env.MAINTENANCE_ENABLE_GEMINI?.toLowerCase() === 'true'

  const geminiApiKey = enableGemini ? process.env.GEMINI_API_KEY : null
  if (geminiApiKey) {
    const genAI = new GoogleGenerativeAI(geminiApiKey)
    geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite-001' })
    console.log('✅ Gemini API使用可能（H3セクション・まとめ最適化）')
  } else if (enableGemini) {
    console.log('⚠️  MAINTENANCE_ENABLE_GEMINI=1ですが GEMINI_API_KEY が未設定です（簡易版を使用）')
  } else {
    console.log('ℹ️  Gemini API は無効化されています（MAINTENANCE_ENABLE_GEMINI を設定すると有効化できます）')
  }

  // アフィリエイト・出典リンクの強制再配置フラグ
  const forceLinkMaintenance =
    process.env.MAINTENANCE_FORCE_LINKS === '1' ||
    process.env.MAINTENANCE_FORCE_LINKS?.toLowerCase() === 'true'

  if (forceLinkMaintenance) {
    console.log('🔁 アフィリエイト・出典リンクの再配置を強制モードで実行します')
  }

  const { categories, fallback } = await getCategoryResources()

  const rawPosts = await client.fetch(`
    *[_type == "post" && (${PUBLIC_POST_FILTER}) && (
      !defined(slug.current) ||
      count(categories) == 0 ||
      !defined(excerpt) ||
      length(excerpt) < 50 ||
      !defined(metaDescription) ||
      length(metaDescription) < 100 ||
      length(metaDescription) > 180
    )] {
      _id,
      title,
      slug,
      excerpt,
      metaDescription,
      body,
      "categories": categories[]->{ _id, title },
      internalOnly
    }
  `)

  const posts = filterOutInternalPosts(rawPosts)

  if (!posts || posts.length === 0) {
    console.log('✅ 修復対象の記事はありません')
    return { total: 0, updated: 0 }
  }

  console.log(`対象記事: ${posts.length}件\n`)

  const internalLinkCatalog = await fetchInternalLinkCatalog()
  const internalLinkHrefSet = new Set(
    internalLinkCatalog.map(item =>
      item.slug.startsWith('/posts/') ? item.slug : `/posts/${item.slug}`
    )
  )

  let updated = 0
  let sourceLinkDetails = null
  let affiliateLinksAdded = false

  for (const post of posts) {
    const updates = {}
    const publishedId = post._id.startsWith('drafts.') ? post._id.replace(/^drafts\./, '') : post._id
    const currentCategories = Array.isArray(post.categories) ? post.categories.filter(Boolean) : []
  let categoryRefs = ensureReferenceKeys(
    currentCategories
      .filter(category => category?._id)
      .map(category => ({ _type: 'reference', _ref: category._id }))
  )

    // 各記事の処理ごとに変数をリセット
    sourceLinkDetails = null
    affiliateLinksAdded = false
    let shouldInsertComparisonLink = false

    // カテゴリが空の場合、本文から最適なカテゴリを自動選択
    if (categoryRefs.length === 0) {
      const plainText = blocksToPlainText(post.body)
      const bestCategory = selectBestCategory(post.title, plainText, categories)
      if (bestCategory) {
        categoryRefs = ensureReferenceKeys([{ _type: 'reference', _ref: bestCategory._id }])
      } else if (fallback) {
        categoryRefs = ensureReferenceKeys([{ _type: 'reference', _ref: fallback._id }])
      }
    }

    // 記事冒頭の不要な挨拶文を削除
    let greetingsRemoved = false
    if (post.body && Array.isArray(post.body)) {
      const cleanedBody = removeGreetings(post.body)
      if (JSON.stringify(cleanedBody) !== JSON.stringify(post.body)) {
        updates.body = cleanedBody
        greetingsRemoved = true
      }
    }

    // 記事末尾の締めくくり文を削除
    let closingRemarksRemoved = false
    if (post.body && Array.isArray(post.body)) {
      const bodyWithoutClosing = removeClosingRemarks(updates.body || post.body)
      if (JSON.stringify(bodyWithoutClosing) !== JSON.stringify(updates.body || post.body)) {
        updates.body = bodyWithoutClosing
        closingRemarksRemoved = true
      }
    }

    // プレースホルダーリンクを削除
    let placeholdersRemoved = false
    if (post.body && Array.isArray(post.body)) {
      const bodyWithoutPlaceholders = removePlaceholderLinks(updates.body || post.body)
      if (JSON.stringify(bodyWithoutPlaceholders) !== JSON.stringify(updates.body || post.body)) {
        updates.body = bodyWithoutPlaceholders
        placeholdersRemoved = true
      }
    }

    // アフィリエイトリンクを独立した段落として分離
    let affiliateLinksSeparated = false
    if (post.body && Array.isArray(post.body)) {
      const bodyWithSeparatedLinks = separateAffiliateLinks(updates.body || post.body)
      if (JSON.stringify(bodyWithSeparatedLinks) !== JSON.stringify(updates.body || post.body)) {
        updates.body = bodyWithSeparatedLinks
        affiliateLinksSeparated = true
      }
    }

    // 記事冒頭の #〇〇 で始まる一行を削除
    let hashtagLinesRemoved = false
    if (post.body && Array.isArray(post.body)) {
      const bodyWithoutHashtags = removeHashtagLines(updates.body || post.body)
      if (JSON.stringify(bodyWithoutHashtags) !== JSON.stringify(updates.body || post.body)) {
        updates.body = bodyWithoutHashtags
        hashtagLinesRemoved = true
      }
    }

    // H3タイトルのみで本文がないセクションに本文を追加（Gemini API使用）
    let emptyH3SectionsFixed = false
    if (post.body && Array.isArray(post.body)) {
      const bodyWithH3Bodies = await addBodyToEmptyH3Sections(updates.body || post.body, post.title, geminiModel)
      if (JSON.stringify(bodyWithH3Bodies) !== JSON.stringify(updates.body || post.body)) {
        updates.body = bodyWithH3Bodies
        emptyH3SectionsFixed = true
      }
    }

    // まとめセクションの最適化（Gemini API使用）
    let summaryOptimized = false
    let affiliateLinksNormalized = 0
    if (post.body && Array.isArray(post.body)) {
      const optimizedBody = await optimizeSummarySection(updates.body || post.body, post.title, geminiModel)
      if (JSON.stringify(optimizedBody) !== JSON.stringify(updates.body || post.body)) {
        updates.body = optimizedBody
        summaryOptimized = true
      }
    }

    if (post.body && Array.isArray(post.body)) {
      const summaryEnsureResult = ensureSummarySection(updates.body || post.body, post.title)
      if (summaryEnsureResult.added) {
        updates.body = summaryEnsureResult.body
        summaryOptimized = true
      }
    }

    shouldInsertComparisonLink = shouldAddResignationComparisonLink(post, updates.body || post.body)

    const hasAffiliateEmbed = Array.isArray(updates.body || post.body)
      ? (updates.body || post.body).some(block => block?._type === 'affiliateEmbed')
      : false
    if (forceLinkMaintenance || !hasAffiliateEmbed) {
      const affiliateResult = addAffiliateLinksToArticle(updates.body || post.body, post.title, post, {
        disableRetirementAffiliates: shouldInsertComparisonLink
      })
      if (affiliateResult.addedLinks > 0) {
        updates.body = affiliateResult.body
        affiliateLinksAdded = true
        affiliateLinksInserted = affiliateResult.addedLinks
        totalAffiliateLinksInserted += affiliateResult.addedLinks
      }
    }

    const hasReferenceBlock = Array.isArray(updates.body || post.body)
      ? (updates.body || post.body).some(block => isReferenceBlock(block))
      : false
    if (forceLinkMaintenance || !hasReferenceBlock) {
      const sourceLinkResult = await addSourceLinksToArticle(updates.body || post.body, post.title, post)
      if (sourceLinkResult && sourceLinkResult.addedSource) {
        updates.body = sourceLinkResult.body
        sourceLinkDetails = sourceLinkResult.addedSource
        sourceLinkAdded = sourceLinkResult.addedSource
      }
    }

    if (shouldInsertComparisonLink) {
      const comparisonLinkResult = ensureResignationComparisonLink(updates.body || post.body, post, { force: true })
      if (comparisonLinkResult.inserted) {
        updates.body = comparisonLinkResult.body
      }
    }

    // アフィリエイトリンクの自動追加（収益最適化）は上部で既に実行済み

    // 出典リンクの自動追加（YMYL対策）は上部で既に実行済み

    if (post.body && Array.isArray(post.body)) {
      const normalized = normalizeAffiliateLinkMarks(updates.body || post.body)
      if (normalized.normalized > 0) {
        updates.body = normalized.body
        affiliateLinksNormalized = normalized.normalized
      }
    }

    // 関連記事セクションや重複段落を除去
    let relatedSectionsRemoved = 0
    let duplicateParagraphsRemoved = 0
    let extraInternalLinksRemoved = 0
    let forbiddenSectionsRemoved = 0
    let summaryHelpersRemoved = 0
    let affiliateCtasRemoved = 0
    let summaryHeadingsRemoved = 0
    let personaHeadingsFixed = 0
    let disclaimersAdded = 0
    let disclaimerRepositioned = false
    let referencesFixed = 0
    let unresolvedReferences = []
    let shortContentExpanded = false
    let referenceBlocksAdded = 0
    let referenceBlocksRemoved = 0
    let ymyReplacements = 0
    let affiliateContextsAdded = 0
    let internalLinkAdded = false
    let internalLinkTarget = null
    let affiliateBlocksRemoved = 0
    let medicalNoticeAdded = false
    let sectionClosingsAdded = 0
    let summaryMoved = false
    let h3BodiesAdded = false
    let summaryAdjusted = false
    if (post.body && Array.isArray(post.body)) {
      const sanitised = sanitizeBodyBlocks(updates.body || post.body)
      if (JSON.stringify(sanitised.body) !== JSON.stringify(updates.body || post.body)) {
        updates.body = sanitised.body
      }
      relatedSectionsRemoved = sanitised.removedRelated
      duplicateParagraphsRemoved = sanitised.removedDuplicateParagraphs
      extraInternalLinksRemoved = sanitised.removedInternalLinks
      forbiddenSectionsRemoved = sanitised.removedForbiddenSections
      summaryHelpersRemoved = sanitised.removedSummaryHelpers
      affiliateCtasRemoved = sanitised.removedAffiliateCtas
      summaryHeadingsRemoved = sanitised.removedSummaryHeadings
      disclaimersAdded = sanitised.disclaimerAdded
      personaHeadingsFixed = sanitised.personaHeadingsFixed || 0

      const referenceResult = await normalizeReferenceLinks(updates.body || post.body, post.title)
      if (referenceResult.fixed > 0 || referenceResult.removed > 0 || referenceResult.body !== (updates.body || post.body)) {
        updates.body = referenceResult.body
        if (referenceResult.fixed > 0) {
          referencesFixed = referenceResult.fixed
        }
        if (referenceResult.removed > 0) {
          referenceBlocksRemoved = referenceResult.removed
        }
      }
      unresolvedReferences = referenceResult.unresolved

      const referenceInsertResult = ensureReferenceBlocks(updates.body || post.body)
      if (referenceInsertResult.added > 0) {
        updates.body = referenceInsertResult.body
        referenceBlocksAdded = referenceInsertResult.added
      }

      const invalidInternalRemoval = removeInvalidInternalLinks(updates.body || post.body, internalLinkHrefSet)
      if (invalidInternalRemoval.removed > 0) {
        updates.body = invalidInternalRemoval.body
        extraInternalLinksRemoved += invalidInternalRemoval.removed
        bodyChanged = true
      }

      const irrelevantAffiliateResult = removeIrrelevantAffiliateBlocks(updates.body || post.body, post, {
        removeRetirementAffiliates: shouldInsertComparisonLink
      })
      if (irrelevantAffiliateResult.removed > 0) {
        updates.body = irrelevantAffiliateResult.body
        affiliateBlocksRemoved += irrelevantAffiliateResult.removed
        bodyChanged = true
      }

      const expansionResult = expandShortContent(updates.body || post.body, post.title)
      if (expansionResult.expanded) {
        updates.body = expansionResult.body
        shortContentExpanded = true
      }

      const ymyResult = replaceYMYLTerms(updates.body || post.body)
      if (ymyResult.replaced > 0) {
        updates.body = ymyResult.body
        ymyReplacements = ymyResult.replaced
        bodyChanged = true
      }

      const affiliateContextResult = ensureAffiliateContextBlocks(updates.body || post.body, post)
      if (affiliateContextResult.added > 0) {
        updates.body = affiliateContextResult.body
        affiliateContextsAdded = affiliateContextResult.added
        bodyChanged = true
      }

      const sectionClosingResult = ensureSectionClosingParagraphs(updates.body || post.body)
      if (sectionClosingResult.added > 0) {
        updates.body = sectionClosingResult.body
        sectionClosingsAdded = sectionClosingResult.added
        bodyChanged = true
      }

      const medicalNoticeResult = ensureMedicalScopeNotice(updates.body || post.body)
      if (medicalNoticeResult.added) {
        updates.body = medicalNoticeResult.body
        medicalNoticeAdded = true
        bodyChanged = true
      }

      const summaryMoveResult = moveSummaryToEnd(updates.body || post.body)
      if (summaryMoveResult.moved) {
        updates.body = summaryMoveResult.body
        summaryMoved = true
        bodyChanged = true
      }

      const internalLinkResult = ensureInternalLinkBlock(updates.body || post.body, post, internalLinkCatalog)
      if (internalLinkResult.added) {
        updates.body = internalLinkResult.body
        internalLinkAdded = true
        internalLinkTarget = internalLinkResult.target
        bodyChanged = true
      }
    }

    const currentSlug = post.slug?.current
    if (needsSlugRegeneration(currentSlug) && publishedId) {
      const slugCandidate = generateSlugFromTitle(post.title)
      const uniqueSlug = await ensureUniqueSlug(slugCandidate, publishedId)
      updates.slug = {
        _type: 'slug',
        current: uniqueSlug,
      }
    }

    if (categoryRefs.length > 0 && (!post.categories || post.categories.length === 0)) {
      updates.categories = categoryRefs
    }

    const plainText = blocksToPlainText(updates.body || post.body)

    if (!post.excerpt || post.excerpt.length < 50) {
      const excerpt = generateExcerpt(plainText, post.title)
      updates.excerpt = excerpt
    }

    // Tagsが2つ以下の場合、追加タグを自動生成
    if (!post.tags || post.tags.length <= 2) {
      // 既存のタグから selectedTopic を推測（看護助手以外の最初のタグ、空でないもの）
      const existingTags = (post.tags || []).filter(tag => tag && tag.trim().length > 0)
      const selectedTopic = existingTags.find(tag => tag !== '看護助手') || '悩み'
      const generatedTags = generateTags(post.title, plainText, selectedTopic)
      updates.tags = generatedTags
    }

    let categoriesForMeta = (updates.categories || categoryRefs || [])
      .map(ref => {
        if (ref?._ref) {
          const match = categories.find(category => category._id === ref._ref)
          return match ? normalizeCategoryTitle(match.title) : null
        }
        if (typeof ref === 'string') {
          return normalizeCategoryTitle(ref)
        }
        if (ref?.title) {
          return normalizeCategoryTitle(ref.title)
        }
        return null
      })
      .filter(Boolean)

    if (categoriesForMeta.length === 0 && currentCategories.length > 0) {
      categoriesForMeta = getNormalizedCategoryTitles(currentCategories)
    }

    // Meta Description は plainText から直接生成（excerpt とは別）
    // 100-180文字を目安（ユーザビリティやSEO優先）
    if (!post.metaDescription || post.metaDescription.length < 100 || post.metaDescription.length > 180) {
      const metaDescription = generateMetaDescription(post.title, plainText, categoriesForMeta)
      if (metaDescription.length < 100) {
        updates.metaDescription = `${post.title}について、看護助手として現場で積み重ねた経験をもとに課題の背景と対処法をやさしく解説します。落ち着いて取り組めるポイントやフォローの仕方も紹介し、安心して次の一歩を踏み出せるよう支援します。`
      } else if (metaDescription.length > 200) {
        updates.metaDescription = `${metaDescription.slice(0, 180)}`
      } else {
        updates.metaDescription = metaDescription
      }
    }

    if (Object.keys(updates).length === 0) {
      continue
    }

    await client
      .patch(post._id)
      .set(updates)
      .commit()

    if (post._id !== publishedId) {
      await client
        .patch(publishedId)
        .set(updates)
        .commit()
        .catch(() => null)
    }

    updated += 1
    console.log(`✅ ${post.title}`)
    if (updates.slug) {
      console.log(`   スラッグ: ${updates.slug.current}`)
    }
    if (greetingsRemoved) {
      console.log('   記事冒頭の挨拶文を削除しました')
    }
    if (closingRemarksRemoved) {
      console.log('   記事末尾の締めくくり文を削除しました（次のステップセクションへの誘導改善）')
    }
    if (placeholdersRemoved) {
      console.log('   プレースホルダーリンク ([INTERNAL_LINK], [AFFILIATE_LINK]) を削除しました')
    }
    if (affiliateLinksSeparated) {
      console.log('   アフィリエイトリンクを独立した段落として分離しました')
    }
    if (hashtagLinesRemoved) {
      console.log('   記事冒頭の #〇〇 で始まるハッシュタグ行を削除しました')
    }
    if (emptyH3SectionsFixed) {
      console.log('   本文がないH3セクションに説明文を追加しました')
    }
    if (summaryOptimized) {
      console.log('   まとめセクションを最適化しました（簡潔化・アクション誘導強化）')
    }
    if (affiliateLinksAdded) {
      console.log('   アフィリエイトリンクを自動追加しました（収益最適化）')
    }
    if (sourceLinkDetails) {
      console.log(`   出典リンクを自動追加しました（${sourceLinkDetails.name}）`)
    }
    if (referenceBlocksAdded > 0) {
      console.log(`   出典リンクを追加しました (${referenceBlocksAdded}件)`)
    }
    if (ymyReplacements > 0) {
      console.log(`   断定表現をやわらげました (${ymyReplacements}箇所)`)
    }
    if (affiliateLinksNormalized > 0) {
      console.log(`   アフィリエイトリンクのURLを正規化しました (${affiliateLinksNormalized}件)`)
    }
    if (affiliateContextsAdded > 0) {
      console.log(`   アフィリエイト訴求文を追加しました (${affiliateContextsAdded}ブロック)`)
    }
    if (affiliateBlocksRemoved > 0) {
      console.log(`   関連性の低いアフィリエイトリンクを削除しました (${affiliateBlocksRemoved}ブロック)`)
    }
    if (sectionClosingsAdded > 0) {
      console.log(`   セクション末尾にフォロー文を追加しました (${sectionClosingsAdded}ブロック)`)
    }
    if (medicalNoticeAdded) {
      console.log('   医療行為に関する注意書きを追記しました')
    }
    if (summaryMoved) {
      console.log('   「まとめ」セクションを記事末尾へ移動しました')
    }
    if (internalLinkAdded) {
      if (internalLinkTarget && internalLinkTarget.title) {
        console.log(`   内部リンクを追加しました: ${internalLinkTarget.title}`)
      } else {
        console.log('   内部リンクを追加しました')
      }
    }
    if (relatedSectionsRemoved > 0) {
      console.log(`   関連記事セクションを削除しました (${relatedSectionsRemoved}ブロック)`)
    }
    if (duplicateParagraphsRemoved > 0) {
      console.log(`   重複段落を削除しました (${duplicateParagraphsRemoved}ブロック)`)
    }
    if (extraInternalLinksRemoved > 0) {
      console.log(`   余分な内部リンクを削除しました (${extraInternalLinksRemoved}リンク)`)
    }
    if (forbiddenSectionsRemoved > 0) {
      console.log(`   禁止セクションを削除しました (${forbiddenSectionsRemoved}セクション)`)
    }
    if (summaryHelpersRemoved > 0) {
      console.log(`   まとめ補助テキストを削除しました (${summaryHelpersRemoved}ブロック)`)
    }
    if (affiliateCtasRemoved > 0) {
      console.log(`   アフィリエイト訴求ブロックを削除しました (${affiliateCtasRemoved}ブロック)`)
    }
    if (summaryHeadingsRemoved > 0) {
      console.log(`   重複した「まとめ」見出しを整理しました (${summaryHeadingsRemoved}見出し)`)
    }
    if (disclaimersAdded > 0) {
      console.log('   免責事項を追記しました')
    }
    if (personaHeadingsFixed > 0) {
      console.log(`   H2見出しから「セラ」を除去しました (${personaHeadingsFixed}見出し)`)
    }
    if (disclaimerRepositioned) {
      console.log('   免責事項を「まとめ」直後に再配置しました')
    }
    if (personaHeadingsFixed > 0) {
      console.log(`   H2見出しから「セラ」を除去: ${personaHeadingsFixed}見出し`)
    }
    if (referencesFixed > 0) {
      console.log(`   出典リンクを更新しました (${referencesFixed}件)`)
    }
    if (unresolvedReferences.length > 0) {
      const preview = unresolvedReferences.slice(0, 3).map(ref => ref.label || ref.url).join(', ')
      console.log(`   ⚠️  確認が必要な出典リンクがあります (${unresolvedReferences.length}件): ${preview}`)
    }
    if (shortContentExpanded) {
      console.log('   文字数が不足していたため追加の解説を追記しました')
    }
    if (plainText.length < 2000) {
      console.log(`   ⚠️ 本文は現在 ${plainText.length}文字で2000文字未満です`)
    }
    if (updates.categories) {
      const selectedCategories = updates.categories
        .map(ref => categories.find(c => c._id === ref._ref)?.title)
        .filter(Boolean)
        .join(', ')
      console.log(`   カテゴリを自動設定: ${selectedCategories}`)
    }
    if (updates.excerpt) {
      console.log('   Excerpt を再生成しました')
    }
    if (updates.tags) {
      console.log(`   Tags を補完しました: ${updates.tags.join(', ')}`)
    }
    if (updates.metaDescription) {
      console.log(`   Meta Description を再生成しました (${updates.metaDescription.length}文字)`)
    }
    console.log()
  }

  console.log(`🛠️ 自動修復完了: ${updated}/${posts.length}件を更新`)

  const repairTasks = [
    { script: 'convert-placeholder-links.js', args: [], label: 'プレースホルダーリンク変換' },
    { script: 'fix-all-link-issues.js', args: [], label: 'リンク問題一括修正' },
    { script: 'fix-affiliate-link-text.js', args: [], label: 'アフィリエイトリンクテキスト修正' },
    { script: 'remove-broken-internal-links.js', args: [], label: '壊れた内部リンク削除' },
    { script: 'remove-toc-headings.js', args: ['remove', '--apply'], label: 'Body内「もくじ」見出し削除' },
  ]

  for (const task of repairTasks) {
    // eslint-disable-next-line no-await-in-loop
    await runNodeScript(task.script, task.args, task.label)
  }

  return { total: posts.length, updated }
}

/**
 * 本文全体から関連記事セクション・重複段落・余計な内部リンクを整理
 */

async function getTopViewedCandidates(limit = 10, cooldownDays = 30) {
  const windowSize = Math.max(limit * 4, limit + 10)
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - cooldownDays)
  const cutoffTime = cutoff.getTime()

  const candidates = await client.fetch(
    `
    *[_type == "post" && defined(slug.current)]
      | order(coalesce(views, 0) desc)[0...$window] {
        "slug": slug.current,
        views,
        geminiMaintainedAt
      }
  `,
    { window: windowSize }
  )

  if (!candidates || candidates.length === 0) {
    return []
  }

  const stale = []
  const recent = []

  candidates.forEach(candidate => {
    const slug = (candidate.slug || '').trim()
    if (!slug) return
    const maintainedAt = candidate.geminiMaintainedAt ? Date.parse(candidate.geminiMaintainedAt) : 0
    const record = {
      slug,
      views: typeof candidate.views === 'number' ? candidate.views : 0,
      geminiMaintainedAt: candidate.geminiMaintainedAt || null,
      cooldownSatisfied: !maintainedAt || maintainedAt < cutoffTime
    }
    if (record.cooldownSatisfied) {
      stale.push(record)
    } else {
      recent.push(record)
    }
  })

  const final = []

  stale.slice(0, limit).forEach(record => final.push(record))

  if (final.length < limit) {
    for (const record of recent) {
      if (final.length >= limit) break
      final.push(record)
    }
  }

  return final.slice(0, limit)
}

async function sanitizeAllBodies(options = {}) {
  console.log('\n🧹 本文内の関連記事・重複段落の自動整理を開始します\n')

  const { slugs = null } = options
  const enableGemini =
    process.env.MAINTENANCE_ENABLE_GEMINI === '1' ||
    process.env.MAINTENANCE_ENABLE_GEMINI?.toLowerCase() === 'true'
  const forceLinkMaintenance =
    options.forceLinks ||
    process.env.MAINTENANCE_FORCE_LINKS === '1' ||
    process.env.MAINTENANCE_FORCE_LINKS?.toLowerCase() === 'true'

  let geminiModel = null
  if (enableGemini) {
    console.log('✅ MAINTENANCE_ENABLE_GEMINI=1 を検出（Gemini API を利用します）')
    const geminiApiKey = process.env.GEMINI_API_KEY
    if (geminiApiKey) {
      const genAI = new GoogleGenerativeAI(geminiApiKey)
      geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite-001' })
    } else {
      console.log('⚠️  MAINTENANCE_ENABLE_GEMINI=1 ですが GEMINI_API_KEY が未設定です（簡易版を使用します）')
    }
  } else {
    console.log('ℹ️  Gemini API は無効化されています。必要に応じて MAINTENANCE_ENABLE_GEMINI=1 を設定してください。')
  }

  if (forceLinkMaintenance) {
    console.log('🔁 アフィリエイト・出典リンクの再配置を強制モードで実行します')
  }

  let fetchQuery = `
    *[_type == "post" && (${PUBLIC_POST_FILTER})] {
      _id,
      title,
      body,
      "slug": slug.current,
      _updatedAt,
      "categories": categories[]->{ title },
      views,
      geminiMaintainedAt,
      internalOnly
    }
  `
  const queryParams = {}

  if (Array.isArray(slugs) && slugs.length > 0) {
    const uniqueSlugs = [...new Set(slugs.filter(Boolean))].sort()
    console.log(`🔍 指定スラッグのみを対象に実行します (${uniqueSlugs.length}件): ${uniqueSlugs.join(', ')}`)
    fetchQuery = `
      *[_type == "post" && slug.current in $slugs && (${PUBLIC_POST_FILTER})] {
        _id,
        title,
        body,
        "slug": slug.current,
        _updatedAt,
        "categories": categories[]->{ title },
        views,
        geminiMaintainedAt,
        internalOnly
      }
    `
    queryParams.slugs = uniqueSlugs
  }

  const rawPosts = await client.fetch(fetchQuery, queryParams)
  const posts = filterOutInternalPosts(rawPosts)

  if (!posts || posts.length === 0) {
    console.log('✅ 対象記事はありません')
    return {
      total: 0,
      updated: 0,
      relatedRemoved: 0,
      duplicateParagraphsRemoved: 0,
      extraInternalLinksRemoved: 0,
      forbiddenSectionsRemoved: 0,
      summaryHelpersRemoved: 0,
      referencesFixed: 0,
      unresolvedReferences: [],
      affiliateCtasRemoved: 0,
      summaryHeadingsRemoved: 0,
      personaHeadingsFixed: 0,
      disclaimersAdded: 0,
      disclaimersMoved: 0
    }
  }

  let internalLinkSource = posts
  if (Array.isArray(slugs) && slugs.length > 0) {
    const internalSourceRaw = await client.fetch(`
      *[_type == "post" && (${PUBLIC_POST_FILTER}) && defined(slug.current)] {
        _id,
        title,
        "slug": slug.current,
        _updatedAt,
        "categories": categories[]->{ title },
        internalOnly
      }
    `)
    internalLinkSource = filterOutInternalPosts(internalSourceRaw)
  }

  const internalLinkCatalog = internalLinkSource
    .filter(post => typeof post.slug === 'string' && post.slug)
    .map(post => ({
      slug: post.slug,
      title: post.title || '',
      categories: (post.categories || []).map(cat => cat?.title).filter(Boolean),
      slugSegments: extractSlugSegments(post.slug),
      titleKeywords: extractTitleKeywords(post.title),
      recency: post._updatedAt ? new Date(post._updatedAt).getTime() : 0
    }))
  const internalLinkHrefSet = new Set(
    internalLinkCatalog.map(item =>
      item.slug.startsWith('/posts/') ? item.slug : `/posts/${item.slug}`
    )
  )

  let updated = 0
  let totalRelatedRemoved = 0
  let totalDuplicatesRemoved = 0
  let totalInternalLinksRemoved = 0
  let totalForbiddenSectionsRemoved = 0
  let totalSummaryHelpersRemoved = 0
  let totalAffiliateCtasRemoved = 0
  let totalSummaryHeadingsRemoved = 0
  let totalPersonaHeadingFixes = 0
  let totalDisclaimersAdded = 0
  let totalDisclaimersMoved = 0
  let totalReferencesFixed = 0
  let totalShortExpansions = 0
  let totalReferenceInsertions = 0
  let totalReferenceRemovals = 0
  let totalYMYLReplacements = 0
  let totalAffiliateContextAdded = 0
  let totalAffiliateBlocksRemoved = 0
  let totalAffiliateLinksNormalized = 0
  let totalInternalLinksAdded = 0
  let totalMedicalNoticesAdded = 0
  let totalAffiliateLinksInserted = 0
  let totalSectionClosingsAdded = 0
  let totalSummaryMoved = 0
  let totalSlugRegenerated = 0
  let totalH3BodiesAdded = 0
  let totalSummariesOptimized = 0
  const unresolvedReferences = []
  const shortLengthIssues = []

  for (const post of posts) {
    const publishedId = post._id.startsWith('drafts.') ? post._id.replace(/^drafts\./, '') : post._id
    const originalSlug = typeof post.slug === 'string' ? post.slug : (post.slug?.current || '')

    let body = Array.isArray(post.body) ? post.body : []
    let removedRelated = 0
    let removedDuplicateParagraphs = 0
    let removedInternalLinks = 0
    let removedForbiddenSections = 0
    let removedSummaryHelpers = 0
    let removedAffiliateCtas = 0
    let removedSummaryHeadings = 0
    let disclaimerAdded = 0
    let bodyChanged = false
    let referencesFixedForPost = 0
    let expansionResult = { expanded: false }
    let referenceBlocksAdded = 0
    let referenceBlocksRemoved = 0
    let ymyReplacements = 0
    let affiliateContextsAdded = 0
    let internalLinkAdded = false
    let internalLinkTarget = null
    let affiliateBlocksRemoved = 0
    let medicalNoticeAdded = false
    let sectionClosingsAdded = 0
    let summaryMoved = false
    let h3BodiesAdded = false
    let summaryAdjusted = false
    let affiliateLinksNormalizedForPost = 0
    let affiliateLinksInserted = 0
    let sourceLinkAdded = null
    let shouldInsertComparisonLink = false

    if (Array.isArray(post.body) && post.body.length > 0) {
      const sanitised = sanitizeBodyBlocks(post.body)
      body = sanitised.body
      removedRelated = sanitised.removedRelated
      removedDuplicateParagraphs = sanitised.removedDuplicateParagraphs
      removedInternalLinks = sanitised.removedInternalLinks
      removedForbiddenSections = sanitised.removedForbiddenSections
      removedSummaryHelpers = sanitised.removedSummaryHelpers
      removedAffiliateCtas = sanitised.removedAffiliateCtas
      removedSummaryHeadings = sanitised.removedSummaryHeadings
      disclaimerAdded = sanitised.disclaimerAdded
      personaHeadingsFixed = sanitised.personaHeadingsFixed || 0

      bodyChanged =
        removedRelated > 0 ||
        removedDuplicateParagraphs > 0 ||
        removedInternalLinks > 0 ||
        removedForbiddenSections > 0 ||
        removedSummaryHelpers > 0 ||
        removedAffiliateCtas > 0 ||
        removedSummaryHeadings > 0 ||
        disclaimerAdded > 0 ||
        personaHeadingsFixed > 0

      const bodyAfterH3 = await addBodyToEmptyH3Sections(body, post.title, enableGemini ? geminiModel : null)
      if (JSON.stringify(bodyAfterH3) !== JSON.stringify(body)) {
        body = bodyAfterH3
        h3BodiesAdded = true
        bodyChanged = true
      }

      const summaryOptimised = await optimizeSummarySection(body, post.title, enableGemini ? geminiModel : null)
      if (JSON.stringify(summaryOptimised) !== JSON.stringify(body)) {
        body = summaryOptimised
        summaryAdjusted = true
        bodyChanged = true
      }

      const summaryEnsureResult = ensureSummarySection(body, post.title)
      if (summaryEnsureResult.added) {
        body = summaryEnsureResult.body
        summaryAdjusted = true
        bodyChanged = true
      }

      shouldInsertComparisonLink = shouldAddResignationComparisonLink(post, body)

      const referenceResult = await normalizeReferenceLinks(body, post.title)
      body = referenceResult.body
      referencesFixedForPost = referenceResult.fixed
      totalReferencesFixed += referenceResult.fixed
      if (referenceResult.fixed > 0) {
        bodyChanged = true
      }
      if (referenceResult.unresolved.length > 0) {
        referenceResult.unresolved.forEach(item => {
          unresolvedReferences.push({
            articleTitle: item.articleTitle || post.title,
            label: item.label,
            url: item.url
          })
        })
      }

      const referenceInsertResult = ensureReferenceBlocks(body)
      if (referenceInsertResult.added > 0) {
        body = referenceInsertResult.body
        referenceBlocksAdded += referenceInsertResult.added
        totalReferenceInsertions += referenceInsertResult.added
        bodyChanged = true
      }

      const invalidInternalRemoval = removeInvalidInternalLinks(body, internalLinkHrefSet)
      if (invalidInternalRemoval.removed > 0) {
        body = invalidInternalRemoval.body
        removedInternalLinks += invalidInternalRemoval.removed
        bodyChanged = true
      }

      const irrelevantAffiliateResult = removeIrrelevantAffiliateBlocks(body, post, {
        removeRetirementAffiliates: shouldInsertComparisonLink
      })
      if (irrelevantAffiliateResult.removed > 0) {
        body = irrelevantAffiliateResult.body
        affiliateBlocksRemoved += irrelevantAffiliateResult.removed
        bodyChanged = true
      }

      const normalizedLinks = normalizeAffiliateLinkMarks(body)
      if (normalizedLinks.normalized > 0) {
        body = normalizedLinks.body
        affiliateLinksNormalizedForPost += normalizedLinks.normalized
        bodyChanged = true
      }

      expansionResult = expandShortContent(body, post.title)
      body = expansionResult.body
      if (expansionResult.expanded) {
        totalShortExpansions += 1
        bodyChanged = true
      }

      const ymyResult = replaceYMYLTerms(body)
      if (ymyResult.replaced > 0) {
        body = ymyResult.body
        ymyReplacements += ymyResult.replaced
        totalYMYLReplacements += ymyResult.replaced
        bodyChanged = true
      }

      const hasAffiliateEmbedInBody = body.some(block => block?._type === 'affiliateEmbed')
      if (forceLinkMaintenance || !hasAffiliateEmbedInBody) {
        const affiliateResult = addAffiliateLinksToArticle(body, post.title, post, {
          disableRetirementAffiliates: shouldInsertComparisonLink
        })
        if (affiliateResult.addedLinks > 0) {
          body = affiliateResult.body
          affiliateLinksInserted = affiliateResult.addedLinks
          totalAffiliateLinksInserted += affiliateResult.addedLinks
          bodyChanged = true
        }
      }

      const hasReferenceBlockInBody = body.some(block => isReferenceBlock(block))
      if (forceLinkMaintenance || !hasReferenceBlockInBody) {
        const sourceResult = await addSourceLinksToArticle(body, post.title, post)
        if (sourceResult && sourceResult.addedSource) {
          body = sourceResult.body
          referenceBlocksAdded += 1
          totalReferenceInsertions += 1
          sourceLinkAdded = sourceResult.addedSource
          bodyChanged = true
        }
      }

      if (shouldInsertComparisonLink) {
        const comparisonLinkResult = ensureResignationComparisonLink(body, post, { force: true })
        if (comparisonLinkResult.inserted) {
          body = comparisonLinkResult.body
          bodyChanged = true
        }
      }

      const sectionClosingResult = ensureSectionClosingParagraphs(body)
      if (sectionClosingResult.added > 0) {
        body = sectionClosingResult.body
        sectionClosingsAdded += sectionClosingResult.added
        bodyChanged = true
      }

      const medicalNoticeResult = ensureMedicalScopeNotice(body)
      if (medicalNoticeResult.added) {
        body = medicalNoticeResult.body
        medicalNoticeAdded = true
        bodyChanged = true
      }

      const summaryMoveResult = moveSummaryToEnd(body)
      if (summaryMoveResult.moved) {
        body = summaryMoveResult.body
        summaryMoved = true
        bodyChanged = true
      }

      const disclaimerPlacementResult = ensureDisclaimerPlacement(body)
      if (disclaimerPlacementResult.moved) {
        body = disclaimerPlacementResult.body
        disclaimerRepositioned = true
        bodyChanged = true
        if (disclaimerPlacementResult.added) {
          disclaimerAdded += 1
        }
      }

      const affiliateContextResult = ensureAffiliateContextBlocks(body, post)
      if (affiliateContextResult.added > 0) {
        body = affiliateContextResult.body
        affiliateContextsAdded += affiliateContextResult.added
        bodyChanged = true
      }

      const internalLinkResult = ensureInternalLinkBlock(body, post, internalLinkCatalog)
      if (internalLinkResult.added) {
        body = internalLinkResult.body
        internalLinkAdded = true
        internalLinkTarget = internalLinkResult.target
        totalInternalLinksAdded += 1
        bodyChanged = true
      }
    }

    const finalPlainLength = blocksToPlainText(body).length

    let slugUpdated = false
    let slugForReporting = originalSlug
    const updates = {}

    if (needsSlugRegeneration(originalSlug)) {
      const slugCandidate = generateSlugFromTitle(post.title)
      const uniqueSlug = await ensureUniqueSlug(slugCandidate, publishedId)
      updates.slug = {
        _type: 'slug',
        current: uniqueSlug
      }
      slugUpdated = true
      slugForReporting = uniqueSlug
      totalSlugRegenerated += 1
    }

    if (finalPlainLength < 2000) {
      shortLengthIssues.push({
        title: post.title,
        slug: slugForReporting || '(slug未設定)',
        charCount: finalPlainLength
      })
    }

    if (bodyChanged) {
      updates.body = body
    }

    if (enableGemini && geminiModel) {
      updates.geminiMaintainedAt = new Date().toISOString()
    }

    if (Object.keys(updates).length === 0) {
      continue
    }

    await client
      .patch(post._id)
      .set(updates)
      .commit()

    if (publishedId !== post._id) {
      await client
        .patch(publishedId)
        .set(updates)
        .commit()
        .catch(() => null)
    }

    updated += 1
    totalRelatedRemoved += removedRelated
    totalDuplicatesRemoved += removedDuplicateParagraphs
    totalInternalLinksRemoved += removedInternalLinks
    totalForbiddenSectionsRemoved += removedForbiddenSections
    totalSummaryHelpersRemoved += removedSummaryHelpers
    totalAffiliateCtasRemoved += removedAffiliateCtas
    totalSummaryHeadingsRemoved += removedSummaryHeadings
    totalPersonaHeadingFixes += personaHeadingsFixed
    totalDisclaimersAdded += disclaimerAdded
    if (disclaimerRepositioned) {
      totalDisclaimersMoved += 1
    }
    totalAffiliateBlocksRemoved += affiliateBlocksRemoved
    totalAffiliateContextAdded += affiliateContextsAdded
    totalAffiliateLinksNormalized += affiliateLinksNormalizedForPost
    if (referenceBlocksRemoved > 0) {
      totalReferenceRemovals += referenceBlocksRemoved
    }
    if (medicalNoticeAdded) {
      totalMedicalNoticesAdded += 1
    }
    totalSectionClosingsAdded += sectionClosingsAdded
    if (summaryMoved) {
      totalSummaryMoved += 1
    }
    if (h3BodiesAdded) {
      totalH3BodiesAdded += 1
    }
    if (summaryAdjusted) {
      totalSummariesOptimized += 1
    }
    if (expansionResult.expanded) {
      console.log('   文字数不足だったため追記を行いました')
    }

    console.log(`✅ ${post.title}`)
    if (removedRelated > 0) {
      console.log(`   関連記事セクションを削除: ${removedRelated}ブロック`)
    }
    if (removedDuplicateParagraphs > 0) {
      console.log(`   重複段落を削除: ${removedDuplicateParagraphs}ブロック`)
    }
    if (removedInternalLinks > 0) {
      console.log(`   余分な内部リンクを削除: ${removedInternalLinks}リンク`)
    }
    if (removedForbiddenSections > 0) {
      console.log(`   禁止セクションを削除: ${removedForbiddenSections}セクション`)
    }
    if (removedSummaryHelpers > 0) {
      console.log(`   まとめ補助テキストを削除: ${removedSummaryHelpers}ブロック`)
    }
    if (removedAffiliateCtas > 0) {
      console.log(`   アフィリエイト訴求ブロックを削除: ${removedAffiliateCtas}ブロック`)
    }
    if (removedSummaryHeadings > 0) {
      console.log(`   重複した「まとめ」見出しを整理: ${removedSummaryHeadings}見出し`)
    }
    if (affiliateBlocksRemoved > 0) {
      console.log(`   関連性の低いアフィリエイトリンクを削除: ${affiliateBlocksRemoved}ブロック`)
    }
    if (disclaimerAdded > 0) {
      console.log('   免責事項を追記しました')
    }
    if (disclaimerRepositioned) {
      console.log('   免責事項を「まとめ」直後に再配置しました')
    }
    if (referencesFixedForPost > 0) {
      console.log(`   出典リンクを更新: ${referencesFixedForPost}件`)
    }
    if (referenceBlocksAdded > 0) {
      console.log(`   出典リンクを追加: ${referenceBlocksAdded}件`)
    }
    if (referenceBlocksRemoved > 0) {
      console.log(`   無効な出典リンクを削除: ${referenceBlocksRemoved}件`)
    }
    if (ymyReplacements > 0) {
      console.log(`   断定表現を柔らかく調整: ${ymyReplacements}箇所`)
    }
    if (affiliateContextsAdded > 0) {
      console.log(`   アフィリエイト訴求文を補強: ${affiliateContextsAdded}ブロック`)
    }
    if (affiliateLinksNormalizedForPost > 0) {
      console.log(`   アフィリエイトリンクのURLを正規化: ${affiliateLinksNormalizedForPost}リンク`)
    }
    if (h3BodiesAdded) {
      console.log('   H3セクションに本文を追加しました')
    }
    if (affiliateLinksInserted > 0) {
      console.log(`   アフィリエイトリンクを追加: ${affiliateLinksInserted}件`)
    }
    if (sourceLinkAdded) {
      console.log(`   出典リンクを追加: ${sourceLinkAdded.name}`)
    }
    if (summaryAdjusted) {
      console.log('   まとめセクションを整えました')
    }
    if (sectionClosingsAdded > 0) {
      console.log(`   セクション末尾にフォロー文を追加: ${sectionClosingsAdded}セクション`)
    }
    if (medicalNoticeAdded) {
      console.log('   医療行為に関する注意書きを追記しました')
    }
    if (summaryMoved) {
      console.log('   「まとめ」セクションを末尾へ移動しました')
    }
    if (internalLinkAdded) {
      if (internalLinkTarget && internalLinkTarget.title) {
        console.log(`   内部リンクを追加: ${internalLinkTarget.title}`)
      } else {
        console.log('   内部リンクを追加しました')
      }
    }
    if (finalPlainLength < 2000) {
      console.log(`   ⚠️ 本文は現在 ${finalPlainLength}文字で2000文字未満です`)
    }
    if (slugUpdated && updates.slug?.current) {
      console.log(`   スラッグを再生成: ${updates.slug.current}`)
    }
  }

  console.log(`\n🧹 本文整理完了: ${updated}/${posts.length}件を更新（関連記事:${totalRelatedRemoved} / 重複段落:${totalDuplicatesRemoved} / 余分な内部リンク:${totalInternalLinksRemoved} / 禁止セクション:${totalForbiddenSectionsRemoved} / まとめ補助:${totalSummaryHelpersRemoved} / 訴求ブロック:${totalAffiliateCtasRemoved} / 重複まとめ:${totalSummaryHeadingsRemoved} / H2調整:${totalPersonaHeadingFixes} / 出典更新:${totalReferencesFixed} / 出典追加:${totalReferenceInsertions} / 出典削除:${totalReferenceRemovals} / 断定表現調整:${totalYMYLReplacements} / 不適切訴求削除:${totalAffiliateBlocksRemoved} / 訴求文補強:${totalAffiliateContextAdded} / リンク正規化:${totalAffiliateLinksNormalized} / アフィリエイト再配置:${totalAffiliateLinksInserted} / H3補強:${totalH3BodiesAdded} / まとめ補強:${totalSummariesOptimized} / 医療注意追記:${totalMedicalNoticesAdded} / セクション補強:${totalSectionClosingsAdded} / まとめ移動:${totalSummaryMoved} / 内部リンク追加:${totalInternalLinksAdded} / 自動追記:${totalShortExpansions} / スラッグ再生成:${totalSlugRegenerated} / 免責事項追記:${totalDisclaimersAdded} / 免責事項配置:${totalDisclaimersMoved}）\n`)

  if (shortLengthIssues.length > 0) {
    console.log(`⚠️ 2000文字未満の記事が ${shortLengthIssues.length}件残っています。上位10件:`)
    shortLengthIssues.slice(0, 10).forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.title} (${item.charCount}文字) -> /posts/${item.slug}`)
    })
    if (shortLengthIssues.length > 10) {
      console.log(`  ...他 ${shortLengthIssues.length - 10}件`)
    }
    console.log()
  } else {
    console.log('✅ 2000文字未満の記事はありません\n')
  }

  if (unresolvedReferences.length > 0) {
    console.log('⚠️  以下の出典リンクは自動修正できませんでした。手動確認をお願いします。')
    unresolvedReferences.slice(0, 10).forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.articleTitle} -> ${item.label || '出典不明'} (${item.url || 'URL不明'})`)
    })
    if (unresolvedReferences.length > 10) {
      console.log(`  ...他 ${unresolvedReferences.length - 10}件`)
    }
    console.log()
  }

  return {
    total: posts.length,
    updated,
    affiliateLinksInserted: totalAffiliateLinksInserted,
    relatedRemoved: totalRelatedRemoved,
    duplicateParagraphsRemoved: totalDuplicatesRemoved,
    extraInternalLinksRemoved: totalInternalLinksRemoved,
    forbiddenSectionsRemoved: totalForbiddenSectionsRemoved,
    summaryHelpersRemoved: totalSummaryHelpersRemoved,
    referencesFixed: totalReferencesFixed,
    referencesInserted: totalReferenceInsertions,
    referencesRemoved: totalReferenceRemovals,
    shortExpansions: totalShortExpansions,
    unresolvedReferences,
    affiliateCtasRemoved: totalAffiliateCtasRemoved,
    summaryHeadingsRemoved: totalSummaryHeadingsRemoved,
    personaHeadingsFixed: totalPersonaHeadingFixes,
    disclaimersAdded: totalDisclaimersAdded,
    disclaimersMoved: totalDisclaimersMoved,
    ymylSoftened: totalYMYLReplacements,
    affiliateContextsAdded: totalAffiliateContextAdded,
    affiliateBlocksRemoved: totalAffiliateBlocksRemoved,
    affiliateLinksNormalized: totalAffiliateLinksNormalized,
    h3BodiesAdded: totalH3BodiesAdded,
    summariesOptimized: totalSummariesOptimized,
    medicalNoticesAdded: totalMedicalNoticesAdded,
    sectionClosingsAdded: totalSectionClosingsAdded,
    summariesMoved: totalSummaryMoved,
    internalLinksAdded: totalInternalLinksAdded,
    slugRegenerated: totalSlugRegenerated,
    shortLengthIssues
  }
}

function runNodeScript(scriptName, args = [], label) {
  return new Promise((resolve) => {
    const scriptPath = path.resolve(__dirname, scriptName)
    console.log(`\n▶ ${label}`)
    const child = spawn('node', [scriptPath, ...args], {
      env: process.env,
      stdio: 'inherit',
    })

    child.on('exit', (code) => {
      if (code === 0) {
        console.log(`✅ ${label} 完了`)
      } else {
        console.log(`⚠️ ${label} でエラーが発生しました (exit ${code})`)
      }
      resolve({ code })
    })
  })
}

/**
 * 画像なし記事を検出
 */
async function findPostsWithoutImages() {
  const query = `*[_type == "post"] {
    _id,
    title,
    "slug": slug.current,
    mainImage,
    "hasBodyImages": count(body[_type == "image"]) > 0,
    "categories": categories[]->title
  }`

  try {
    const posts = await client.fetch(query)

    const noMainImage = posts.filter(p => !p.mainImage)
    const noBodyImages = posts.filter(p => !p.hasBodyImages)
    const noImages = posts.filter(p => !p.mainImage && !p.hasBodyImages)

    console.log('\n🖼️  画像なしの記事:\n')
    console.log(`  ⚠️  メイン画像なし: ${noMainImage.length}件`)
    console.log(`  ⚠️  本文画像なし: ${noBodyImages.length}件`)
    console.log(`  🔴 画像が全くなし: ${noImages.length}件\n`)

    if (noImages.length > 0) {
      console.log('🎯 画像が全くない記事（最大10件）:\n')
      noImages.slice(0, 10).forEach((post, i) => {
        console.log(`${i + 1}. ${post.title}`)
        console.log(`   ID: ${post._id}`)
        console.log(`   カテゴリ: ${post.categories?.join(', ') || 'なし'}`)
        console.log(`   URL: /posts/${post.slug}\n`)
      })
    }

    return { noMainImage, noBodyImages, noImages }
  } catch (error) {
    console.error('❌ エラー:', error.message)
    return null
  }
}

/**
 * 文字数不足の記事を検出
 * デフォルト: 2000文字未満（ユーザビリティ重視）
 */
async function findShortPosts(minChars = 2000) {
  const query = `*[_type == "post"] {
    _id,
    title,
    "slug": slug.current,
    body,
    "categories": categories[]->title
  }`

  try {
    const posts = await client.fetch(query)
    const shortPosts = []

    posts.forEach(post => {
      if (!post.body || !Array.isArray(post.body)) {
        shortPosts.push({ ...post, charCount: 0 })
        return
      }

      let charCount = 0
      post.body.forEach(block => {
        if (block._type === 'block' && block.children) {
          block.children.forEach(child => {
            if (child.text) {
              charCount += child.text.length
            }
          })
        }
      })

      if (charCount < minChars) {
        shortPosts.push({ ...post, charCount })
      }
    })

    shortPosts.sort((a, b) => a.charCount - b.charCount)

    console.log(`\n📏 文字数不足の記事（${minChars}文字未満）: ${shortPosts.length}件`)
    console.log('   ⚠️ 注意: ユーザビリティを最優先し、必要に応じて文字数よりも内容の質を重視してください\n')

    if (shortPosts.length > 0) {
      console.log('🎯 文字数が特に少ない記事（TOP10）:\n')
      shortPosts.slice(0, 10).forEach((post, i) => {
        console.log(`${i + 1}. ${post.title}`)
        console.log(`   ID: ${post._id}`)
        console.log(`   文字数: ${post.charCount}文字`)
        console.log(`   カテゴリ: ${post.categories?.join(', ') || 'なし'}`)
        console.log(`   URL: /posts/${post.slug}\n`)
      })
    }

    return shortPosts
  } catch (error) {
    console.error('❌ エラー:', error.message)
    return []
  }
}

/**
 * 次のステップセクションがない記事を検出
 */
async function findPostsWithoutNextSteps() {
  const query = `*[_type == "post"] {
    _id,
    title,
    "slug": slug.current,
    body,
    _createdAt,
    "categories": categories[]->title
  }`

  try {
    const posts = await client.fetch(query)
    const missingNextSteps = []

    posts.forEach(post => {
      if (!post.body || !Array.isArray(post.body)) {
        missingNextSteps.push(post)
        return
      }

      // 「次のステップ」H2見出しの検出
      const hasNextStepsH2 = post.body.some(block =>
        block._type === 'block' &&
        block.style === 'h2' &&
        block.children?.some(child =>
          child.text?.includes('次のステップ')
        )
      )

      if (!hasNextStepsH2) {
        missingNextSteps.push(post)
      }
    })

    // 作成日でソート（新しい記事順）
    missingNextSteps.sort((a, b) => new Date(b._createdAt) - new Date(a._createdAt))

    console.log(`\n🔗 「次のステップ」セクションがない記事: ${missingNextSteps.length}件\n`)

    if (missingNextSteps.length > 0) {
      console.log('🎯 最近作成された記事で「次のステップ」がない記事（TOP15）:\n')
      missingNextSteps.slice(0, 15).forEach((post, i) => {
        const createdDate = new Date(post._createdAt)
        const daysAgo = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24))

        console.log(`${i + 1}. ${post.title}`)
        console.log(`   ID: ${post._id}`)
        console.log(`   作成日: ${daysAgo}日前 (${createdDate.toLocaleDateString('ja-JP')})`)
        console.log(`   カテゴリ: ${post.categories?.join(', ') || 'なし'}`)
        console.log(`   URL: /posts/${post.slug}\n`)
      })

      if (missingNextSteps.length > 15) {
        console.log(`   ... 他${missingNextSteps.length - 15}件\n`)
      }
    }

    return missingNextSteps
  } catch (error) {
    console.error('❌ エラー:', error.message)
    return []
  }
}

/**
 * アフィリエイトリンクの適切性をチェック
 * 1. 記事内容とリンクの関連性
 * 2. 連続するアフィリエイトリンクの検出
 * 3. ASPアフィリエイトリンク数（2個超過）
 */
async function checkAffiliateLinks() {
  const query = `*[_type == "post"] {
    _id,
    title,
    "slug": slug.current,
    body,
    "categories": categories[]->title
  }`

  try {
    const posts = await client.fetch(query)
    const issues = {
      consecutiveLinks: [], // 連続リンク
      tooManyLinks: [],      // リンク数が多すぎる（全体4個以上）
      irrelevantLinks: []    // 記事内容と関連性が低い
    }

    posts.forEach(post => {
      if (!post.body || !Array.isArray(post.body)) return

      let affiliateCount = 0
      let lastWasAffiliate = false
      let consecutiveCount = 0
      const affiliateBlocks = []
      let inSelectionSection = false // 「〇〇選」セクション内かどうか

      post.body.forEach((block, index) => {
        // 「〇〇選」セクションの検出（H2見出しに「3選」「5選」などが含まれる）
        if (block._type === 'block' && block.style === 'h2') {
          const h2Text = block.children?.map(c => c.text).join('') || ''
          const matches = h2Text.match(/([0-9]+)選/)

          if (matches) {
            const count = parseInt(matches[1])
            // 10選までを「〇〇選」セクションとして認識
            inSelectionSection = (count >= 1 && count <= 10)
          } else {
            inSelectionSection = false
          }
        }

        // アフィリエイトリンクの検出
        const isAffiliate = block.markDefs?.some(def =>
          def._type === 'link' &&
          (def.href?.includes('af.moshimo.com') ||
           def.href?.includes('amazon.co.jp') ||
           def.href?.includes('tcs-asp.net'))
        )

        if (isAffiliate) {
          affiliateCount++
          affiliateBlocks.push({ index, block })

          if (lastWasAffiliate) {
            consecutiveCount++
          } else {
            consecutiveCount = 1
          }

          lastWasAffiliate = true
        } else {
          // コンテンツブロック（normal, h2, h3など）
          if (block._type === 'block' && block.style && block.style.match(/^(normal|h2|h3)$/)) {
            lastWasAffiliate = false
          }
        }

        // 連続アフィリエイトリンクの検出（2個以上）
        // ただし「〇〇選」セクション内は除外
        if (consecutiveCount >= 2 && !inSelectionSection && !issues.consecutiveLinks.some(p => p._id === post._id)) {
          issues.consecutiveLinks.push({
            ...post,
            consecutiveCount,
            exampleText: block.children?.map(c => c.text).join('').substring(0, 50)
          })
        }
      })

      // アフィリエイトリンク数チェック（4個以上）
      if (affiliateCount >= 4) {
        issues.tooManyLinks.push({
          ...post,
          affiliateCount
        })
      }

      // 記事内容との関連性チェック（簡易版）
      // 「資格」記事に退職代行リンクなど
      const titleLower = post.title.toLowerCase()
      const hasRetirementLink = affiliateBlocks.some(ab =>
        ab.block.children?.some(child =>
          child.text?.includes('退職代行') ||
          child.text?.includes('汐留パートナーズ')
        )
      )

      if (hasRetirementLink && !titleLower.includes('退職') && !titleLower.includes('辞め')) {
        issues.irrelevantLinks.push({
          ...post,
          linkType: '退職代行',
          reason: 'タイトルに「退職」「辞める」が含まれていないのに退職代行リンクがあります'
        })
      }
    })

    console.log('\n🔗 アフィリエイトリンクチェック:\n')
    console.log(`  🔴 連続するアフィリエイトリンク: ${issues.consecutiveLinks.length}件`)
    console.log(`  ⚠️  リンク数が多すぎる（4個以上）: ${issues.tooManyLinks.length}件`)
    console.log(`  ⚠️  記事内容と関連性が低い可能性: ${issues.irrelevantLinks.length}件\n`)

    if (issues.consecutiveLinks.length > 0) {
      console.log('🎯 連続するアフィリエイトリンクがある記事:\n')
      issues.consecutiveLinks.slice(0, 10).forEach((post, i) => {
        console.log(`${i + 1}. ${post.title}`)
        console.log(`   ID: ${post._id}`)
        console.log(`   連続数: ${post.consecutiveCount}個`)
        console.log(`   カテゴリ: ${post.categories?.join(', ') || 'なし'}`)
        console.log(`   URL: /posts/${post.slug}\n`)
      })
    }

    if (issues.tooManyLinks.length > 0) {
      console.log('🎯 アフィリエイトリンクが多すぎる記事:\n')
      issues.tooManyLinks.slice(0, 10).forEach((post, i) => {
        console.log(`${i + 1}. ${post.title}`)
        console.log(`   ID: ${post._id}`)
        console.log(`   リンク数: ${post.affiliateCount}個（推奨: 2-3個）`)
        console.log(`   カテゴリ: ${post.categories?.join(', ') || 'なし'}`)
        console.log(`   URL: /posts/${post.slug}\n`)
      })
    }

    if (issues.irrelevantLinks.length > 0) {
      console.log('🎯 記事内容と関連性が低い可能性のある記事:\n')
      issues.irrelevantLinks.slice(0, 10).forEach((post, i) => {
        console.log(`${i + 1}. ${post.title}`)
        console.log(`   ID: ${post._id}`)
        console.log(`   リンク種別: ${post.linkType}`)
        console.log(`   理由: ${post.reason}`)
        console.log(`   URL: /posts/${post.slug}\n`)
      })
    }

    return issues
  } catch (error) {
    console.error('❌ エラー:', error.message)
    return null
  }
}

/**
 * 内部リンクの適切性をチェック
 * 1. 内部リンクが少なすぎる記事を検出
 * 2. 壊れた内部リンクを検出
 * 3. 内部リンクが多すぎる記事を検出（3個超過）
 * 4. 内部リンクとアフィリエイトリンクが同時配置されている記事を検出
 */
async function checkInternalLinks() {
  const query = `*[_type == "post"] {
    _id,
    title,
    "slug": slug.current,
    body,
    "categories": categories[]->title
  }`

  try {
    const posts = await client.fetch(query)
    const issues = {
      tooFewLinks: [],       // 内部リンクが少ない（1本未満）
      tooManyLinks: [],      // 内部リンクが多すぎる（1本超過）
      brokenLinks: [],       // 壊れたリンク
      mixedWithAffiliate: [] // 内部リンクとアフィリエイトリンクが同じブロックに配置
    }

    // 全記事のslugを取得（壊れたリンク検出用）
    const allSlugs = new Set(posts.map(p => p.slug))

    posts.forEach(post => {
      if (!post.body || !Array.isArray(post.body)) return

      let internalLinkCount = 0
      const internalLinks = []
      const internalLinkBlockIndices = new Set()
      const affiliateLinkBlockIndices = new Set()

      post.body.forEach((block, index) => {
        if (!block.markDefs) return

        let hasInternalLink = false
        let hasAffiliateLink = false

        block.markDefs.forEach(def => {
          if (def._type === 'link' && def.href) {
            // 内部リンクの検出（/posts/で始まる）
            if (def.href.startsWith('/posts/')) {
              const targetSlug = def.href.replace('/posts/', '')
              internalLinkCount++
              hasInternalLink = true
              internalLinks.push({
                href: def.href,
                targetSlug,
                blockIndex: index,
                text: block.children?.map(c => c.text).join('').substring(0, 50)
              })

              // 壊れたリンクのチェック
              if (!allSlugs.has(targetSlug)) {
                if (!issues.brokenLinks.some(p => p._id === post._id)) {
                  issues.brokenLinks.push({
                    ...post,
                    brokenLink: def.href,
                    linkText: block.children?.map(c => c.text).join('')
                  })
                }
              }
            }

            // アフィリエイトリンクの検出
            if (def.href.includes('af.moshimo.com') ||
                def.href.includes('amazon.co.jp') ||
                def.href.includes('tcs-asp.net')) {
              hasAffiliateLink = true
            }
          }
        })

        if (hasInternalLink) {
          internalLinkBlockIndices.add(index)
        }
        if (hasAffiliateLink) {
          affiliateLinkBlockIndices.add(index)
        }
      })

      // 内部リンク数チェック（1本未満は不足）
      if (internalLinkCount < 1) {
        issues.tooFewLinks.push({
          ...post,
          internalLinkCount
        })
      }

      // 内部リンク数チェック（1本超過は多すぎる）
      if (internalLinkCount > 1) {
        issues.tooManyLinks.push({
          ...post,
          internalLinkCount
        })
      }

      // 内部リンクとアフィリエイトリンクが近接しているかチェック
      // 同じブロックまたは隣接ブロック（±2ブロック以内）に両方が存在する場合
      for (const internalIdx of internalLinkBlockIndices) {
        for (const affiliateIdx of affiliateLinkBlockIndices) {
          if (Math.abs(internalIdx - affiliateIdx) <= 2) {
            if (!issues.mixedWithAffiliate.some(p => p._id === post._id)) {
              issues.mixedWithAffiliate.push({
                ...post,
                blockDistance: Math.abs(internalIdx - affiliateIdx)
              })
            }
            break
          }
        }
      }
    })

    console.log('\n🔗 内部リンクチェック:\n')
    console.log(`  ⚠️  内部リンクが不足（1本未満）: ${issues.tooFewLinks.length}件`)
    console.log(`  🔴 内部リンクが多すぎる（1本超過）: ${issues.tooManyLinks.length}件（新ルール）`)
    console.log(`  🔴 内部リンクとアフィリエイトが近接: ${issues.mixedWithAffiliate.length}件（新ルール）`)
    console.log(`  🔴 壊れた内部リンク: ${issues.brokenLinks.length}件\n`)

    if (issues.tooFewLinks.length > 0) {
      console.log('🎯 内部リンクが少ない記事（TOP10）:\n')
      issues.tooFewLinks.slice(0, 10).forEach((post, i) => {
        console.log(`${i + 1}. ${post.title}`)
        console.log(`   ID: ${post._id}`)
        console.log(`   内部リンク数: ${post.internalLinkCount}本（推奨: 1本）`)
        console.log(`   カテゴリ: ${post.categories?.join(', ') || 'なし'}`)
        console.log(`   URL: /posts/${post.slug}\n`)
      })
    }

    if (issues.tooManyLinks.length > 0) {
      console.log('🎯 内部リンクが多すぎる記事（TOP10）:\n')
      issues.tooManyLinks.slice(0, 10).forEach((post, i) => {
        console.log(`${i + 1}. ${post.title}`)
        console.log(`   ID: ${post._id}`)
        console.log(`   内部リンク数: ${post.internalLinkCount}本（推奨: 1本）`)
        console.log(`   カテゴリ: ${post.categories?.join(', ') || 'なし'}`)
        console.log(`   URL: /posts/${post.slug}`)
        console.log(`   注: ユーザビリティ最優先。本文中は1本に制限してください\n`)
      })
    }

    if (issues.mixedWithAffiliate.length > 0) {
      console.log('🎯 内部リンクとアフィリエイトリンクが近接している記事（TOP10）:\n')
      issues.mixedWithAffiliate.slice(0, 10).forEach((post, i) => {
        console.log(`${i + 1}. ${post.title}`)
        console.log(`   ID: ${post._id}`)
        console.log(`   ブロック間距離: ${post.blockDistance}ブロック以内`)
        console.log(`   カテゴリ: ${post.categories?.join(', ') || 'なし'}`)
        console.log(`   URL: /posts/${post.slug}`)
        console.log(`   推奨: 内部リンクとアフィリエイトリンクは別の場所に配置\n`)
      })
    }

    if (issues.brokenLinks.length > 0) {
      console.log('🎯 壊れた内部リンクがある記事:\n')
      issues.brokenLinks.forEach((post, i) => {
        console.log(`${i + 1}. ${post.title}`)
        console.log(`   ID: ${post._id}`)
        console.log(`   壊れたリンク: ${post.brokenLink}`)
        console.log(`   リンクテキスト: ${post.linkText}`)
        console.log(`   URL: /posts/${post.slug}\n`)
      })
    }

    return issues
  } catch (error) {
    console.error('❌ エラー:', error.message)
    return null
  }
}

/**
 * YMYL（Your Money Your Life）対策チェック
 * 1. 断定表現の検出
 * 2. 統計データ・数字の出典確認（簡易版）
 * 3. 古い記事の検出（給与・法律情報）
 * 4. 医療行為に関する記述チェック
 */
async function checkYMYL() {
  const query = `*[_type == "post"] {
    _id,
    title,
    "slug": slug.current,
    body,
    _updatedAt,
    "categories": categories[]->title
  }`

  try {
    const posts = await client.fetch(query)
    const issues = {
      absoluteExpressions: [],    // 断定表現
      missingCitations: [],        // 出典なしの数字・統計
      oldArticles: [],             // 古い記事（6ヶ月以上）
      medicalProcedures: []        // 医療行為の誤記述の可能性
    }

    // 断定表現の禁止ワード
    const absoluteWords = [
      '絶対に', '絶対', '必ず', '確実に', '100%',
      '誰でも', 'すべての人が', '間違いなく', '完璧',
      '保証します', '必ず〜できます'
    ]

    // 統計キーワード（出典が必要）
    const statisticsKeywords = [
      '平均', '年収', '月給', '時給', '万円', '調査',
      'データ', '統計', '割合', '%', 'パーセント'
    ]

    // 医療行為の注意キーワード
    const medicalKeywords = [
      '注射', '採血', '点滴', '投薬', '診断', '処方',
      '医療行為', '治療'
    ]

    // 6ヶ月前の基準日
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    posts.forEach(post => {
      if (!post.body || !Array.isArray(post.body)) return

      // 本文テキストを抽出
      const bodyText = post.body
        .filter(block => block._type === 'block' && block.children)
        .map(block => block.children.map(child => child.text || '').join(''))
        .join('\n')

      // 1. 断定表現のチェック
      const foundAbsolutes = []
      absoluteWords.forEach(word => {
        if (bodyText.includes(word)) {
          foundAbsolutes.push(word)
        }
      })

      if (foundAbsolutes.length > 0) {
        issues.absoluteExpressions.push({
          ...post,
          foundWords: [...new Set(foundAbsolutes)], // 重複削除
          count: foundAbsolutes.length
        })
      }

      // 2. 統計データの出典確認（簡易版）
      // 統計キーワードを含むがリンクがないブロックを検出
      const hasStatistics = statisticsKeywords.some(keyword => bodyText.includes(keyword))

      if (hasStatistics) {
        const hasExternalLink = post.body.some(block =>
          block.markDefs?.some(def =>
            def._type === 'link' &&
            def.href &&
            (def.href.includes('mhlw.go.jp') ||      // 厚生労働省
             def.href.includes('meti.go.jp') ||      // 経済産業省
             def.href.includes('go.jp') ||           // その他官公庁
             def.href.includes('jil.go.jp'))         // 労働政策研究
          )
        )

        if (!hasExternalLink) {
          issues.missingCitations.push({
            ...post,
            reason: '統計データや数字が含まれていますが、公的機関へのリンクが見つかりません'
          })
        }
      }

      // 3. 古い記事の検出（給与・法律情報を含む記事）
      const lastUpdate = new Date(post._updatedAt)
      const isSalaryRelated = post.title.includes('給料') ||
                             post.title.includes('年収') ||
                             post.title.includes('月給') ||
                             bodyText.includes('平均年収') ||
                             bodyText.includes('平均月給')

      if (isSalaryRelated && lastUpdate < sixMonthsAgo) {
        const daysSince = Math.floor((Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24))
        issues.oldArticles.push({
          ...post,
          daysSinceUpdate: daysSince,
          reason: '給与・年収情報を含む記事は6ヶ月ごとの更新が推奨されます'
        })
      }

      // 4. 医療行為に関する記述チェック
      const hasMedicalKeywords = medicalKeywords.some(keyword => bodyText.includes(keyword))

      if (hasMedicalKeywords) {
        // 「できない」「禁止」などの否定表現があるかチェック
        const hasNegation = bodyText.includes('できません') ||
                           bodyText.includes('できない') ||
                           bodyText.includes('禁止') ||
                           bodyText.includes('行えません')

        if (!hasNegation) {
          issues.medicalProcedures.push({
            ...post,
            reason: '医療行為に関する記述がありますが、看護助手ができないことを明記していない可能性があります'
          })
        }
      }
    })

    console.log('\n🏥 YMYL（Your Money Your Life）対策チェック:\n')
    console.log(`  🔴 断定表現あり: ${issues.absoluteExpressions.length}件`)
    console.log(`  ⚠️  統計データの出典不明: ${issues.missingCitations.length}件`)
    console.log(`  ⚠️  古い給与・年収情報（6ヶ月以上更新なし）: ${issues.oldArticles.length}件`)
    console.log(`  ⚠️  医療行為の記述要確認: ${issues.medicalProcedures.length}件\n`)

    if (issues.absoluteExpressions.length > 0) {
      console.log('🎯 断定表現が含まれる記事:\n')
      issues.absoluteExpressions.slice(0, 10).forEach((post, i) => {
        console.log(`${i + 1}. ${post.title}`)
        console.log(`   ID: ${post._id}`)
        console.log(`   検出された断定表現: ${post.foundWords.join(', ')}`)
        console.log(`   カテゴリ: ${post.categories?.join(', ') || 'なし'}`)
        console.log(`   URL: /posts/${post.slug}`)
        console.log(`   推奨: 「〜の傾向があります」「一般的には〜」などに変更\n`)
      })
    }

    if (issues.missingCitations.length > 0) {
      console.log('🎯 統計データの出典が不明な記事:\n')
      issues.missingCitations.slice(0, 10).forEach((post, i) => {
        console.log(`${i + 1}. ${post.title}`)
        console.log(`   ID: ${post._id}`)
        console.log(`   理由: ${post.reason}`)
        console.log(`   カテゴリ: ${post.categories?.join(', ') || 'なし'}`)
        console.log(`   URL: /posts/${post.slug}`)
        console.log(`   推奨: 厚生労働省などの公的機関データへのリンクを追加\n`)
      })
    }

    if (issues.oldArticles.length > 0) {
      console.log('🎯 更新が必要な給与・年収情報を含む記事:\n')
      issues.oldArticles.slice(0, 10).forEach((post, i) => {
        console.log(`${i + 1}. ${post.title}`)
        console.log(`   ID: ${post._id}`)
        console.log(`   最終更新: ${post.daysSinceUpdate}日前`)
        console.log(`   理由: ${post.reason}`)
        console.log(`   カテゴリ: ${post.categories?.join(', ') || 'なし'}`)
        console.log(`   URL: /posts/${post.slug}\n`)
      })
    }

    if (issues.medicalProcedures.length > 0) {
      console.log('🎯 医療行為の記述を確認すべき記事:\n')
      issues.medicalProcedures.slice(0, 10).forEach((post, i) => {
        console.log(`${i + 1}. ${post.title}`)
        console.log(`   ID: ${post._id}`)
        console.log(`   理由: ${post.reason}`)
        console.log(`   カテゴリ: ${post.categories?.join(', ') || 'なし'}`)
        console.log(`   URL: /posts/${post.slug}`)
        console.log(`   推奨: 看護助手が「できないこと」を明確に記載\n`)
      })
    }

    return issues
  } catch (error) {
    console.error('❌ エラー:', error.message)
    return null
  }
}

/**
 * Body内の「もくじ」見出しを検出
 * 理由: body外部に自動生成される目次があるため、body内の「もくじ」見出しは不要
 */
async function findPostsWithTOC() {
  const query = `*[_type == "post"] {
    _id,
    title,
    "slug": slug.current,
    body,
    "categories": categories[]->title
  }`

  try {
    const posts = await client.fetch(query)
    const postsWithTOC = []

    posts.forEach(post => {
      if (!post.body || !Array.isArray(post.body)) return

      const tocBlocks = post.body.filter(block => {
        if (block._type !== 'block') return false
        if (block.style !== 'h2' && block.style !== 'h3') return false

        const text = block.children
          ?.map(c => c.text || '')
          .join('')
          .trim()

        return /^(もくじ|目次|この記事の目次)$/i.test(text)
      })

      if (tocBlocks.length > 0) {
        postsWithTOC.push({
          ...post,
          tocCount: tocBlocks.length,
          tocStyles: tocBlocks.map(b => b.style)
        })
      }
    })

    console.log(`\n📑 Body内に「もくじ」見出しを含む記事: ${postsWithTOC.length}件`)
    console.log('   理由: body外部に自動生成目次があるため、body内の「もくじ」見出しは削除推奨\n')

    if (postsWithTOC.length > 0) {
      console.log('🎯 「もくじ」見出しを含む記事（TOP10）:\n')
      postsWithTOC.slice(0, 10).forEach((post, i) => {
        console.log(`${i + 1}. ${post.title}`)
        console.log(`   ID: ${post._id}`)
        console.log(`   もくじ見出し数: ${post.tocCount}個 (${post.tocStyles.join(', ')})`)
        console.log(`   カテゴリ: ${post.categories?.join(', ') || 'なし'}`)
        console.log(`   URL: /posts/${post.slug}\n`)
      })

      if (postsWithTOC.length > 10) {
        console.log(`   ... 他${postsWithTOC.length - 10}件\n`)
      }

      console.log('   削除するには:')
      console.log('   node scripts/remove-toc-headings.js remove --apply\n')
    }

    return postsWithTOC
  } catch (error) {
    console.error('❌ エラー:', error.message)
    return []
  }
}

/**
 * 「まとめ」セクションが欠落している記事を検出
 * 理由: 最後のH2は必ず「まとめ」に固定して読了体験を揃えるため
 */
async function findPostsMissingSummary() {
  const query = `*[_type == "post" && count(body[_type == "block" && style == "h2" && pt::text(@) == "まとめ"]) == 0]{
    _id,
    title,
    "slug": slug.current,
    _updatedAt,
    publishedAt
  } | order(_updatedAt desc)`

  try {
    const posts = await client.fetch(query)

    if (!posts || posts.length === 0) {
      console.log('\n✅ すべての記事で「まとめ」セクションが確認できました\n')
      return []
    }

    console.log(`\n⚠️ 「まとめ」セクションが欠落している記事: ${posts.length}件\n`)
    posts.slice(0, 20).forEach((post, index) => {
      const updatedAt = post._updatedAt ? new Date(post._updatedAt).toLocaleString('ja-JP') : '不明'
      console.log(`${index + 1}. ${post.title}`)
      console.log(`   Slug: ${post.slug || '(未設定)'}`)
      console.log(`   最終更新: ${updatedAt}`)
      if (post.publishedAt) {
        console.log(`   公開日: ${new Date(post.publishedAt).toLocaleDateString('ja-JP')}`)
      }
      console.log('')
    })

    const slugCommandSample = posts
      .slice(0, 10)
      .map(post => post.slug)
      .filter(Boolean)
      .join(',')

    console.log('🛠 修正手順:')
    console.log('   1) 影響スラッグを確認（上記一覧）')
    if (slugCommandSample) {
      console.log(
        `   2) node scripts/maintenance.js sanitize --slugs=${slugCommandSample} --force-links`
      )
    } else {
      console.log('   2) node scripts/maintenance.js sanitize --slugs=<slug> --force-links')
    }
    console.log('      ※ sanitize 実行で「まとめ」見出し＋フォールバック本文を自動追記\n')

    return posts
  } catch (error) {
    console.error('❌ エラー:', error.message)
    return []
  }
}

/**
 * 箇条書きでセクションを終えている記事を検出
 * 理由: 各セクションは本文（まとめ文）で締めくくる必要がある
 */
async function checkSectionEndings() {
  const query = `*[_type == "post"] {
    _id,
    title,
    "slug": slug.current,
    body,
    "categories": categories[]->title
  }`

  try {
    const posts = await client.fetch(query)
    const issues = []

    posts.forEach(post => {
      if (!post.body || !Array.isArray(post.body)) return

      const h2Indices = []
      post.body.forEach((block, index) => {
        if (block._type === 'block' && block.style === 'h2') {
          h2Indices.push(index)
        }
      })

      // 各H2セクションをチェック
      for (let i = 0; i < h2Indices.length; i++) {
        const sectionStart = h2Indices[i]
        const sectionEnd = i < h2Indices.length - 1 ? h2Indices[i + 1] : post.body.length

        // セクション内の最後のブロックを取得
        let lastContentBlock = null
        for (let j = sectionEnd - 1; j > sectionStart; j--) {
          const block = post.body[j]
          if (block._type === 'block' && (block.style === 'normal' || block.listItem)) {
            lastContentBlock = { block, index: j }
            break
          }
        }

        // 最後のブロックが箇条書き（listItem）かチェック
        if (lastContentBlock && lastContentBlock.block.listItem) {
          const h2Text = post.body[sectionStart].children?.map(c => c.text).join('') || ''

          if (!issues.some(p => p._id === post._id)) {
            issues.push({
              ...post,
              sectionTitle: h2Text,
              sectionIndex: i + 1,
              totalSections: h2Indices.length
            })
          }
          break // 1つ見つかれば記事全体として記録
        }
      }
    })

    console.log(`\n📝 箇条書きでセクションを終えている記事: ${issues.length}件`)
    console.log('   理由: 各セクションは本文（まとめ文）で締めくくる必要があります\n')

    if (issues.length > 0) {
      console.log('🎯 箇条書きでセクションを終えている記事（TOP15）:\n')
      issues.slice(0, 15).forEach((post, i) => {
        console.log(`${i + 1}. ${post.title}`)
        console.log(`   ID: ${post._id}`)
        console.log(`   問題のセクション: 「${post.sectionTitle}」（${post.sectionIndex}/${post.totalSections}セクション目）`)
        console.log(`   カテゴリ: ${post.categories?.join(', ') || 'なし'}`)
        console.log(`   URL: /posts/${post.slug}`)
        console.log(`   推奨: 箇条書きの後に2〜3文のまとめ文を追加\n`)
      })

      if (issues.length > 15) {
        console.log(`   ... 他${issues.length - 15}件\n`)
      }
    }

    return issues
  } catch (error) {
    console.error('❌ エラー:', error.message)
    return []
  }
}

/**
 * H2まとめセクション後にH2セクションがある記事を検出
 * 理由: 「まとめ」は記事の最後のH2セクションである必要がある
 */
async function checkH2AfterSummary() {
  const query = `*[_type == "post"] {
    _id,
    title,
    "slug": slug.current,
    body,
    "categories": categories[]->title
  }`

  try {
    const posts = await client.fetch(query)
    const issues = []

    posts.forEach(post => {
      if (!post.body || !Array.isArray(post.body)) return

      const h2Blocks = []
      post.body.forEach((block, index) => {
        if (block._type === 'block' && block.style === 'h2') {
          const text = block.children?.map(c => c.text).join('') || ''
          h2Blocks.push({ text, index })
        }
      })

      // 「まとめ」セクションを探す
      const summaryIndex = h2Blocks.findIndex(h2 =>
        h2.text.includes('まとめ') || h2.text.includes('まとめ')
      )

      // 「まとめ」が見つかり、かつそれが最後のH2でない場合
      if (summaryIndex !== -1 && summaryIndex < h2Blocks.length - 1) {
        const sectionsAfterSummary = h2Blocks.slice(summaryIndex + 1).map(h2 => h2.text)

        issues.push({
          ...post,
          summaryTitle: h2Blocks[summaryIndex].text,
          sectionsAfter: sectionsAfterSummary,
          summaryPosition: summaryIndex + 1,
          totalH2Sections: h2Blocks.length
        })
      }
    })

    console.log(`\n📋 「まとめ」の後にH2セクションがある記事: ${issues.length}件`)
    console.log('   理由: 「まとめ」は記事の最後のH2セクションである必要があります\n')

    if (issues.length > 0) {
      console.log('🎯 「まとめ」の後にH2セクションがある記事:\n')
      issues.forEach((post, i) => {
        console.log(`${i + 1}. ${post.title}`)
        console.log(`   ID: ${post._id}`)
        console.log(`   「まとめ」の位置: ${post.summaryPosition}/${post.totalH2Sections}セクション目`)
        console.log(`   「まとめ」の後のセクション: ${post.sectionsAfter.join(', ')}`)
        console.log(`   カテゴリ: ${post.categories?.join(', ') || 'なし'}`)
        console.log(`   URL: /posts/${post.slug}`)
        console.log(`   推奨: 「まとめ」を最後のH2セクションに移動、または後続セクションを削除\n`)
      })
    }

    return issues
  } catch (error) {
    console.error('❌ エラー:', error.message)
    return []
  }
}

/**
 * 総合レポートを生成
 */
async function generateReport() {
  console.log('🔍 ProReNata 記事品質レポート')
  console.log('='.repeat(60))

  const oldPosts = await findOldPosts(6)
  console.log('='.repeat(60))

  const metadataIssues = await findPostsMissingMetadata()
  console.log('='.repeat(60))

  const imageIssues = await findPostsWithoutImages()
  console.log('='.repeat(60))

  const shortPosts = await findShortPosts(2000)
  console.log('='.repeat(60))

  // 次のステップチェックは無効化（RelatedPostsコンポーネントで自動表示済み）
  // const missingNextSteps = await findPostsWithoutNextSteps()
  // console.log('='.repeat(60))

  const affiliateIssues = await checkAffiliateLinks()
  console.log('='.repeat(60))

  const internalLinkIssues = await checkInternalLinks()
  console.log('='.repeat(60))

  const ymylIssues = await checkYMYL()
  console.log('='.repeat(60))

  const postsWithTOC = await findPostsWithTOC()
  console.log('='.repeat(60))

  const sectionEndingIssues = await checkSectionEndings()
  console.log('='.repeat(60))

  const h2AfterSummaryIssues = await checkH2AfterSummary()
  console.log('='.repeat(60))

  // サマリー
  console.log('\n📊 サマリー\n')
  console.log(`  古い記事（6ヶ月以上更新なし）: ${oldPosts.length}件`)

  if (metadataIssues) {
    const criticalIssues = new Set([
      ...metadataIssues.noSlug.map(p => p._id),
      ...metadataIssues.noCategories.map(p => p._id),
      ...metadataIssues.noMetaDescription.map(p => p._id)
    ]).size

    const totalMetadataIssues = new Set([
      ...metadataIssues.noSlug.map(p => p._id),
      ...metadataIssues.noCategories.map(p => p._id),
      ...metadataIssues.noTags.map(p => p._id),
      ...metadataIssues.noExcerpt.map(p => p._id),
      ...metadataIssues.noMetaDescription.map(p => p._id),
      ...metadataIssues.excerptTooShort.map(p => p._id),
      ...metadataIssues.metaDescriptionTooShort.map(p => p._id),
      ...metadataIssues.metaDescriptionTooLong.map(p => p._id)
    ]).size

    console.log(`  🔴 重大な問題（Slug/Categories/MetaDesc欠損）: ${criticalIssues}件`)
    console.log(`  必須フィールド・メタデータ不足: ${totalMetadataIssues}件`)
  }

  if (imageIssues) {
    console.log(`  画像が全くなし: ${imageIssues.noImages.length}件`)
  }

  console.log(`  文字数不足（<2000文字）: ${shortPosts.length}件 ※ユーザビリティ優先`)
  // 「次のステップ」チェックは無効化（RelatedPostsコンポーネントで自動表示済み）
  // console.log(`  「次のステップ」セクションなし: ${missingNextSteps.length}件`)

  if (affiliateIssues) {
    console.log(`  🔴 連続するアフィリエイトリンク: ${affiliateIssues.consecutiveLinks.length}件`)
    console.log(`  ⚠️  リンク数が多すぎる: ${affiliateIssues.tooManyLinks.length}件`)
    if (affiliateIssues.tooManyASPLinks) {
      console.log(`  🔴 ASPアフィリエイトが2個超過: ${affiliateIssues.tooManyASPLinks.length}件（新ルール）`)
    }
    console.log(`  ⚠️  記事内容と関連性が低い可能性: ${affiliateIssues.irrelevantLinks.length}件`)
  }

  if (internalLinkIssues) {
    console.log(`  ⚠️  内部リンクが不足（1本未満）: ${internalLinkIssues.tooFewLinks.length}件`)
    console.log(`  🔴 内部リンクが多すぎる（1本超過）: ${internalLinkIssues.tooManyLinks.length}件（新ルール）`)
    console.log(`  🔴 内部リンクとアフィリエイトが近接: ${internalLinkIssues.mixedWithAffiliate.length}件（新ルール）`)
    console.log(`  🔴 壊れた内部リンク: ${internalLinkIssues.brokenLinks.length}件`)
  }

  if (ymylIssues) {
    console.log(`  🔴 YMYL: 断定表現あり: ${ymylIssues.absoluteExpressions.length}件`)
    console.log(`  ⚠️  YMYL: 統計データの出典不明: ${ymylIssues.missingCitations.length}件`)
    console.log(`  ⚠️  YMYL: 古い給与・年収情報: ${ymylIssues.oldArticles.length}件`)
    console.log(`  ⚠️  YMYL: 医療行為の記述要確認: ${ymylIssues.medicalProcedures.length}件`)
  }

  console.log(`  🔴 Body内に「もくじ」見出しあり: ${postsWithTOC.length}件（削除推奨）`)

  console.log(`  🔴 箇条書きでセクションを終えている: ${sectionEndingIssues.length}件（新ルール）`)
  console.log(`  🔴 「まとめ」の後にH2セクションあり: ${h2AfterSummaryIssues.length}件（新ルール）`)

  console.log('\n='.repeat(60))
}

// CLI実行
if (require.main === module) {
  const args = process.argv.slice(2)
  const command = args[0]

  switch (command) {
    case 'old':
      const months = parseInt(args[1]) || 6
      findOldPosts(months).catch(console.error)
      break

    case 'metadata':
      findPostsMissingMetadata().catch(console.error)
      break

    case 'images':
      findPostsWithoutImages().catch(console.error)
      break

    case 'short':
      const minChars = parseInt(args[1]) || 2000
      findShortPosts(minChars).catch(console.error)
      break

    case 'nextsteps':
      findPostsWithoutNextSteps().catch(console.error)
      break

    case 'affiliate':
      checkAffiliateLinks().catch(console.error)
      break

    case 'internallinks':
      checkInternalLinks().catch(console.error)
      break

    case 'ymyl':
      checkYMYL().catch(console.error)
      break

    case 'toc':
      findPostsWithTOC().catch(console.error)
      break

    case 'missing-summary':
      findPostsMissingSummary().catch(console.error)
      break

    case 'sectionendings':
      checkSectionEndings().catch(console.error)
      break

    case 'h2aftersummary':
      checkH2AfterSummary().catch(console.error)
      break

    case 'report':
      generateReport().catch(console.error)
      break

    case 'all':
      (async () => {
        try {
          console.log('\n📊 === 総合メンテナンス開始 ===\n')
          console.log('ステップ1: 総合レポート生成（問題検出）\n')
          await generateReport()
          console.log('\n' + '='.repeat(60))
          console.log('\nステップ2: カテゴリ再評価\n')
      await recategorizeAllPosts()
      console.log('\n' + '='.repeat(60))
      console.log('\nステップ3: 自動修復実行\n')
      await autoFixMetadata()
      console.log('\n' + '='.repeat(60))
      console.log('\nステップ4: 本文内関連記事・重複段落の整理\n')
      await sanitizeAllBodies()
      console.log('\n' + '='.repeat(60))
      console.log('\n✅ === 総合メンテナンス完了 ===\n')
    } catch (error) {
      console.error('❌ 総合メンテナンス中にエラーが発生:', error.message)
      console.error('スタックトレース:')
      console.error(error.stack)
          process.exit(1)
        }
      })()
      break

    case 'autofix':
      autoFixMetadata().catch(console.error)
      break

    case 'sanitize': {
      (async () => {
        const optionArgs = args.slice(1)
        const options = {}
        let topViewsLimit = null
        let cooldownDays = parseInt(process.env.MAINTENANCE_GEMINI_COOLDOWN_DAYS, 10)
        if (Number.isNaN(cooldownDays) || cooldownDays <= 0) {
          cooldownDays = 30
        }

        optionArgs.forEach(arg => {
          if (!arg) return
          if (arg.startsWith('--slugs=')) {
            const value = arg.replace('--slugs=', '')
            const slugs = value.split(',').map(s => s.trim()).filter(Boolean)
            if (slugs.length > 0) {
              options.slugs = slugs
            }
          } else if (arg === '--force-links') {
            options.forceLinks = true
          } else if (arg.startsWith('--top-views=')) {
            const value = parseInt(arg.replace('--top-views=', ''), 10)
            if (!Number.isNaN(value) && value > 0) {
              topViewsLimit = value
            }
          } else if (arg.startsWith('--cooldown=')) {
            const value = parseInt(arg.replace('--cooldown=', ''), 10)
            if (!Number.isNaN(value) && value > 0) {
              cooldownDays = value
            }
          }
        })

        if (!options.slugs && topViewsLimit !== null) {
          const candidates = await getTopViewedCandidates(topViewsLimit, cooldownDays)
          if (candidates.length === 0) {
            console.log('⚠️  条件に合致する記事が見つからなかったため、メンテナンスをスキップします。')
            return
          }
          const staleCount = candidates.filter(item => item.cooldownSatisfied).length
          const reusedCount = candidates.length - staleCount
          options.slugs = candidates.map(candidate => candidate.slug)
          console.log(
            `👀 アクセス上位 ${options.slugs.length} 件を対象にメンテナンスを実行します（クールダウン経過: ${staleCount}件${reusedCount ? ` / 期間内: ${reusedCount}件` : ''}）`
          )
        }

        await sanitizeAllBodies(options)
      })().catch(console.error)
      break
    }

    case 'recategorize':
      recategorizeAllPosts().catch(console.error)
      break

    case 'dedupe':
      {
        const apply = args.includes('--apply')
        removeDuplicatePosts(apply).catch(console.error)
      }
      break

    case 'sync-categories':
      (async () => {
        const { categories } = await getCategoryResources()
        console.log(`✅ カテゴリ定義を同期しました (${categories.length}件)`)
      })().catch(console.error)
      break

    default:
      console.log(`
📝 ProReNata 記事メンテナンスツール

使い方:
  SANITY_API_TOKEN=<token> node scripts/maintenance.js <コマンド> [オプション]

コマンド:
  old [月数]          古い記事を検出（デフォルト: 6ヶ月）
  metadata            必須フィールド・メタデータ不足を包括的にチェック
                      - Slug、Categories、Tags
                      - Excerpt（50文字以上推奨）
                      - Meta Description（100-180文字推奨、SEO・ユーザビリティ優先）
  images              画像なしの記事を検出
  short [文字数]      文字数不足の記事を検出（デフォルト: 2000文字）
                      ※ユーザビリティ優先、内容の質を重視
  nextsteps           「次のステップ」セクションがない記事を検出
                      ※現在はフロントエンド側で自動表示
  affiliate           アフィリエイトリンクの適切性をチェック
                      - 連続するリンクの検出
                      - リンク数（推奨: 2個以内）
                      - 記事内容との関連性
  internallinks       内部リンクの適切性をチェック
                      - 内部リンク数（推奨: 1本、最大1本）
                      - 内部リンクとアフィリエイトの近接チェック
                      - 壊れたリンクの検出
  ymyl                YMYL（Your Money Your Life）対策チェック
                      - 断定表現の検出（「絶対」「必ず」など）
                      - 統計データの出典確認
                      - 古い給与・年収情報（6ヶ月以上更新なし）
                      - 医療行為の記述チェック
  toc                 Body内の「もくじ」見出しを検出
                      - body外部に自動生成目次があるため削除推奨
  missing-summary     「まとめ」セクションが欠落している記事を検出
                      - 週次メンテ前に実行し、sanitizeで自動復旧
  sectionendings      箇条書きでセクションを終えている記事を検出
                      - 各セクションは本文（まとめ文）で締めくくる必要がある
  h2aftersummary      「まとめ」の後にH2セクションがある記事を検出
                      - 「まとめ」は記事の最後のH2セクションである必要がある
  dedupe [--apply]    タイトル・Slugの重複を検出し、古い記事を削除
                      - --apply を付けると削除を実行（デフォルトはプレビュー）
  report              総合レポートを生成（全チェックを一括実行）
  autofix             スラッグ・カテゴリ・メタディスクリプションを自動修復
                      - Excerpt・Meta Description を白崎セラ口調で再生成
                      - プレースホルダーリンク変換、壊れたリンク削除など
  recategorize        全記事のカテゴリを再評価して最適なカテゴリに変更
                      - タイトル・本文から最適なカテゴリを自動選択
                      - 現在のカテゴリと異なる場合のみ更新
  sync-categories     Sanity Studioのカテゴリ文書を正規ラベルと説明に同期
  sanitize [--slugs=slug1,slug2] [--top-views=10] [--cooldown=30] [--force-links]
                      本文を自動整備（関連記事・重複段落・内部リンク最適化など）
                      - --slugs       : 対象スラッグをカンマ区切りで指定
                      - --top-views   : 閲覧数上位から指定件数を抽出（クールダウン経過分を優先）
                      - --cooldown    : --top-views指定時のクールダウン日数（デフォルト30日）
                      - --force-links : アフィリエイト/内部/出典リンクを全記事で再配置
  all                 総合メンテナンス（report + recategorize + autofix を順次実行）★推奨
                      - 問題を検出し、カテゴリ再評価、自動修復可能なものはすべて修正
                      - GitHub Actions で週3回自動実行（月・水・金 AM3:00）

例:
  # 総合メンテナンス（検出＋自動修正、最推奨）★
  SANITY_WRITE_TOKEN=$SANITY_WRITE_TOKEN node scripts/maintenance.js all

  # 総合レポート（検出のみ）
  SANITY_API_TOKEN=$SANITY_API_TOKEN node scripts/maintenance.js report

  # 自動修正のみ
  SANITY_WRITE_TOKEN=$SANITY_WRITE_TOKEN node scripts/maintenance.js autofix

  # 全記事のカテゴリを再評価
  SANITY_WRITE_TOKEN=$SANITY_WRITE_TOKEN node scripts/maintenance.js recategorize

  # 個別チェック
  SANITY_API_TOKEN=$SANITY_API_TOKEN node scripts/maintenance.js old 3
  SANITY_API_TOKEN=$SANITY_API_TOKEN node scripts/maintenance.js metadata
  SANITY_API_TOKEN=$SANITY_API_TOKEN node scripts/maintenance.js short 2500

チェック項目:
  🔴 重大: Slug、Categories、Meta Description欠損
  ⚠️  推奨: Tags、Excerpt、文字数、画像

環境変数:
  SANITY_API_TOKEN が必要です（書き込み権限不要）
      `)
  }
}

module.exports = {
  findOldPosts,
  findPostsMissingMetadata,
  findPostsWithoutImages,
  findShortPosts,
  findPostsWithoutNextSteps,
  checkAffiliateLinks,
  checkInternalLinks,
  checkYMYL,
  findPostsWithTOC,
  findPostsMissingSummary,
  checkSectionEndings,
  checkH2AfterSummary,
  generateReport,
  autoFixMetadata,
  recategorizeAllPosts
}
