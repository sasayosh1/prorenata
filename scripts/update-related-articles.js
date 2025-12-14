require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')
const fs = require('fs').promises
const path = require('path')
const crypto = require('crypto')

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false
})

const BACKUP_DIR = path.join(__dirname, '../backups/related_articles_update')

function makeKey() {
    return crypto.randomBytes(8).toString('hex')
}

async function createBackup(articleId, article) {
    await fs.mkdir(BACKUP_DIR, { recursive: true })
    const backupPath = path.join(BACKUP_DIR, `${articleId.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`)
    await fs.writeFile(backupPath, JSON.stringify(article, null, 2), 'utf8')
    return backupPath
}

function calculateRelevanceScore(article1, article2) {
    let score = 0

    const cat1 = article1.categories?.map(c => c.title) || []
    const cat2 = article2.categories?.map(c => c.title) || []
    const categoryMatch = cat1.some(c => cat2.includes(c))
    if (categoryMatch) score += 10

    const tags1 = article1.tags || []
    const tags2 = article2.tags || []
    const tagMatches = tags1.filter(t => tags2.includes(t)).length
    score += tagMatches * 3

    const title1Words = article1.title.toLowerCase().split(/\s+/)
    const title2Words = article2.title.toLowerCase().split(/\s+/)
    const titleMatches = title1Words.filter(w =>
        w.length > 2 && title2Words.includes(w)
    ).length
    score += Math.min(titleMatches, 5)

    return score
}

function findRelatedArticles(targetArticle, allArticles, topN = 3) {
    const scored = allArticles
        .filter(a => a._id !== targetArticle._id)
        .map(article => ({
            article,
            score: calculateRelevanceScore(targetArticle, article)
        }))
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, topN)

    return scored
}

function createRelatedArticlesBlocks(relatedArticles) {
    const blocks = []

    // H3 heading
    blocks.push({
        _type: 'block',
        _key: makeKey(),
        style: 'h3',
        children: [
            {
                _type: 'span',
                _key: makeKey(),
                text: 'あわせて読みたい',
                marks: []
            }
        ],
        markDefs: []
    })

    // Add each related article as a link
    relatedArticles.forEach(item => {
        const linkKey = makeKey()
        blocks.push({
            _type: 'block',
            _key: makeKey(),
            style: 'normal',
            children: [
                {
                    _type: 'span',
                    _key: makeKey(),
                    text: item.article.title,
                    marks: [linkKey]
                }
            ],
            markDefs: [
                {
                    _key: linkKey,
                    _type: 'link',
                    href: `/posts/${item.article.slug.current}`
                }
            ]
        })
    })

    return blocks
}

async function updateArticleRelatedLinks(article, allArticles) {
    if (!article.body || !Array.isArray(article.body)) return null

    // Find まとめ section
    const summaryIndex = article.body.findIndex(
        b => b.style === 'h2' && b.children?.[0]?.text === 'まとめ'
    )

    if (summaryIndex === -1) {
        console.log('   ⚠️  No summary section found, skipping')
        return null
    }

    // Find existing "あわせて読みたい" section
    let relatedIndex = -1
    for (let i = summaryIndex + 1; i < article.body.length; i++) {
        const block = article.body[i]
        if (block.children?.[0]?.text?.includes('あわせて読みたい')) {
            relatedIndex = i
            break
        }
        // Stop at next H2 or disclaimer
        if (block.style === 'h2') break
        if (JSON.stringify(block).includes('免責事項')) break
    }

    // Find related articles
    const relatedArticles = findRelatedArticles(article, allArticles, 3)

    if (relatedArticles.length === 0) {
        console.log('   ⚠️  No related articles found, skipping')
        return null
    }

    // Create new related articles blocks
    const newRelatedBlocks = createRelatedArticlesBlocks(relatedArticles)

    let newBody

    if (relatedIndex !== -1) {
        // Replace existing related articles section
        // Find the end of the related section
        let relatedEndIndex = relatedIndex + 1
        for (let i = relatedIndex + 1; i < article.body.length; i++) {
            const block = article.body[i]
            if (block.style === 'h2' || block.style === 'h3') {
                relatedEndIndex = i
                break
            }
            if (JSON.stringify(block).includes('免責事項')) {
                relatedEndIndex = i
                break
            }
            // If it's a link block, it's part of related section
            if (block.markDefs?.some(md => md._type === 'link')) {
                relatedEndIndex = i + 1
            }
        }

        newBody = [
            ...article.body.slice(0, relatedIndex),
            ...newRelatedBlocks,
            ...article.body.slice(relatedEndIndex)
        ]
    } else {
        // Insert new related articles section after summary
        // Find where to insert (after summary content, before next H2/disclaimer)
        let insertIndex = summaryIndex + 1
        for (let i = summaryIndex + 1; i < article.body.length; i++) {
            const block = article.body[i]
            if (block.style === 'h2') {
                insertIndex = i
                break
            }
            if (JSON.stringify(block).includes('免責事項')) {
                insertIndex = i
                break
            }
            insertIndex = i + 1
        }

        newBody = [
            ...article.body.slice(0, insertIndex),
            ...newRelatedBlocks,
            ...article.body.slice(insertIndex)
        ]
    }

    return newBody
}

async function main() {
    const dryRun = process.argv.includes('--dry-run')
    const limitStr = process.argv.find(arg => arg.startsWith('--limit='))
    const limit = limitStr ? parseInt(limitStr.split('=')[1]) : null

    console.log('🔄 Updating Related Articles...')
    if (dryRun) console.log('   (DRY RUN MODE - no changes will be made)\n')
    if (limit) console.log(`   (Limited to ${limit} articles)\n`)

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

    console.log(`📊 Found ${articles.length} articles.\n`)

    const articlesToProcess = limit ? articles.slice(0, limit) : articles

    let updatedCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (const article of articlesToProcess) {
        try {
            const newBody = await updateArticleRelatedLinks(article, articles)

            if (!newBody) {
                skippedCount++
                continue
            }

            console.log(`🔄 Updating: ${article.title}`)

            // Find related articles for logging
            const relatedArticles = findRelatedArticles(article, articles, 3)
            relatedArticles.forEach((item, idx) => {
                console.log(`   ${idx + 1}. [Score: ${item.score}] ${item.article.title}`)
            })

            if (!dryRun) {
                await createBackup(article._id, article)

                await client
                    .patch(article._id)
                    .set({ body: newBody })
                    .commit()

                console.log('   ✅ Updated\n')
            } else {
                console.log('   ✅ Would update (dry run)\n')
            }

            updatedCount++

        } catch (error) {
            console.error(`❌ Error processing ${article.title}:`, error.message)
            errorCount++
        }
    }

    console.log('\n============================================================')
    console.log(`✅ Update complete!`)
    console.log(`   Total articles: ${articles.length}`)
    console.log(`   Processed: ${articlesToProcess.length}`)
    console.log(`   Updated: ${updatedCount}`)
    console.log(`   Skipped: ${skippedCount}`)
    console.log(`   Errors: ${errorCount}`)
    if (!dryRun) {
        console.log(`   Backups saved to: ${BACKUP_DIR}`)
    }
    console.log('============================================================')
}

main().catch(console.error)
