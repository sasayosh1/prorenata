require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false
})

async function main() {
    console.log('🔍 Checking for misplaced "あわせて読みたい" sections...\n')

    const articles = await client.fetch(`
    *[_type == "post"] {
      _id,
      title,
      slug,
      body
    }
  `)

    console.log(`📊 Found ${articles.length} articles. Analyzing...\n`)

    let issueCount = 0
    const issues = []

    for (const article of articles) {
        if (!article.body || !Array.isArray(article.body)) continue

        // Find まとめ section
        const summaryIndex = article.body.findIndex(
            b => b.style === 'h2' && b.children?.[0]?.text === 'まとめ'
        )

        if (summaryIndex === -1) continue

        // Find the end of summary section
        // Summary ends at: next H2, H3 "あわせて読みたい", or "免責事項"
        let summaryEndIndex = article.body.length
        for (let i = summaryIndex + 1; i < article.body.length; i++) {
            const block = article.body[i]

            // End at next H2
            if (block.style === 'h2') {
                summaryEndIndex = i
                break
            }

            // End at H3 "あわせて読みたい"
            if (block.style === 'h3' && block.children?.[0]?.text?.includes('あわせて読みたい')) {
                summaryEndIndex = i
                break
            }

            // End at 免責事項
            if (JSON.stringify(block).includes('免責事項')) {
                summaryEndIndex = i
                break
            }
        }

        // Check if "あわせて読みたい" appears INSIDE the summary section
        const summaryBlocks = article.body.slice(summaryIndex + 1, summaryEndIndex)
        const hasRelatedInsideSummary = summaryBlocks.some(block =>
            block.children?.some(child => child.text?.includes('あわせて読みたい'))
        )

        if (hasRelatedInsideSummary) {
            issueCount++
            issues.push({
                id: article._id,
                title: article.title,
                slug: article.slug?.current
            })
            console.log(`⚠️  Issue found: ${article.title}`)
            console.log(`   Slug: ${article.slug?.current}`)
            console.log(`   Summary index: ${summaryIndex}, End: ${summaryEndIndex}`)
            console.log('')
        }

        // Also check if "あわせて読みたい" exists but is not H3
        const relatedIndex = article.body.findIndex(b =>
            b.children?.[0]?.text?.includes('あわせて読みたい')
        )

        if (relatedIndex !== -1) {
            const relatedBlock = article.body[relatedIndex]
            if (relatedBlock.style !== 'h3') {
                console.log(`⚠️  Wrong heading level: ${article.title}`)
                console.log(`   "あわせて読みたい" is ${relatedBlock.style}, should be h3`)
                console.log('')
            }
        }
    }

    console.log('\n============================================================')
    console.log(`✅ Analysis complete!`)
    console.log(`   Total articles checked: ${articles.length}`)
    console.log(`   Articles with misplaced "あわせて読みたい": ${issueCount}`)
    console.log('============================================================\n')

    if (issues.length > 0) {
        console.log('📝 Articles with issues:')
        issues.forEach(issue => {
            console.log(`   - ${issue.title} (${issue.slug})`)
        })
    }
}

main().catch(console.error)
