require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')
const fs = require('fs')

const client = createClient({
    projectId: process.env.SANITY_PROJECT_ID || '72m8vhy2',
    dataset: process.env.SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false
})

async function main() {
    // We want the posts about "human relations" and "interview"
    // Let's search by keyword in title or slug
    const query = `*[_type == "post" && (
        slug.current match "*relationship*" || 
        slug.current match "*human*" ||
        title match "*人間関係*" ||
        slug.current match "*interview*" ||
        title match "*面接*"
    )] { _id, title, slug, body }`

    const posts = await client.fetch(query)

    console.log(`Found ${posts.length} candidate posts.`)
    for (const post of posts) {
        console.log(`- ${post.title} (${post.slug.current}) [ID: ${post._id}]`)
        // Save the portable text to check its structure
        fs.writeFileSync(`sanity_post_${post.slug.current}.json`, JSON.stringify(post.body, null, 2))
    }
}

main().catch(console.error)
