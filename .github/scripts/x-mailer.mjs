import nodemailer from 'nodemailer'
import process from 'node:process'
import { fetchOnePost } from './sanity-fetch.mjs'
import twitterText from 'twitter-text'

const { parseTweet } = twitterText

/**
 * Advanced Dynamic X Mailer (Fundamental Reform v4)
 * 
 * Goals:
 * 1. Maximize content density using context-aware "add-on phrases".
 * 2. Strict 138 weighted character limit (2-char margin).
 * 3. Dynamic multi-category phrase pool (25+ unique entries).
 * 4. Content-based selection and redundancy checking.
 * 5. Flexible URL placement for space optimization.
 * 6. Detailed logging of metrics and optimization steps.
 */

const TARGET_TOTAL = 138

const ADDON_POOL = {
  OBJECTIVE: [
    '背景の考え方を整理しました。',
    '判断基準をまとめています。',
    '自分に合う選び方の参考に。',
    '役立つ視点を整理しました。',
    'ポイントを詳しく解説。',
    '客観的に見るヒントです。',
    '解決への道筋を整理。',
    '新しい視点のきっかけに。',
    '現場の声、まとめました。',
    '視点を変えてみませんか。',
    '判断の軸を知る。',
    '考えを深める材料に。',
    '視点を整理。',
    '大切な視点。',
    '内容を整理。'
  ],
  RELIEF: [
    'まずは知ることから。',
    '毎日お疲れ様です。',
    '自分を後回しにしないで。',
    '自分のペースで大丈夫。',
    '心の荷物を少しずつ。',
    'あなただけではありません。',
    '自分を労わる時間を。',
    '無理せず一歩ずつ。',
    '心を守るお守りに。',
    '深呼吸を大切に。',
    '自分を大切に。',
    'ホッと一息。',
    '自分のために。',
    '心を守る。',
    '一歩ずつ。'
  ],
  ACTION: [
    '環境を見直すヒントに。',
    '行動を少し変える。',
    '現状を確かめることから。',
    '働き方を考える材料に。',
    '選択肢を広げましょう。',
    '一歩踏み出すサポートに。',
    '今の働き方に違和感。',
    '小さなきっかけに。',
    '納得できる選択を。',
    'まずはチェックを。',
    '未来のために。',
    '選び方を知る。',
    'きっかけ作り。',
    '改善の第一歩。',
    '自分らしく.'
  ]
}

function requiredEnv(name) {
  const value = process.env[name]
  if (!value || !String(value).trim()) {
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

function deriveProjectName() {
  return (
    optionalEnv('PROJECT_NAME') ||
    (process.env.GITHUB_REPOSITORY ? process.env.GITHUB_REPOSITORY.split('/')[1] : '') ||
    'prorenata'
  )
}

function extractTextFromPortableText(body) {
  if (!Array.isArray(body)) return ''
  let text = ''
  for (const block of body) {
    if (block._type === 'block' && Array.isArray(block.children)) {
      for (const child of block.children) {
        if (child._type === 'span' && child.text) {
          text += child.text
        }
      }
      text += ' '
    }
  }
  return text.trim()
}

/**
 * Normalizes sentences and transforms to Sera's voice.
 */
function toSeraVoice(text) {
  if (!text) return ''
  return text
    .trim()
    .replace(/である。/g, 'のことが多いです。')
    .replace(/だ。/g, 'かもしれません。')
    .replace(/です。/g, 'です。 ')
    .replace(/ます。/g, 'ます。 ')
    .trim()
}

/**
 * Generates dynamic components from article text.
 */
function extractDynamicComponents(post) {
  const bodyText = extractTextFromPortableText(post.body || [])
  const sentences = bodyText
    .split(/[。！？]/)
    .map(s => s.trim())
    .filter(s => s.length > 10 && s.length < 60)

  // Hook (Empathetic observation based on a full sentence)
  let hookSentence = sentences.find(s => s.length > 15 && s.length < 40) || post.title || '看護助手の現場'
  const hookSuffixes = ['…って思うこと、ありますよね。', '、ひとりで抱えていませんか？', 'に、寄り添いたいと思っています。', 'のこと、大切に考えてみませんか。']
  const hookIndex = Math.abs(hookSentence.length) % hookSuffixes.length
  const hookSubject = hookSentence.replace(/[、。！？]$/, '')
  const hook = `${hookSubject}${hookSuffixes[hookIndex]}`

  // Points (Important logical point)
  let points = sentences.slice(1, 6)
    .find(s => s.length > 15 && s.length < 50) || '大切にしたいポイントを、丁寧に整理しました。'
  points = toSeraVoice(points)

  return { hook, points }
}

/**
 * Selects the best padding phrases based on content and avoids repetition.
 */
function getPotentialAddons(baseText, post) {
  const bodyText = (extractTextFromPortableText(post.body || []) + ' ' + (post.slug || '')).toLowerCase()

  // Categorize content
  let category = 'OBJECTIVE'
  if (bodyText.match(/つらい|悩み|孤独|不安|疲|しんどい|精神|気持ち|重い|苦しい/)) category = 'RELIEF'
  if (bodyText.match(/転職|検討|選ぶ|将来|行動|退職|キャリア|現場|働き方/)) category = 'ACTION'

  const candidates = ADDON_POOL[category]

  // Scramble and filter out redundant phrases
  return candidates
    .sort(() => Math.random() - 0.5)
    .filter(phrase => {
      // Very simple redundancy check: if a key shared noun/verb exists in baseText, skip
      const keywords = ['ひとり', '整理', 'きっかけ', '見直す', '知る', '選択']
      for (const kw of keywords) {
        if (phrase.includes(kw) && baseText.includes(kw)) return false
      }
      return true
    })
}

/**
 * Composes the post with flexible URL placement and dynamic padding.
 */
function composePost({ hook, points, url, post, target = TARGET_TOTAL }) {
  const render = (parts, useNewline) => {
    const text = parts.filter(Boolean).join('\n')
    return useNewline ? `${text}\n${url}` : `${text} ${url}`
  }

  // Base components
  let currentParts = [hook, points]
  let useNewline = true
  let addons = []

  // Padding optimization
  const potentialAddons = getPotentialAddons(currentParts.join(''), post)

  const attempt = (parts, newline) => {
    const str = render(parts, newline)
    const len = weightedLen(str)
    return { str, len, newline, parts }
  }

  let best = attempt(currentParts, true)
  if (best.len > target) best = attempt(currentParts, false)
  if (best.len > target) best = attempt([hook], true)
  if (best.len > target) best = attempt([hook], false)

  // Try adding phrases
  for (let i = 0; i < 2; i++) {
    for (const addon of potentialAddons) {
      if (addons.includes(addon)) continue

      const testParts = [...best.parts, addon]
      const testNewline = attempt(testParts, true)
      const testInline = attempt(testParts, false)

      let candidate = null
      if (testNewline.len <= target) candidate = testNewline
      else if (testInline.len <= target) candidate = testInline

      if (candidate && candidate.len > best.len) {
        best = candidate
        addons.push(addon)
        break // Moved to next addon count
      }
    }
  }

  // Final metadata for logging
  best.remaining = target - best.len
  best.addonCount = addons.length
  return best
}

async function sendMail({ subject, body }) {
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

async function runTest(label, post, siteBaseUrl) {
  const url = `${siteBaseUrl}/x/${post.slug}`
  const { hook, points } = extractDynamicComponents(post)
  const result = composePost({ hook, points, url, post, target: TARGET_TOTAL })

  const emailBody = result.str
  const len = result.len
  const rawLen = Array.from(emailBody).length
  const title = post.title || '新着記事'
  const subject = `【X投稿用｜${deriveProjectName()}】${title}`

  console.log(`\n=== TEST CASE: ${label} ===`)
  console.log(`SUBJECT: ${subject}`)
  console.log(`METRICS: weighted=${len} raw=${rawLen} remaining=${result.remaining} urlMode=${result.newline ? 'newline' : 'inline'} addons=${result.addonCount}`)
  console.log('--- BODY START ---')
  process.stdout.write(emailBody + '\n')
  console.log('--- BODY END ---')

  if (len > 140) throw new Error(`CRITICAL: Case "${label}" exceeded limit! (${len})`)
}

async function main() {
  const dryRun = isTruthy(process.env.DRY_RUN)
  const siteBaseUrl = optionalEnv('SITE_BASE_URL', 'https://prorenata.jp').replace(/\/+$/, '')

  if (dryRun && !process.env.SANITY_PROJECT_ID) {
    // Case 1: Standard (Should get 1-2 addons)
    await runTest('Normal Space', {
      title: '職場での向き合い方',
      slug: 'workplace-attitude',
      body: [{ _type: 'block', children: [{ _type: 'span', text: '毎日の業務に追われていると、どうしても自分の気持ちに蓋をしてしまいがちです。' }] }]
    }, siteBaseUrl)

    // Case 2: Tight Space (Long slug)
    await runTest('Tight Space', {
      title: '非常に詳細な解説記事：人間関係を劇的に改善するためのアクションプラン',
      slug: 'very-long-detailed-slug-that-exhausts-available-character-count-quickly-and-forces-inline-url-logic',
      body: [{ _type: 'block', children: [{ _type: 'span', text: 'この記事では具体的な人間関係の改善策について詳しく説明しています。' }] }]
    }, siteBaseUrl)

    // Case 3: High Space (Shortest possible)
    await runTest('High Space', {
      title: '短文記事',
      slug: 'short',
      body: [{ _type: 'block', children: [{ _type: 'span', text: '短い文章のテストです。' }] }]
    }, siteBaseUrl)

    return
  }

  const fetched = await fetchOnePost()
  if (!fetched || !fetched.post) throw new Error('Failed to fetch post from Sanity')

  const post = fetched.post
  const url = `${siteBaseUrl}/x/${post.slug}`
  const { hook, points } = extractDynamicComponents(post)
  const result = composePost({ hook, points, url, post, target: TARGET_TOTAL })
  const emailBody = result.str

  const subject = `【X投稿用｜${deriveProjectName()}】${post.title || '新着記事'}`

  await sendMail({ subject, body: emailBody })
  console.log(`✅ Sent mail: ${post.slug} (weighted=${result.len}, raw=${Array.from(emailBody).length}, remaining=${result.remaining}, addons=${result.addonCount})`)
}

main().catch((error) => {
  console.error('[x-mailer] Failed:', error?.message || error)
  process.exitCode = 1
})
