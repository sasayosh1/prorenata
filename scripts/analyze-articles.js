/**
 * 全記事を分析して内部リンク最適化のための情報を収集
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')
const fs = require('fs')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
})

/**
 * 記事本文からテキストを抽出
 */
function extractTextFromBody(body) {
  if (!body || !Array.isArray(body)) return ''

  return body
    .filter(block => block._type === 'block')
    .map(block => {
      if (!block.children) return ''
      return block.children
        .filter(child => child._type === 'span')
        .map(child => child.text || '')
        .join('')
    })
    .join('\n')
}

/**
 * タイトルからカテゴリを推定
 */
function categorizeArticle(title) {
  const categories = {
    '仕事内容': ['仕事内容', '業務', '役割', '職務'],
    'なるには': ['なるには', '未経験', '資格', '取得'],
    '給料': ['給料', '年収', '時給', '収入', '待遇'],
    '1日の流れ': ['1日', 'スケジュール', '勤務', 'シフト'],
    '辞めたい': ['辞めたい', '退職', '転職'],
    'きつい・大変': ['きつい', '大変', 'しんどい', '辛い'],
    '夜勤': ['夜勤'],
    '人間関係': ['人間関係', '悩み'],
    '看護師との違い': ['看護師', '違い', '比較'],
    'その他': []
  }

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => title.includes(keyword))) {
      return category
    }
  }

  return 'その他'
}

/**
 * 記事の関連性スコアを計算
 */
function calculateRelevanceScore(article1, article2) {
  let score = 0

  // カテゴリが同じ場合は低スコア（同じカテゴリ内で回遊させない）
  if (article1.category === article2.category) {
    score -= 10
  }

  // タグが重複している場合
  const tags1 = article1.tags || []
  const tags2 = article2.tags || []
  const commonTags = tags1.filter(tag => tags2.includes(tag))
  score += commonTags.length * 5

  // カテゴリが重複している場合
  const cats1 = article1.categories || []
  const cats2 = article2.categories || []
  const commonCats = cats1.filter(cat => cats2.includes(cat))
  score += commonCats.length * 10

  return score
}

/**
 * 記事の自然な流れを定義
 */
const ARTICLE_FLOW = {
  'なるには': ['仕事内容', '1日の流れ', '給料', '看護師との違い'],
  '仕事内容': ['なるには', '1日の流れ', '給料'],
  '1日の流れ': ['仕事内容', '夜勤', 'きつい・大変'],
  '給料': ['仕事内容', '辞めたい', '看護師との違い'],
  'きつい・大変': ['辞めたい', '人間関係', '1日の流れ'],
  '辞めたい': ['給料', '人間関係', 'なるには'],
  '夜勤': ['1日の流れ', 'きつい・大変', '給料'],
  '人間関係': ['辞めたい', 'きつい・大変'],
  '看護師との違い': ['なるには', '給料', '仕事内容']
}

/**
 * 各記事に推奨する内部リンクを生成
 */
function generateInternalLinkSuggestions(articles) {
  return articles.map(article => {
    const suggestions = []

    // 自然な流れに基づく推奨リンク
    const flow = ARTICLE_FLOW[article.category] || []
    const flowArticles = articles.filter(a =>
      a._id !== article._id &&
      flow.includes(a.category)
    )

    // 関連性スコアでソート
    const relatedArticles = articles
      .filter(a => a._id !== article._id)
      .map(a => ({
        ...a,
        relevanceScore: calculateRelevanceScore(article, a)
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 10)

    // 流れに基づく記事を優先、次に関連性の高い記事
    const candidates = [
      ...flowArticles.slice(0, 3),
      ...relatedArticles.filter(a =>
        !flowArticles.find(f => f._id === a._id)
      ).slice(0, 3)
    ]

    return {
      _id: article._id,
      title: article.title,
      slug: article.slug,
      category: article.category,
      bodyLength: article.bodyText.length,
      suggestions: candidates.slice(0, 4).map(c => ({
        _id: c._id,
        title: c.title,
        slug: c.slug,
        category: c.category,
        relevanceScore: c.relevanceScore || 0,
        reason: flow.includes(c.category) ? '自然な流れ' : '関連性が高い'
      }))
    }
  })
}

/**
 * メイン処理
 */
async function main() {
  console.log('=' .repeat(60))
  console.log('📊 記事分析: 内部リンク最適化')
  console.log('=' .repeat(60))
  console.log()

  // 全記事取得
  const posts = await client.fetch(`*[_type == "post"] {
    _id,
    title,
    "slug": slug.current,
    body,
    tags,
    "categories": categories[]->title
  }`)

  console.log(`📚 総記事数: ${posts.length}件\n`)

  // 記事を分析
  const articles = posts.map(post => ({
    _id: post._id,
    title: post.title,
    slug: post.slug,
    bodyText: extractTextFromBody(post.body),
    tags: post.tags || [],
    categories: post.categories || [],
    category: categorizeArticle(post.title)
  }))

  // カテゴリ別集計
  const categoryCounts = {}
  articles.forEach(article => {
    categoryCounts[article.category] = (categoryCounts[article.category] || 0) + 1
  })

  console.log('📂 カテゴリ別記事数:')
  Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, count]) => {
      console.log(`  ${category}: ${count}件`)
    })
  console.log()

  // 内部リンク提案を生成
  console.log('🔗 内部リンク提案を生成中...\n')
  const linkSuggestions = generateInternalLinkSuggestions(articles)

  // 結果を保存
  const outputDir = require('path').resolve(__dirname, '../internal-links-analysis')
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const outputFile = `${outputDir}/link-suggestions.json`
  fs.writeFileSync(outputFile, JSON.stringify(linkSuggestions, null, 2))

  console.log(`✅ 分析完了`)
  console.log(`📄 結果: ${outputFile}`)
  console.log()

  // サンプル表示
  console.log('📋 サンプル（最初の3記事）:')
  console.log('=' .repeat(60))
  linkSuggestions.slice(0, 3).forEach((item, index) => {
    console.log(`\n${index + 1}. ${item.title}`)
    console.log(`   カテゴリ: ${item.category}`)
    console.log(`   推奨リンク:`)
    item.suggestions.forEach((sug, i) => {
      console.log(`     ${i + 1}. [${sug.category}] ${sug.title}`)
      console.log(`        理由: ${sug.reason} (スコア: ${sug.relevanceScore})`)
    })
  })
  console.log()
  console.log('=' .repeat(60))
  console.log('💡 次のステップ:')
  console.log('  1. link-suggestions.json を確認')
  console.log('  2. 内部リンク挿入スクリプトを実行')
  console.log()
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { categorizeArticle, calculateRelevanceScore, generateInternalLinkSuggestions }
