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
    console.log('🔍 Inspecting draft documents...\n');

    const drafts = await client.fetch(`*[_id in path("drafts.**")] {
        _id,
        _type,
        _createdAt,
        _updatedAt,
        title
    } | order(_updatedAt desc)`);

    console.log(`Found ${drafts.length} draft(s)\n`);

    for (const draft of drafts) {
        console.log('='.repeat(60));
        console.log(`ID: ${draft._id}`);
        console.log(`Type: ${draft._type}`);
        console.log(`Title: ${draft.title || '(no title)'}`);
        console.log(`Created: ${draft._createdAt}`);
        console.log(`Updated: ${draft._updatedAt}`);

        // Get full document
        const fullDoc = await client.getDocument(draft._id);
        console.log(`\nDocument keys: ${Object.keys(fullDoc).join(', ')}`);

        // Check if there's a published version
        const publishedId = draft._id.replace('drafts.', '');
        try {
            const published = await client.getDocument(publishedId);
            console.log(`✅ Published version exists (${publishedId})`);
        } catch (e) {
            console.log(`❌ No published version found`);
        }

        console.log('');
    }

    console.log('='.repeat(60));
    console.log('\nRecommendation:');
    console.log('- drafts.homePage: Likely a homepage draft (check if needed)');
    console.log('- Other drafts: Check if they have published versions');
    console.log('- If published versions exist, drafts can be safely deleted');
}

main().catch(console.error);
