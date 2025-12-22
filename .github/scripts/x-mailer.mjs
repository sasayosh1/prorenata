import process from 'node:process'
import nodemailer from 'nodemailer'
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

function normalizeBaseUrl(url) {
  return String(url).replace(/\/+$/, '')
}

async function sendMail({ subject, body }) {
  const GMAIL_USER = requiredEnv('GMAIL_USER')
  const GMAIL_APP_PASSWORD = requiredEnv('GMAIL_APP_PASSWORD')
  const MAIL_TO = requiredEnv('MAIL_TO')

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
  })

  await transporter.sendMail({
    from: `"X Mailer" <${GMAIL_USER}>`,
    to: MAIL_TO,
    subject,
    text: body,
  })
}

function buildShortLine(mode) {
  return mode === 'fresh' ? '新着のおすすめです。' : '過去記事のおすすめです。'
}

function deriveProjectName() {
  return (
    optionalEnv('PROJECT_NAME') ||
    (process.env.GITHUB_REPOSITORY ? process.env.GITHUB_REPOSITORY.split('/')[1] : '') ||
    'site'
  )
}

async function main() {
  const { mode, post } = await fetchOnePost()

  const SITE_BASE_URL = optionalEnv('SITE_BASE_URL')
  if (!SITE_BASE_URL) {
    throw new Error('Missing optional ENV: SITE_BASE_URL (example: https://sasakiyoshimasa.com or https://prorenata.jp)')
  }

  const baseUrl = normalizeBaseUrl(SITE_BASE_URL)
  const url = `${baseUrl}/posts/${post.slug}`

  const subject = `【X投稿用｜${deriveProjectName()}】${post.slug}`
  const body = [post.title, buildShortLine(mode), url].join('\n')

  await sendMail({ subject, body })
  console.log(`✅ Sent mail (${mode}): ${post.slug}`)
}

main().catch((error) => {
  console.error('[x-mailer] Failed:', error?.message || error)
  process.exitCode = 1
})

