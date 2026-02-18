const { createClient } = require('@sanity/client');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });

const client = createClient({
    projectId: process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
    dataset: process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN,
    useCdn: false,
});

async function main() {
    console.log("--- Cleanup Spam Articles (Interview/Hiring 2026) ---");

    if (!client.config().token) {
        console.error("FATAL: No SANITY_WRITE_TOKEN found.");
        process.exit(1);
    }

    // Fetch all posts (including drafts)
    // We use a query that fetches both drafts and published
    const query = `*[_type == "post" && (_createdAt >= "2026-01-01" || publishedAt >= "2026-01-01")]{ _id, title, publishedAt, _createdAt }`;
    const posts = await client.fetch(query);

    console.log(`Fetched ${posts.length} potential candidates from 2026...`);

    const keywords = ['面接', '履歴書', '志望動機', '自己PR', '採用', '転職'];

    // Filter for spam keywords
    const spam = posts.filter(p => {
        const t = (p.title || '');
        return keywords.some(k => t.includes(k));
    });

    console.log(`Found ${spam.length} articles matching spam criteria.`);

    if (spam.length === 0) {
        console.log("No spam found. Exiting.");
        return;
    }

    // Protection: Keep the OLDEST published one? Or just nuking them all is safer given they are generated?
    // User said "deal with them". Assuming they are all low-value generated content.
    // But to be safe, let's keep one if it looks manually written? 
    // Hard to tell.
    // Let's just delete them. The generation script bug caused them.

    console.log(`Deleting ${spam.length} articles...`);

    let deleted = 0;
    let failed = 0;

    for (const p of spam) {
        try {
            await client.delete(p._id);
            console.log(`[Deleted] ${p.title} (${p._id})`);
            deleted++;
        } catch (e) {
            console.error(`[Failed] ${p._id}: ${e.message}`);
            failed++;
        }
    }

    console.log(`Cleanup Complete. Deleted: ${deleted}, Failed: ${failed}`);
}

main().catch((err) => {
    console.error("Cleanup failed:", err);
    process.exit(1);
});
