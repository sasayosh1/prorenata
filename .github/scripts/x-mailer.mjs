import nodemailer from 'nodemailer'
import process from 'node:process'
import { fetchOnePost } from './sanity-fetch.mjs'
import twitterText from 'twitter-text'

const { parseTweet } = twitterText

/**
 * Advanced X Mailer (Fundamental Reform v2)
 * 
 * Requirements:
 * 1. Target total weighted length: 138 (2-char margin from 140 limit)
 * 2. Body is ONLY the post (copy-paste ready).
 * 3. URL is on a single line at the end (Short URL: /x/<slug>).
 * 4. Sera's Persona: nurturing, "わたし", empathetic, not assertive.
 * 5. No "..." trimming. Use complete sentences only.
 * 6. Dynamic padding/trimming to stay near 138 chars.
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
 * Knowledge base for Sera's voice and formatting.
 */
const SERA_LIBRARY = {
  hooks: [
    "「このままでいいのかな…」って思う日、ありますよね。",
    "職場の人間関係や仕事の内容で、ふと立ち止まってしまうこと、わたしもあります。",
    "毎日お疲れ様です。少しでも心が軽くなるヒントになれば嬉しいです。",
    "がんばりすぎて、自分を後回しにしていませんか？",
    "「自分だけじゃないんだ」と思えるだけで、少し救われることもありますよね。",
    "今の環境で、本当の自分を抑えすぎていないでしょうか。",
    "ふとした瞬間に感じる「違和感」は、自分を守るためのサインかもしれません。"
  ],
  ctas: [
    "よかったら、目を通してみてくださいね。",
    "お時間のある時に、チェックしてみてください。",
    "少しでもお役に立てれば嬉しいです。",
    "よかったら、覗いてみてください。",
    "あなたの心が、少しでも軽くなりますように。",
    "一人で抱え込まずに、まずは知ることから始めてみませんか。"
  ],
  fillers: [
    "今日も無理せず、自分のペースで。",
    "あなたは、そのままで十分がんばっていますよ。",
    "焦らなくて大丈夫。一歩ずつ、進んでいきましょう。",
    "まずは深呼吸して、自分を労わってあげてくださいね。",
    "今は少し、立ち止まってもいい時期なのかもしれません。"
  ]
}

/**
 * Generates components for the post.
 */
function generateBaseComponents(post) {
  const bodyText = extractTextFromPortableText(post.body || [])

  // Pick a random hook
  let hook = SERA_LIBRARY.hooks[Math.floor(Math.random() * SERA_LIBRARY.hooks.length)]

  // Extract points (1-2 sentences)
  const sentences = bodyText
    .split(/[。！？]/)
    .map(s => s.trim())
    .filter(s => s.length > 10 && s.length < 50)

  let points = sentences.length > 0 ? sentences[0] : '日々の業務の中で、大切にしたい視点をまとめました。'
  if (sentences.length > 1) {
    points += '。' + sentences[1]
  }
  if (!points.endsWith('。')) points += '。'

  // Transform to Sera-voice
  points = points
    .replace(/である。/g, 'のことが多いです。')
    .replace(/だ。/g, 'かもしれません。')
    .replace(/です。/g, 'です。 ')
    .trim()

  const cta = SERA_LIBRARY.ctas[Math.floor(Math.random() * SERA_LIBRARY.ctas.length)]

  return { hook, points, cta }
}

/**
 * Composes the post with strict grammar and length control.
 * Maximizes length <= target. No "..." allowed.
 */
function composePost({ hook, points, cta, url, target = TARGET_TOTAL }) {
  const render = (parts) => parts.filter(Boolean).join('\n') + '\n' + url
  const weighted = (parts) => weightedLen(render(parts))

  const pointFirst = points.split('。')[0] + '。'

  // Potential combinations (in order of preference for content richness)
  const baseCombinations = [
    [hook, points, cta],
    [hook, points],
    [hook, pointFirst, cta],
    [hook, pointFirst],
    [hook, cta],
    [hook],
    ["今のあなたに必要なこと、まとめました。"]
  ]

  const candidates = []

  for (const base of baseCombinations) {
    if (weighted(base) <= target) {
      candidates.push({ parts: base, score: weighted(base) })

      // Try adding one filler to enhance length
      for (const filler of SERA_LIBRARY.fillers) {
        const withFiller = [...base]
        const ctaIndex = withFiller.indexOf(cta)
        if (ctaIndex !== -1) {
          withFiller.splice(ctaIndex, 0, filler)
        } else {
          withFiller.push(filler)
        }

        const score = weighted(withFiller)
        if (score <= target) {
          candidates.push({ parts: withFiller, score })
        }
      }
    }
  }

  // Pick the one closest to target
  candidates.sort((a, b) => b.score - a.score)

  if (candidates.length > 0) return render(candidates[0].parts)
  return render(["今のあなたに必要なこと、まとめました。"])
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
  const { hook, points, cta } = generateBaseComponents(post)
  const emailBody = composePost({ hook, points, cta, url, target: TARGET_TOTAL })
  const len = weightedLen(emailBody)
  const title = post.title || '新着記事'
  const subject = `【X投稿用｜${deriveProjectName()}】${title}`

  console.log(`\n=== TEST CASE: ${label} ===`)
  console.log(`SUBJECT: ${subject}`)
  console.log(`METRICS: ${len} / 138 weighted chars`)
  console.log('--- BODY START ---')
  process.stdout.write(emailBody + '\n')
  console.log('--- BODY END ---')

  if (len > 140) throw new Error(`CRITICAL: Case "${label}" exceeded limit! (${len})`)
}

async function main() {
  const dryRun = isTruthy(process.env.DRY_RUN)
  const siteBaseUrl = optionalEnv('SITE_BASE_URL', 'https://prorenata.jp').replace(/\/+$/, '')

  if (dryRun && !process.env.SANITY_PROJECT_ID) {
    // 1. Normal Case
    await runTest('Normal Case', {
      title: '看護助手の夜勤がつらいときの対処',
      slug: 'nursing-assistant-night-shift-coping',
      body: [{ _type: 'block', children: [{ _type: 'span', text: '夜勤は体力的にも精神的にもハードですよね。睡眠リズムを整えることが大切です。' }] }]
    }, siteBaseUrl)

    // 2. Long Content Case (Tight Space)
    await runTest('Tight Space Case', {
      title: '非常に長いタイトルを持つ場合であっても適切に処理されることを期待するテスト',
      slug: 'very-long-slug-that-takes-up-a-lot-of-space-in-the-tweet-and-reduces-available-text-area',
      body: [{ _type: 'block', children: [{ _type: 'span', text: 'この文章は非常に長く、タイトルの長さも相まって残りのスペースが非常に少なくなっています。それでも文が途切れないように調整される必要があります。' }] }]
    }, siteBaseUrl)

    // 3. Fallback Case (No Title)
    await runTest('Fallback Title Case', {
      title: '',
      slug: 'no-title-post',
      body: [{ _type: 'block', children: [{ _type: 'span', text: 'タイトルがない場合でも、件名がフォールバックされることを確認します。' }] }]
    }, siteBaseUrl)

    return
  }

  const fetched = await fetchOnePost()
  const post = fetched.post
  const url = `${siteBaseUrl}/x/${post.slug}`
  const { hook, points, cta } = generateBaseComponents(post)
  const emailBody = composePost({ hook, points, cta, url, target: TARGET_TOTAL })
  const len = weightedLen(emailBody)
  const title = post.title || '新着記事'
  const subject = `【X投稿用｜${deriveProjectName()}】${title}`

  await sendMail({ subject, body: emailBody })
  console.log(`✅ Sent mail: ${post.slug} (${len} chars)`)
}

main().catch((error) => {
  console.error('[x-mailer] Failed:', error?.message || error)
  process.exitCode = 1
})
