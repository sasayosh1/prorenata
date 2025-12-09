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
    const post = await client.fetch(`*[_type == "post" && slug.current == $slug][0]`, { slug: SLUG });

    if (!post || !post.body) return;

    post.body.forEach((block, index) => {
        if (index === 71 || index === 72) {
            console.log(`\n[Block ${index}] type: ${block._type}`);
            if (block.html) console.log(block.html);
        }
    });
}

main().catch(console.error);
