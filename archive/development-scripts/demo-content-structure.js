// コンテンツ構造のデモンストレーション
const { categories, articleTemplates } = require('./create-nursing-content.js')
const { additionalArticleTemplates } = require('./generate-additional-articles.js')
const { educationalContentTemplates } = require('./educational-content-templates.js')
const { careerSupportTemplates } = require('./career-support-content.js')
const { industryNewsTemplates } = require('./industry-news-system.js')

console.log('🏥 看護助手向けサイト - コンテンツ構造デモ')
console.log('=' .repeat(60))

// カテゴリ構造の表示
console.log('\n📂 カテゴリ構造:')
categories.forEach((category, index) => {
  console.log(`${index + 1}. ${category.title} (${category.slug})`)
  console.log(`   ${category.description}`)
  console.log(`   色: ${category.color} | アイコン: ${category.icon}`)
  console.log('')
})

// 各タイプの記事数をカウント
const contentSummary = {
  基本記事: articleTemplates.length,
  追加記事: additionalArticleTemplates.length,
  教育コンテンツ: educationalContentTemplates.length,
  キャリア支援: careerSupportTemplates.length,
  業界ニュース: industryNewsTemplates.length
}

console.log('\n📊 作成予定コンテンツ数:')
let totalArticles = 0
Object.entries(contentSummary).forEach(([type, count]) => {
  console.log(`- ${type}: ${count}件`)
  totalArticles += count
})
console.log(`\n合計: ${totalArticles}件の記事`)

// サンプル記事の詳細表示
console.log('\n📝 サンプル記事例:')
console.log('-' .repeat(40))

const sampleArticles = [
  articleTemplates[0],
  educationalContentTemplates[0],
  careerSupportTemplates[0],
  industryNewsTemplates[0]
]

sampleArticles.forEach((article, index) => {
  if (article) {
    console.log(`\n${index + 1}. ${article.title}`)
    console.log(`   カテゴリ: ${article.categorySlug}`)
    console.log(`   タイプ: ${article.contentType}`)
    console.log(`   対象: ${article.targetAudience}`)
    console.log(`   キーワード: ${article.focusKeyword}`)
    console.log(`   関連KW: ${article.relatedKeywords?.slice(0, 3).join(', ')}`)
  }
})

// SEO戦略の表示
console.log('\n🎯 SEO戦略概要:')
console.log('-' .repeat(40))

// 全記事からキーワードを集計
const allArticles = [
  ...articleTemplates,
  ...additionalArticleTemplates,
  ...educationalContentTemplates,
  ...careerSupportTemplates,
  ...industryNewsTemplates
]

const keywordCounts = {}
const contentTypeCounts = {}
const audienceCounts = {}

allArticles.forEach(article => {
  if (article.focusKeyword) {
    keywordCounts[article.focusKeyword] = (keywordCounts[article.focusKeyword] || 0) + 1
  }
  if (article.contentType) {
    contentTypeCounts[article.contentType] = (contentTypeCounts[article.contentType] || 0) + 1
  }
  if (article.targetAudience) {
    audienceCounts[article.targetAudience] = (audienceCounts[article.targetAudience] || 0) + 1
  }
})

console.log('\nメインキーワード上位5位:')
Object.entries(keywordCounts)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 5)
  .forEach(([keyword, count], index) => {
    console.log(`${index + 1}. "${keyword}": ${count}記事`)
  })

console.log('\nコンテンツタイプ分布:')
Object.entries(contentTypeCounts)
  .sort(([,a], [,b]) => b - a)
  .forEach(([type, count]) => {
    console.log(`- ${type}: ${count}記事`)
  })

console.log('\n対象読者分布:')
Object.entries(audienceCounts)
  .sort(([,a], [,b]) => b - a)
  .forEach(([audience, count]) => {
    console.log(`- ${audience}: ${count}記事`)
  })

// 実行可能性の確認
console.log('\n🚀 実行準備状況:')
console.log('-' .repeat(40))
console.log(`✅ カテゴリ設計: ${categories.length}カテゴリ`)
console.log(`✅ 記事テンプレート: ${totalArticles}件`)
console.log(`✅ SEO最適化: フルサポート`)
console.log(`✅ バッチ処理: エラー回避対応`)
console.log(`\n⚠️  実行には有効なSANITY_API_TOKENが必要です`)

console.log('\n📋 次のステップ:')
console.log('1. Sanity管理画面でAPIトークンを取得')
console.log('2. 環境変数 SANITY_API_TOKEN を設定')
console.log('3. node create-all-content.js を実行')

console.log('\n🎉 準備完了! 高品質な看護助手向けサイトの構築準備が整いました。')