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
    console.log('🔍 Verifying article restoration...\n');

    // Check for any drafts
    const drafts = await client.fetch(`*[_id in path("drafts.**") && slug.current == $slug]`, { slug: SLUG });

    // Get published version
    const published = await client.fetch(`*[_type == "post" && slug.current == $slug && !(_id in path("drafts.**"))][0] {
        _id,
        title,
        "slug": slug.current,
        _updatedAt,
        body
    }`, { slug: SLUG });

    console.log('='.repeat(60));
    console.log('📊 Verification Results');
    console.log('='.repeat(60));

    if (drafts.length > 0) {
        console.log('❌ ISSUE: Draft still exists!');
        drafts.forEach(d => console.log(`   - ${d._id}`));
    } else {
        console.log('✅ No drafts found (correct state)');
    }

    console.log('');

    if (!published) {
        console.log('❌ CRITICAL: Published version not found!');
        return;
    }

    console.log('✅ Published version found:');
    console.log(`   ID: ${published._id}`);
    console.log(`   Title: ${published.title}`);
    console.log(`   Last Updated: ${published._updatedAt}`);
    console.log(`   Body Blocks: ${published.body ? published.body.length : 0}`);

    if (published.body && published.body.length > 0) {
        console.log('');
        console.log('📝 Content Preview (first 3 blocks):');
        published.body.slice(0, 3).forEach((block, i) => {
            if (block.children) {
                const text = block.children.map(c => c.text || '').join('');
                console.log(`   [${i}] ${text.substring(0, 80)}${text.length > 80 ? '...' : ''}`);
            }
        });
    }

    console.log('');
    console.log('='.repeat(60));

    if (drafts.length === 0 && published && published.body && published.body.length > 50) {
        console.log('✅ VERIFICATION PASSED: Article is healthy!');
    } else {
        console.log('⚠️  VERIFICATION INCOMPLETE: Please check manually');
    }
}

main().catch(console.error);
