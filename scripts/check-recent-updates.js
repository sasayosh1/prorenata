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
    console.log('🔍 Checking for recently updated articles...\n');

    // Get time 2 hours ago
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    const posts = await client.fetch(`*[_type == "post" && _updatedAt > $time] | order(_updatedAt desc) {
        _id,
        title,
        "slug": slug.current,
        _updatedAt
    }`, { time: twoHoursAgo });

    console.log(`Found ${posts.length} articles updated in the last 2 hours:\n`);

    posts.forEach(post => {
        console.log(`- [${post._updatedAt}] ${post.title} (${post._id})`);
    });
}

main().catch(console.error);
