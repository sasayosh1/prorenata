require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')
const { createBackup } = require('./backup-utility')

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false
})

async function main() {
    console.log('🚀 Starting "Next Step" Section Removal...\n')

    const articles = await client.fetch(`
    *[_type == "post"] {
      _id,
      title,
      body
    }
  `)

    console.log(`📊 Found ${articles.length} articles. Processing...\n`)

    let removedCount = 0
    let errorCount = 0

    for (const article of articles) {
        try {
            const body = article.body || []

            // Check for "Next Step" section (H2 or H3)
            // Keywords: "次のステップ", "Next Step", "ネクストステップ"
            const nextStepIndex = body.findIndex(b =>
                (b.style === 'h2' || b.style === 'h3') &&
                (
                    b.children?.[0]?.text?.includes('次のステップ') ||
                    b.children?.[0]?.text?.includes('Next Step') ||
                    b.children?.[0]?.text?.includes('ネクストステップ')
                )
            )

            // Check for "Related Articles" section
            const relatedIndex = body.findIndex(b =>
                (b.style === 'h2' || b.style === 'h3') &&
                b.children?.[0]?.text?.includes('あわせて読みたい')
            )

            // Only remove if BOTH exist
            if (nextStepIndex !== -1 && relatedIndex !== -1) {
                console.log(`🗑️  Removing "Next Step" from: ${article.title}`)

                await createBackup(article._id, 'remove-next-step')

                const newBody = [...body]

                // Remove the Next Step section (heading + content until next heading)
                let removeEndIndex = nextStepIndex + 1
                while (removeEndIndex < newBody.length) {
                    const block = newBody[removeEndIndex]
                    if (block.style === 'h2' || block.style === 'h3' || JSON.stringify(block).includes('免責事項')) {
                        break
                    }
                    removeEndIndex++
                }

                newBody.splice(nextStepIndex, removeEndIndex - nextStepIndex)

                await client
                    .patch(article._id)
                    .set({ body: newBody })
                    .commit()

                console.log('   ✅ Removed')
                removedCount++
            }
        } catch (error) {
            console.error(`❌ Error processing ${article.title}:`, error.message)
            errorCount++
        }
    }

    console.log('\n============================================================')
    console.log(`✅ Completed! Removed: ${removedCount}, Errors: ${errorCount}`)
    console.log('============================================================')
}

main().catch(console.error)
