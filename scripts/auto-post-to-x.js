/**
 * X（Twitter）自動投稿スクリプト
 *
 * 既存記事からランダムに1記事を選択し、Gemini APIで要約を生成してXに投稿
 */

const { createClient } = require('@sanity/client')
const { TwitterApi } = require('twitter-api-v2')
const { GoogleGenerativeAI } = require('@google/generative-ai')

// 環境変数の確認
const SANITY_CONFIG = {
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
}

const X_CONFIG = {
  appKey: process.env.X_API_KEY,
  appSecret: process.env.X_API_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_TOKEN_SECRET
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const SUMMARY_ONLY = (process.env.X_SUMMARY_ONLY || '').toLowerCase() === 'true'

// 必須環境変数チェック
const missing = []
if (!SANITY_CONFIG.token) missing.push('SANITY_API_TOKEN')
if (!GEMINI_API_KEY) missing.push('GEMINI_API_KEY')

if (!SUMMARY_ONLY) {
  if (!X_CONFIG.appKey) missing.push('X_API_KEY')
  if (!X_CONFIG.appSecret) missing.push('X_API_SECRET')
  if (!X_CONFIG.accessToken) missing.push('X_ACCESS_TOKEN')
  if (!X_CONFIG.accessSecret) missing.push('X_ACCESS_TOKEN_SECRET')
}

if (missing.length) {
  console.error('❌ 必須環境変数が不足しています:')
  missing.forEach(key => console.error(`  - ${key}`))
  console.error('ℹ️  サマリーモードで実行する場合は X_SUMMARY_ONLY=true を設定してください。')
  process.exit(1)
}

if (SUMMARY_ONLY) {
  console.log('ℹ️  サマリーモードを有効化: Xには投稿せず、要約のみ出力します。')
}

// クライアント初期化（環境変数チェック後に初期化）
const sanityClient = createClient(SANITY_CONFIG)
const xClient = SUMMARY_ONLY ? null : new TwitterApi(X_CONFIG)

/**
 * 公開済み記事からランダムに1記事を取得
 */
async function getRandomArticle() {
  console.log('📚 公開済み記事を取得中...')

  // 公開済み記事を取得（最近投稿していない記事を優先）
  const query = `*[_type == "post" && !(_id in path("drafts.**"))] | order(_updatedAt desc) {
    _id,
    title,
    slug,
    excerpt,
    body,
    publishedAt,
    _createdAt,
    "categories": categories[]->title,
    "lastPostedToX": coalesce(lastPostedToX, "1970-01-01T00:00:00Z")
  }`

  const posts = await sanityClient.fetch(query)

  if (!posts || posts.length === 0) {
    throw new Error('公開済み記事が見つかりません')
  }

  console.log(`✅ ${posts.length}件の記事を取得`)

  // 最近投稿していない記事を優先（30日以上前 or 未投稿）
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const eligiblePosts = posts.filter(post => {
    const lastPosted = new Date(post.lastPostedToX)
    return lastPosted < thirtyDaysAgo
  })

  const selectedPosts = eligiblePosts.length > 0 ? eligiblePosts : posts
  console.log(`📋 投稿候補: ${selectedPosts.length}件`)

  // ランダムに1記事を選択
  const randomIndex = Math.floor(Math.random() * selectedPosts.length)
  const selectedPost = selectedPosts[randomIndex]

  console.log(`🎲 選択された記事: "${selectedPost.title}"`)

  return selectedPost
}

/**
 * Gemini APIで記事要約を生成（280文字以内）
 */
async function generateSummary(post) {
  console.log('🤖 Gemini APIで要約を生成中...')

  // Initialize Gemini AI client inside function (after env vars are loaded)
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
  // Use latest stable model: gemini-2.5-flash
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  // 記事本文をプレーンテキストに変換
  const bodyText = post.body
    .filter(block => block._type === 'block' && block.children)
    .map(block => block.children.map(child => child.text).join(''))
    .join('\n')
    .substring(0, 3000) // 長すぎる場合は制限

  const prompt = `
以下の記事のタイトルと本文から、X（Twitter）投稿用の魅力的な要約を作成してください。

【制約条件】
- 文字数: 200〜240文字
- 記事URLを含めるスペースを考慮すること
- ハッシュタグは不要
- 絵文字は適度に使用（1〜3個程度）
- 読者の興味を引く内容にする
- 「〜です」「〜ます」調で統一
- 箇条書きは使わず、自然な文章で

【記事タイトル】
${post.title}

【記事概要】
${post.excerpt || ''}

【記事本文（抜粋）】
${bodyText.substring(0, 1000)}

【要約】
`

  const result = await model.generateContent(prompt)
  const response = await result.response
  let summary = response.text().trim()

  // 改行を削除してスペースに置換
  summary = summary.replace(/\n+/g, ' ')

  // 240文字を超える場合は切り詰める
  if (summary.length > 240) {
    summary = summary.substring(0, 237) + '...'
  }

  console.log(`✅ 要約生成完了（${summary.length}文字）`)
  console.log(`📝 要約:\n${summary}`)

  return summary
}

/**
 * Xに投稿
 */
async function postToX(post, summary) {
  const articleUrl = `https://prorenata.jp/posts/${post.slug.current}`
  const MAX_TWEET_LENGTH = 280
  const LINE_BREAKS_LENGTH = 2 // "\n\n" 分
  const availableSummaryLength = MAX_TWEET_LENGTH - articleUrl.length - LINE_BREAKS_LENGTH

  if (availableSummaryLength <= 0) {
    throw new Error('記事URLが長すぎるため、ツイート文字数を計算できません')
  }

  let adjustedSummary = summary
  if (adjustedSummary.length > availableSummaryLength) {
    const ellipsis = '…'
    const cutLength = Math.max(availableSummaryLength - ellipsis.length, 0)
    adjustedSummary = adjustedSummary.substring(0, cutLength)
    if (cutLength > 0) {
      adjustedSummary += ellipsis
    }
    console.log(`✂️ 要約を短縮しました（${adjustedSummary.length}文字）`)
  }

  const tweetText = `${adjustedSummary}\n\n${articleUrl}`
  console.log(`📊 投稿文字数: ${tweetText.length}文字`)

  if (SUMMARY_ONLY) {
    console.log('\n📝 サマリーモード（X投稿なし）')
    console.log('----------------------------------------')
    console.log(tweetText)
    console.log('----------------------------------------\n')
    return { data: { id: 'summary-mode' }, text: tweetText }
  }

  console.log('🐦 Xに投稿中...')

  if (tweetText.length > MAX_TWEET_LENGTH) {
    console.error(`❌ ツイートが${MAX_TWEET_LENGTH}文字を超えています（${tweetText.length}文字）`)
    process.exit(1)
  }

  try {
    const tweet = await xClient.v2.tweet(tweetText)
    console.log('✅ Xに投稿成功!')
    console.log(`🔗 ツイートID: ${tweet.data.id}`)
    return tweet
  } catch (error) {
    console.error('❌ X投稿エラー:', error)
    throw error
  }
}

/**
 * Sanityに投稿履歴を記録
 */
async function updatePostHistory(postId) {
  console.log('💾 投稿履歴を記録中...')

  const now = new Date().toISOString()

  await sanityClient
    .patch(postId)
    .set({ lastPostedToX: now })
    .commit()

  console.log('✅ 投稿履歴を記録しました')
}

/**
 * ランダムな待機時間を追加（スパム対策）
 * 0〜60分の間でランダムに待機
 */
async function randomDelay() {
  const delayMinutes = Math.floor(Math.random() * 60) // 0〜60分
  const delayMs = delayMinutes * 60 * 1000

  console.log(`⏰ スパム対策: ${delayMinutes}分待機します...`)

  await new Promise(resolve => setTimeout(resolve, delayMs))

  console.log('✅ 待機完了\n')
}

/**
 * メイン処理
 */
async function main() {
  console.log('🚀 X自動投稿スクリプト開始\n')

  try {
    // 0. ランダムな待機時間（スパム対策）
    await randomDelay()

    // 1. ランダムに記事を選択
    const post = await getRandomArticle()
    console.log('')

    // 2. Gemini APIで要約を生成
    const summary = await generateSummary(post)
    console.log('')

    // 3. Xに投稿
    const tweet = await postToX(post, summary)
    console.log('')

    // 4. 投稿履歴を記録
    await updatePostHistory(post._id)
    console.log('')

    console.log('🎉 すべての処理が完了しました!')
    console.log(`📄 記事: ${post.title}`)
    console.log(`🔗 記事URL: https://prorenata.jp/posts/${post.slug.current}`)
    console.log(`🐦 ツイートID: ${tweet.data.id}`)

  } catch (error) {
    console.error('\n❌ エラーが発生しました:', error.message)
    console.error(error)
    process.exit(1)
  }
}

// スクリプト実行
main()
