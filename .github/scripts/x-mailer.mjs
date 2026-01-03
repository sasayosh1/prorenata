import nodemailer from 'nodemailer'
import process from 'node:process'
import { fetchOnePost } from './sanity-fetch.mjs'
import twitterText from 'twitter-text'

const { parseTweet } = twitterText

/**
 * Advanced Dynamic X Mailer (Sentence Pool Edition v6)
 * 
 * Goals:
 * 1. ZERO Code-based Japanese modification. 
 * 2. Use pre-composed, perfect sentences from pools.
 * 3. Max 2 sentences total in the body.
 * 4. Strict 138 weighted character limit (2-char margin).
 * 5. Selection based on keywords without any editing.
 */

const TARGET_TOTAL = 138

const SENTENCE_POOLS = {
  HOOK: [
    '職場での人間関係に、ふと疲れを感じることはありませんか。',
    '毎日の業務に追われて、自分の気持ちを後回しにしていませんか。',
    '周囲に気を使いすぎて、心が少し重くなっているかもしれません。',
    '看護助手の現場では、言葉にできない悩みも多いですよね。',
    '一生懸命頑張っているからこそ、悩んでしまうこともあります。',
    '同僚との距離感に、正解が見えなくて不安になることもありますよね。',
    '忙しい毎日の中で、ふと立ち止まりたくなる瞬間はありませんか。',
    '誰にも相談できずに、ひとりで抱え込んでいることはありませんか。',
    '仕事の内容や環境に、漠然とした不安を感じる時期もあります。',
    '周りの期待に応えようとして、少し無理をしていませんか。',
    '現場の人間関係で、どうしても馴染めないと感じる日もありますよね。',
    '自分の働き方がこれでいいのか、不安になる夜もあるかもしれません。',
    '頑張りすぎて、心に余裕がなくなっていることに気づいていますか。',
    '職場の空気に、少しだけ息苦しさを感じることはありませんか。',
    '丁寧なケアをしたいのに、現実に追われて悩むことも多いですよね。',
    '自分の良さを見失いそうになって、悲しくなることもあるかもしれません。',
    '毎日向き合っているからこそ、見えてくる課題に悩むこともあります。',
    '今の働き方に、どこか違和感を感じている方へ。',
    '最近、少し疲れが溜まっていませんか。',
    '無理をして笑う日が増えていませんか。',
    '毎日、本当にお疲れ様です。',
    '自分の働き方に、迷いを感じることもあります。'
  ],
  EXPLANATION: [
    '今の状況を客観的に見つめ直すための、判断基準をまとめました。',
    '現場のリアルな声をもとに、解決に向けたヒントを整理しています。',
    '自分の心を守りながら働くための、具体的な方法をご紹介します。',
    'なぜそう感じてしまうのか、背景にある理由を分かりやすく解説しました。',
    '無理のない範囲で一歩踏み出すための、小さなきっかけを提案します。',
    '他の現場ではどうしているのか、比較できる材料を揃えています。',
    '今の環境が自分に合っているのか、確かめるための視点をお伝えします。',
    '納得できる選択をするために、知っておきたいポイントをまとめました。',
    '働き方の選択肢を広げるための、具体的なアクションプランです。',
    '自分らしいペースを取り戻すための、心の整え方を整理しました。',
    '周囲との適切な距離を保つための、実践的なヒントをまとめています。',
    '後悔しない決断をするために、大切にしたい考え方を整理しました。',
    '状況を改善するために、まず何から始めればいいかを解説しています。',
    '頑張りすぎない働き方を継続するための、心の持ち方を提案します。',
    '今のモヤモヤを言語化して整理するための、お手伝いをさせてください。',
    '現場での良い循環を作るための、具体的な視点をまとめました。',
    '安心して働き続けるために、確認しておきたいチェックリストです。',
    '大切なポイントを整理しました。',
    '現場の課題と解決策をまとめました。',
    '今の現状を確かめるヒントです。',
    '後悔しない選択の参考にどうぞ。'
  ],
  GENTLE_CTA: [
    'ほんの少し視点を変えるだけで、気持ちが楽になることもあります。',
    'あなたの毎日が、少しでも穏やかなものになることを願っています。',
    '今の自分を大切にするための、小さなヒントになれば嬉しいです。',
    'これからの働き方を、一度ゆっくりと考えてみませんか。',
    '無理に答えを出そうとせず、まずは現状を整理してみましょう。',
    'あなたらしい選択肢を見つけるための、一助になれば幸いです。',
    '心の重荷を少しずつおろして、自分を労わってあげてくださいね。',
    '次の一歩をどう踏み出すか、一緒に考えていきましょう。',
    'ひとりで悩まずに、まずはこの内容を参考にしてみてください。',
    '今日より明日が、少しだけ前向きになれるきっかけを届けます。',
    '自分を責める必要はありません。まずは知ることから始めましょう。',
    'この記事が、今の状況を整理するきっかけになれば嬉しいです。',
    'あなたの頑張りを、わたしはいつも応援しています。',
    '大切なのは、あなたがあなたらしくいられることです。',
    '少しでも心が軽くなるための、サポートになればと願っています。',
    '焦らずに、まずは自分の気持ちと向き合ってみませんか。',
    '納得できる答えを、自分のペースで見つけていきましょう。',
    'まずは情報を整理してみましょう。',
    '一歩ずつ、一緒に進みましょう。',
    '自分のペースで大丈夫ですよ。',
    '心を軽くするきっかけにどうぞ。'
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
 * Selects pre-composed sentences from pools based on keyword matching.
 */
function selectPoolSentences(post) {
  const bodyFullText = (extractTextFromPortableText(post.body || []) + ' ' + (post.slug || '')).toLowerCase()
  const seed = post.slug || 'default-seed'

  // Deterministic random index based on seed
  const getIndex = (arr, offset = 0) => {
    let hash = 0
    for (let i = 0; i < seed.length; i++) hash = (hash << 5) - hash + seed.charCodeAt(i)
    return Math.abs(hash + offset) % arr.length
  }

  // Define keyword-based weights or filtered lists (TBD if needed, currently using seeded random for variety)
  const hook = SENTENCE_POOLS.HOOK[getIndex(SENTENCE_POOLS.HOOK)]
  const desc = SENTENCE_POOLS.EXPLANATION[getIndex(SENTENCE_POOLS.EXPLANATION)]
  const cta = SENTENCE_POOLS.GENTLE_CTA[getIndex(SENTENCE_POOLS.GENTLE_CTA)]

  return { hook, desc, cta }
}

/**
 * Composes the post using "Pool sentences" without ANY modification.
 */
function composePost({ post, url, target = TARGET_TOTAL }) {
  const seed = post.slug || post.title || 'default'
  const getHash = (str) => {
    let hash = 0
    for (let i = 0; i < str.length; i++) hash = (hash << 5) - hash + str.charCodeAt(i)
    return Math.abs(hash)
  }

  const render = (parts, useNewline) => {
    const text = parts.filter(Boolean).join('')
    return useNewline ? `${text}\n${url}` : `${text} ${url}`
  }

  // Generate ALL possible valid combinations of max 2 sentences
  const candidates = []

  // 1-sentence combinations
  for (const hook of SENTENCE_POOLS.HOOK) {
    candidates.push({ parts: [hook], name: 'Hook Only' })
  }

  // 2-sentence combinations (Hook + Desc or Hook + CTA)
  for (const hook of SENTENCE_POOLS.HOOK) {
    for (const desc of SENTENCE_POOLS.EXPLANATION) {
      candidates.push({ parts: [hook, desc], name: 'Hook + Explanation' })
    }
    for (const cta of SENTENCE_POOLS.GENTLE_CTA) {
      candidates.push({ parts: [hook, cta], name: 'Hook + CTA' })
    }
  }

  // Find all that fit under TARGET_TOTAL
  const valid = []
  for (const c of candidates) {
    const resNewline = render(c.parts, true)
    const lenNewline = weightedLen(resNewline)
    if (lenNewline <= target) {
      valid.push({ ...c, str: resNewline, len: lenNewline, newline: true, remaining: target - lenNewline })
    } else {
      const resInline = render(c.parts, false)
      const lenInline = weightedLen(resInline)
      if (lenInline <= target) {
        valid.push({ ...c, str: resInline, len: lenInline, newline: false, remaining: target - lenInline })
      }
    }
  }

  if (valid.length === 0) {
    const flatHook = SENTENCE_POOLS.HOOK[0].slice(0, 30) + '...'
    return { str: `${flatHook} ${url}`, len: weightedLen(`${flatHook} ${url}`), poolName: 'Critical Fallback' }
  }

  // Sort by remaining space ascending (maximization)
  valid.sort((a, b) => a.remaining - b.remaining)

  // To ensure variety between runs for same article (optional) or stable selection
  // User wants "TARGET_TOTAL にできるだけ近い", so we pick the top one.
  // But to meet "毎回文が変わる", we use the seed to pick among top 10 best options.
  const topSize = Math.min(10, valid.length)
  const bestIndex = getHash(seed) % topSize
  return {
    ...valid[bestIndex],
    poolName: valid[bestIndex].name
  }
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
  const result = composePost({ post, url, target: TARGET_TOTAL })

  const emailBody = result.str
  const len = result.len
  const rawLen = Array.from(emailBody).length
  const title = post.title || '新着記事'
  const subject = `【X投稿用｜${deriveProjectName()}】${title}`

  console.log(`\n=== TEST CASE: ${label} ===`)
  console.log(`SUBJECT: ${subject}`)
  console.log(`POOL: ${result.poolName}`)
  console.log(`SENTENCES: ${result.parts ? result.parts.join(' / ') : 'N/A'}`)
  console.log(`METRICS: weighted=${len} raw=${rawLen} remaining=${result.remaining} urlMode=${result.newline ? 'newline' : 'inline'}`)
  console.log('--- BODY START ---')
  process.stdout.write(emailBody + '\n')
  console.log('--- BODY END ---')

  if (len > TARGET_TOTAL) throw new Error(`CRITICAL: Case "${label}" exceeded limit! (${len})`)
}

async function main() {
  const dryRun = isTruthy(process.env.DRY_RUN)
  const siteBaseUrl = optionalEnv('SITE_BASE_URL', 'https://prorenata.jp').replace(/\/+$/, '')

  if (dryRun && !process.env.SANITY_PROJECT_ID) {
    // Case 1: Standard Article
    await runTest('Normal Article', {
      title: '人間関係の悩み',
      slug: 'human-relations-stress',
      body: []
    }, siteBaseUrl)

    // Case 2: Different Article (Variety test)
    await runTest('Career Article', {
      title: 'キャリアプラン',
      slug: 'career-growth-tips',
      body: []
    }, siteBaseUrl)

    // Case 3: Character maximization test
    await runTest('Short Slug Article', {
      title: '短いテスト',
      slug: 'test',
      body: []
    }, siteBaseUrl)

    return
  }

  const fetched = await fetchOnePost()
  if (!fetched || !fetched.post) throw new Error('Failed to fetch post from Sanity')

  const post = fetched.post
  const url = `${siteBaseUrl}/x/${post.slug}`
  const result = composePost({ post, url, target: TARGET_TOTAL })
  const emailBody = result.str

  const subject = `【X投稿用｜${deriveProjectName()}】${post.title || '新着記事'}`

  await sendMail({ subject, body: emailBody })
  console.log(`✅ Sent mail: ${post.slug} (weighted=${result.len}, pool=${result.poolName}, remaining=${result.remaining})`)
}

main().catch((error) => {
  console.error('[x-mailer] Failed:', error?.message || error)
  process.exitCode = 1
})
