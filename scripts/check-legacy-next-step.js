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
    console.log('🚀 Checking for legacy "nextStep" field and "Related Articles" section...\n')

    // Fetch all posts with all fields
    const articles = await client.fetch(`
    *[_type == "post"] {
      _id,
      title,
      body,
      nextStep,
      next_step,
      nextSteps
    }
  `)

    console.log(`📊 Analyzed ${articles.length} articles.\n`)

    let legacyCount = 0
    let relatedCount = 0
    let h2Count = 0
    let h3Count = 0

    const legacyArticles = []
    const missingRelated = []

    for (const article of articles) {
        // Check for various possible names for "Next Step"
        const hasNextStep = article.nextStep || article.next_step || article.nextSteps

        if (hasNextStep) {
            legacyCount++
            legacyArticles.push(article.title)
        }

        // Check if "Related Articles" exists in body
        if (article.body) {
            const relatedBlock = article.body.find(b =>
                (b.style === 'h2' || b.style === 'h3') &&
                b.children?.[0]?.text?.includes('あわせて読みたい')
            )

            if (relatedBlock) {
                relatedCount++
                if (relatedBlock.style === 'h2') h2Count++
                if (relatedBlock.style === 'h3') h3Count++
            } else {
                missingRelated.push(article.title)
            }
        }
    }

    console.log('---------------------------------------------------')
    console.log(`Legacy "nextStep" field found: ${legacyCount} articles`)
    if (legacyCount > 0) {
        console.log('Articles with legacy field:')
        legacyArticles.forEach(t => console.log(` - ${t}`))
    }
    console.log(`"Related Articles" section found: ${relatedCount} articles`)
    console.log(`  - H2 style: ${h2Count}`)
    console.log(`  - H3 style: ${h3Count}`)
    console.log('---------------------------------------------------')

    if (legacyCount === 0) {
        console.log('\n✅ Verification Successful: No articles have the legacy "nextStep" field.')
    } else {
        console.log('\n❌ Verification Failed: Some articles still have the legacy field.')
    }

    if (relatedCount < articles.length) {
        console.log(`\n⚠️  Warning: ${articles.length - relatedCount} articles are missing the "Related Articles" section.`)
        // console.log('Missing in:', missingRelated.slice(0, 5))
    }
}

main().catch(console.error)
