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
    console.log(`🔍 Verifying Integrity for: ${SLUG}\n`);

    const posts = await client.fetch(`*[_type == "post" && slug.current == $slug]`, { slug: SLUG });

    if (posts.length === 0) {
        console.log('❌ Article not found.');
        return;
    }

    const post = posts[0];
    let errors = 0;

    if (!post.body || !Array.isArray(post.body)) {
        console.log('❌ Body is not an array.');
        return;
    }

    post.body.forEach((block, i) => {
        if (!block._key) {
            console.log(`❌ Block ${i} missing _key`);
            errors++;
        }
        if (!block._type) {
            console.log(`❌ Block ${i} missing _type`);
            errors++;
        }

        if (block.children) {
            if (!Array.isArray(block.children)) {
                console.log(`❌ Block ${i} children is not an array`);
                errors++;
            } else {
                block.children.forEach((child, j) => {
                    if (!child._key) {
                        console.log(`❌ Block ${i} Child ${j} missing _key`);
                        console.log(JSON.stringify(child));
                        errors++;
                    }
                    if (!child._type) {
                        console.log(`❌ Block ${i} Child ${j} missing _type`);
                        errors++;
                    }
                });
            }
        }

        if (block.markDefs) {
            if (!Array.isArray(block.markDefs)) {
                console.log(`❌ Block ${i} markDefs is not an array`);
                errors++;
            } else {
                block.markDefs.forEach((def, k) => {
                    if (!def._key) {
                        console.log(`❌ Block ${i} MarkDef ${k} missing _key`);
                        errors++;
                    }
                    if (!def._type) {
                        console.log(`❌ Block ${i} MarkDef ${k} missing _type`);
                        errors++;
                    }
                });
            }
        }
    });

    if (errors === 0) {
        console.log('✅ Structure integrity check passed (Keys and Types present).');
    } else {
        console.log(`❌ Found ${errors} integrity errors.`);
    }
}

main().catch(console.error);
