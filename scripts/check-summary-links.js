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
    console.log('🚀 Checking for Links inside Summary Section...\n')

    const articles = await client.fetch(`
    *[_type == "post" && title == "看護助手から看護学校へ進学するキャリアパス"] {
      title,
      body
    }
  `)

    let issueCount = 0

    for (const article of articles) {
        const body = article.body || []

        // Find Summary Section
        const summaryIndex = body.findIndex(b => b.style === 'h2' && b.children?.[0]?.text === 'まとめ')

        if (summaryIndex !== -1) {
            // Find end of summary
            let summaryEndIndex = body.length
            for (let i = summaryIndex + 1; i < body.length; i++) {
                const block = body[i]

                // Debug logging for specific article
                if (article.title === '看護助手から看護学校へ進学するキャリアパス') {
                    console.log(`Block ${i}: style=${block.style}, text=${block.children?.[0]?.text}`)
                }

                // Stop at next H2, or H3 (especially Related Articles), or Disclaimer
                if (block.style === 'h2' ||
                    block.style === 'h3' ||
                    (block.children?.[0]?.text && block.children[0].text.includes('あわせて読みたい')) ||
                    JSON.stringify(block).includes('免責事項')) {
                    summaryEndIndex = i
                    break
                }
            }

            // Check blocks within summary for links
            const summaryBlocks = body.slice(summaryIndex + 1, summaryEndIndex)

            let hasLinks = false
            let linkTexts = []

            for (const block of summaryBlocks) {
                if (block.markDefs && block.markDefs.some(m => m._type === 'link')) {
                    // Extract link text
                    if (block.children) {
                        block.children.forEach(c => {
                            if (c.marks && c.marks.some(m => block.markDefs.find(md => md._key === m && md._type === 'link'))) {
                                linkTexts.push(c.text)
                                hasLinks = true
                            }
                        })
                    }
                }

                // Also check for text patterns like "出典" or "参考"
                if (block.children) {
                    block.children.forEach(c => {
                        if (c.text.includes('出典') || c.text.includes('参考')) {
                            // Exclude common phrases like "参考にしてください" if needed, but for now be strict
                            linkTexts.push(`(Text match: ${c.text.substring(0, 20)}...)`)
                            hasLinks = true
                        }
                    })
                }
            }

            if (hasLinks) {
                issueCount++
                console.log(`⚠️  Links/References found in Summary: ${article.title}`)
                linkTexts.forEach(t => console.log(`   - ${t}`))
            }
        }
    }

    console.log('\n---------------------------------------------------')
    console.log(`Articles with Links/References in Summary: ${issueCount}`)
    console.log('---------------------------------------------------')
}

main().catch(console.error)
