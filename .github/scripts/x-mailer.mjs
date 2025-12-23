import nodemailer from 'nodemailer'
import process from 'node:process'
import { fetchOnePost } from './sanity-fetch.mjs'

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

function extractFirstHttpUrl(input) {
  const text = String(input || '')
  const match = text.match(new RegExp('https?://\\S+'))
  return match ? match[0] : ''
}

function normalizeBaseUrl(url) {
  return String(url).replace(/\/+$/, '')
}

function buildShortLine(mode) {
  // 2行目の短文（ハッシュタグ無し）
  return mode === 'fresh' ? '新着のおすすめです。' : '過去記事のおすすめです。'
}

function deriveProjectName() {
  return (
    optionalEnv('PROJECT_NAME') ||
    (process.env.GITHUB_REPOSITORY ? process.env.GITHUB_REPOSITORY.split('/')[1] : '') ||
    'site'
  )
}

async function sendMail({ subject, body }) {
  const gmailUser = requiredEnv('GMAIL_USER')
  const gmailAppPassword = requiredEnv('GMAIL_APP_PASSWORD')
  const mailTo = requiredEnv('MAIL_TO')

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: gmailUser, pass: gmailAppPassword },
  })

  await transporter.sendMail({
    from: `"X Mailer" <${gmailUser}>`,
    to: mailTo,
    subject,
    text: body,
  })
}

async function main() {
  const { mode, post } = await fetchOnePost()

  const rawBase = optionalEnv('SITE_BASE_URL')
  const siteBaseUrl = extractFirstHttpUrl(rawBase)
  if (!siteBaseUrl) {
    throw new Error(
      'Missing optional ENV: SITE_BASE_URL (example: https://sasakiyoshimasa.com or https://prorenata.jp)'
    )
  }

  const url = `${normalizeBaseUrl(siteBaseUrl)}/posts/${post.slug}`

  const subject = `【X投稿用｜${deriveProjectName()}】${post.slug}`
  const body = [post.title, buildShortLine(mode), url].join('\n')

  await sendMail({ subject, body })
  console.log(`✅ Sent mail (${mode}): ${post.slug}`)
}

main().catch((error) => {
  console.error('[x-mailer] Failed:', error?.message || error)
  process.exitCode = 1
})
