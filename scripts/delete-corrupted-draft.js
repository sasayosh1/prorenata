require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false
})

const DRAFT_ID = 'drafts.fc67aa26-02eb-4655-8af7-b904d6c1c01e';

async function main() {
    console.log(`🗑️  Deleting draft: ${DRAFT_ID}\n`);

    try {
        await client.delete(DRAFT_ID);
        console.log('✅ Draft deleted successfully!');
        console.log('The published version should now be visible in Sanity Studio.');
    } catch (error) {
        console.error('❌ Error deleting draft:', error.message);
    }
}

main().catch(console.error);
