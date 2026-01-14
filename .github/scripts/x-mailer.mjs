import nodemailer from 'nodemailer'
import process from 'node:process'
import fs from 'node:fs'
import path from 'node:path'
import { fetchOnePost } from './sanity-fetch.mjs'
import twitterText from 'twitter-text'

/**
 * X Mailer (Semi-Auto Workflow)
 *
 * [Design Philosophy]
 * - Provides a safe, "one-way" path for generating and notifying X posts via Mail.
 * - Prioritizes stability and character guardrails (Era/YMYL) over variety.
 * - Strictly separates DRY_RUN (local simulation) from PROD (actions/fetching).
 *
 * [DRY_RUN vs PROD]
 * - DRY_RUN=1: No external calls (Sanity/Gmail). No real URLs. Mock data tests.
 * - PROD (No DRY_RUN): Fetches real post from Sanity. Requires GMAIL/MAIL secrets.
 *   Missing required ENV in PROD will intentionally trigger a process exit (Error).
 */

const { parseTweet } = twitterText

const TARGET_MIN = 110
const TARGET_MAX = 135
const TARGET_IDEAL = 132
const HISTORY_FILE = path.join(process.cwd(), '.analytics/x_mailer_history.json')
const HISTORY_MAX = 200
const isDryRun = process.env.DRY_RUN === '1'

// NG Word Patterns (Medical context, Financial guarantees, Aggressive commands, and Era/Time Guard)
const NG_REGEX = /(必ず|絶対|100%|確実に|治る|治ります|診断|処方|投資|稼げる|収益|しなさい|すべき|やめろ|最悪|ゴミ|死ね|殺す|最新|現在|今|今年|20[0-9]{2}年)/i

const SENTENCE_POOLS = {
  OBSERVATION: [
    '観察ですが、夜勤明けに帰宅後の動線を固定している人は疲れが残りにくい印象です。',
    '夜勤の入り前に水分を少し意識するだけで、体の重さが変わることがあります。',
    '休憩が削られた日は、些細な音でも疲労を強く感じやすいです。',
    '人手が薄い日は、引き継ぎメモの書式を固定していると迷いが減ります。',
    '夜勤明けの電車で、目が開かないまま立っている人をよく見かけます。',
    '忙しい日は、声をかけるタイミングだけで雰囲気が変わることがあります。',
    '夜勤の連続が続くと、食欲より睡眠が優先になる日が増えがちです。',
    '声かけのトーンを少し変えるだけで、反応が柔らかくなることがあります。',
    '記録を後回しにした日は、終業時刻がずれ込みやすいです。',
    '勤務交代の直前は、空気が張りやすいので言葉選びに迷います。',
    '疲れが溜まると、短い返事でもぶっきらぼうに聞こえやすいです。',
    '夜勤の入りに軽い甘味を入れると、集中が続きやすいことがあります。',
    '体がだるい日は、ベッドメイクの手順を固定すると負担が減ります。',
    '忙しい日ほど、手洗いの流れを決めておくと安心です。',
    '連続勤務が続いた週は、休憩室の空気も重く感じることがあります。',
    '引き継ぎの最後に一言添えるだけで、相手の表情が変わることがあります。'
  ],
  VIEWPOINT: [
    '小さな流れを決めるだけでも、心の負担は少し軽くなるかもしれません。',
    '体の反応は正直なので、気合いだけで埋めなくていいと思います。',
    '疲れやすさは弱さではなく、条件の問題として見てもよさそうです。',
    '無理に明るくしなくても、落ち着いている方が伝わる場面もあります。',
    'がんばりの不足より、休めない状況の影響が大きい日もあります。',
    '誰かに合わせすぎるより、自分のペースを守る方が長く続くこともあります。',
    '同じ仕事でも、体調の差で感じ方が変わるのは自然なことです。',
    '自分の限界を早めに知っておく方が、結果的に楽になることもあります。',
    '疲労が続く時は、判断基準を小さくしても十分だと思います。',
    '一人で抱え込むより、手順だけでも整理しておくと安心しやすいです。',
    '小さな工夫は、気持ちの揺れを整える助けになることがあります。',
    '同じ言葉でも、言う側の余裕で伝わり方が変わることがあります。',
    '忙しさが続く時期は、完璧より安定を優先してもよさそうです。',
    '自分の疲れを責めるより、条件を見直す視点が必要かもしれません。',
    '無理のない範囲で手順を整えるだけでも、落ち着く日が増えます。',
    '静かに続けられる工夫を増やす方が、結果的に気持ちが守られます。'
  ],
  QUESTION_VIEWPOINT: [
    'この疲れを一番重くしているのは、どの場面だと感じますか。',
    '気持ちが落ちる瞬間は、どこに集中していますか。',
    '休むより先に思い浮かぶことは、何が多いでしょうか。',
    '心の余裕が少し戻るのは、どんな時でしょうか。',
    '一番負担が大きい作業は、どれに近いですか。',
    '言葉を飲み込む場面は、どの時間帯に多いですか。',
    '体が軽いと感じる日は、どんな流れになっていますか。',
    '無理を減らせそうな手順は、どこにありそうですか。'
  ]
}

class HistoryManager {
  constructor(filePath, maxEntries = HISTORY_MAX) {
    this.filePath = filePath
    this.maxEntries = maxEntries
    this.history = []
    this.load()
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, 'utf8')
        this.history = JSON.parse(data)
      }
    } catch (e) {
      console.error(`[HistoryManager] Load failed: ${e.message}`)
      this.history = []
    }
  }

  save() {
    try {
      const dir = path.dirname(this.filePath)
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(this.filePath, JSON.stringify(this.history, null, 2))
    } catch (e) {
      console.error(`[HistoryManager] Save failed: ${e.message}`)
    }
  }

  addEntry(entry) {
    this.history.unshift({
      timestamp: new Date().toISOString(),
      ...entry
    })
    if (this.history.length > this.maxEntries) {
      this.history = this.history.slice(0, this.maxEntries)
    }
    this.save()
  }

  isUsed(sentence) {
    return this.history.some(e =>
      e.selectedObservation === sentence ||
      e.selectedViewpoint === sentence ||
      e.selectedQuestion === sentence
    )
  }

  recent(limit = 20) {
    return this.history.slice(0, limit)
  }
}

/**
 * Validates text against NG word patterns.
 */
function isSafe(text) {
  return !NG_REGEX.test(text)
}

function requiredEnv(name, fallback = '') {
  const value = process.env[name]
  if (!value || !String(value).trim()) {
    if (isDryRun) return fallback || `MOCK_${name}`
    throw new Error(`Missing required ENV/Secret: ${name}`)
  }
  return String(value).trim()
}

function optionalEnv(name, fallback = '') {
  const value = process.env[name]
  return value ? String(value).trim() : fallback
}

function isTruthy(value) {
  const v = String(value || '').trim().toLowerCase()
  return v === '1' || v === 'true' || v === 'yes' || v === 'on'
}

function weightedLen(tweetText) {
  return Number(parseTweet(String(tweetText || '')).weightedLength || 0)
}

/**
 * Orchestrates sentence selection with history and safety checks.
 */
function composePost({ post, url, historyManager, includeUrl }) {
  const seed = post.slug || post.title || 'default'
  const getHash = (str) => {
    let hash = 0
    for (let i = 0; i < str.length; i++) hash = (hash << 5) - hash + str.charCodeAt(i)
    return Math.abs(hash)
  }

  const render = (parts, useNewline) => {
    const text = parts.filter(Boolean).join('')
    if (!includeUrl || !url || isDryRun) return text
    return useNewline ? `${text}\n${url}` : `${text} ${url}`
  }

  // 1. Initial Filtering (Safety Guard)
  const safePools = {
    OBSERVATION: SENTENCE_POOLS.OBSERVATION.filter(s => isSafe(s)),
    VIEWPOINT: SENTENCE_POOLS.VIEWPOINT.filter(s => isSafe(s)),
    QUESTION_VIEWPOINT: SENTENCE_POOLS.QUESTION_VIEWPOINT.filter(s => isSafe(s))
  }

  const recent = historyManager.recent(20)
  const recentQuestionCount = recent.filter(e => e?.endedWithQuestion).length
  const recentTotal = recent.length || 1
  const questionRate = recentQuestionCount / recentTotal
  const shouldAskQuestion = questionRate < 0.2

  // 2. Generate Candidate Pool (Observation + Viewpoint)
  const candidates = []
  const viewpointPool = shouldAskQuestion ? safePools.QUESTION_VIEWPOINT : safePools.VIEWPOINT

  for (const obs of safePools.OBSERVATION) {
    for (const view of viewpointPool) {
      candidates.push({ parts: [obs, view], name: 'Observation + Viewpoint', endsWithQuestion: view.endsWith('？') })
    }
  }

  // 3. Score & Filter (History + Safety + Length)
  const processCandidate = (c) => {
    // Check history (Duplication Guard)
    const historyHits = c.parts.filter(p => historyManager.isUsed(p))

    // Check layout optimization
    let resNewline = render(c.parts, true)
    let lenNewline = weightedLen(resNewline)
    let resInline = render(c.parts, false)
    let lenInline = weightedLen(resInline)

    let best = null
    const inRangeNewline = lenNewline >= TARGET_MIN && lenNewline <= TARGET_MAX
    const inRangeInline = lenInline >= TARGET_MIN && lenInline <= TARGET_MAX

    if (inRangeNewline) {
      best = { ...c, str: resNewline, len: lenNewline, newline: true, remaining: Math.abs(TARGET_IDEAL - lenNewline), historyHits }
    } else if (inRangeInline) {
      best = { ...c, str: resInline, len: lenInline, newline: false, remaining: Math.abs(TARGET_IDEAL - lenInline), historyHits }
    }

    if (best && !isSafe(best.str)) return null // Final combined safety check
    return best
  }

  const scored = candidates.map(processCandidate).filter(Boolean)

  if (scored.length === 0) {
    const fallback = `${safePools.OBSERVATION[0]}${safePools.VIEWPOINT[0]}`
    return { str: fallback, len: weightedLen(fallback), poolName: 'Critical Fallback' }
  }

  // Sort: 
  // 1st Priority: NO History Hits
  // 2nd Priority: Smaller Remaining (Maximization)
  scored.sort((a, b) => {
    if (a.historyHits.length !== b.historyHits.length) return a.historyHits.length - b.historyHits.length
    return a.remaining - b.remaining
  })

  // Variety: Seeded selection from top 10 best valid/unique candidates
  const bestValid = scored.filter(s => s.historyHits.length === 0)
  const poolToPickFrom = bestValid.length > 0 ? bestValid : scored

  if (bestValid.length === 0) {
    console.log('[Warning] History pool exhausted (expected). Falling back to oldest entries.')
  }

  const topSize = Math.min(10, poolToPickFrom.length)
  const finalSelect = poolToPickFrom[getHash(seed) % topSize]

  return {
    ...finalSelect,
    historyHit: finalSelect.historyHits.length > 0
  }
}

async function sendMail({ subject, body }) {
  if (isDryRun) {
    console.log('[X Mailer] SendMail skipped (DRY_RUN)')
    return
  }

  const gmailUser = requiredEnv('GMAIL_USER')
  const gmailAppPassword = requiredEnv('GMAIL_APP_PASSWORD').replace(/\s+/g, '')
  const mailTo = requiredEnv('MAIL_TO')

  const transporter = nodemailer.createTransport({
    host: optionalEnv('SMTP_HOST', 'smtp.gmail.com'),
    port: Number(optionalEnv('SMTP_PORT', '465')),
    secure: isTruthy(optionalEnv('SMTP_SECURE', 'true')),
    auth: { user: gmailUser, pass: gmailAppPassword },
  })

  await transporter.verify()
  await transporter.sendMail({
    from: `"X Mailer" <${gmailUser}>`,
    to: mailTo,
    subject,
    text: body,
  })
}

async function runTest(label, post, siteBaseUrl, historyManager) {
  const url = `${siteBaseUrl}/x/${post.slug}`
  // In DRY_RUN, includeUrl is always false to ensure no URLs are generated in tests
  const result = composePost({ post, url, historyManager, includeUrl: false })

  const emailBody = result.str
  const len = result.len
  const rawLen = Array.from(emailBody).length

  console.log(`\n=== TEST CASE: ${label} ===`)
  console.log(`SLUG: ${post.slug}`)
  console.log(`METRICS: weighted=${len} raw=${rawLen} remaining=${result.remaining} urlMode=${result.newline ? 'newline' : 'inline'}`)
  console.log(`FLAGS: historyHit=${result.historyHit ? 'YES' : 'no'}`)
  console.log('--- BODY START ---')
  process.stdout.write(emailBody + '\n')
  console.log('--- BODY END ---')

  if (len > TARGET_MAX) throw new Error(`CRITICAL: Case "${label}" exceeded limit! (${len})`)

  // Update history in simulation
  historyManager.addEntry({
    slug: post.slug,
    selectedObservation: result.parts ? result.parts[0] : null,
    selectedViewpoint: result.parts ? result.parts[1] : null,
    selectedQuestion: result.endsWithQuestion ? result.parts[1] : null,
    urlMode: result.newline ? 'newline' : 'inline',
    finalWeighted: result.len,
    endedWithQuestion: result.endsWithQuestion
  })
}

function shouldIncludeUrl(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    weekday: 'short',
  })
  const day = formatter.format(date)
  return day === '火' || day === '木' || day === '土'
}

async function main() {
  const dryRun = isTruthy(process.env.DRY_RUN)
  const siteBaseUrl = optionalEnv('SITE_BASE_URL', 'https://prorenata.jp').replace(/\/+$/, '')
  const historyManager = new HistoryManager(HISTORY_FILE)

  if (dryRun) {
    await runTest('Normal Article', { title: '関係の悩み', slug: 'stress-1' }, siteBaseUrl, historyManager)
    await runTest('Career Article', { title: '働き方', slug: 'career-1' }, siteBaseUrl, historyManager)
    await runTest('Burnout Article', { title: '休息の大切さ', slug: 'rest-1' }, siteBaseUrl, historyManager)
    await runTest('Repeat Test (Exhaustion Trigger)', { title: '関係の悩み', slug: 'stress-1' }, siteBaseUrl, historyManager)

    // Safety Test (Verify NG check)
    const unsafePost = { title: '必ず治る！', slug: 'unsafe' }
    const unsafeResult = composePost({ post: unsafePost, url: '...', historyManager, includeUrl: false })
    console.log(`\n=== SAFETY TEST ===\nResult contains NG: ${!isSafe(unsafeResult.str) ? 'YES (CRITICAL)' : 'no'}`)

    return
  }

  // PROD MODE (Execution)
  const fetched = await fetchOnePost()
  if (!fetched || !fetched.post) throw new Error('Failed to fetch post from Sanity')

  const post = fetched.post
  const url = `${siteBaseUrl}/x/${post.slug}`
  const includeUrl = shouldIncludeUrl()
  const result = composePost({ post, url, historyManager, includeUrl })

  const subject = `【X投稿用】${post.title || '新着記事'}`
  await sendMail({ subject, body: result.str })

  // Record history
  historyManager.addEntry({
    slug: post.slug,
    selectedObservation: result.parts[0],
    selectedViewpoint: result.parts[1],
    selectedQuestion: result.endsWithQuestion ? result.parts[1] : null,
    urlMode: result.newline ? 'newline' : 'inline',
    finalWeighted: result.len,
    usedUrl: includeUrl,
    endedWithQuestion: result.endsWithQuestion
  })

  console.log(`✅ Sent mail: ${post.slug} (weighted=${result.len}, pool=${result.name}, remaining=${result.remaining})`)
}

main().catch((error) => {
  console.error('[x-mailer] Failed:', error?.message || error)
  process.exitCode = 1
})
