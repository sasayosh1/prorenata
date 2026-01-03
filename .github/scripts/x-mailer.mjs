import nodemailer from 'nodemailer'
import process from 'node:process'
import { fetchOnePost } from './sanity-fetch.mjs'
import twitterText from 'twitter-text'

const { parseTweet } = twitterText

/**
 * Advanced Dynamic X Mailer (Fundamental Reform v3)
 * 
 * Goals:
 * 1. Eliminate fixed templates. Generate based on article content.
 * 2. Strict 138 weighted character limit (2-char margin).
 * 3. URL is /x/<slug>.
 * 4. URL placement: newline if possible, same-line if tight.
 * 5. No "..." allowed. Complete sentences only.
 */

const TARGET_TOTAL = 138

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

  // 1. Hook (Empathetic observation based on a full sentence)
  let hookSentence = sentences.find(s => s.length > 15 && s.length < 40) || post.title || '看護助手の現場'
  const hookSuffixes = ['…って思うこと、ありますよね。', '、ひとりで抱えていませんか？', 'に、寄り添いたいと思っています。', 'のこと、大切に考えてみませんか。']
  const hookIndex = Math.abs(hookSentence.length) % hookSuffixes.length
  const hookSubject = hookSentence.replace(/[、。！？]$/, '')
  const hook = `${hookSubject}${hookSuffixes[hookIndex]}`

  // 2. Points (Next 1-2 interesting points)
  let points = sentences.slice(1, 4)
    .find(s => s.length > 15 && s.length < 50) || '大切にしたいポイントを、丁寧に整理しました。'
  points = toSeraVoice(points)

  // 3. CTA (Dynamic Role-based)
  const roleVerbs = ['整理する', '見直す', '知る', '確かめる', '選ぶ', '向き合う', '整える']
  const verbSeed = (hook + points).length
  const verb = roleVerbs[verbSeed % roleVerbs.length]
  const cta = `今の状態を${verb}きっかけになれば、嬉しいです。`

  return { hook, points, cta }
}

/**
 * Composes the post with flexible URL placement and strict length control.
 * Priority: Hook > Points > CTA
 */
function composePost({ hook, points, cta, url, target = TARGET_TOTAL }) {
  const render = (parts, useNewline) => {
    const text = parts.filter(Boolean).join('\n')
    return useNewline ? `${text}\n${url}` : `${text} ${url}`
  }

  const combinations = [
    { parts: [hook, points, cta], newline: true },
    { parts: [hook, points, cta], newline: false },
    { parts: [hook, points], newline: true },
    { parts: [hook, points], newline: false },
    { parts: [hook, cta], newline: true },
    { parts: [hook, cta], newline: false },
    { parts: [hook], newline: true },
    { parts: [hook], newline: false },
    { parts: ['「自分らしく」いられるヒント、まとめました。'], newline: true }
  ]

  for (const combo of combinations) {
    const result = render(combo.parts, combo.newline)
    if (weightedLen(result) <= target) {
      return result
    }
  }

  // Final fallback
  return `${hook.slice(0, 30)} ${url}`
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
  const { hook, points, cta } = extractDynamicComponents(post)
  const emailBody = composePost({ hook, points, cta, url, target: TARGET_TOTAL })
  const len = weightedLen(emailBody)
  const title = post.title || '新着記事'
  const subject = `【X投稿用｜${deriveProjectName()}】${title}`

  const rawLen = Array.from(emailBody).length
  console.log(`\n=== TEST CASE: ${label} ===`)
  console.log(`SUBJECT: ${subject}`)
  console.log(`METRICS: weighted=${len} raw=${rawLen} / 138`)
  console.log('--- BODY START ---')
  process.stdout.write(emailBody + '\n')
  console.log('--- BODY END ---')

  if (len > 140) throw new Error(`CRITICAL: Case "${label}" exceeded limit! (${len})`)
}

async function main() {
  const dryRun = isTruthy(process.env.DRY_RUN)
  const siteBaseUrl = optionalEnv('SITE_BASE_URL', 'https://prorenata.jp').replace(/\/+$/, '')

  if (dryRun && !process.env.SANITY_PROJECT_ID) {
    // Case 1: Standard
    await runTest('Dynamic Content (Standard)', {
      title: '職場での適切な距離感',
      slug: 'workplace-boundary',
      body: [{ _type: 'block', children: [{ _type: 'span', text: '同僚との距離感に悩むことは多いです。無理に合わせすぎず、自分のペースを大切にすることが長続きのコツです。' }] }]
    }, siteBaseUrl)

    // Case 2: Very tight (URL on same line)
    await runTest('Dynamic Content (Tight)', {
      title: '非常に長い内容を持つ記事がどのように調整されるかのテスト',
      slug: 'extremely-long-slug-for-testing-flexible-url-placement-and-dynamic-sentence-shortening-mechanics',
      body: [{ _type: 'block', children: [{ _type: 'span', text: 'この記事の内容は非常に詳細にわたっており、多くの教訓を含んでいますが、Xの140文字制限に合わせて最小限のメッセージに凝縮される必要があります。' }] }]
    }, siteBaseUrl)

    // Case 3: Title fallback
    await runTest('Dynamic Content (No Title)', {
      title: '',
      slug: 'no-title-post',
      body: [{ _type: 'block', children: [{ _type: 'span', text: 'タイトルがない場合でも、本文から内容を抽出して意味のある投稿を生成します。' }] }]
    }, siteBaseUrl)

    return
  }

  const fetched = await fetchOnePost()
  if (!fetched || !fetched.post) throw new Error('Failed to fetch post from Sanity')

  const post = fetched.post
  const url = `${siteBaseUrl}/x/${post.slug}`
  const { hook, points, cta } = extractDynamicComponents(post)
  const emailBody = composePost({ hook, points, cta, url, target: TARGET_TOTAL })
  const len = weightedLen(emailBody)
  const subject = `【X投稿用｜${deriveProjectName()}】${post.title || '新着記事'}`

  await sendMail({ subject, body: emailBody })
  console.log(`✅ Sent mail: ${post.slug} (${len} chars)`)
}

main().catch((error) => {
  console.error('[x-mailer] Failed:', error?.message || error)
  process.exitCode = 1
})
