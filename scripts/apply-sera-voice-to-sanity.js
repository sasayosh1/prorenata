require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false
})

// Parse command-line arguments
const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run') || args.includes('-d')

if (DRY_RUN) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n')
}

/**
 * This script applies the transformed article content to Sanity.
 * 
 * Due to the complexity of the transformation (adding personal experiences,
 * adjusting tone, etc.), this is a manual process that requires:
 * 
 * 1. Reading the transformed markdown files
 * 2. Manually updating the Sanity content through the Studio UI
 * 3. OR creating a detailed mapping of changes to apply programmatically
 * 
 * For now, this script will:
 * - Verify the articles exist in Sanity
 * - Provide a checklist of what needs to be updated
 * - Generate a report for manual review
 */

const ARTICLES = [
    {
        slug: 'nursing-assistant-compare-services-perspective',
        title: '看護助手の転職サービス３社を "看護助手の視点だけ" で比較',
        transformedFile: 'transformed_article_sample1.md'
    },
    {
        slug: 'nursing-assistant-daily-schedule',
        title: '看護助手の1日の流れ｜病院勤務のリアルなスケジュールを公開',
        transformedFile: 'transformed_article_sample2.md'
    },
    {
        slug: 'nursing-assistant-mental-care-stress',
        title: '看護助手が精神的にきつい理由とストレスと向き合う秘策',
        transformedFile: 'transformed_article_sample3.md'
    }
]

async function main() {
    console.log('📝 Sanity Update Plan for Transformed Articles\n')
    console.log('='.repeat(60))

    for (const article of ARTICLES) {
        console.log(`\n📄 ${article.title}`)
        console.log(`   Slug: ${article.slug}`)
        console.log(`   Transformed file: ${article.transformedFile}`)

        // Verify article exists
        const existing = await client.fetch(
            `*[_type == "post" && slug.current == $slug && !(_id in path("drafts.**"))][0] { _id, title }`,
            { slug: article.slug }
        )

        if (existing) {
            console.log(`   ✅ Found in Sanity (ID: ${existing._id})`)
            console.log(`   📋 Action: Manual update required through Sanity Studio`)
            console.log(`   🔗 Studio URL: https://sanity.io/@souya3c39v/prorenata/structure/post;${existing._id}`)
        } else {
            console.log(`   ❌ NOT found in Sanity`)
        }
    }

    console.log('\n' + '='.repeat(60))
    console.log('\n📋 Next Steps:')
    console.log('\n1. Open each article in Sanity Studio using the URLs above')
    console.log('2. Copy content from the transformed markdown files')
    console.log('3. Update the article body with Sera\'s voice')
    console.log('4. Verify the changes in preview mode')
    console.log('5. Publish the updated articles')
    console.log('\nNote: Due to the complexity of the transformations (adding personal')
    console.log('experiences, adjusting tone, etc.), manual review and editing through')
    console.log('Sanity Studio is recommended to ensure quality.')
    console.log('\n' + '='.repeat(60))
}

main().catch(console.error)
