import fs from 'node:fs'
import path from 'node:path'
import nodemailer from 'nodemailer'

const CHAR_LIMIT = 140
const SUMMARY_PATH = path.resolve('x-summary.json')

const {
  PROJECT_NAME = 'prorenata',
  SITE_URL = 'https://prorenata.jp',
  GMAIL_USER,
  GMAIL_APP_PASSWORD,
  MAIL_TO,
} = process.env

if (!GMAIL_USER || !GMAIL_APP_PASSWORD) throw new Error('GMAIL_USER / GMAIL_APP_PASSWORD required')

function normalizeBaseUrl(url) {
  return String(url).replace(/\/+$/, '')
}

function buildText(title, desc, url) {
  const safeTitle = String(title || '').trim()
  const safeDesc = String(desc || '').trim()
  const safeUrl = String(url || '').trim()

  let text = `${safeTitle}\n${safeDesc}\n${safeUrl}`
  if (text.length <= CHAR_LIMIT) return text

  const remain = CHAR_LIMIT - (safeTitle.length + safeUrl.length + 2)
  const shortDesc = safeDesc.slice(0, Math.max(0, remain - 1)) + '…'
  return `${safeTitle}\n${shortDesc}\n${safeUrl}`.slice(0, CHAR_LIMIT)
}

function extractSlugFromUrl(url) {
  try {
    const u = new URL(url)
    const parts = u.pathname.split('/').filter(Boolean)
    return parts[parts.length - 1] || 'unknown'
  } catch {
    return 'unknown'
  }
}

async function sendMail(subject, body) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
  })

  await transporter.sendMail({
    from: `"X Mailer" <${GMAIL_USER}>`,
    to: MAIL_TO || GMAIL_USER,
    subject,
    text: body,
  })
}

async function main() {
  if (!fs.existsSync(SUMMARY_PATH)) {
    throw new Error(`Missing ${SUMMARY_PATH}. Run scripts/auto-post-to-x.js first.`)
  }

  const summary = JSON.parse(fs.readFileSync(SUMMARY_PATH, 'utf8'))
  const articleUrl = String(summary.articleUrl || '').trim()
  const baseUrl = normalizeBaseUrl(SITE_URL)
  const url = articleUrl || `${baseUrl}/posts/`
  const slug = extractSlugFromUrl(url)

  const titlePrefix = PROJECT_NAME === 'toyama' ? '【富山】' : '【看護助手】'
  const title = `${titlePrefix}${String(summary.title || '').trim()}`
  const desc = String(summary.summary || '').trim()

  const tweetText = buildText(title, desc, url)

  const body = [
    '以下をそのままXに投稿してください。',
    '（投稿後、このメールは削除OK）',
    '',
    '------------------------------',
    tweetText,
    '------------------------------',
  ].join('\n')

  const subject = `【X投稿用｜${PROJECT_NAME}】${slug}`
  await sendMail(subject, body)
  console.log('Mail sent:', subject)
}

main().catch((error) => {
  console.error('[x_mailer] Failed:', error)
  process.exitCode = 1
})
