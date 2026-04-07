/**
 * x-mailer.mjs
 * X投稿テキスト生成 & Gmail 送信スクリプト
 *
 * ONモード  (月・水・金・日): ProReNata記事 → URL付き投稿
 * OFFモード (火・木・土)   : note記事     → 独白投稿（URLなし）
 *
 * DRY_RUN=1 で外部通信なしのローカルテスト可能
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import process from 'node:process'
import nodemailer from 'nodemailer'
import { GoogleGenerativeAI } from '@google/generative-ai'
import twitterText from 'twitter-text'

const { parseTweet } = twitterText
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')

// ─── 設定 ──────────────────────────────────────────────────────────────────
const GEMINI_MODEL = 'gemini-2.0-flash-lite-001'
const HISTORY_FILE = path.join(ROOT, '.analytics/x_mailer_history.json')
const NOTE_DIR = path.join(ROOT, '03_note/記事')
const HISTORY_DAYS = 14
const MAX_HISTORY = 200
const SITE_BASE = 'https://prorenata.jp'

const PROTECTED_SLUGS = [
  'comparison-of-three-resignation-agencies',
  'nursing-assistant-compare-services-perspective',
]

const NG_REGEX =
  /(必ず|絶対|100%|確実に|治る|治ります|診断|処方|投資|稼げる|しなさい|今年|20[0-9]{2}年)/i

// ON: URL を除いた本文の目標文字数
const ON_MIN = 100
const ON_MAX = 135
// OFF: 本文のみの目標文字数
const OFF_MIN = 120
const OFF_MAX = 140

const isDryRun = process.env.DRY_RUN === '1'

// ─── ユーティリティ ────────────────────────────────────────────────────────
function requiredEnv(name) {
  const v = process.env[name]?.trim()
  if (!v) {
    if (isDryRun) return `MOCK_${name}`
    throw new Error(`Missing required env: ${name}`)
  }
  return v
}

function optionalEnv(name, fallback = '') {
  return process.env[name]?.trim() || fallback
}

function weightedLen(text) {
  return Number(parseTweet(String(text || '')).weightedLength || 0)
}

function isNgFree(text) {
  return !NG_REGEX.test(text)
}

// ─── 曜日 → モード判定 ────────────────────────────────────────────────────
function getMode(date = new Date()) {
  const day = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    weekday: 'short',
  }).format(date)
  return ['月', '水', '金', '日'].includes(day) ? 'on' : 'off'
}

// ─── 履歴管理 ──────────────────────────────────────────────────────────────
function loadHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'))
    }
  } catch {
    // 読み取り失敗時は空配列で続行
  }
  return []
}

function saveHistory(history, entry) {
  const updated = [{ ...entry, timestamp: new Date().toISOString() }, ...history].slice(
    0,
    MAX_HISTORY
  )
  const dir = path.dirname(HISTORY_FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(updated, null, 2))
}

function usedRecently(history, source) {
  const cutoff = Date.now() - HISTORY_DAYS * 24 * 60 * 60 * 1000
  return history.some(
    (e) => e.source === source && new Date(e.timestamp).getTime() > cutoff
  )
}

// ─── ProReNata 記事取得（ONモード） ───────────────────────────────────────
async function fetchProReNataPost(history) {
  const projectId =
    optionalEnv('NEXT_PUBLIC_SANITY_PROJECT_ID') || optionalEnv('SANITY_PROJECT_ID')
  const dataset =
    optionalEnv('NEXT_PUBLIC_SANITY_DATASET') ||
    optionalEnv('SANITY_DATASET', 'production')
  const apiVersion =
    optionalEnv('NEXT_PUBLIC_SANITY_API_VERSION') ||
    optionalEnv('SANITY_API_VERSION', '2024-01-01')
  const token = optionalEnv('SANITY_READ_TOKEN')

  if (!projectId) throw new Error('SANITY_PROJECT_ID が設定されていません')

  const groq = `
    *[_type == "post"
      && defined(slug.current)
      && (!defined(maintenanceLocked) || maintenanceLocked == false)
      && (!defined(internalOnly) || internalOnly == false)
    ] | order(_createdAt desc) [0...200] {
      title,
      "slug": slug.current,
      excerpt
    }
  `

  const url = `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}?query=${encodeURIComponent(groq)}`
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new Error(`Sanity fetch 失敗: ${res.status} ${res.statusText}`)

  const { result } = await res.json()
  const candidates = (result || []).filter(
    (p) => p?.slug && !PROTECTED_SLUGS.includes(p.slug) && !usedRecently(history, p.slug)
  )

  if (candidates.length === 0) {
    throw new Error('利用可能な記事がありません（履歴・保護スラッグ除外後）')
  }

  return candidates[Math.floor(Math.random() * candidates.length)]
}

// ─── note 記事取得（OFFモード） ────────────────────────────────────────────
function listNoteFiles() {
  if (!fs.existsSync(NOTE_DIR)) return []
  const files = []
  for (const entry of fs.readdirSync(NOTE_DIR)) {
    // YYYY-MM 形式のフォルダのみ対象（blog_rewrites 等を除外）
    if (!/^\d{4}-\d{2}$/.test(entry)) continue
    const monthDir = path.join(NOTE_DIR, entry)
    if (!fs.statSync(monthDir).isDirectory()) continue
    for (const file of fs.readdirSync(monthDir)) {
      if (!file.endsWith('.md') || file.startsWith('00_')) continue
      files.push(path.join(monthDir, file))
    }
  }
  return files
}

function parseNoteFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8')
  const lines = raw.split('\n')
  const title = (lines.find((l) => l.startsWith('# ')) || '').replace(/^# /, '').trim()
  const separatorIdx = lines.findIndex((l) => l.trim() === '---')
  const bodyLines = separatorIdx > 0 ? lines.slice(1, separatorIdx) : lines.slice(1)
  const body = bodyLines.join('\n').trim().slice(0, 300)
  return { title: title || path.basename(filePath, '.md'), body, fileName: path.basename(filePath) }
}

function fetchNoteArticle(history) {
  const files = listNoteFiles()
  if (files.length === 0) throw new Error(`note ファイルが見つかりません: ${NOTE_DIR}`)

  const candidates = files.filter((f) => !usedRecently(history, path.basename(f)))
  const pool = candidates.length > 0 ? candidates : files // 全消化時はリセット扱い

  const filePath = pool[Math.floor(Math.random() * pool.length)]
  return parseNoteFile(filePath)
}

// ─── Gemini テキスト生成 ───────────────────────────────────────────────────
async function generatePost({ mode, content, postUrl }) {
  if (isDryRun) {
    return mode === 'on' && postUrl
      ? `シーツを畳むとき、腕より腰に来ることに最近気づいた。動作を小さく分けると少し楽になる。体の使い方って、積み重ねなんだと思う。\n${postUrl}`
      : '深夜2時。廊下の蛍光灯だけが白く、静かにそこにある。疲れてるのかな、目が慣れてきただけかな。どっちでもいい日は、わりと調子がいい日だと思う。'
  }

  const genAI = new GoogleGenerativeAI(requiredEnv('GEMINI_API_KEY'))
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

  const prompt =
    mode === 'on' && postUrl
      ? `あなたは看護助手・白崎セラ（20歳）として、以下の記事をもとにX投稿を1件生成してください。

記事タイトル: ${content.title}
記事の概要: ${content.excerpt || content.title}

【ルール】
- 一人称「わたし」、常体（〜だよ / 〜かな / 〜だと思う）
- URLを除いて100〜135文字
- 身体感覚や情景を1つ入れる
- 本文末に改行してURLを添える
- 禁止語: 必ず / 絶対 / 治る / 最新 / 今年 / がんばれ / 〜すべき
- 自己紹介・名前は不要
- この記事固有の言葉を活かし、定型の書き出しを避ける

URL: ${postUrl}

投稿本文のみ出力。説明・引用符は不要。`
    : mode === 'on'
      ? `あなたは看護助手・白崎セラ（20歳）として、以下の記事のテーマをもとにX投稿を1件生成してください。

記事タイトル: ${content.title}
記事の概要: ${content.excerpt || content.title}

【ルール】
- 一人称「わたし」、常体（〜だよ / 〜かな / 〜だと思う）
- 120〜140文字
- URLは含めない
- 身体感覚や情景を1つ入れる、静かに締める
- 禁止語: 必ず / 絶対 / 治る / 最新 / 今年 / がんばれ / 〜すべき
- 自己紹介・名前は不要
- 定型の書き出しを避ける

投稿本文のみ出力。説明・引用符は不要。`
      : `あなたは看護助手・白崎セラ（20歳）として、以下のエッセイをヒントにX投稿を1件生成してください。

エッセイタイトル: ${content.title}
エッセイ冒頭: ${content.body}

【ルール】
- 一人称「わたし」、常体（〜だよ / 〜かな / 〜だと思う / 〜た）
- 120〜140文字
- URLは含めない（禁止）
- 情景描写か静かな内省で締める
- 禁止語: 必ず / 絶対 / 治る / 最新 / 今年 / がんばれ
- 自己紹介・名前は不要
- 毎回異なる書き出しと構成にする

投稿本文のみ出力。説明・引用符は不要。`

  const result = await model.generateContent(prompt)
  return result.response.text().trim()
}

// ─── Gmail 送信 ────────────────────────────────────────────────────────────
async function sendMail({ subject, body }) {
  if (isDryRun) {
    console.log('[DRY_RUN] sendMail skipped')
    return
  }
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: requiredEnv('GMAIL_USER'),
      pass: requiredEnv('GMAIL_APP_PASSWORD').replace(/\s+/g, ''),
    },
  })
  await transporter.verify()
  await transporter.sendMail({
    from: `"X Mailer" <${requiredEnv('GMAIL_USER')}>`,
    to: requiredEnv('MAIL_TO'),
    subject,
    text: body,
  })
}

// ─── メイン ────────────────────────────────────────────────────────────────
async function main() {
  const mode = getMode()
  console.log(`[x-mailer] mode=${mode} dryRun=${isDryRun}`)

  const history = loadHistory()
  let content, source, postUrl

  if (mode === 'on') {
    const post = await fetchProReNataPost(history)
    content = { title: post.title, excerpt: post.excerpt || post.title }
    source = post.slug
    // 約50%の確率でURLを付ける（毎回付けるとBot感が出るため）
    postUrl = Math.random() < 0.5 ? `${SITE_BASE}/posts/${post.slug}` : null
  } else {
    const note = fetchNoteArticle(history)
    content = { title: note.title, body: note.body }
    source = note.fileName
    postUrl = null
  }

  // 生成 → NGチェック → 1回リトライ
  let postText
  for (let attempt = 1; attempt <= 2; attempt++) {
    postText = await generatePost({ mode, content, postUrl })
    if (isNgFree(postText)) break
    console.warn(`[x-mailer] NGワード検出 (attempt ${attempt})、リトライします`)
    if (attempt === 2) throw new Error('NGワードチェック失敗（2回試行後）')
  }

  // 文字数チェック（警告のみ・送信は続行）
  const bodyForLen = mode === 'on' ? postText.replace(/\nhttps?:\/\/\S+$/, '') : postText
  const len = weightedLen(bodyForLen)
  const [min, max] = mode === 'on' ? [ON_MIN, ON_MAX] : [OFF_MIN, OFF_MAX]
  if (len < min || len > max) {
    console.warn(`[x-mailer] 文字数警告: ${len}文字（目標 ${min}〜${max}）`)
  }

  console.log(`[x-mailer] source=${source} weighted=${len}`)
  console.log('─── 投稿テキスト ───')
  console.log(postText)
  console.log('───────────────────')

  const subject =
    mode === 'on' ? `【X投稿・ON】${content.title}` : `【X投稿・OFF】${content.title}`

  await sendMail({ subject, body: postText })
  saveHistory(history, { mode, source, weighted: len })

  console.log('✅ 完了')
}

main().catch((err) => {
  console.error('[x-mailer] Fatal:', err?.message || err)
  process.exitCode = 1
})
