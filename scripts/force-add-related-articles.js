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
    console.log('🚀 Starting Forced Addition of "Related Articles" Section...\n')

    const articles = await client.fetch(`
    *[_type == "post"] {
      _id,
      title,
      "slug": slug.current,
      body,
      categories[]->{title}
    }
  `)

    console.log(`📊 Found ${articles.length} articles. Processing...\n`)

    let updatedCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (const article of articles) {
        try {
            const body = article.body || []

            // Check if "Related Articles" section exists (H2 or H3)
            const existingRelatedIndex = body.findIndex(b =>
                (b.style === 'h2' || b.style === 'h3') &&
                b.children?.[0]?.text?.includes('あわせて読みたい')
            )

            if (existingRelatedIndex !== -1) {
                // Section exists, check if it's H2 (needs fix) or H3 (good)
                const block = body[existingRelatedIndex]
                if (block.style === 'h2') {
                    console.log(`⚠️  Fixing H2 -> H3 for: ${article.title}`)

                    await createBackup(article._id, 'fix-related-heading-level')

                    const newBody = [...body]
                    newBody[existingRelatedIndex] = { ...block, style: 'h3' }

                    await client.patch(article._id).set({ body: newBody }).commit()
                    updatedCount++
                } else {
                    // console.log(`   Skipping (Already exists): ${article.title}`)
                    skippedCount++
                }
                continue
            }

            console.log(`➕ Adding "Related Articles" to: ${article.title}`)

            // Find insertion point
            // Priority: After Summary -> Before Disclaimer -> End
            const summaryIndex = body.findIndex(b =>
                b.style === 'h2' && b.children?.[0]?.text === 'まとめ'
            )

            const disclaimerIndex = body.findIndex(b =>
                JSON.stringify(b).includes('免責事項')
            )

            let insertIndex = body.length
            if (summaryIndex !== -1) {
                // Insert after summary content (find next heading or end)
                let i = summaryIndex + 1
                while (i < body.length) {
                    const b = body[i]
                    if (b.style === 'h2' || JSON.stringify(b).includes('免責事項')) {
                        break
                    }
                    i++
                }
                insertIndex = i
            } else if (disclaimerIndex !== -1) {
                insertIndex = disclaimerIndex
            }

            // Fetch related articles (random/latest for now, excluding current)
            const relatedArticles = await client.fetch(`
        *[_type == "post" && slug.current != $currentSlug] | order(_createdAt desc) [0...3] {
          title,
          "slug": slug.current
        }
      `, { currentSlug: article.slug })

            if (relatedArticles.length === 0) {
                console.warn('   ⚠️ No related articles found to link.')
                continue
            }

            // Create blocks
            const newBlocks = [
                {
                    _type: 'block',
                    style: 'h3',
                    _key: `related-head-${Date.now()}`,
                    children: [{ _type: 'span', text: 'あわせて読みたい' }]
                },
                ...relatedArticles.map((rel, idx) => ({
                    _type: 'block',
                    style: 'normal',
                    listItem: 'bullet',
                    level: 1,
                    _key: `related-link-${Date.now()}-${idx}`,
                    children: [
                        {
                            _type: 'span',
                            marks: [`rel-link-${Date.now()}-${idx}`],
                            text: rel.title
                        }
                    ],
                    markDefs: [
                        {
                            _type: 'link',
                            _key: `rel-link-${Date.now()}-${idx}`,
                            href: `/posts/${rel.slug}`
                        }
                    ]
                }))
            ]

            await createBackup(article._id, 'add-related-section')

            const newBody = [...body]
            newBody.splice(insertIndex, 0, ...newBlocks)

            await client
                .patch(article._id)
                .set({ body: newBody })
                .commit()

            console.log('   ✅ Added')
            updatedCount++

        } catch (error) {
            console.error(`❌ Error processing ${article.title}:`, error.message)
            errorCount++
        }
    }

    console.log('\n============================================================')
    console.log(`✅ Completed! Updated: ${updatedCount}, Skipped: ${skippedCount}, Errors: ${errorCount}`)
    console.log('============================================================')
}

main().catch(console.error)
