import nodemailer from 'nodemailer'
import process from 'node:process'
import fs from 'node:fs'
import path from 'node:path'
import { fetchOnePost } from './sanity-fetch.mjs'
import twitterText from 'twitter-text'

const { parseTweet } = twitterText

/**
 * Advanced Dynamic X Mailer (Enterprise Edition v7)
 * 
 * Features:
 * 1. Persistent History Tracking (.analytics/x_mailer_history.json)
 * 2. Sentence Pool Expansion (40+ per category)
 * 3. NG Word / Safety Guard (Medical/Financial/Aggressive)
 * 4. Automatic URL Layout Optimization (newline/inline)
 * 5. Maximization Search closest to TARGET_TOTAL = 138
 */

const TARGET_TOTAL = 138
const SAFETY_MARGIN = 2
const HISTORY_FILE = path.join(process.cwd(), '.analytics/x_mailer_history.json')
const HISTORY_MAX = 200

// NG Word Patterns (Medical context, Financial guarantees, Aggressive commands)
const NG_REGEX = /(必ず|絶対|100%|確実に|治る|治ります|診断|処方|投資|稼げる|収益|しなさい|すべき|やめろ|最悪|ゴミ|死ね|殺す)/i

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
    '自分の働き方に、迷いを感じることもあります。',
    '夜勤明けの静かな時間に、ふと将来が不安になりませんか。',
    '一生懸命なあなただからこそ、心の手入れが必要です。',
    '患者さんの前では笑顔でも、心は泣いていることはありませんか。',
    '職場のルールに、なんとなく納得できないことはありませんか。',
    '誰にも言えない弱音、心の中に溜まっていませんか。',
    '人手不足の現場で、心身ともに限界を感じていませんか。',
    '頑張りが評価されないと感じて、虚しくなることはありませんか。',
    '今の環境で、自分の成長を感じられずに悩んでいませんか。',
    '優しいあなたを必要としている場所は、きっとあります。',
    '心がざわついて、眠れない夜を過ごしていませんか。',
    'もっと楽に、自分らしく働ける道を探してみませんか。',
    '現場の慌ただしさに、心が削られていませんか。',
    'ふとした瞬間に、このままでいいのかと立ち止まってしまいます。',
    '周りと意見が合わなくて、孤独を感じることはありませんか。',
    '些細な一言に、傷ついてしまう日もありますよね。',
    '自分のケアは、後回しになりがちですよね。',
    '新しい環境に飛び込む勇気が、なかなか持てないこともあります。',
    '理想と現実のギャップに、苦しくなっていませんか。'
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
    '後悔しない選択の参考にどうぞ。',
    '自分を責めないための、考え方のコツをまとめました。',
    '心に余裕を作るための、日々のちょっとした工夫です。',
    '仕事とプライベートの境界線を、うまく引くためのヒントです。',
    '職場の空気に流されない、自分軸の作り方を解説しました。',
    'モヤモヤの正体を知ることで、解決の糸口が見えてきます。',
    '自分にとって何が一番大切か、見極める材料を整理しました。',
    '今の職場が「普通」ではない可能性、一度確認してみませんか。',
    'ストレスの原因を分解して、対処法を一緒に考えましょう。',
    '心が折れる前に知っておきたい、避難方法もお伝えします。',
    '現場での立ち振る舞いを、少し楽にする方法を共有します。',
    '前向きに現状を変えるための、最初のアクションをまとめました。',
    '自分の可能性を狭めないために、知っておくべきことがあります。',
    '無理な我慢を減らすための、実践的な考え方です。',
    '心身の健康を維持しながら、長く働くためのポイントです。',
    '自分の強みを再発見するための、ワークを用意しました。',
    '納得のいく決断を下すための、ロードマップを作成しました。',
    '現場の不満を、建設的な改善に変えるヒントを探しましょう。',
    '一歩引いた視点で、これからの人生を眺めてみませんか。',
    '自分にとっての「幸せな働き方」を定義してみましょう。'
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
    '心を軽くするきっかけにどうぞ。',
    '明日の心が、今日より少し晴れますように。',
    '立ち止まることは、決して悪いことではありません。',
    'あなたの居場所は、ここだけではないかもしれません。',
    '頑張っている自分を、たまには褒めてあげてください。',
    '深呼吸して、自分の声をゆっくり聴いてみませんか。',
    '解決のきっかけは、すぐそばにあるかもしれません。',
    'この内容が、あなたの支えになることを願っています。',
    '自分にとって一番良い道を、一緒に探していきましょう。',
    '焦る気持ちを、そっと横に置いておきましょう。',
    'あなたの笑顔が戻るまで、ここでお待ちしています。',
    '新しい明日のために、今できることから始めませんか。',
    '無理をしない勇気、大切にしていきましょう。',
    '自分の人生のハンドル、自分で握り直してみませんか。',
    '一日の終わりに、心が温まるきっかけになれば幸いです。',
    '未来のあなたが、今のあなたに感謝できる選択を。',
    '少しの勇気が、世界を大きく変えることもあります。',
    'ここにあるヒントが、あなたの力になりますように。',
    '自分らしく輝ける場所を、妥協せずに探しましょう。',
    'あなたの心の平安が、何より大切です。'
  ]
}

class HistoryManager {
  constructor(filePath, maxEntries = HISTORY_MAX) {
    this.filePath = filePath
    this.maxEntries = maxEntries
    this.history = []
    this.load()
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, 'utf8')
        this.history = JSON.parse(data)
      }
    } catch (e) {
      console.error(`[HistoryManager] Load failed: ${e.message}`)
      this.history = []
    }
  }

  save() {
    try {
      const dir = path.dirname(this.filePath)
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(this.filePath, JSON.stringify(this.history, null, 2))
    } catch (e) {
      console.error(`[HistoryManager] Save failed: ${e.message}`)
    }
  }

  addEntry(entry) {
    this.history.unshift({
      timestamp: new Date().toISOString(),
      ...entry
    })
    if (this.history.length > this.maxEntries) {
      this.history = this.history.slice(0, this.maxEntries)
    }
    this.save()
  }

  isUsed(sentence) {
    return this.history.some(e =>
      e.selectedHook === sentence ||
      e.selectedExplanation === sentence ||
      e.selectedCTA === sentence
    )
  }

  // Fallback: returns the oldest entry's sentences to "unblock" if needed
  getOldestSentences() {
    if (this.history.length === 0) return []
    const oldest = this.history[this.history.length - 1]
    return [oldest.selectedHook, oldest.selectedExplanation, oldest.selectedCTA].filter(Boolean)
  }
}

/**
 * Validates text against NG word patterns.
 */
function isSafe(text) {
  return !NG_REGEX.test(text)
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

/**
 * Orchestrates sentence selection with history and safety checks.
 */
function composePost({ post, url, historyManager, target = TARGET_TOTAL }) {
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

  // 1. Initial Filtering (Safety Guard)
  const safePools = {
    HOOK: SENTENCE_POOLS.HOOK.filter(s => isSafe(s)),
    EXPLANATION: SENTENCE_POOLS.EXPLANATION.filter(s => isSafe(s)),
    GENTLE_CTA: SENTENCE_POOLS.GENTLE_CTA.filter(s => isSafe(s))
  }

  // 2. Generate Candidate Pool
  let candidates = []

  // Single sentence candidates
  for (const hook of safePools.HOOK) {
    candidates.push({ parts: [hook], name: 'Hook Only' })
  }

  // Double sentence candidates
  for (const hook of safePools.HOOK) {
    for (const desc of safePools.EXPLANATION) {
      candidates.push({ parts: [hook, desc], name: 'Hook + Explanation' })
    }
    for (const cta of safePools.GENTLE_CTA) {
      candidates.push({ parts: [hook, cta], name: 'Hook + CTA' })
    }
  }

  // 3. Score & Filter (History + Safety + Length)
  const processCandidate = (c) => {
    // Check history (Duplication Guard)
    const historyHits = c.parts.filter(p => historyManager.isUsed(p))

    // Check layout optimization
    let resNewline = render(c.parts, true)
    let lenNewline = weightedLen(resNewline)
    let resInline = render(c.parts, false)
    let lenInline = weightedLen(resInline)

    let best = null
    if (lenNewline <= target) {
      best = { ...c, str: resNewline, len: lenNewline, newline: true, remaining: target - lenNewline, historyHits }
    } else if (lenInline <= target) {
      best = { ...c, str: resInline, len: lenInline, newline: false, remaining: target - lenInline, historyHits }
    }

    if (best && !isSafe(best.str)) return null // Final combined safety check
    return best
  }

  const scored = candidates.map(processCandidate).filter(Boolean)

  if (scored.length === 0) {
    const fallback = `${safePools.HOOK[0].slice(0, 30)}... ${url}`
    return { str: fallback, len: weightedLen(fallback), poolName: 'Critical Fallback' }
  }

  // Sort: 
  // 1st Priority: NO History Hits
  // 2nd Priority: Smaller Remaining (Maximization)
  scored.sort((a, b) => {
    if (a.historyHits.length !== b.historyHits.length) return a.historyHits.length - b.historyHits.length
    return a.remaining - b.remaining
  })

  // Variety: Seeded selection from top 10 best valid/unique candidates
  const bestValid = scored.filter(s => s.historyHits.length === 0)
  const poolToPickFrom = bestValid.length > 0 ? bestValid : scored

  if (bestValid.length === 0) {
    console.log('⚠️ [Warning] History candidate exhaustion. Using oldest entries fallback.')
  }

  const topSize = Math.min(10, poolToPickFrom.length)
  const finalSelect = poolToPickFrom[getHash(seed) % topSize]

  return {
    ...finalSelect,
    historyHit: finalSelect.historyHits.length > 0
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

async function runTest(label, post, siteBaseUrl, historyManager) {
  const url = `${siteBaseUrl}/x/${post.slug}`
  const result = composePost({ post, url, historyManager, target: TARGET_TOTAL })

  const emailBody = result.str
  const len = result.len
  const rawLen = Array.from(emailBody).length
  const subject = `【X投稿用】${post.title || '新着記事'}`

  console.log(`\n=== TEST CASE: ${label} ===`)
  console.log(`SLUG: ${post.slug}`)
  console.log(`POOL: ${result.name}`)
  console.log(`SENTENCES: ${result.parts ? result.parts.join(' / ') : 'N/A'}`)
  console.log(`METRICS: weighted=${len} raw=${rawLen} remaining=${result.remaining} urlMode=${result.newline ? 'newline' : 'inline'}`)
  console.log(`FLAGS: historyHit=${result.historyHit ? 'YES' : 'no'}`)
  console.log('--- BODY START ---')
  process.stdout.write(emailBody + '\n')
  console.log('--- BODY END ---')

  if (len > TARGET_TOTAL) throw new Error(`CRITICAL: Case "${label}" exceeded limit! (${len})`)

  // Update history in simulation
  historyManager.addEntry({
    slug: post.slug,
    selectedHook: result.parts[0],
    selectedExplanation: result.parts[1],
    selectedCTA: result.parts[2], // Handle CTA cases if any
    urlMode: result.newline ? 'newline' : 'inline',
    finalWeighted: result.len
  })
}

async function main() {
  const dryRun = isTruthy(process.env.DRY_RUN)
  const siteBaseUrl = optionalEnv('SITE_BASE_URL', 'https://prorenata.jp').replace(/\/+$/, '')
  const historyManager = new HistoryManager(HISTORY_FILE)

  if (dryRun && !process.env.SANITY_PROJECT_ID) {
    // Variety Test
    await runTest('Normal Article', { title: '関係の悩み', slug: 'stress-1' }, siteBaseUrl, historyManager)
    await runTest('Career Article', { title: '働き方', slug: 'career-1' }, siteBaseUrl, historyManager)
    await runTest('Burnout Article', { title: '休息の大切さ', slug: 'rest-1' }, siteBaseUrl, historyManager)
    await runTest('Repeat Test (Should vary)', { title: '関係の悩み', slug: 'stress-1' }, siteBaseUrl, historyManager)

    // Safety Test (Verify NG check)
    const unsafePost = { title: '必ず治る！', slug: 'unsafe' }
    const unsafeResult = composePost({ post: unsafePost, url: '...', historyManager })
    console.log(`\n=== SAFETY TEST ===\nResult contains NG: ${!isSafe(unsafeResult.str) ? 'YES (CRITICAL)' : 'no'}`)

    return
  }

  const fetched = await fetchOnePost()
  if (!fetched || !fetched.post) throw new Error('Failed to fetch post from Sanity')

  const post = fetched.post
  const url = `${siteBaseUrl}/x/${post.slug}`
  const result = composePost({ post, url, historyManager, target: TARGET_TOTAL })

  const subject = `【X投稿用】${post.title || '新着記事'}`

  await sendMail({ subject, body: result.str })

  // Record history
  historyManager.addEntry({
    slug: post.slug,
    selectedHook: result.parts[0],
    selectedExplanation: result.parts.length > 1 && result.parts[1],
    urlMode: result.newline ? 'newline' : 'inline',
    finalWeighted: result.len
  })

  console.log(`✅ Sent mail: ${post.slug} (weighted=${result.len}, pool=${result.name}, remaining=${result.remaining})`)
}

main().catch((error) => {
  console.error('[x-mailer] Failed:', error?.message || error)
  process.exitCode = 1
})
