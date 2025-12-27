const { createClient } = require('@sanity/client')
require('dotenv').config({ path: '.env.local' })

const client = createClient({
    projectId: '72m8vhy2',
    dataset: 'production',
    apiVersion: '2024-01-01',
    useCdn: false,
    token: process.env.SANITY_API_TOKEN,
})

const slug = process.argv[2]
if (!slug) {
    console.error('Please provide a slug')
    process.exit(1)
}

async function fetchArticle() {
    const query = `*[_type == "post" && slug.current == $slug][0] {
    title,
    excerpt,
    body
  }`

    const post = await client.fetch(query, { slug })

    if (!post) {
        console.error('Post not found')
        return
    }

    console.log(`Title: ${post.title}`)
    console.log('---')
    console.log(JSON.stringify(post.body, null, 2))
}

fetchArticle()
