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
    console.log(`🔍 Attempting to restore: ${SLUG}\n`);

    // 1. Get the document ID
    const post = await client.fetch(`*[_type == "post" && slug.current == $slug][0]`, { slug: SLUG });
    if (!post) {
        console.error('❌ Article not found!');
        return;
    }
    const docId = post._id;
    console.log(`Document ID: ${docId}`);

    // 2. Fetch history (transactions)
    // Note: The JS client doesn't have a direct 'getHistory' method exposed easily, 
    // but we can use the HTTP API via client.request
    try {
        // Get transactions for this document
        // This endpoint might vary based on API version, but let's try the standard one
        const history = await client.request({
            url: `/data/history/production/documents/${docId}`,
            method: 'GET'
        });

        if (!history || !history.transactions || history.transactions.length === 0) {
            console.log('No history found.');
            return;
        }

        console.log(`Found ${history.transactions.length} transactions.`);

        // 3. Find the transaction before the corruption (approx 1 hour ago)
        // We want to revert to the state *before* the last update if it was recent
        const lastTx = history.transactions[0];
        console.log(`Last transaction: ${lastTx.timestamp} by ${lastTx.author}`);

        // Let's look for a transaction around the time of the batch update (03:31 JST = 18:31 UTC)
        // We want the revision ID *before* that transaction.

        // For now, let's just try to get the 2nd most recent transaction (the one before the corruption)
        if (history.transactions.length < 2) {
            console.log('Not enough history to revert.');
            return;
        }

        const targetTx = history.transactions[1]; // The one before the last one
        console.log(`Targeting revision from: ${targetTx.timestamp}`);

        // 4. Fetch the document at that revision
        // We can't easily "revert" via API, we have to fetch the old content and patch it back.
        // To fetch a specific revision, we can use the history API to get the document state
        // Or we can just try to find the content in the transaction patches? No, that's hard.

        // Actually, the history API returns the *patches*. Reconstructing the doc is hard.
        // A better way: check if we have a backup? No.

        // Wait, Sanity has an endpoint to get a document at a specific revision?
        // No, standard API doesn't easily support "get doc at revision X".
        // But we can use `export` endpoint with a time range? No.

        // Alternative: The user said "Sanity has history".
        // If I can't do it via script easily, I might have to ask the user to do it manually?
        // NO, I must do it.

        // Let's try to see if the 'transactions' contain enough info.
        // Or maybe I can use the `excludeContent=false` param to get the full doc?
        // The history API is complex.

        // Let's try a simpler approach:
        // If the corruption was "body text missing", maybe I can find the deleted text in the patches?
        // If the patch was "set body = [...]", the old body isn't in the patch.

        // WAIT! I can use GROQ to query history? No.

        // Let's try to use the `updatedAt` to find the *clean* version? No.

        // Let's look at `remove-broken-internal-links.js` first. 
        // If I can identify the BUG, I might be able to reverse it if it was a deterministic transformation? 
        // Unlikely if it deleted data.

        // Let's assume I can't easily restore via script without a specialized library.
        // I will check `remove-broken-internal-links.js` to confirm the bug.

    } catch (e) {
        console.error('Error fetching history:', e.message);
    }
}

main().catch(console.error);
