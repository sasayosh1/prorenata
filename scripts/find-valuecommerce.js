require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false
})

async function findValueCommerceLinks() {
    const articles = await client.fetch(`*[_type == "post" && !(_id in path("drafts.**"))]{ _id, title, slug, body }`)

    let count = 0
    const found = []

    articles.forEach(article => {
        const bodyStr = JSON.stringify(article.body)
        if (bodyStr.includes('valuecommerce') || bodyStr.includes('ck.jp.ap')) {
            console.log(`${article.title} (${article.slug?.current})`)
            found.push(article)
            count++
        }
    })

    console.log(`\nバリューコマースリンクが見つかった記事: ${count}件`)

    if (found.length > 0) {
        console.log('\n詳細:')
        found.forEach(article => {
            const vcBlocks = article.body.filter(b => {
                const str = JSON.stringify(b)
                return str.includes('valuecommerce') || str.includes('ck.jp.ap')
            })
            vcBlocks.forEach(block => {
                console.log(JSON.stringify(block, null, 2))
            })
        })
    }
}

findValueCommerceLinks().catch(console.error)
