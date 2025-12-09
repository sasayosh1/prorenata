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
    console.log('🔍 Checking all articles for content loss...\n');

    const posts = await client.fetch(`*[_type == "post"] {
        _id,
        title,
        "slug": slug.current,
        body
    }`);

    let corruptedCount = 0;
    const corruptedPosts = [];

    posts.forEach(post => {
        const bodyLength = post.body ? post.body.length : 0;

        if (post.slug === 'nursing-assistant-compare-services-perspective') {
            console.log(`DEBUG: Target article found. Length: ${bodyLength}`);
        }

        // Heuristic: if body has fewer than 3 blocks, it's likely corrupted or empty
        if (bodyLength < 3) {
            corruptedCount++;
            corruptedPosts.push({
                title: post.title,
                id: post._id,
                slug: post.slug,
                length: bodyLength
            });
            console.log(`⚠️  POSSIBLE CORRUPTION: [${bodyLength} blocks] ${post.title} (${post._id})`);
        }
    });

    console.log('\n' + '='.repeat(60));
    console.log(`Total Articles: ${posts.length}`);
    console.log(`Suspicious Articles: ${corruptedCount}`);
    console.log('='.repeat(60));
}

main().catch(console.error);
