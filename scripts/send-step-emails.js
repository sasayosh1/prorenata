const { createClient } = require('@sanity/client')
const nodemailer = require('nodemailer')
const fs = require('fs/promises')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env.local') })

const MAIL_USER = process.env.MAIL_USER
const MAIL_PASS = process.env.MAIL_PASS
const SANITY_TOKEN = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN

// 登録後 N 日目に送るメールファイルのマッピング（step 1 はウェルカムメール、即時送信済み）
const STEP_FILES = {
  2: '02_7日前_告知開始.md',
  3: '03_6日前_制作秘話.md',
  4: '04_5日前_特典公開.md',
  5: '05_4日前_感情共有.md',
  6: '06_3日前_期待感.md',
  7: '07_2日前_最終確認.md',
  8: '08_当日_リリース.md',
}

const EMAIL_DIR = path.join(__dirname, '../06_メルマガ/ローンチメール')
const TOTAL_STEPS = 8

async function parseEmailFile(filename) {
  const filePath = path.join(EMAIL_DIR, filename)
  const content = await fs.readFile(filePath, 'utf-8')
  const lines = content.split('\n')

  let subject = ''
  let bodyStart = 0

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('件名：')) {
      subject = lines[i].replace('件名：', '').trim()
      bodyStart = i + 1
      break
    }
  }

  const body = lines
    .slice(bodyStart)
    .join('\n')
    .trim()

  return { subject, body }
}

async function sendEmail(transporter, to, subject, body) {
  await transporter.sendMail({
    from: `"白崎セラ" <${MAIL_USER}>`,
    to,
    subject,
    text: body,
  })
}

async function main() {
  if (!MAIL_USER || !MAIL_PASS) {
    console.error('Error: MAIL_USER and MAIL_PASS must be set')
    process.exit(1)
  }
  if (!SANITY_TOKEN) {
    console.error('Error: SANITY_WRITE_TOKEN or SANITY_API_TOKEN must be set')
    process.exit(1)
  }

  const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    useCdn: false,
    apiVersion: '2024-01-01',
    token: SANITY_TOKEN,
  })

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: MAIL_USER, pass: MAIL_PASS },
  })

  const now = Date.now()

  // アクティブな購読者を全件取得
  const subscribers = await client.fetch(
    `*[_type == "subscriber" && !defined(unsubscribedAt)] { _id, email, subscribedAt, lastStepSent }`
  )

  console.log(`Found ${subscribers.length} active subscribers`)

  let sent = 0
  let skipped = 0

  for (const subscriber of subscribers) {
    const subscribedAt = new Date(subscriber.subscribedAt).getTime()
    const daysElapsed = Math.floor((now - subscribedAt) / (1000 * 60 * 60 * 24))
    const lastStepSent = subscriber.lastStepSent ?? 1
    const nextStep = lastStepSent + 1

    // 次のステップが存在し、送信タイミング（daysElapsed >= nextStep - 1）に達しているか
    if (nextStep > TOTAL_STEPS) {
      skipped++
      continue
    }

    const dayRequired = nextStep - 1 // step2=day1, step3=day2, ...
    if (daysElapsed < dayRequired) {
      skipped++
      continue
    }

    const filename = STEP_FILES[nextStep]
    if (!filename) {
      skipped++
      continue
    }

    try {
      const { subject, body } = await parseEmailFile(filename)
      await sendEmail(transporter, subscriber.email, subject, body)

      // Sanity の lastStepSent を更新
      await client
        .patch(subscriber._id)
        .set({ lastStepSent: nextStep })
        .commit()

      console.log(`✅ Sent step ${nextStep} to ${subscriber.email} (day ${daysElapsed})`)
      sent++
    } catch (err) {
      console.error(`❌ Failed to send step ${nextStep} to ${subscriber.email}:`, err.message)
    }
  }

  console.log(`\nDone. Sent: ${sent}, Skipped/Not due: ${skipped}`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
