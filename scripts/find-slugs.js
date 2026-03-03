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
    const query = `*[_type == "post" && !(_id in path("drafts.**")) && (
        title match "*志望動機*" ||
        title match "*体力*"
    )] { _id, title, slug }`

    const posts = await client.fetch(query)
    console.log(JSON.stringify(posts, null, 2))
}

main().catch(console.error)
