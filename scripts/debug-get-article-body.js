require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false
})

async function getArticleBody(slug) {
    if (!slug) {
        console.error('Error: Slug is required.')
        process.exit(1)
    }

    const article = await client.fetch(`
        *[_type == "post" && slug.current == $slug][0] {
            body
        }
    `, { slug })

    if (article) {
        console.log(JSON.stringify(article.body, null, 2))
    } else {
        console.log('Article not found.')
    }
}

const slug = process.argv[2]
getArticleBody(slug)
