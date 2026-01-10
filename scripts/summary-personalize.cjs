#!/usr/bin/env node

/**
 * Summary Personalizer (Gemini)
 *
 * - Rewrites ONLY the "まとめ" section, keeping the rest untouched.
 * - Reads the body before "まとめ" as context and generates an article-specific summary.
 * - Adds a gentle follow prompt (bookmark / X).
 * - Uses budget-guard before Gemini calls.
 * - Safe-by-default: if budget disallows, exits 0 without failing.
 *
 * Usage:
 *   node scripts/summary-personalize.cjs --limit 10 --apply
 *   node scripts/summary-personalize.cjs --limit 10          # dry-run
 *
 * Env:
 *   SANITY_WRITE_TOKEN=... (or SANITY_API_TOKEN)
 *   GEMINI_API_KEY=...
 *   GEMINI_MODEL=gemini-2.0-flash-lite-001
 *   GEMINI_ESTIMATED_COST_JPY_PER_ARTICLE=0.2
 *   GEMINI_BUDGET_JPY=100
 */

/* eslint-disable no-console */
const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')
const { createClient } = require('@sanity/client')
const { GoogleGenerativeAI } = require('@google/generative-ai')

require('dotenv').config({ path: '.env.local' })
require('dotenv').config({ path: '.env.private' })

const PROGRESS_PATH = path.join(process.cwd(), '.analytics', 'summary-personalize-last-run.json')

function parseArgs(argv) {
  const args = { limit: 10, apply: false, force: false, slugs: null }
  for (let i = 2; i < argv.length; i += 1) {
    const v = argv[i]
    if (v === '--apply') args.apply = true
    if (v === '--dry-run') args.apply = false
    if (v === '--force') args.force = true
    if (v.startsWith('--slugs=')) {
      const value = v.slice('--slugs='.length).trim()
      args.slugs = value ? value.split(',').map(s => s.trim()).filter(Boolean) : []
    }
    if (v === '--limit') {
      args.limit = Number(argv[i + 1])
      i += 1
    }
  }
  if (!Number.isFinite(args.limit) || args.limit <= 0) args.limit = 10
  return args
}

function readJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch {
    return fallback
  }
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8')
}

function extractBlockText(block) {
  if (!block || block._type !== 'block' || !Array.isArray(block.children)) return ''
  return block.children
    .map(child => (child && typeof child.text === 'string' ? child.text : ''))
    .join('')
    .trim()
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

function normalizeText(text = '') {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
}

function buildArticleContext(blocks, summaryIndex) {
  const lines = []
  for (let i = 0; i < summaryIndex; i += 1) {
    const b = blocks[i]
    if (!b || b._type !== 'block') continue
    if (b.style === 'h2' || b.style === 'h3' || b.style === 'normal' || !b.style) {
      const text = extractBlockText(b)
      if (text) lines.push(text)
    }
  }
  const full = normalizeText(lines.join('\n'))
  // コストを抑えつつ品質を上げるため、先頭と末尾（まとめ直前）をバランス良く渡す
  if (full.length <= 2200) return full
  const head = full.slice(0, 1200)
  const tail = full.slice(Math.max(0, full.length - 1200))
  return normalizeText(`${head}\n${tail}`).slice(0, 2400)
}

function splitToPortableTextParagraphs({ summary, follow }) {
  const { randomUUID } = require('crypto')
  const makeP = text => ({
    _type: 'block',
    _key: `p-${randomUUID()}`,
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: `span-${randomUUID()}`, marks: [], text }]
  })
  return [makeP(summary), makeP(follow)]
}

function createGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY is required')
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite-001'
  const genAI = new GoogleGenerativeAI(apiKey)
  return genAI.getGenerativeModel({ model: modelName })
}

function extractAnchors(blocks, summaryIndex) {
  if (!Array.isArray(blocks) || summaryIndex <= 0) return []
  const anchors = []
  const push = text => {
    const raw = String(text || '').trim()
    const t = raw.split(/[：:｜|]/)[0].trim()
    if (!t) return
    if (t.length < 6 || t.length > 22) return
    if (/[0-9０-９]/.test(t)) return
    if (/^(まとめ|参考|免責|注意|次のステップ)$/u.test(t)) return
    if (!anchors.includes(t)) anchors.push(t)
  }

  for (let i = 0; i < summaryIndex; i += 1) {
    const b = blocks[i]
    if (!b || b._type !== 'block') continue
    const text = extractBlockText(b)
    if (!text) continue
    if (b.style === 'h2' || b.style === 'h3') push(text)
    if (b.listItem === 'bullet') push(text)
  }

  return anchors.slice(-8)
}

function buildPrompt({ title, context, anchors }) {
  const anchorText = anchors.map(a => `- ${a}`).join('\n')
  const followTemplates = [
    'もしよければ、ブックマークしてまた見返してくださいね。',
    'もしよければ、公式X（@prorenata_jp）もフォローしてみてくださいね。'
  ]
  const followText = followTemplates.map(t => `- ${t}`).join('\n')
  return `あなたはProReNataの記事執筆者です。一人称は必ず「わたし」。丁寧な「です・ます」調を基本としつつ、要点や列挙部分では「体言止め」や簡潔な表現を使い、幼くならないようプロフェッショナルかつ温かみのある文章を書いてください。

禁止事項:
- 文章内で自分の名前を出さない（例: 「白崎セラです」「セラが」「セラの」など）
- 「看護助手の私が教える、」のような肩書き主張を入れない

記事タイトル: ${title}

記事本文（まとめの前までの抜粋）:
${context}

本文から抽出したキーワード候補（必ずこの中から最低2つをそのまま含める）:
${anchorText}

followは次の定型文のどちらかを「そのまま」使ってください（改変禁止）:
${followText}

要件:
1) summaryは220〜420文字（改行なし）
2) followは上の定型文から1つだけ選ぶ（改行なし）
3) 本文に書かれていない具体例・エピソード・私生活は一切追加しない
4) 「汎用テンプレの言い回し」を避け、本文の内容に寄せる

出力形式:
必ずJSONのみを出力（説明文は禁止）。
{"summary":"...","follow":"..."}`
}

async function generateSummaryJson({ geminiModel, title, context, anchors }) {
  const prompt = buildPrompt({ title, context, anchors })

  const result = await geminiModel.generateContent(prompt)
  const response = await result.response
  return String(response.text() || '').trim()
}

function safeParseJson(text) {
  const raw = String(text || '').trim()
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) return null
  try {
    return JSON.parse(match[0])
  } catch {
    return null
  }
}

function validateSummary({ summary, follow, anchors }) {
  const errors = []
  const s = String(summary || '').replace(/\s+/g, ' ').trim()
  const fRaw = String(follow || '').replace(/\s+/g, ' ').trim()
  if (!s) errors.push('missing_summary')
  if (!fRaw) errors.push('missing_follow')
  const sLen = [...s].length
  if (sLen < 220 || sLen > 520) errors.push('summary_length')
  const followBookmark = 'もしよければ、ブックマークしてまた見返してくださいね。'
  const followX = 'もしよければ、公式X（@prorenata_jp）もフォローしてみてくださいね。'
  const hasX = /(@prorenata_jp|公式X)/.test(fRaw)
  const hasBookmark = /(ブックマーク|お気に入り)/.test(fRaw)
  const f = hasX ? followX : hasBookmark ? followBookmark : ''
  if (!f) errors.push('follow_missing_prompt')
  const banned = ['カフェ', '友達', '音楽', '休日', '旅行', 'デート', 'わたしみたいに', 'わたしは']
  if (banned.some(w => s.includes(w) || fRaw.includes(w))) errors.push('banned_words')
  const hits = anchors.filter(a => a && s.includes(a)).length
  if (anchors.length >= 2 && hits < 2) errors.push('missing_anchors')
  if (/^まとめ\s*$/.test(s) || s.startsWith('まとめ')) errors.push('summary_includes_heading')
  return { ok: errors.length === 0, errors, summary: s, follow: f }
}

async function generateWithRetry({ geminiModel, title, context, anchors }) {
  const firstRaw = await generateSummaryJson({ geminiModel, title, context, anchors })
  const firstJson = safeParseJson(firstRaw)
  const first = validateSummary({
    summary: firstJson?.summary,
    follow: firstJson?.follow,
    anchors
  })
  if (first.ok) return { summary: first.summary, follow: first.follow }

  const retryPrompt = `次のJSONは要件違反の可能性があります。本文の内容だけに基づいて、要件を厳守して書き直してください。
- summary: 220〜360文字、改行なし、本文の内容だけ、キーワード候補から最低2つをそのまま含める。文章が幼くならないよう、適宜「体言止め」等でバランスを整える。
- follow: 1文だけ、改行なし、ブックマーク or 公式X（@prorenata_jp）
- 私生活や本文にない具体例は追加しない
出力はJSONのみ。

記事タイトル: ${title}
本文抜粋:
${context}

キーワード候補:
${anchors.map(a => `- ${a}`).join('\n')}

前回の出力:
${firstRaw}

書き直し結果（JSONのみ）:`
  const retry = await geminiModel.generateContent(retryPrompt)
  const retryRes = await retry.response
  const secondRaw = String(retryRes.text() || '').trim()
  const secondJson = safeParseJson(secondRaw)
  const second = validateSummary({
    summary: secondJson?.summary,
    follow: secondJson?.follow,
    anchors
  })
  if (second.ok) return { summary: second.summary, follow: second.follow }

  const compressPrompt = `本文の内容だけに基づいて、さらに短く整えてください。
- summary: 200〜280文字、2〜3文、改行なし、キーワード候補から最低2つをそのまま含める
- follow: 1文だけ（50文字以内、改行なし）、ブックマーク or 公式X（@prorenata_jp）をどちらか1つだけ
出力はJSONのみ。

記事タイトル: ${title}
本文抜粋:
${context}

キーワード候補:
${anchors.map(a => `- ${a}`).join('\n')}

直前の出力:
${secondRaw}

短縮した出力（JSONのみ）:`
  const thirdReq = await geminiModel.generateContent(compressPrompt)
  const thirdRes = await thirdReq.response
  const thirdRaw = String(thirdRes.text() || '').trim()
  const thirdJson = safeParseJson(thirdRaw)
  const third = validateSummary({
    summary: thirdJson?.summary,
    follow: thirdJson?.follow,
    anchors
  })
  if (!third.ok) throw new Error(`gemini_output_failed_validation:${third.errors.join(',')}`)
  return { summary: third.summary, follow: third.follow }
}

async function main() {
  const args = parseArgs(process.argv)

  const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN || process.env.SANITY_TOKEN
  if (!token) throw new Error('SANITY_WRITE_TOKEN (or SANITY_API_TOKEN) is required')

  const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    token,
    useCdn: false
  })

  const progress = readJson(PROGRESS_PATH, { updatedAt: null, processed: {} })
  const processed = progress && typeof progress === 'object' && progress.processed && typeof progress.processed === 'object'
    ? progress.processed
    : {}

  const query = args.slugs
    ? `*[_type=="post" && slug.current in $slugs]{_id,title,"slug":slug.current,body,_updatedAt}`
    : `*[_type=="post" && (!defined(internalOnly)||internalOnly==false) && defined(slug.current)]{
      _id,
      title,
      "slug": slug.current,
      body,
      _updatedAt
    }`
  const posts = await client.fetch(query, args.slugs ? { slugs: args.slugs } : {})

  const candidates = posts
    .filter(p => p && p.slug && Array.isArray(p.body))
    .filter(p => {
      const { summaryIndex } = findSummaryRange(p.body)
      if (summaryIndex === -1) return false
      if (args.force) return true
      const record = processed[p.slug]
      return !record || !record.personalizedAt
    })
    .sort((a, b) => String(a._updatedAt || '').localeCompare(String(b._updatedAt || '')))

  const targets = candidates.slice(0, args.limit)

  console.log(JSON.stringify({ mode: args.apply ? 'apply' : 'dry-run', total: posts.length, candidates: candidates.length, target: targets.length }, null, 2))
  if (targets.length === 0) return

  if (!args.apply) {
    console.log('\nTargets:')
    targets.forEach(p => console.log(`- ${p.slug}`))
    return
  }

  // Budget gate (reserve for target count)
  const budget = spawnSync(
    process.execPath,
    [path.join('scripts', 'budget-guard.cjs'), '--reserve-articles', String(targets.length)],
    { encoding: 'utf8', env: process.env }
  )
  const budgetOut = `${budget.stdout || ''}\n${budget.stderr || ''}`
  if (budget.status !== 0) {
    console.warn('WARN: budget-guard returned non-zero, skipping to be safe')
    return
  }
  if (budgetOut.includes('allowed=false')) {
    console.log('⏭️ Gemini budget disallowed. Skipping summary personalization safely.')
    return
  }

  const geminiModel = createGeminiModel()

  let updated = 0
  for (const post of targets) {
    const { summaryIndex, endIndex } = findSummaryRange(post.body)
    if (summaryIndex === -1) {
      processed[post.slug] = { skippedAt: new Date().toISOString(), reason: 'missing_summary' }
      continue
    }

    const context = buildArticleContext(post.body, summaryIndex)
    if (!context) {
      processed[post.slug] = { skippedAt: new Date().toISOString(), reason: 'empty_context' }
      continue
    }
    const anchors = extractAnchors(post.body, summaryIndex)
    if (anchors.length < 2) {
      processed[post.slug] = { skippedAt: new Date().toISOString(), reason: 'missing_anchors' }
      continue
    }

    try {
      const generated = await generateWithRetry({ geminiModel, title: post.title || post.slug, context, anchors })
      const newSummaryBlocks = splitToPortableTextParagraphs(generated)
      const nextBody = [
        ...post.body.slice(0, summaryIndex + 1),
        ...newSummaryBlocks,
        ...post.body.slice(endIndex)
      ]

      await client.patch(post._id).set({ body: nextBody }).commit()

      // draft/published both (best-effort)
      const id = post._id
      const publishedId = id.startsWith('drafts.') ? id.slice('drafts.'.length) : id
      const draftId = id.startsWith('drafts.') ? id : `drafts.${id}`
      if (id === publishedId) {
        await client.patch(draftId).set({ body: nextBody }).commit().catch(() => null)
      } else {
        await client.patch(publishedId).set({ body: nextBody }).commit().catch(() => null)
      }

      processed[post.slug] = { personalizedAt: new Date().toISOString() }
      updated += 1
      console.log(`✅ summary personalized: ${post.slug}`)
    } catch (err) {
      processed[post.slug] = { failedAt: new Date().toISOString(), error: String(err?.message || err) }
      console.warn(`⚠️ failed: ${post.slug}:`, err?.message || err)
    }
  }

  writeJson(PROGRESS_PATH, { updatedAt: new Date().toISOString(), updated, processed })
  console.log(JSON.stringify({ updated, progressPath: '.analytics/summary-personalize-last-run.json' }, null, 2))
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
