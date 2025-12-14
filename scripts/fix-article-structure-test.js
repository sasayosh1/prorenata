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

const BACKUP_DIR = path.join(__dirname, '../backups/comprehensive_structure_fix')

async function createBackup(articleId, article) {
    await fs.mkdir(BACKUP_DIR, { recursive: true })
    const backupPath = path.join(BACKUP_DIR, `${articleId.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`)
    await fs.writeFile(backupPath, JSON.stringify(article, null, 2), 'utf8')
    return backupPath
}

function isInternalLink(block) {
    return block.markDefs?.some(md =>
        md._type === 'link' && md.href?.startsWith('/posts/')
    )
}

function isAffiliateLink(block) {
    // Check for [PR] text or affiliate domains
    const blockText = block.children?.map(c => c.text).join('') || ''
    if (blockText.includes('[PR]')) return true

    const affiliateDomains = ['amazon', 'rakuten', 'amzn']
    return block.markDefs?.some(md =>
        md._type === 'link' && affiliateDomains.some(domain => md.href?.includes(domain))
    )
}

function hasReference(block) {
    const blockText = block.children?.map(c => c.text).join('') || ''
    return blockText.includes('出典') || blockText.includes('参考')
}

async function fixArticleStructure(article) {
    if (!article.body || !Array.isArray(article.body)) return null

    const issues = []

    // Find key sections
    const summaryIndex = article.body.findIndex(
        b => b.style === 'h2' && b.children?.[0]?.text === 'まとめ'
    )

    if (summaryIndex === -1) {
        issues.push('No summary section found')
        return null
    }

    // Find all "あわせて読みたい" sections
    const relatedIndices = []
    article.body.forEach((block, idx) => {
        if (block.children?.[0]?.text?.includes('あわせて読みたい')) {
            relatedIndices.push(idx)
        }
    })

    // Find disclaimer
    const disclaimerIndex = article.body.findIndex(b =>
        JSON.stringify(b).includes('免責事項')
    )

    let newBody = [...article.body]
    let modified = false

    // Step 1: Clean summary section (remove internal links and references)
    let summaryEndIndex = newBody.length
    for (let i = summaryIndex + 1; i < newBody.length; i++) {
        const block = newBody[i]
        if (block.style === 'h2' || block.style === 'h3') {
            summaryEndIndex = i
            break
        }
        if (JSON.stringify(block).includes('免責事項')) {
            summaryEndIndex = i
            break
        }
    }

    const summaryBlocks = newBody.slice(summaryIndex + 1, summaryEndIndex)
    const cleanedSummaryBlocks = summaryBlocks.filter(block => {
        // Remove internal links
        if (isInternalLink(block)) {
            issues.push('Removed internal link from summary')
            modified = true
            return false
        }
        // Remove references
        if (hasReference(block)) {
            issues.push('Removed reference from summary')
            modified = true
            return false
        }
        // Keep affiliate links (they'll be moved to separate section if needed)
        return true
    })

    newBody = [
        ...newBody.slice(0, summaryIndex + 1),
        ...cleanedSummaryBlocks,
        ...newBody.slice(summaryEndIndex)
    ]

    // Step 2: Remove duplicate "あわせて読みたい" sections (keep only the first valid one)
    if (relatedIndices.length > 1) {
        issues.push(`Found ${relatedIndices.length} "あわせて読みたい" sections, keeping only one`)

        // Remove all but the first
        for (let i = relatedIndices.length - 1; i > 0; i--) {
            const idx = relatedIndices[i]
            // Find the end of this related section
            let endIdx = idx + 1
            for (let j = idx + 1; j < newBody.length; j++) {
                const block = newBody[j]
                if (block.style === 'h2' || block.style === 'h3') {
                    endIdx = j
                    break
                }
                if (JSON.stringify(block).includes('免責事項')) {
                    endIdx = j
                    break
                }
                if (block.markDefs?.some(md => md._type === 'link')) {
                    endIdx = j + 1
                }
            }
            newBody.splice(idx, endIdx - idx)
            modified = true
        }
    }

    // Step 3: Remove self-referencing links from "あわせて読みたい"
    const relatedIndex = newBody.findIndex(b =>
        b.children?.[0]?.text?.includes('あわせて読みたい')
    )

    if (relatedIndex !== -1) {
        let relatedEndIndex = relatedIndex + 1
        for (let i = relatedIndex + 1; i < newBody.length; i++) {
            const block = newBody[i]
            if (block.style === 'h2' || block.style === 'h3') {
                relatedEndIndex = i
                break
            }
            if (JSON.stringify(block).includes('免責事項')) {
                relatedEndIndex = i
                break
            }
            if (block.markDefs?.some(md => md._type === 'link')) {
                relatedEndIndex = i + 1
            }
        }

        const relatedBlocks = newBody.slice(relatedIndex + 1, relatedEndIndex)
        const cleanedRelatedBlocks = relatedBlocks.filter(block => {
            if (block.markDefs) {
                const hasSelfRef = block.markDefs.some(md => {
                    if (md._type === 'link' && md.href?.startsWith('/posts/')) {
                        const linkedSlug = md.href.replace('/posts/', '')
                        return linkedSlug === article.slug?.current
                    }
                    return false
                })
                if (hasSelfRef) {
                    issues.push('Removed self-referencing link from related articles')
                    modified = true
                    return false
                }
            }
            return true
        })

        newBody = [
            ...newBody.slice(0, relatedIndex + 1),
            ...cleanedRelatedBlocks,
            ...newBody.slice(relatedEndIndex)
        ]
    }

    // Step 4: Ensure "あわせて読みたい" is before disclaimer
    const finalRelatedIndex = newBody.findIndex(b =>
        b.children?.[0]?.text?.includes('あわせて読みたい')
    )
    const finalDisclaimerIndex = newBody.findIndex(b =>
        JSON.stringify(b).includes('免責事項')
    )

    if (finalRelatedIndex !== -1 && finalDisclaimerIndex !== -1 && finalRelatedIndex > finalDisclaimerIndex) {
        issues.push('Moving "あわせて読みたい" before disclaimer')

        // Extract related section
        let relatedEndIdx = finalRelatedIndex + 1
        for (let i = finalRelatedIndex + 1; i < newBody.length; i++) {
            const block = newBody[i]
            if (block.style === 'h2' || block.style === 'h3') {
                relatedEndIdx = i
                break
            }
            if (block.markDefs?.some(md => md._type === 'link')) {
                relatedEndIdx = i + 1
            }
        }

        const relatedSection = newBody.slice(finalRelatedIndex, relatedEndIdx)
        newBody.splice(finalRelatedIndex, relatedEndIdx - finalRelatedIndex)

        // Insert before disclaimer
        const newDisclaimerIndex = newBody.findIndex(b =>
            JSON.stringify(b).includes('免責事項')
        )
        newBody.splice(newDisclaimerIndex, 0, ...relatedSection)
        modified = true
    }

    if (!modified) return null

    return { newBody, issues }
}

async function main() {
    const dryRun = process.argv.includes('--dry-run')
    const limitStr = process.argv.find(arg => arg.startsWith('--limit='))
    const limit = limitStr ? parseInt(limitStr.split('=')[1]) : null

    console.log('🔧 Comprehensive Article Structure Cleanup...')
    if (dryRun) console.log('   (DRY RUN MODE - no changes will be made)\n')
    if (limit) console.log(`   (Limited to ${limit} articles)\n`)

    const articles = await client.fetch(`
    *[_type == "post"] {
      _id,
      title,
      slug,
      body
    }
  `)

    console.log(`📊 Found ${articles.length} articles.\n`)

    const articlesToProcess = limit ? articles.slice(0, limit) : articles.filter(a => a.slug?.current === "comparison-of-three-resignation-agencies")

    let updatedCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (const article of articlesToProcess) {
        try {
            const result = await fixArticleStructure(article)

            if (!result) {
                skippedCount++
                continue
            }

            console.log(`🔧 Fixing: ${article.title}`)
            result.issues.forEach(issue => console.log(`   - ${issue}`))

            if (!dryRun) {
                await createBackup(article._id, article)

                await client
                    .patch(article._id)
                    .set({ body: result.newBody })
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
    console.log(`✅ Cleanup complete!`)
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
