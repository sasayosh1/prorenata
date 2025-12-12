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
    console.log('🚀 Checking for "References" text in body...\n')

    const articles = await client.fetch(`
    *[_type == "post"] {
      title,
      body
    }
  `)

    let foundCount = 0
    let insideSummaryCount = 0

    for (const article of articles) {
        const body = article.body || []

        // Find Summary Index
        const summaryIndex = body.findIndex(b => b.style === 'h2' && b.children?.[0]?.text === 'まとめ')

        // Find any block containing "参考文献"
        const refBlocks = body.map((b, idx) => ({ block: b, index: idx }))
            .filter(({ block }) => JSON.stringify(block).includes('参考文献'))

        if (refBlocks.length > 0) {
            foundCount++
            // console.log(`Found "参考文献" in: ${article.title}`)

            if (summaryIndex !== -1) {
                // Check if any ref block is AFTER summary start and BEFORE next H2
                // Find end of summary
                let summaryEndIndex = body.length
                for (let i = summaryIndex + 1; i < body.length; i++) {
                    if (body[i].style === 'h2' || JSON.stringify(body[i]).includes('免責事項')) {
                        summaryEndIndex = i
                        break
                    }
                }

                const refsInsideSummary = refBlocks.filter(r => r.index > summaryIndex && r.index < summaryEndIndex)

                if (refsInsideSummary.length > 0) {
                    insideSummaryCount++
                    console.log(`⚠️  References INSIDE Summary: ${article.title}`)
                    // console.log(`   Summary Start: ${summaryIndex}, End: ${summaryEndIndex}`)
                    // refsInsideSummary.forEach(r => console.log(`   Ref at: ${r.index} (${r.block.style || 'normal'})`))
                }
            }
        }
    }

    console.log('\n---------------------------------------------------')
    console.log(`Articles with "参考文献" text: ${foundCount}`)
    console.log(`Articles with References INSIDE Summary: ${insideSummaryCount}`)
    console.log('---------------------------------------------------')
}

main().catch(console.error)
