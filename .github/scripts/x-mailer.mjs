import nodemailer from 'nodemailer'
import process from 'node:process'
import { fetchOnePost } from './sanity-fetch.mjs'
import twitterText from 'twitter-text'

const { parseTweet } = twitterText

let lastDiagnostics = null

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

function codepointLen(value) {
  return Array.from(String(value || '')).length
}

function clampCodepoints(value, max) {
  const arr = Array.from(String(value || ''))
  if (arr.length <= max) return arr.join('')
  return arr.slice(0, max).join('')
}

function normalizeBaseUrl(url) {
  return String(url).replace(/\/+$/, '')
}

function getXMax() {
  const raw = optionalEnv('X_MAX', '280')
  const n = Number(raw)
  if (!Number.isFinite(n) || n <= 0) return 280
  return Math.floor(n)
}

function weightedLen(tweetText) {
  return Number(parseTweet(String(tweetText || '')).weightedLength || 0)
}

function deriveProjectName() {
  return (
    optionalEnv('PROJECT_NAME') ||
    (process.env.GITHUB_REPOSITORY ? process.env.GITHUB_REPOSITORY.split('/')[1] : '') ||
    'site'
  )
}

function maskEmail(email) {
  const value = String(email || '')
  const at = value.indexOf('@')
  if (at <= 0) return value ? `${value.slice(0, 2)}***` : ''
  const name = value.slice(0, at)
  const domain = value.slice(at + 1)
  const maskedName = name.length <= 2 ? `${name[0] || ''}*` : `${name[0]}***${name[name.length - 1]}`
  return `${maskedName}@${domain}`
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

function ensurePoliteEnding(text) {
  let result = String(text || '').trim()

  // Remove ellipsis endings
  result = result.replace(/(?:\.\.\.|…)+$/g, '').trim()
  result = result.replace(/[、,]+$/g, '').trim()

  // If already ends with polite form, keep it
  if (/(?:です|ます|ました|でした|ません|ませんでした)[。！？]?$/.test(result)) {
    if (!/[。！？]$/.test(result)) {
      result += '。'
    }
    return result
  }

  // If ends with だ/である form, convert to です
  result = result.replace(/(?:だ|である)[。！？]?$/g, 'です。')

  // If ends with verb plain form, add polite ending hint
  if (!/[。！？]$/.test(result)) {
    result += '。'
  }

  return result
}

function buildSeraImpression(post, mode) {
  const title = String(post?.title || '').trim()
  const bodyText = extractTextFromPortableText(post.body || [])

  if (!bodyText) {
    return `${title || '看護助手の現場で役立つ情報'}について、詳しく解説しています。`
  }

  // Extract sentences from article body
  const sentences = bodyText
    .split(/[。！？]/)
    .map(s => s.trim())
    .filter(s => s.length > 15)

  if (sentences.length === 0) {
    return ensurePoliteEnding(bodyText.slice(0, 100))
  }

  // Build claim-reason-claim structure
  // Claim 1: Opening statement (from title or first sentence)
  const claim1 = sentences[0] || title

  // Reason: Supporting detail (from second sentence if available)
  const reason = sentences.length > 1 ? sentences[1] : null

  // Claim 2: Closing statement with call to action
  const closingPhrases = [
    'ぜひ参考にしてみてください',
    '詳しく解説しています',
    'チェックしてみてください',
    '確認してみましょう',
    '見ていきましょう'
  ]
  const claim2 = closingPhrases[Math.floor(Math.random() * closingPhrases.length)]

  // Combine into claim-reason-claim structure
  let impression = claim1
  if (reason && impression.length + reason.length < 100) {
    impression += '。' + reason
  }
  impression += '。' + claim2

  return ensurePoliteEnding(impression)
}

function fitToX({ text, url, xMax }) {
  const cleanUrl = String(url || '').trim()
  const base = `\n${cleanUrl}`
  const score = (t) => weightedLen(`${String(t || '')}${base}`)

  // Already fits
  if (score(text) <= xMax) return String(text || '')

  const cps = Array.from(String(text || ''))
  let lo = 0
  let hi = cps.length

  // Find max codepoint prefix that fits
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2)
    const candidate = cps.slice(0, mid).join('')
    if (score(candidate) <= xMax) lo = mid
    else hi = mid - 1
  }

  let fitted = cps.slice(0, lo).join('').trim()

  // Don't end with ellipsis / incomplete punctuation.
  fitted = fitted.replace(/\.{3,}$/g, '').trim()
  fitted = fitted.replace(/[、,・…]+$/g, '').trim()

  const ensureSentenceEnding = (value) => {
    let v = String(value || '').trim()
    if (!v) return v
    if (/[。！？!?]$/.test(v)) return v

    // Try append "。" if it fits; otherwise trim 1+ chars then append.
    if (score(v + '。') <= xMax) return v + '。'

    // Prefer trimming back to a "safe" boundary to avoid mid-word endings.
    const boundaries = new Set(['。', '、', '」', '』', '）', ')', '】', ']', ' ', '\n'])
    const arrFull = Array.from(v)
    const window = 12
    for (let i = arrFull.length - 1; i >= Math.max(0, arrFull.length - window); i -= 1) {
      const ch = arrFull[i]
      if (!boundaries.has(ch)) continue
      const keepInclusive = ch === '」' || ch === '』' || ch === '）' || ch === ')' || ch === '】' || ch === ']'
      const head = arrFull.slice(0, keepInclusive ? i + 1 : i).join('').trim()
      if (!head) continue
      if (score(head + '。') <= xMax) return head + '。'
    }

    // Fallback: remove codepoints until we can append "。"
    let arr = Array.from(v)
    while (arr.length > 0) {
      arr = arr.slice(0, arr.length - 1)
      const candidate = arr.join('').trim()
      if (!candidate) break
      if (score(candidate + '。') <= xMax) return candidate + '。'
    }

    return v
  }

  fitted = ensureSentenceEnding(fitted)

  // Final safety clamp (should rarely run)
  while (fitted && score(fitted) > xMax) {
    const arr = Array.from(fitted)
    fitted = arr.slice(0, Math.max(0, arr.length - 1)).join('').trim()
    fitted = fitted.replace(/\.{3,}$/g, '').trim()
    fitted = fitted.replace(/[、,・…]+$/g, '').trim()
  }

  // If we stripped everything, allow empty text (URL-only tweet).
  return fitted
}

function finalizeEnding(text, maxLen) {
  let result = String(text || '')
  result = result.replace(/(?:\.\.\.|…)+$/g, '')
  result = result.replace(/[.,、，]+$/g, '')

  if (!/[。！？!?]$/.test(result)) {
    if (codepointLen(result) < maxLen) {
      result += '。'
    } else if (maxLen > 0) {
      const trimmed = clampCodepoints(result, Math.max(0, maxLen - 1))
      result = trimmed.replace(/[.,、，]+$/g, '') + '。'
    }
  }

  // Final clamp just in case
  if (codepointLen(result) > maxLen) {
    result = clampCodepoints(result, maxLen)
    if (!/[。！？!?]$/.test(result) && maxLen > 0) {
      result = clampCodepoints(result, Math.max(0, maxLen - 1)) + '。'
    }
  }

  return result
}

function fillToNearMax(base, maxLen) {
  let impression = String(base || '').replace(/\s+/g, ' ').trim()
  impression = finalizeEnding(impression, maxLen)

  const fillerSentences = [
    '今は焦りやすい時期なので、判断の前に負荷を下げましょう。',
    '「できない自分」ではなく、「疲れている状態」として扱って大丈夫です。',
    '一気に変えなくていいので、今日の負担が減る順番で進めます。',
    '大事なのは根性ではなく、続く形にすることです。',
    '読み終えたら、まず一つだけ行動に落としてみてください。',
    '迷うときほど、情報を増やすより整理が効きます。',
  ]

  let cursor = 0
  while (codepointLen(impression) < maxLen && cursor < fillerSentences.length) {
    const sep = impression.endsWith('。') ? '' : '。'
    impression = `${impression}${sep}${fillerSentences[cursor]}`
    impression = finalizeEnding(impression, maxLen)
    cursor += 1
  }

  // If still short, pad with a safe sentence fragment to get close
  if (codepointLen(impression) < maxLen) {
    const pad = '今のあなたに必要なことだけ、丁寧に。'
    const remaining = maxLen - codepointLen(impression)
    if (remaining > 0) {
      const chunk = clampCodepoints(pad, remaining)
      impression = finalizeEnding(impression + chunk, maxLen)
    }
  }

  return impression
}

function buildXTextAndUrl(post, baseUrl, mode) {
  const xMax = getXMax()
  const url = `${normalizeBaseUrl(baseUrl)}/posts/${post.slug}`
  const urlLen = codepointLen(url)

  // Start with a long impression, then shrink precisely by X weighted length.
  const rawImpression = buildSeraImpression(post, mode)
  const longImpression = fillToNearMax(rawImpression, Math.max(400, xMax * 3))
  const impression = fitToX({ text: longImpression, url, xMax })
  const body = `${impression}\n${url}`

  const weightedLength = weightedLen(body)
  if (weightedLength > xMax) {
    throw new Error(`weightedLength overflow: weightedLength=${weightedLength} X_MAX=${xMax}`)
  }

  return { body, url, impression, xMax, urlLen, weightedLength }
}

async function sendMail({ subject, body }) {
  const gmailUser = requiredEnv('GMAIL_USER')
  const gmailAppPasswordRaw = requiredEnv('GMAIL_APP_PASSWORD')
  const gmailAppPassword = gmailAppPasswordRaw.replace(/\s+/g, '')
  const mailTo = requiredEnv('MAIL_TO')

  const smtpHost = optionalEnv('SMTP_HOST', 'smtp.gmail.com')
  const smtpPort = Number(optionalEnv('SMTP_PORT', '465'))
  const smtpSecure = isTruthy(optionalEnv('SMTP_SECURE', 'true'))

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: Number.isFinite(smtpPort) ? smtpPort : 465,
    secure: smtpSecure,
    auth: { user: gmailUser, pass: gmailAppPassword },
  })

  try {
    // Fail fast with clearer diagnostics (same credentials as sendMail).
    await transporter.verify()

    await transporter.sendMail({
      from: `"X Mailer" <${gmailUser}>`,
      to: mailTo,
      subject,
      text: body,
    })
  } catch (error) {
    const code = error?.code
    const responseCode = error?.responseCode
    const command = error?.command
    const response = error?.response

    if (code === 'EAUTH' || responseCode === 535) {
      const passLen = Array.from(gmailAppPassword).length
      throw new Error(
        [
          'Gmail authentication failed (EAUTH/535).',
          `SMTP: host=${smtpHost} port=${Number.isFinite(smtpPort) ? smtpPort : 465} secure=${smtpSecure}`,
          `Account: ${maskEmail(gmailUser)} (appPassLen=${passLen})`,
          'Fix:',
          '- Make sure the GitHub Secret `GMAIL_APP_PASSWORD` is an App Password for the *same* `GMAIL_USER` you just updated.',
          '- The Gmail account must have 2-Step Verification enabled, then generate an App Password (Google Account > Security > App passwords).',
          '- If you copied an App Password shown like "abcd efgh ijkl mnop", remove spaces (this script strips whitespace automatically).',
          passLen !== 16 ? `- Your app password length after stripping spaces is ${passLen} (expected 16).` : '',
          '- If you recently changed accounts, update both `GMAIL_USER` and `GMAIL_APP_PASSWORD` in this repo.',
          '',
          `Details: code=${code} responseCode=${responseCode} command=${command}`,
          response ? `response=${String(response).slice(0, 200)}` : '',
        ]
          .filter(Boolean)
          .join('\n')
      )
    }

    throw error
  }
}

async function main() {
  const dryRun = isTruthy(process.env.DRY_RUN)

  const siteBaseUrl = optionalEnv('SITE_BASE_URL')
  if (!siteBaseUrl || !String(siteBaseUrl).trim()) {
    throw new Error('Missing optional ENV: SITE_BASE_URL (example: https://prorenata.jp)')
  }

  const modeOverride = optionalEnv('MAIL_MODE', '').toLowerCase()
  const isModeValid = modeOverride === 'fresh' || modeOverride === 'evergreen'

  const fetched = await (async () => {
    // DRY_RUN時にSanity envが無い場合でも、生成ロジックの自己テストだけできるようにする
    if (dryRun && !process.env.SANITY_PROJECT_ID) {
      return {
        mode: isModeValid ? modeOverride : 'fresh',
        post: {
          title: '看護助手の夜勤がつらいときの対処：体調と心を守るコツ',
          slug: 'nursing-assistant-night-shift-coping',
          body: [
            {
              _type: 'block',
              children: [
                {
                  _type: 'span',
                  text: '看護助手として夜勤を続けていると、体調管理が難しくなることがあります。睡眠リズムの乱れや疲労の蓄積は、心身に大きな負担をかけます。'
                }
              ]
            }
          ]
        },
      }
    }
    return fetchOnePost()
  })()

  const mode = fetched.mode
  const post = fetched.post

  const { body, urlLen, impression, xMax, weightedLength } = buildXTextAndUrl(post, siteBaseUrl, mode)
  const impressionLen = codepointLen(impression)
  const bodyLen = codepointLen(body)
  lastDiagnostics = { X_MAX: xMax, urlLen, impressionLen, bodyLen, weightedLength }

  // Create a preview for the subject line (first 50 chars of impression)
  const preview = clampCodepoints(impression, 50).replace(/\n/g, ' ').trim()
  const subject = `【X投稿用｜${deriveProjectName()}】${preview}...`

  // Simple email body with just the post text
  const emailBody = `=== X投稿用テキスト（${weightedLength}/${xMax}文字） ===

${body}

=== コピー用（上記のテキストをそのままコピーしてください） ===`

  if (dryRun) {
    console.log(emailBody)
    console.log(
      JSON.stringify(
        { X_MAX: xMax, urlLen, impressionLen, bodyLen, weightedLength },
        null,
        2
      )
    )
    return
  }

  await sendMail({ subject, body: emailBody })
  console.log(`✅ Sent mail (${mode}): ${post.slug}`)
}

main().catch((error) => {
  const xMax = getXMax()
  const rawBase = optionalEnv('SITE_BASE_URL', '')
  const baseLen = codepointLen(rawBase)
  const diagnostics = lastDiagnostics || { X_MAX: xMax, siteBaseUrlLen: baseLen }

  console.error('[x-mailer] Failed:', error?.message || error)
  console.error(JSON.stringify(diagnostics, null, 2))
  process.exitCode = 1
})
