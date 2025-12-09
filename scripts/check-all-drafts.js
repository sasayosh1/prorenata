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
    console.log('🔍 Checking for all draft documents...\n');

    // Get all drafts
    const drafts = await client.fetch(`*[_id in path("drafts.**")] {
        _id,
        _type,
        title,
        "slug": slug.current,
        _updatedAt
    } | order(_updatedAt desc)`);

    console.log(`Found ${drafts.length} draft documents\n`);

    if (drafts.length > 0) {
        console.log('Recent drafts:');
        drafts.slice(0, 20).forEach(draft => {
            console.log(`- [${draft._updatedAt}] ${draft.title || draft._id}`);
        });
    }

    // Check specifically for the target article
    const targetDraft = drafts.find(d => d.slug === 'nursing-assistant-compare-services-perspective');
    if (targetDraft) {
        console.log('\n⚠️  Found draft for target article:');
        console.log(JSON.stringify(targetDraft, null, 2));
    } else {
        console.log('\n✅ No draft found for target article.');
    }
}

main().catch(console.error);
