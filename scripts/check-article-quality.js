require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')
const { checkArticleQuality } = require('./article-quality-utils')
const fs = require('fs')
const path = require('path')

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false
})

async function main() {
    console.log('🚀 Starting Article Quality Assessment...\n')

    // Fetch all articles
    const articles = await client.fetch(`
    *[_type == "post"] {
      _id,
      title,
      "slug": slug.current,
      body
    }
  `)

    console.log(`📊 Found ${articles.length} articles. Analyzing...\n`)

    const results = []
    let totalScore = 0
    let perfectCount = 0
    let criticalCount = 0

    for (const article of articles) {
        if (!article.body) {
            console.warn(`⚠️ Skipping ${article.title} (No body content)`)
            continue
        }

        const assessment = checkArticleQuality(article)

        results.push({
            title: article.title,
            slug: article.slug,
            score: assessment.score,
            issues: assessment.issues,
            warnings: assessment.warnings
        })

        totalScore += assessment.score
        if (assessment.score === 100) perfectCount++
        if (assessment.issues.some(i => i.severity === 'critical')) criticalCount++
    }

    // Sort by score (ascending) to show worst articles first
    results.sort((a, b) => a.score - b.score)

    // Generate Report
    const averageScore = (totalScore / results.length).toFixed(1)

    console.log('============================================================')
    console.log('📈 QUALITY ASSESSMENT REPORT')
    console.log('============================================================')
    console.log(`Total Articles: ${results.length}`)
    console.log(`Average Score:  ${averageScore} / 100`)
    console.log(`Perfect Score:  ${perfectCount} articles`)
    console.log(`Critical Issues: ${criticalCount} articles`)
    console.log('============================================================\n')

    console.log('📉 LOWEST SCORING ARTICLES (Bottom 10):')
    results.slice(0, 10).forEach(r => {
        console.log(`\n[${r.score}pts] ${r.title}`)
        r.issues.forEach(i => console.log(`  ❌ ${i.message}`))
        r.warnings.forEach(w => console.log(`  ⚠️ ${w.message}`))
    })

    // Save full report to file
    const reportPath = path.resolve(__dirname, '../article_quality_report.json')
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2))
    console.log(`\n💾 Full report saved to: ${reportPath}`)
}

main().catch(console.error)
