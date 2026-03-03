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
    const targetId = 'UZhm4BlgpnW3kQdzLi0bZ6';
    console.log(`Deleting post with ID: ${targetId}...`)

    try {
        await client.delete(targetId)
        console.log(`✅ Successfully deleted test post (Speech Bubble Feature Test).`)
    } catch (err) {
        console.error(`❌ Deletion failed:`, err.message)
    }
}

main().catch(console.error)
