/**
 * X投稿サマリー生成スクリプト
 *
 * 公開済み記事からランダムに1件を選び、Gemini APIで約140文字の要約を作成。
 * 生成した要約を x-summary.txt に保存し、GitHub Actions などから手動投稿に活用できます。
 */

const fs = require('fs')
const { createClient } = require('@sanity/client')
const { GoogleGenerativeAI } = require('@google/generative-ai')

const SANITY_CONFIG = {
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

if (!SANITY_CONFIG.token || !GEMINI_API_KEY) {
  console.error('❌ 必須環境変数が不足しています:')
  console.error('  - SANITY_API_TOKEN:', !!SANITY_CONFIG.token)
  console.error('  - GEMINI_API_KEY:', !!GEMINI_API_KEY)
  process.exit(1)
}

const sanityClient = createClient(SANITY_CONFIG)

async function getRandomArticle() {
  console.log('📚 公開済み記事を取得中...')

  const query = `*[_type == "post" && !(_id in path("drafts.**"))] | order(_updatedAt desc) {
    _id,
    title,
    slug,
    excerpt,
    body,
    publishedAt,
    _createdAt,
    "categories": categories[]->title
  }`

  const posts = await sanityClient.fetch(query)

  if (!posts || posts.length === 0) {
    throw new Error('公開済み記事が見つかりません')
  }

  const randomIndex = Math.floor(Math.random() * posts.length)
  const selectedPost = posts[randomIndex]
  console.log(`🎲 選択された記事: "${selectedPost.title}"`)

  return selectedPost
}

async function generateSummary(post) {
  console.log('🤖 Gemini APIで要約を生成中...')

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const bodyText = (post.body || [])
    .filter((block) => block._type === 'block' && block.children)
    .map((block) => block.children.map((child) => child.text || '').join(''))
    .join('\n')
    .slice(0, 2000)

  const prompt = `
あなたは病棟で働く20歳の看護助手「白崎セラ」です。ProReNataブログの編集長として、看護助手仲間に寄り添うX（旧Twitter）投稿を作成してください。

# 白崎セラの話し方
- 一人称は「わたし」。丁寧で穏やかな「です・ます」調。
- 優しさと誠実さを大切にしつつ、現場で役立つ一言や注意点を添える。
- 読者が無理をしないよう、さりげない労いを入れても良い。

# 投稿条件
- 日本語で120〜140文字
- ハッシュタグとURLは禁止
- 記事を読みたくなる具体的なメリットを含める
- 末尾は自然な句読点で締める

# 記事タイトル
${post.title}

# 記事概要
${post.excerpt || ''}

# 本文抜粋
${bodyText}

# 出力
白崎セラとしての投稿文のみを出力してください。
`

  const result = await model.generateContent(prompt)
  const response = await result.response
  let summary = response.text().trim().replace(/\s+/g, ' ')
  summary = finalizeSummary(summary)

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
    if (result.length >= MAX_LENGTH) {
      result = result.slice(0, MAX_LENGTH - 1)
    }
    result = `${result}。`
  }

  return result
}
