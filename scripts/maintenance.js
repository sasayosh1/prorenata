/**
 * 記事メンテナンスツール
 *
 * 記事の品質チェック・修正支援ツール
 * - 古い記事の検出
 * - メタデータ不足の記事検出
 * - 画像なし記事の検出
 * - 文字数不足の記事検出
 */

const path = require('path')
const { spawn } = require('child_process')
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
} = require('./utils/postHelpers')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
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
  'fam-ad.com'
]

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

const REFERENCE_MAPPINGS = [
  {
    keywords: ['厚生労働省', '介護従事者処遇状況等調査'],
    url: 'https://www.mhlw.go.jp/toukei/list/176-1.html'
  },
  {
    keywords: ['厚生労働省', '賃金構造基本統計調査'],
    url: 'https://www.mhlw.go.jp/toukei/list/chinginkouzou.html'
  },
  {
    keywords: ['厚生労働省', '医療施設調査'],
    url: 'https://www.mhlw.go.jp/toukei/list/79-1.html'
  },
  {
    keywords: ['看護師等学校養成所', '卒業生就業状況'],
    url: 'https://www.mhlw.go.jp/toukei/list/100-1.html'
  },
  {
    keywords: ['総務省', '労働力調査'],
    url: 'https://www.stat.go.jp/data/roudou/'
  },
  {
    keywords: ['日本看護協会', '看護統計'],
    url: 'https://www.nurse.or.jp/home/statistics/index.html'
  },
  {
    keywords: ['日本看護協会', '看護職員の需給', '働き方調査'],
    url: 'https://www.nurse.or.jp/home/publication/pdf/report/2023_jinzai_chousa.pdf'
  },
  {
    keywords: ['労働政策研究', '研修機構'],
    url: 'https://www.jil.go.jp/'
  },
  {
    keywords: ['東京都', '産業労働局', '医療事務', '賃金実態調査'],
    url: 'https://www.metro.tokyo.lg.jp/tosei/hodohappyo/press/2023/03/15/13.html'
  }
]

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
  if (!block || block._type !== 'block' || !Array.isArray(block.markDefs)) {
    return false
  }
  return block.markDefs.some(def => {
    if (!def || typeof def.href !== 'string') {
      return false
    }
    return AFFILIATE_HOST_KEYWORDS.some(keyword => def.href.includes(keyword))
  })
}

function needsSlugRegeneration(slug) {
  if (!slug || typeof slug !== 'string') return true
  const normalized = slug.trim().toLowerCase()
  if (!normalized.startsWith('nursing-assistant-')) return true
  if (/[^a-z0-9-]/.test(normalized)) return true
  const remainder = normalized.replace(/^nursing-assistant-/, '')
  const segments = remainder.split('-').filter(Boolean)
  return segments.length < 2 || segments.length > 3
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
      return mapping.url
    }
  }
  return null
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
  const DISCLAIMER_TEXT = '免責事項: この記事は、看護助手としての現場経験に基づく一般的な情報提供を目的としています。職場や地域、個人の状況によって異なる場合がありますので、詳細は勤務先や専門家にご確認ください。'

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

  return {
    body: cleaned,
    removedRelated,
    removedDuplicateParagraphs: removedDuplicates,
    removedInternalLinks,
    removedForbiddenSections,
    removedSummaryHelpers,
    removedAffiliateCtas,
    removedSummaryHeadings,
    disclaimerAdded: hasDisclaimer ? 0 : 1
  }
}

async function normalizeReferenceLinks(blocks, articleTitle = '') {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return { body: blocks, fixed: 0, unresolved: [] }
  }

  const clonedBlocks = deepClone(blocks)
  let fixed = 0
  const unresolved = []
  const cache = new Map()

  const getLabelForMark = (block, markKey) => {
    if (!block || !Array.isArray(block.children)) return ''
    return block.children
      .filter(child => Array.isArray(child?.marks) && child.marks.includes(markKey))
      .map(child => child.text || '')
      .join('')
      .trim()
  }

  for (const block of clonedBlocks) {
    if (!block || block._type !== 'block') continue
    const text = extractBlockText(block)
    const normalized = text.replace(/\s+/g, ' ').trim()
    if (!normalized.startsWith('参考')) continue
    if (!Array.isArray(block.markDefs) || block.markDefs.length === 0) continue

    const referenceMarks = block.markDefs.filter(def => def && def._type === 'link' && typeof def.href === 'string')
    if (referenceMarks.length === 0) continue

    let blockModified = false

    for (const markDef of referenceMarks) {
      const currentUrl = ensureHttpsUrl(markDef.href)
      const label = getLabelForMark(block, markDef._key) || normalized.replace(/^参考[:：]?\s*/, '')
      const mappingUrl = matchReferenceMapping(label)

      let targetUrl = ensureHttpsUrl(mappingUrl || currentUrl)

      if (!targetUrl) {
        unresolved.push({ articleTitle, label, url: currentUrl })
        continue
      }

      let resolvedUrl = await resolveReferenceUrl(targetUrl, cache)
      if (!resolvedUrl && mappingUrl) {
        resolvedUrl = ensureHttpsUrl(mappingUrl)
      }

      if (resolvedUrl && isTopLevelUrl(resolvedUrl) && mappingUrl) {
        resolvedUrl = ensureHttpsUrl(mappingUrl)
      }

      if (!resolvedUrl || isTopLevelUrl(resolvedUrl)) {
        unresolved.push({ articleTitle, label, url: currentUrl })
        continue
      }

      if (resolvedUrl !== markDef.href) {
        markDef.href = resolvedUrl
        fixed += 1
        blockModified = true
      }
    }

    if (blockModified) {
      // 余分な markDefs を整理（重複解除）
      const uniqueDefs = []
      const seenKeys = new Set()
      block.markDefs.forEach(def => {
        if (!def || !def._key || seenKeys.has(def._key)) return
        seenKeys.add(def._key)
        uniqueDefs.push(def)
      })
      block.markDefs = uniqueDefs
    }
  }

  return {
    body: clonedBlocks,
    fixed,
    unresolved
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

  const alreadyExpanded = blocks.some(block => block?._key && block._key.startsWith('auto-expansion-'))
  if (alreadyExpanded) {
    return { body: blocks, expanded: false }
  }

  const timestampBase = Date.now()
  const templates = [
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

  const additions = []
  let expanded = false
  let currentBody = [...blocks]

  for (let i = 0; i < templates.length; i += 1) {
    additions.push(...templates[i](i))
    currentBody = [...blocks, ...additions]
    plain = blocksToPlainText(currentBody)
    expanded = true
    if (plain.length >= 2000) {
      break
    }
  }

  if (!expanded) {
    return { body: blocks, expanded: false }
  }

  return { body: currentBody, expanded: true }
}

async function getCategoryResources() {
  try {
    const categories = await client.fetch(`*[_type == "category"] { _id, title }`)
    const map = new Map()

    categories.forEach(category => {
      if (category?._id && category?.title) {
        map.set(category.title, category._id)
      }
    })

    return {
      categories,
      map,
      fallback: categories[0] || null,
    }
  } catch (error) {
    console.error('❌ カテゴリ取得エラー:', error.message)
    return { categories: [], map: new Map(), fallback: null }
  }
}

function sanitiseSlugValue(slug) {
  return (slug || '')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

async function ensureUniqueSlug(candidate, excludeId) {
  let base = sanitiseSlugValue(candidate)
  if (!base) {
    base = generateSlugFromTitle('看護助手-article')
  }

  let attempt = 0
  let slug = base

  for (;;) {
    // eslint-disable-next-line no-await-in-loop
    const existing = await client.fetch(
      `*[_type == "post" && slug.current == $slug && _id != $id][0] { _id }`,
      { slug, id: excludeId }
    )

    if (!existing) {
      return slug
    }

    attempt += 1
    slug = sanitiseSlugValue(`${base}-${Date.now().toString().slice(-6)}-${attempt}`)
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

  const posts = await client.fetch(`
    *[_type == "post"] {
      _id,
      title,
      body,
      "categories": categories[]->{ _id, title }
    }
  `)

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
    const categoryRefs = [{ _type: 'reference', _ref: bestCategory._id }]

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
  const geminiApiKey = process.env.GEMINI_API_KEY
  if (geminiApiKey) {
    const genAI = new GoogleGenerativeAI(geminiApiKey)
    geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-001' })
    console.log('✅ Gemini API使用可能（H3セクション・まとめ最適化）')
  } else {
    console.log('⚠️  GEMINI_API_KEY未設定（簡易版を使用）')
  }

  const { categories, fallback } = await getCategoryResources()

  const posts = await client.fetch(`
    *[_type == "post" && (
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
      "categories": categories[]->{ _id, title }
    }
  `)

  if (!posts || posts.length === 0) {
    console.log('✅ 修復対象の記事はありません')
    return { total: 0, updated: 0 }
  }

  console.log(`対象記事: ${posts.length}件\n`)

  let updated = 0

  for (const post of posts) {
    const updates = {}
    const publishedId = post._id.startsWith('drafts.') ? post._id.replace(/^drafts\./, '') : post._id
    const currentCategories = Array.isArray(post.categories) ? post.categories.filter(Boolean) : []
    let categoryRefs = currentCategories
      .filter(category => category?._id)
      .map(category => ({ _type: 'reference', _ref: category._id }))

    // カテゴリが空の場合、本文から最適なカテゴリを自動選択
    if (categoryRefs.length === 0) {
      const plainText = blocksToPlainText(post.body)
      const bestCategory = selectBestCategory(post.title, plainText, categories)
      if (bestCategory) {
        categoryRefs = [{ _type: 'reference', _ref: bestCategory._id }]
      } else if (fallback) {
        categoryRefs = [{ _type: 'reference', _ref: fallback._id }]
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
    if (post.body && Array.isArray(post.body)) {
      const optimizedBody = await optimizeSummarySection(updates.body || post.body, post.title, geminiModel)
      if (JSON.stringify(optimizedBody) !== JSON.stringify(updates.body || post.body)) {
        updates.body = optimizedBody
        summaryOptimized = true
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
    let disclaimersAdded = 0
    let referencesFixed = 0
    let unresolvedReferences = []
    let shortContentExpanded = false
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

      const referenceResult = await normalizeReferenceLinks(updates.body || post.body, post.title)
      if (referenceResult.fixed > 0) {
        updates.body = referenceResult.body
        referencesFixed = referenceResult.fixed
      } else if (referenceResult.body !== (updates.body || post.body)) {
        updates.body = referenceResult.body
      }
      unresolvedReferences = referenceResult.unresolved

      const expansionResult = expandShortContent(updates.body || post.body, post.title)
      if (expansionResult.expanded) {
        updates.body = expansionResult.body
        shortContentExpanded = true
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

    const categoriesForMeta = (updates.categories || categoryRefs || currentCategories || [])
      .map(ref => {
        if (ref?._ref) {
          const match = categories.find(category => category._id === ref._ref)
          return match?.title
        }
        return ref?.title
      })
      .filter(Boolean)

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
async function sanitizeAllBodies() {
  console.log('\n🧹 本文内の関連記事・重複段落の自動整理を開始します\n')

  const posts = await client.fetch(`
    *[_type == "post"] {
      _id,
      title,
      body,
      "slug": slug.current
    }
  `)

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
      disclaimersAdded: 0
    }
  }

  let updated = 0
  let totalRelatedRemoved = 0
  let totalDuplicatesRemoved = 0
  let totalInternalLinksRemoved = 0
  let totalForbiddenSectionsRemoved = 0
  let totalSummaryHelpersRemoved = 0
  let totalAffiliateCtasRemoved = 0
  let totalSummaryHeadingsRemoved = 0
  let totalDisclaimersAdded = 0
  let totalReferencesFixed = 0
  let totalShortExpansions = 0
  let totalSlugRegenerated = 0
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

      bodyChanged =
        removedRelated > 0 ||
        removedDuplicateParagraphs > 0 ||
        removedInternalLinks > 0 ||
        removedForbiddenSections > 0 ||
        removedSummaryHelpers > 0 ||
        removedAffiliateCtas > 0 ||
        removedSummaryHeadings > 0 ||
        disclaimerAdded > 0

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

      expansionResult = expandShortContent(body, post.title)
      body = expansionResult.body
      if (expansionResult.expanded) {
        totalShortExpansions += 1
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
    totalDisclaimersAdded += disclaimerAdded
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
    if (disclaimerAdded > 0) {
      console.log('   免責事項を追記しました')
    }
    if (referencesFixedForPost > 0) {
      console.log(`   出典リンクを更新: ${referencesFixedForPost}件`)
    }
    if (finalPlainLength < 2000) {
      console.log(`   ⚠️ 本文は現在 ${finalPlainLength}文字で2000文字未満です`)
    }
    if (slugUpdated && updates.slug?.current) {
      console.log(`   スラッグを再生成: ${updates.slug.current}`)
    }
  }

  console.log(`\n🧹 本文整理完了: ${updated}/${posts.length}件を更新（関連記事:${totalRelatedRemoved} / 重複段落:${totalDuplicatesRemoved} / 余分な内部リンク:${totalInternalLinksRemoved} / 禁止セクション:${totalForbiddenSectionsRemoved} / まとめ補助:${totalSummaryHelpersRemoved} / 訴求ブロック:${totalAffiliateCtasRemoved} / 重複まとめ:${totalSummaryHeadingsRemoved} / 出典更新:${totalReferencesFixed} / 自動追記:${totalShortExpansions} / スラッグ再生成:${totalSlugRegenerated} / 免責事項追記:${totalDisclaimersAdded}）\n`)

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
    relatedRemoved: totalRelatedRemoved,
    duplicateParagraphsRemoved: totalDuplicatesRemoved,
    extraInternalLinksRemoved: totalInternalLinksRemoved,
    forbiddenSectionsRemoved: totalForbiddenSectionsRemoved,
    summaryHelpersRemoved: totalSummaryHelpersRemoved,
    referencesFixed: totalReferencesFixed,
    shortExpansions: totalShortExpansions,
    unresolvedReferences,
    affiliateCtasRemoved: totalAffiliateCtasRemoved,
    summaryHeadingsRemoved: totalSummaryHeadingsRemoved,
    disclaimersAdded: totalDisclaimersAdded,
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
      tooFewLinks: [],       // 内部リンクが少ない（2個未満）
      tooManyLinks: [],      // 内部リンクが多すぎる（3個超過）
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

      // 内部リンク数チェック（2個未満は少ない）
      if (internalLinkCount < 2) {
        issues.tooFewLinks.push({
          ...post,
          internalLinkCount
        })
      }

      // 内部リンク数チェック（3個超過）
      if (internalLinkCount > 3) {
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
    console.log(`  ⚠️  内部リンクが少ない（2個未満）: ${issues.tooFewLinks.length}件`)
    console.log(`  🔴 内部リンクが多すぎる（3個超過）: ${issues.tooManyLinks.length}件（新ルール）`)
    console.log(`  🔴 内部リンクとアフィリエイトが近接: ${issues.mixedWithAffiliate.length}件（新ルール）`)
    console.log(`  🔴 壊れた内部リンク: ${issues.brokenLinks.length}件\n`)

    if (issues.tooFewLinks.length > 0) {
      console.log('🎯 内部リンクが少ない記事（TOP10）:\n')
      issues.tooFewLinks.slice(0, 10).forEach((post, i) => {
        console.log(`${i + 1}. ${post.title}`)
        console.log(`   ID: ${post._id}`)
        console.log(`   内部リンク数: ${post.internalLinkCount}個（推奨: 2個以上）`)
        console.log(`   カテゴリ: ${post.categories?.join(', ') || 'なし'}`)
        console.log(`   URL: /posts/${post.slug}\n`)
      })
    }

    if (issues.tooManyLinks.length > 0) {
      console.log('🎯 内部リンクが多すぎる記事（TOP10）:\n')
      issues.tooManyLinks.slice(0, 10).forEach((post, i) => {
        console.log(`${i + 1}. ${post.title}`)
        console.log(`   ID: ${post._id}`)
        console.log(`   内部リンク数: ${post.internalLinkCount}個（推奨: 最大2-3個）`)
        console.log(`   カテゴリ: ${post.categories?.join(', ') || 'なし'}`)
        console.log(`   URL: /posts/${post.slug}`)
        console.log(`   注: ユーザビリティ最優先。無理に最大数を配置しない\n`)
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
    console.log(`  ⚠️  内部リンクが少ない（2個未満）: ${internalLinkIssues.tooFewLinks.length}件`)
    console.log(`  🔴 内部リンクが多すぎる（3個超過）: ${internalLinkIssues.tooManyLinks.length}件（新ルール）`)
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

    case 'sanitize':
      sanitizeAllBodies().catch(console.error)
      break

    case 'recategorize':
      recategorizeAllPosts().catch(console.error)
      break

    case 'dedupe':
      {
        const apply = args.includes('--apply')
        removeDuplicatePosts(apply).catch(console.error)
      }
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
                      - リンク数（推奨: 2-3個）
                      - 記事内容との関連性
  internallinks       内部リンクの適切性をチェック
                      - 内部リンク数（推奨: 2個以上、最大2-3個）
                      - 内部リンクとアフィリエイトの近接チェック
                      - 壊れたリンクの検出
  ymyl                YMYL（Your Money Your Life）対策チェック
                      - 断定表現の検出（「絶対」「必ず」など）
                      - 統計データの出典確認
                      - 古い給与・年収情報（6ヶ月以上更新なし）
                      - 医療行為の記述チェック
  toc                 Body内の「もくじ」見出しを検出
                      - body外部に自動生成目次があるため削除推奨
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
  checkSectionEndings,
  checkH2AfterSummary,
  generateReport,
  autoFixMetadata,
  recategorizeAllPosts
}
