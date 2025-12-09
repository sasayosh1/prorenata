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
    // Get time 2 hours ago
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    const posts = await client.fetch(`*[_type == "post" && _updatedAt > $time] | order(_updatedAt desc) [0...5] {
        title,
        "slug": slug.current,
        body
    }`, { time: twoHoursAgo });

    posts.forEach(post => {
        console.log('---------------------------------------------------');
        console.log(`Title: ${post.title}`);
        console.log(`Body Blocks: ${post.body ? post.body.length : 0}`);

        if (post.body) {
            // Print first few blocks to see what's there
            post.body.slice(0, 3).forEach((block, i) => {
                console.log(`[Block ${i}] Type: ${block._type}`);
                if (block.children) {
                    const text = block.children.map(c => c.text).join('');
                    console.log(`  Text: ${text.substring(0, 100)}...`);
                }
            });
        }
    });
}

main().catch(console.error);
