// サンプルコンテンツ生成のデモンストレーション
const fs = require('fs')
const path = require('path')

// 実際のコンテンツ生成関数をインポート
const { categories, articleTemplates } = require('./create-nursing-content.js')

// サンプル記事の本文生成関数
function generateSampleArticleContent(template) {
  return `# ${template.title}

## メタ情報
- **カテゴリ**: ${template.categorySlug}
- **コンテンツタイプ**: ${template.contentType}
- **対象読者**: ${template.targetAudience}
- **難易度**: ${template.difficulty}
- **フォーカスキーワード**: ${template.focusKeyword}
- **関連キーワード**: ${template.relatedKeywords.join(', ')}
- **読了時間**: ${template.readingTime}分

## 記事概要
${template.metaDescription}

## 目次
1. はじめに
2. ${template.focusKeyword}の基本知識
3. 実践的なポイント
4. よくある質問
5. まとめ

## はじめに
看護助手として働く方、または看護助手を目指す方にとって、「${template.focusKeyword}」は重要な関心事の一つです。この記事では、実際の現場経験を基に、実践的で具体的な情報をお届けします。

## ${template.focusKeyword}の基本知識
${template.focusKeyword}について、基本的な知識から詳しく説明します。看護助手として知っておくべき重要なポイントを、現場での実践を踏まえて解説します。

### 重要なポイント
- 安全性を最優先に考える
- 患者様の尊厳を尊重する
- チームワークを大切にする
- 継続的な学習を心がける

## 実践的なポイント
実際の医療現場で活用するための具体的な方法について説明します。

### ${template.contentType === 'howto' ? 'ステップバイステップガイド' : '重要な観点'}
${template.contentType === 'howto' 
  ? `
1. **準備段階**: 基本的な知識と必要な道具の確認
2. **実行段階**: 具体的な手順と注意点
3. **評価段階**: 結果の確認と改善点の特定
  `
  : `
- 現場での実践に必要な知識
- 効率的な業務遂行のコツ
- トラブル時の対応方法
  `
}

## よくある質問
### Q: ${template.focusKeyword}について、初心者が最初に知っておくべきことは？
A: まずは基本的な知識をしっかりと身につけることが重要です。現場での実践と併せて、継続的な学習を心がけましょう。

### Q: 実際の現場ではどのような点に注意すべきですか？
A: 患者様の安全を最優先に考え、不明な点があれば必ず上司や先輩に相談することが大切です。

## まとめ
${template.focusKeyword}について詳しく解説しました。看護助手として成長し続けるために、この記事の内容を実践に活かしていただければと思います。

---
**関連記事**
${template.relatedKeywords.slice(0, 3).map(keyword => `- [${keyword}について詳しく解説](/${keyword.replace(/\s+/g, '-')})`).join('\n')}

**タグ**: ${template.tags ? template.tags.join(', ') : '看護助手, 医療現場, ' + template.contentType}
`
}

// サンプルコンテンツの生成
function generateSampleContent() {
  console.log('📝 サンプルコンテンツ生成開始...')
  
  // outputs ディレクトリを作成
  const outputDir = path.join(__dirname, 'sample-outputs')
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir)
  }
  
  // カテゴリ情報をJSON出力
  const categoryData = {
    categories: categories.map(cat => ({
      title: cat.title,
      slug: cat.slug,
      description: cat.description,
      level: cat.level,
      icon: cat.icon,
      color: cat.color,
      sortOrder: cat.sortOrder
    }))
  }
  
  fs.writeFileSync(
    path.join(outputDir, 'categories.json'),
    JSON.stringify(categoryData, null, 2)
  )
  
  // 各カテゴリのサンプル記事を生成
  let totalGenerated = 0
  
  categories.forEach(category => {
    // 該当カテゴリの記事を取得
    const categoryArticles = articleTemplates.filter(
      article => article.categorySlug === category.slug
    )
    
    if (categoryArticles.length > 0) {
      // カテゴリディレクトリを作成
      const categoryDir = path.join(outputDir, category.slug)
      if (!fs.existsSync(categoryDir)) {
        fs.mkdirSync(categoryDir)
      }
      
      // 最初の記事のサンプルを生成
      const sampleArticle = categoryArticles[0]
      const content = generateSampleArticleContent(sampleArticle)
      
      fs.writeFileSync(
        path.join(categoryDir, `${sampleArticle.slug}.md`),
        content
      )
      
      console.log(`✅ ${category.title}: ${sampleArticle.title}`)
      totalGenerated++
    }
  })
  
  // 記事一覧をCSVで出力
  const csvHeader = 'Title,Slug,Category,ContentType,TargetAudience,FocusKeyword,ReadingTime\n'
  const csvRows = articleTemplates.map(article => 
    `"${article.title}","${article.slug}","${article.categorySlug}","${article.contentType}","${article.targetAudience}","${article.focusKeyword}","${article.readingTime}"`
  ).join('\n')
  
  fs.writeFileSync(
    path.join(outputDir, 'articles-list.csv'),
    csvHeader + csvRows
  )
  
  // サマリーレポート生成
  const summaryReport = `# 看護助手向けサイト - コンテンツ生成レポート

## 生成日時
${new Date().toLocaleString('ja-JP')}

## 生成結果
- **総カテゴリ数**: ${categories.length}
- **総記事テンプレート数**: ${articleTemplates.length}
- **サンプル記事生成数**: ${totalGenerated}

## カテゴリ一覧
${categories.map((cat, index) => 
  `${index + 1}. **${cat.title}** (${cat.slug})\n   - ${cat.description}\n   - 色: ${cat.color} | アイコン: ${cat.icon}`
).join('\n\n')}

## 記事タイプ分析
${Object.entries(
  articleTemplates.reduce((acc, article) => {
    acc[article.contentType] = (acc[article.contentType] || 0) + 1
    return acc
  }, {})
).map(([type, count]) => `- ${type}: ${count}件`).join('\n')}

## 対象読者分析
${Object.entries(
  articleTemplates.reduce((acc, article) => {
    acc[article.targetAudience] = (acc[article.targetAudience] || 0) + 1
    return acc
  }, {})
).map(([audience, count]) => `- ${audience}: ${count}件`).join('\n')}

## ファイル出力
- \`categories.json\`: カテゴリ定義
- \`articles-list.csv\`: 記事一覧
- \`[category]/[slug].md\`: サンプル記事

---
このレポートは看護助手向け情報サイトのコンテンツ生成システムによって自動生成されました。
`

  fs.writeFileSync(
    path.join(outputDir, 'generation-report.md'),
    summaryReport
  )
  
  console.log('\n🎉 サンプルコンテンツ生成完了!')
  console.log(`📊 生成されたファイル数: ${totalGenerated + 3}`)
  console.log(`📁 出力ディレクトリ: ${outputDir}`)
  
  return {
    totalGenerated,
    outputDir,
    categories: categories.length,
    articles: articleTemplates.length
  }
}

// 実行
if (require.main === module) {
  generateSampleContent()
}

module.exports = { generateSampleContent }