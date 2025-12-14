require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false
})

/**
 * Calculate relevance score between two articles
 */
function calculateRelevanceScore(article1, article2) {
    let score = 0

    // Same category: +10 points
    const cat1 = article1.categories?.map(c => c.title) || []
    const cat2 = article2.categories?.map(c => c.title) || []
    const categoryMatch = cat1.some(c => cat2.includes(c))
    if (categoryMatch) score += 10

    // Same tags: +3 points per match
    const tags1 = article1.tags || []
    const tags2 = article2.tags || []
    const tagMatches = tags1.filter(t => tags2.includes(t)).length
    score += tagMatches * 3

    // Title similarity: +1-5 points
    const title1Words = article1.title.toLowerCase().split(/\s+/)
    const title2Words = article2.title.toLowerCase().split(/\s+/)
    const titleMatches = title1Words.filter(w =>
        w.length > 2 && title2Words.includes(w)
    ).length
    score += Math.min(titleMatches, 5)

    return score
}

/**
 * Find top N related articles for a given article
 */
function findRelatedArticles(targetArticle, allArticles, topN = 3) {
    const scored = allArticles
        .filter(a => a._id !== targetArticle._id) // Exclude self
        .map(article => ({
            article,
            score: calculateRelevanceScore(targetArticle, article)
        }))
        .filter(item => item.score > 0) // Exclude completely unrelated
        .sort((a, b) => b.score - a.score)
        .slice(0, topN)

    return scored
}

/**
 * Extract current related article links from body
 */
function getCurrentRelatedLinks(article) {
    if (!article.body || !Array.isArray(article.body)) return []

    const relatedIndex = article.body.findIndex(b =>
        b.children?.[0]?.text?.includes('あわせて読みたい')
    )

    if (relatedIndex === -1) return []

    const links = []
    for (let i = relatedIndex + 1; i < article.body.length; i++) {
        const block = article.body[i]

        // Stop at next heading or disclaimer
        if (block.style === 'h2' || block.style === 'h3') break
        if (JSON.stringify(block).includes('免責事項')) break

        // Extract links
        if (block.markDefs) {
            block.markDefs.forEach(md => {
                if (md._type === 'link' && md.href?.startsWith('/posts/')) {
                    const slug = md.href.replace('/posts/', '')
                    links.push(slug)
                }
            })
        }
    }

    return links
}

async function main() {
    console.log('📊 Analyzing Related Articles Relevance...\n')

    const articles = await client.fetch(`
    *[_type == "post"] {
      _id,
      title,
      slug,
      categories[]->{ title, slug },
      tags,
      body
    }
  `)

    console.log(`Found ${articles.length} articles.\n`)

    // Analyze a sample of articles
    const sampleSize = Math.min(10, articles.length)
    const samples = articles.slice(0, sampleSize)

    console.log(`Analyzing ${sampleSize} sample articles:\n`)
    console.log('='.repeat(80))

    for (const article of samples) {
        console.log(`\n📄 ${article.title}`)
        console.log(`   Categories: ${article.categories?.map(c => c.title).join(', ') || 'None'}`)
        console.log(`   Tags: ${article.tags?.join(', ') || 'None'}`)

        // Find recommended related articles
        const recommended = findRelatedArticles(article, articles, 3)

        console.log('\n   🎯 Recommended related articles:')
        recommended.forEach((item, idx) => {
            console.log(`   ${idx + 1}. [Score: ${item.score}] ${item.article.title}`)
            console.log(`      ${item.article.slug?.current}`)
        })

        // Check current related links
        const currentLinks = getCurrentRelatedLinks(article)
        if (currentLinks.length > 0) {
            console.log('\n   📌 Current related links:')
            currentLinks.forEach((slug, idx) => {
                const linkedArticle = articles.find(a => a.slug?.current === slug)
                if (linkedArticle) {
                    const score = calculateRelevanceScore(article, linkedArticle)
                    console.log(`   ${idx + 1}. [Score: ${score}] ${linkedArticle.title}`)
                } else {
                    console.log(`   ${idx + 1}. [Not found] ${slug}`)
                }
            })
        } else {
            console.log('\n   📌 Current related links: None')
        }

        console.log('\n' + '-'.repeat(80))
    }

    // Overall statistics
    console.log('\n\n📈 Overall Statistics:\n')

    let totalWithRelated = 0
    let totalRelevanceScore = 0
    let totalLinks = 0

    articles.forEach(article => {
        const currentLinks = getCurrentRelatedLinks(article)
        if (currentLinks.length > 0) {
            totalWithRelated++
            totalLinks += currentLinks.length

            currentLinks.forEach(slug => {
                const linkedArticle = articles.find(a => a.slug?.current === slug)
                if (linkedArticle) {
                    totalRelevanceScore += calculateRelevanceScore(article, linkedArticle)
                }
            })
        }
    })

    console.log(`   Total articles: ${articles.length}`)
    console.log(`   Articles with related links: ${totalWithRelated}`)
    console.log(`   Total related links: ${totalLinks}`)
    if (totalLinks > 0) {
        console.log(`   Average relevance score: ${(totalRelevanceScore / totalLinks).toFixed(2)}`)
    }

    console.log('\n' + '='.repeat(80))
    console.log('✅ Analysis complete!')
}

main().catch(console.error)
