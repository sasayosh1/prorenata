require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false
})

const SLUG = 'nursing-assistant-compare-services-perspective';

async function main() {
    console.log(`🔍 Detailed Inspection for: ${SLUG}\n`);

    // Fetch ALL documents matching the slug (drafts and published)
    const posts = await client.fetch(`*[_type == "post" && slug.current == $slug]`, { slug: SLUG });

    if (posts.length === 0) {
        console.log('❌ No documents found with this slug.');
        return;
    }

    posts.forEach(post => {
        console.log('='.repeat(60));
        console.log(`ID: ${post._id}`);
        console.log(`Title: ${post.title}`);
        console.log(`Updated At: ${post._updatedAt}`);
        console.log(`Body Length: ${post.body ? post.body.length : 0}`);

        if (post.body && post.body.length > 0) {
            console.log('\n--- First 5 Blocks ---');
            post.body.slice(0, 5).forEach((block, i) => {
                console.log(`[Block ${i}] Type: ${block._type}, Key: ${block._key}`);
                console.log(JSON.stringify(block, null, 2));
            });
        } else {
            console.log('\n⚠️  Body is empty or invalid.');
        }
    });
}

main().catch(console.error);
