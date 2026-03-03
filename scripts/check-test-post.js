require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')

const client = createClient({
    projectId: process.env.SANITY_PROJECT_ID || '72m8vhy2',
    dataset: process.env.SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false
})

async function main() {
    const post = await client.fetch(`*[_type == "post" && title match "Speech Bubble Feature Test"][0]`)
    if (post) {
        console.log(`Title: ${post.title}`)
        console.log(`Slug: ${post.slug?.current}`)
        console.log(`ID: ${post._id}`)
        console.log(`Internal Only: ${post.internalOnly}`)
        console.log(`Is Draft?: ${post._id.startsWith('drafts.')}`)
    } else {
        console.log("Post not found.")
    }
}

main().catch(console.error)
