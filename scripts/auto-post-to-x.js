/**
 * X投稿サマリー生成スクリプト
 *
 * 公開済み記事からランダムに1件を選び、Excerptから約140文字の要約を作成。
 * 生成した要約を x-summary.txt に保存し、GitHub Actions などから手動投稿に活用できます。
 *
 * 注: Gemini API不使用（完全無料、Excerptは既に白崎セラ口調で最適化済み）
 */

const fs = require('fs')
const { createClient } = require('@sanity/client')

const SANITY_TOKEN = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN || ''

const SANITY_TOKEN_SOURCE = SANITY_TOKEN
  ? (process.env.SANITY_WRITE_TOKEN ? 'SANITY_WRITE_TOKEN' : 'SANITY_API_TOKEN')
  : 'anonymous (token not provided)'
console.log(`🔐 Sanity token source: ${SANITY_TOKEN_SOURCE}`)

const SANITY_CONFIG = {
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
}

let currentSanityToken = SANITY_TOKEN || null
let sanityClient = createSanityClient(currentSanityToken)
const POSTS_QUERY = `*[_type == "post" && !(_id in path("drafts.**"))] | order(_updatedAt desc) {
  _id,
  title,
  slug,
  excerpt,
  body,
  publishedAt,
  _createdAt,
  "categories": categories[]->title
}`

// 投稿履歴を読み込む
function loadTweetHistory() {
  const historyPath = 'posts_tweeted.json'
  try {
    if (fs.existsSync(historyPath)) {
      const data = fs.readFileSync(historyPath, 'utf8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.warn('⚠️ 投稿履歴の読み込みに失敗しました:', error.message)
  }
  return []
}

// 過去30日分の投稿済み記事IDを取得
function getRecentlyTweetedIds() {
  const history = loadTweetHistory()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  return history
    .filter(record => new Date(record.timestamp) > thirtyDaysAgo)
    .map(record => record.postId)
}

async function fetchPublishedPostsWithRetry(maxAttempts = 3) {
  let lastError

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`   ↳ Sanity fetch attempt ${attempt}/${maxAttempts}`)
      const posts = await sanityClient.fetch(POSTS_QUERY)
      return Array.isArray(posts) ? posts : []
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      const status =
        error?.statusCode ||
        error?.response?.statusCode ||
        error?.response?.status ||
        error?.status
      const detailMessage =
        error?.response?.body?.message ||
        error?.response?.body?.error ||
        error?.message ||
        'unknown error'

      if (status === 401) {
        if (currentSanityToken) {
          console.warn('⚠️ Sanityトークンが無効または期限切れのため、匿名クライアントに切り替えます（公開データのみ取得）。')
          currentSanityToken = null
          sanityClient = createSanityClient(null)
          continue
        }

        throw new Error('Sanity APIが401を返しました。データセットが非公開の場合は有効なトークンを設定してください。')
      }

      if (attempt === maxAttempts) {
        break
      }

      const waitMs = attempt * 2000
      console.warn(`⚠️ Sanity記事取得に失敗しました (${detailMessage}). ${waitMs / 1000}s後にリトライします...`)
      await sleep(waitMs)
    }
  }

  throw new Error(`Sanity記事取得に連続で失敗しました: ${lastError?.message || 'unknown error'}`)
}

async function getRandomArticle() {
  console.log('📚 公開済み記事を取得中...')

  const allPosts = await fetchPublishedPostsWithRetry()

  if (!allPosts || allPosts.length === 0) {
    throw new Error('公開済み記事が見つかりません')
  }

  const validPosts = allPosts.filter(post => post?.slug?.current)
  if (validPosts.length === 0) {
    throw new Error('slugが設定された公開記事が存在しません')
  }

  if (validPosts.length !== allPosts.length) {
    console.warn(`⚠️ slug未設定の記事を ${allPosts.length - validPosts.length}件スキップしました`)
  }

  // 過去30日分の投稿済み記事を除外
  const recentlyTweetedIds = getRecentlyTweetedIds()
  const availablePosts = validPosts.filter(post => !recentlyTweetedIds.includes(post._id))

  console.log(`📊 総記事数: ${validPosts.length}, 除外: ${recentlyTweetedIds.length}, 利用可能: ${availablePosts.length}`)

  // 利用可能な記事がない場合は全記事から選択
  const posts = availablePosts.length > 0 ? availablePosts : validPosts
  if (availablePosts.length === 0) {
    console.warn('⚠️ 過去30日分の除外後、利用可能な記事がないため全記事から選択します')
  }

  const randomIndex = Math.floor(Math.random() * posts.length)
  const selectedPost = posts[randomIndex]
  console.log(`🎲 選択された記事: "${selectedPost.title}"`)

  return selectedPost
}

async function generateSummary(post) {
  console.log('📝 Excerptから要約を生成中...')

  // Excerpt を使用（既に白崎セラ口調で最適化済み）
  let summary = post.excerpt || ''

  // Excerpt が空の場合は本文の最初の部分を使用
  if (!summary || summary.trim().length === 0) {
    console.warn('⚠️ Excerptが空のため、本文から抽出します')
    const bodyText = (post.body || [])
      .filter((block) => block._type === 'block' && block.children)
      .map((block) => block.children.map((child) => child.text || '').join(''))
      .join('\n')
    summary = bodyText.slice(0, 200)
  }

  // 140文字に調整
  summary = finalizeSummary(summary.trim())

  console.log(`✅ 要約生成完了（${summary.length}文字）`)
  console.log(`📝 要約:\n${summary}`)

  return summary
}

async function saveSummary(post, summary) {
  const now = new Date()
  const isoTimestamp = now.toISOString()
  const articleUrl = `https://prorenata.jp/posts/${post.slug.current}`

  const summaryRecord = JSON.stringify(
    {
      title: post.title,
      timestamp: isoTimestamp,
      articleUrl,
      summary,
    },
    null,
    2,
  )

  await fs.promises.writeFile('x-summary.json', summaryRecord, 'utf8')
  console.log('📝 要約を x-summary.json に保存しました')

  // 投稿履歴に記録を追加
  const history = loadTweetHistory()
  history.push({
    postId: post._id,
    title: post.title,
    slug: post.slug.current,
    timestamp: isoTimestamp,
  })

  // 最新100件のみ保持（ファイルサイズ管理）
  const trimmedHistory = history.slice(-100)

  await fs.promises.writeFile(
    'posts_tweeted.json',
    JSON.stringify(trimmedHistory, null, 2),
    'utf8'
  )
  console.log('📜 投稿履歴を posts_tweeted.json に記録しました')
}

async function main() {
  console.log('🚀 X投稿サマリー生成を開始します\n')

  try {
    const post = await getRandomArticle()
    console.log('')

    const summary = await generateSummary(post)
    console.log('')

    await saveSummary(post, summary)
    console.log('')

    console.log('🎉 すべての処理が完了しました!')
    console.log(`📄 記事: ${post.title}`)
    console.log(`🔗 記事URL: https://prorenata.jp/posts/${post.slug.current}`)
    console.log(`🗒️ 生成要約: ${summary}`)
  } catch (error) {
    console.error('\n❌ エラーが発生しました:', error.message)
    console.error(error)
    process.exit(1)
  }
}

main()

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function finalizeSummary(text) {
  const MAX_LENGTH = 140
  let result = text

  if (result.length > MAX_LENGTH) {
    const sentenceEndings = ['。', '！', '？', '!', '?']
    const slicePoint = sentenceEndings
      .map((mark) => result.lastIndexOf(mark, MAX_LENGTH - 1))
      .reduce((max, index) => Math.max(max, index), -1)

    if (slicePoint !== -1) {
      result = result.slice(0, slicePoint + 1)
    } else {
      result = result.slice(0, MAX_LENGTH)
    }
  }

  result = result.trim()

  if (!/[。！？!?]$/.test(result)) {
    result = result.replace(/[、,・;；]+$/u, '')
    const candidates = ['。', '！', '？', '!', '?']
    const lastEnding = candidates
      .map(mark => result.lastIndexOf(mark))
      .reduce((max, index) => Math.max(max, index), -1)

    if (lastEnding !== -1) {
      result = result.slice(0, lastEnding + 1)
    }

    if (result.length + 1 > MAX_LENGTH) {
      const slicePoint = result.lastIndexOf('、', MAX_LENGTH - 1)
      if (slicePoint !== -1) {
        result = result.slice(0, slicePoint)
      } else {
        result = result.slice(0, MAX_LENGTH - 1)
      }
      result = result.replace(/[、,・;；]+$|[。！？!?]+$/u, '')
    }

    result = `${result}。`
  }

  if (result.length > MAX_LENGTH) {
    result = result.slice(0, MAX_LENGTH)
    if (!/[。！？!?]$/.test(result)) {
      result = result.replace(/.$/, '。')
    }
  }

  return result
}
function createSanityClient(token) {
  const client = createClient({
    ...SANITY_CONFIG,
    token: token || undefined,
    useCdn: token ? false : true,
  })
  const label = token ? (process.env.SANITY_WRITE_TOKEN ? 'SANITY_WRITE_TOKEN' : 'SANITY_API_TOKEN') : 'anonymous (no token)'
  console.log(`📡 Sanity client initialized with ${label}`)
  return client
}
