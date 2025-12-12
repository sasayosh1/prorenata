require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')
const fs = require('fs')
const path = require('path')

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false
})

// Backup utility
async function backupArticle(article) {
    const backupDir = path.resolve(__dirname, '../backups/summary_links_removal')
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true })
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `${article.slug.current}_${timestamp}.json`
    fs.writeFileSync(path.join(backupDir, filename), JSON.stringify(article, null, 2))
}

async function main() {
    console.log('🚀 Removing Links from Summary Section...\n')

    const articles = await client.fetch(`
    *[_type == "post"] {
      _id,
      title,
      slug,
      body
    }
  `)

    let updatedCount = 0
    let errorCount = 0

    for (const article of articles) {
        const body = article.body || []

        // Find Summary Section
        const summaryIndex = body.findIndex(b => b.style === 'h2' && b.children?.[0]?.text === 'まとめ')

        if (summaryIndex !== -1) {
            // Find end of summary
            let summaryEndIndex = body.length
            for (let i = summaryIndex + 1; i < body.length; i++) {
                const block = body[i]
                // Stop at next H2, or H3 (especially Related Articles), or Disclaimer
                if (block.style === 'h2' ||
                    block.style === 'h3' ||
                    (block.children?.[0]?.text && block.children[0].text.includes('あわせて読みたい')) ||
                    JSON.stringify(block).includes('免責事項')) {
                    summaryEndIndex = i
                    break
                }
            }

            // Identify blocks to remove or modify
            const blocksToRemoveIndices = []
            let modified = false

            for (let i = summaryIndex + 1; i < summaryEndIndex; i++) {
                const block = body[i]
                let shouldRemove = false

                // Check for links
                if (block.markDefs && block.markDefs.some(m => m._type === 'link')) {
                    // If it's a short block (likely a navigation link), remove it
                    // Or if it contains "出典" or "参考"
                    const text = block.children?.map(c => c.text).join('') || ''

                    if (text.length < 100 || text.includes('出典') || text.includes('参考') || text.includes('読む')) {
                        shouldRemove = true
                    } else {
                        // Long text with link? Unlink it.
                        // But user said "Summary section references prohibited", so maybe safer to remove if it looks like a reference.
                        // For now, let's remove blocks with links to be safe and strict as requested.
                        shouldRemove = true
                    }
                }

                // Also check for text patterns like "出典" or "参考" even without link marks
                if (!shouldRemove && block.children) {
                    const text = block.children.map(c => c.text).join('')
                    if (text.includes('出典') || text.includes('参考')) {
                        shouldRemove = true
                    }
                }

                if (shouldRemove) {
                    blocksToRemoveIndices.push(i)
                }
            }

            if (blocksToRemoveIndices.length > 0) {
                // Create new body with blocks removed
                // We need to filter out the indices
                const newBody = body.filter((_, index) => !blocksToRemoveIndices.includes(index))

                try {
                    await backupArticle(article)
                    await client.patch(article._id).set({ body: newBody }).commit()
                    console.log(`✅ Removed ${blocksToRemoveIndices.length} blocks from summary in: ${article.title}`)
                    updatedCount++
                } catch (err) {
                    console.error(`❌ Error updating ${article.title}:`, err.message)
                    errorCount++
                }
            }
        }
    }

    console.log('\n---------------------------------------------------')
    console.log(`Updated Articles: ${updatedCount}`)
    console.log(`Errors: ${errorCount}`)
    console.log('---------------------------------------------------')
}

main().catch(console.error)
