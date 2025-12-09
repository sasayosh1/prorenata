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
    console.log(`🔍 Comparing Draft vs Published for: ${SLUG}\n`);

    // Fetch all docs with this slug (draft and published)
    // Note: We can't query by slug easily for drafts if slug is in the draft
    // But usually drafts have the same _id prefix

    // First get the published ID
    const published = await client.fetch(`*[_type == "post" && slug.current == $slug][0]`, { slug: SLUG });

    if (!published) {
        console.log('❌ Published article not found.');
        return;
    }

    console.log(`Published ID: ${published._id}`);
    console.log(`Published Body Length: ${published.body ? published.body.length : 0}`);

    // Now try to get the draft
    const draftId = `drafts.${published._id}`;
    const draft = await client.getDocument(draftId);

    if (draft) {
        console.log(`\nDraft ID: ${draft._id}`);
        console.log(`Draft Body Length: ${draft.body ? draft.body.length : 0}`);

        if (draft.body && draft.body.length < 5) {
            console.log('\n⚠️  Draft seems CORRUPTED!');
            console.log('Content of draft body:');
            console.log(JSON.stringify(draft.body, null, 2));
        }
    } else {
        console.log('\nNo draft found.');
    }
}

main().catch(console.error);
