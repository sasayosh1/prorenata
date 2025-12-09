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
    console.log(`🔍 Dumping article data for: ${SLUG}\n`);

    // Fetch both draft and published if they exist
    const posts = await client.fetch(`*[_type == "post" && slug.current == $slug]`, { slug: SLUG });

    if (posts.length === 0) {
        console.error('❌ Article not found!');
        return;
    }

    posts.forEach(post => {
        console.log('---------------------------------------------------');
        console.log(`ID: ${post._id}`);
        console.log(`Title: ${post.title}`);
        console.log(`Body Blocks: ${post.body ? post.body.length : 0}`);
        if (post.body) {
            console.log(JSON.stringify(post.body, null, 2));
        } else {
            console.log('Body is null or undefined');
        }
    });
}

main().catch(console.error);
