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
    console.log(`🔍 Inspecting links in article: ${SLUG}\n`);

    const post = await client.fetch(`*[_type == "post" && slug.current == $slug][0] {
        title,
        body
    }`, { slug: SLUG });

    if (!post) {
        console.error('❌ Article not found!');
        return;
    }

    console.log(`Title: ${post.title}\n`);

    if (!post.body || !Array.isArray(post.body)) {
        console.log('No body content.');
        return;
    }

    const bodyString = JSON.stringify(post.body);
    console.log(`\nRaw body check for 'rentracks': ${bodyString.includes('rentracks')}`);
    console.log(`Raw body check for 'ヒューマン': ${bodyString.includes('ヒューマン')}`);

    post.body.forEach((block, index) => {
        const blockStr = JSON.stringify(block);
        if (blockStr.includes('ヒューマン') || blockStr.includes('rentracks')) {
            console.log(`\n[Block ${index}] Type: ${block._type}, Style: ${block.style || 'N/A'}`);
            console.log(`   Content snippet: ${blockStr.substring(0, 200)}...`);

            if (block.markDefs) {
                block.markDefs.forEach(def => {
                    if (def.href) console.log(`   markDef URL: ${def.href}`);
                });
            }
        }
    });
}

main().catch(console.error);
