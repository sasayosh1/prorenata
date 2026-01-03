import nodemailer from 'nodemailer'
import process from 'node:process'
import { fetchOnePost } from './sanity-fetch.mjs'
import twitterText from 'twitter-text'

const { parseTweet } = twitterText

/**
 * Fundamental Reform of X Mailer
 * 
 * Goals:
 * 1. Strict 140 weighted character limit (body + url + newlines)
 * 2. Sera's Persona (nurturing, "わたし", hesitant/polite)
 * 3. Copy-paste ready email body (post only)
 * 4. Improved subject line with Japanese title
 */

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
 * Generates components for the post based on article content.
 */
function generatePostComponents(post) {
  const bodyText = extractTextFromPortableText(post.body || [])

  // 1. Hook (Empathy / Insight)
  const hooks = [
    `「このままでいいのかな…」って思う日、ありますよね。`,
    `職場の人間関係や仕事の内容で、ふと立ち止まってしまうこと、わたしもあります。`,
    `毎日お疲れ様です。少しでも心が軽くなるヒントになれば嬉しいです。`,
    `がんばりすぎて、自分を後回しにしていませんか？`,
    `「自分だけじゃないんだ」と思えるだけで、少し救われることもありますよね。`
  ]

  // Try to find a more specific hook if possible
  let hook = hooks[Math.floor(Math.random() * hooks.length)]
  if (bodyText.includes('夜勤')) hook = `夜勤明けの疲れ、心まで重くなってしまうことありますよね。`
  if (bodyText.includes('人間関係')) hook = `職場の人間関係って、正解がなくて難しいですよね。`
  if (bodyText.includes('辞めたい')) hook = `「もう辞めたいな」という気持ち、否定しなくて大丈夫ですよ。`

  // 2. Points (1-2 sentences)
  const sentences = bodyText
    .split(/[。！？]/)
    .map(s => s.trim())
    .filter(s => s.length > 10 && s.length < 50)

  let points = sentences.length > 0 ? sentences[0] : '日々の業務の中で、大切にしたい視点をまとめました。'
  if (sentences.length > 1 && (weightedLen(points + ' ' + sentences[1]) < 80)) {
    points += '。' + sentences[1]
  }
  if (!points.endsWith('。')) points += '。'

  // Transform to Sera-voice (polite/potential)
  points = points
    .replace(/である。/g, 'のことが多いです。')
    .replace(/だ。/g, 'かもしれません。')
    .replace(/です。/g, 'です。 ')
    .trim()

  // 3. CTA (Call to Action)
  const ctas = [
    `よかったら、目を通してみてくださいね。`,
    `お時間のある時に、チェックしてみてください。`,
    `少しでもお役に立てれば嬉しいです。`,
    `よかったら、覗いてみてください。`
  ]
  const cta = ctas[Math.floor(Math.random() * ctas.length)]

  return { hook, points, cta }
}

/**
 * Composes the final post text with strict length control.
 * Priority of keeping: URL (highest) > Hook > Points > CTA (lowest)
 */
function composePost({ hook, points, cta, url, xMax = 140 }) {
  const build = (h, p, c) => {
    const parts = [h, p, c].filter(Boolean)
    return parts.join('\n') + '\n' + url
  }

  // Iterative trimming
  let currentHook = hook
  let currentPoints = points
  let currentCTA = cta

  // Try full version
  let post = build(currentHook, currentPoints, currentCTA)
  if (weightedLen(post) <= xMax) return post

  // 1. Remove CTA
  currentCTA = ''
  post = build(currentHook, currentPoints, currentCTA)
  if (weightedLen(post) <= xMax) return post

  // 2. Trim Points
  if (currentPoints.length > 30) {
    currentPoints = currentPoints.slice(0, 27) + '...'
  }
  post = build(currentHook, currentPoints, currentCTA)
  if (weightedLen(post) <= xMax) return post

  // 3. Remove Points, keep Hook only
  currentPoints = ''
  post = build(currentHook, currentPoints, currentCTA)
  if (weightedLen(post) <= xMax) return post

  // 4. Emergency: Shorten Hook
  // X treats URL as 23 chars. Add 1 for newline.
  const urlSpace = 24
  const available = xMax - urlSpace - 3 // -3 for "..."
  if (currentHook.length > available) {
    currentHook = currentHook.slice(0, available) + '...'
  }
  return build(currentHook, currentPoints, currentCTA)
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

async function main() {
  const dryRun = isTruthy(process.env.DRY_RUN)
  const siteBaseUrl = optionalEnv('SITE_BASE_URL', 'https://prorenata.jp').replace(/\/+$/, '')

  const fetched = await (async () => {
    if (dryRun && !process.env.SANITY_PROJECT_ID) {
      return {
        mode: 'fresh',
        post: {
          title: '看護助手の夜勤がつらいときの対処：体調と心を守るコツ',
          slug: 'nursing-assistant-night-shift-coping',
          body: [
            {
              _type: 'block',
              children: [{ _type: 'span', text: '看護助手として夜勤を続けていると、体調管理が難しくなることがあります。睡眠リズムの乱れや疲労の蓄積は、心身に大きな負担をかけます。' }]
            }
          ]
        },
      }
    }
    return fetchOnePost()
  })()

  const post = fetched.post
  const url = `${siteBaseUrl}/posts/${post.slug}`

  // 1. Generate Content
  const { hook, points, cta } = generatePostComponents(post)

  // 2. Compose and Enforce 140 limit
  const emailBody = composePost({ hook, points, cta, url, xMax: 140 })
  const len = weightedLen(emailBody)

  // 3. Subject Line
  const title = post.title || '新着記事'
  const subject = `【X投稿用｜${deriveProjectName()}】${title}`

  if (dryRun) {
    console.log('\n=== DRY RUN OUTPUT ===')
    console.log(`SUBJECT: ${subject}`)
    console.log(`METRICS: ${len} / 140 weighted chars`)
    console.log('--- BODY START ---')
    process.stdout.write(emailBody + '\n')
    console.log('--- BODY END ---')
    return
  }

  await sendMail({ subject, body: emailBody })
  console.log(`✅ Sent mail: ${post.slug} (${len} chars)`)
}

main().catch((error) => {
  console.error('[x-mailer] Failed:', error?.message || error)
  process.exitCode = 1
})
