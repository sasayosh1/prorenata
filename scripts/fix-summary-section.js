require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')
const fs = require('fs').promises
const path = require('path')

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false
})

const BACKUP_DIR = path.join(__dirname, '../backups/summary_cleanup')

async function createBackup(articleId, article) {
    await fs.mkdir(BACKUP_DIR, { recursive: true })
    const backupPath = path.join(BACKUP_DIR, `${articleId.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`)
    await fs.writeFile(backupPath, JSON.stringify(article, null, 2), 'utf8')
    return backupPath
}

function shouldRemoveBlock(block, summaryIndex, blockIndex) {
    // Don't remove the summary heading itself
    if (blockIndex === summaryIndex) return false

    // Remove blocks containing "あわせて読みたい"
    if (block.children?.some(child => child.text?.includes('あわせて読みたい'))) {
        return true
    }

    // Remove blocks with internal links (/posts/)
    if (block.markDefs?.some(md => md._type === 'link' && md.href?.startsWith('/posts/'))) {
        return true
    }

    // Remove blocks that are just "Speech Bubble Feature Test" or similar
    const blockText = block.children?.map(c => c.text).join('').trim()
    if (blockText && blockText.length < 100 && blockText.includes('Speech Bubble')) {
        return true
    }

    return false
}

async function cleanSummarySection(article) {
    if (!article.body || !Array.isArray(article.body)) return null

    // Find まとめ section
    const summaryIndex = article.body.findIndex(
        b => b.style === 'h2' && b.children?.[0]?.text === 'まとめ'
    )

    if (summaryIndex === -1) return null

    // Find the end of summary section
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

    // Check if there's anything to remove
    const summaryBlocks = article.body.slice(summaryIndex + 1, summaryEndIndex)
    const hasIssues = summaryBlocks.some((block, idx) =>
        shouldRemoveBlock(block, summaryIndex, summaryIndex + 1 + idx)
    )

    if (!hasIssues) return null

    // Create new body with problematic blocks removed
    const newBody = []

    // Add everything before summary
    newBody.push(...article.body.slice(0, summaryIndex))

    // Add summary heading
    newBody.push(article.body[summaryIndex])

    // Add summary content, filtering out problematic blocks
    for (let i = summaryIndex + 1; i < summaryEndIndex; i++) {
        const block = article.body[i]
        if (!shouldRemoveBlock(block, summaryIndex, i)) {
            newBody.push(block)
        }
    }

    // Add everything after summary
    newBody.push(...article.body.slice(summaryEndIndex))

    return newBody
}

async function main() {
    console.log('🧹 Starting Summary Section Cleanup...\n')

    const articles = await client.fetch(`
    *[_type == "post"] {
      _id,
      title,
      slug,
      body
    }
  `)

    console.log(`📊 Found ${articles.length} articles. Processing...\n`)

    let updatedCount = 0
    let errorCount = 0
    let skippedCount = 0

    for (const article of articles) {
        try {
            const newBody = await cleanSummarySection(article)

            if (!newBody) {
                skippedCount++
                continue
            }

            const removedCount = article.body.length - newBody.length
            console.log(`🔄 Cleaning: ${article.title}`)
            console.log(`   Removed ${removedCount} block(s) from summary section`)

            // Create backup
            await createBackup(article._id, article)

            // Update article
            await client
                .patch(article._id)
                .set({ body: newBody })
                .commit()

            console.log('   ✅ Updated\n')
            updatedCount++

        } catch (error) {
            console.error(`❌ Error processing ${article.title}:`, error.message)
            errorCount++
        }
    }

    console.log('\n============================================================')
    console.log(`✅ Cleanup complete!`)
    console.log(`   Total articles: ${articles.length}`)
    console.log(`   Updated: ${updatedCount}`)
    console.log(`   Skipped (no issues): ${skippedCount}`)
    console.log(`   Errors: ${errorCount}`)
    console.log(`   Backups saved to: ${BACKUP_DIR}`)
    console.log('============================================================')
}

main().catch(console.error)
