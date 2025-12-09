require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false
})

const DRAFT_IDS = [
    'drafts.homePage',
    'drafts.b3a3b34f-7f9a-4219-93d7-150b7be42250',
    'drafts.c84a0321-61d2-4cf2-9ff7-f413507ca2ed'
]

async function main() {
    console.log('🗑️  Deleting draft documents...\n');

    for (const draftId of DRAFT_IDS) {
        try {
            // Verify published version exists
            const publishedId = draftId.replace('drafts.', '');
            const published = await client.getDocument(publishedId);

            if (published) {
                console.log(`✅ Published version confirmed for ${draftId}`);

                // Delete the draft
                await client.delete(draftId);
                console.log(`🗑️  Deleted: ${draftId}\n`);
            }
        } catch (e) {
            console.error(`❌ Error processing ${draftId}:`, e.message);
        }
    }

    // Verify cleanup
    const remainingDrafts = await client.fetch(`count(*[_id in path("drafts.**")])`);
    console.log('='.repeat(60));
    console.log(`Remaining drafts: ${remainingDrafts}`);

    if (remainingDrafts === 0) {
        console.log('✅ All drafts cleaned up successfully!');
    } else {
        console.log(`⚠️  ${remainingDrafts} draft(s) still remain`);
    }
}

main().catch(console.error);
