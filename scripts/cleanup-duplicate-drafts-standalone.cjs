const { createClient } = require('@sanity/client');
const { randomUUID } = require('crypto');

const client = createClient({
    projectId: '72m8vhy2',
    dataset: 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
});

function normalize(text) {
    return String(text || '')
        .normalize('NFKC')
        .toLowerCase()
        .replace(/[【】\[\]（）()]/g, ' ')
        .replace(/[・、。！？!?,:：\u3000]/g, ' ')
        .replace(/\s+/g, '')
        .trim();
}

async function cleanupDrafts() {
    console.log("Fetching all drafts...");
    const drafts = await client.fetch(`*[_id in drafts.** && _type == "post"]{_id, title, _createdAt}`);

    if (!drafts || drafts.length === 0) {
        console.log("No drafts found.");
        return;
    }

    console.log(`Found ${drafts.length} drafts.`);

    const seen = new Map();
    const toDelete = [];

    // Sort by creation date so we keep the newest one
    drafts.sort((a, b) => new Date(b._createdAt) - new Date(a._createdAt));

    for (const draft of drafts) {
        const normalTitle = normalize(draft.title);
        if (seen.has(normalTitle)) {
            toDelete.push(draft);
        } else {
            seen.set(normalTitle, draft);
        }
    }

    console.log(`Identified ${toDelete.length} duplicate drafts to delete.`);

    for (const draft of toDelete) {
        try {
            if (process.env.EXECUTE === 'true') {
                await client.delete(draft._id);
                console.log(`✅ Deleted: ${draft.title} (${draft._id})`);
            } else {
                console.log(`[DRY RUN] Would delete: ${draft.title} (${draft._id})`);
            }
        } catch (err) {
            console.error(`❌ Failed to delete ${draft._id}:`, err.message);
        }
    }

    if (process.env.EXECUTE !== 'true' && toDelete.length > 0) {
        console.log("\nRun with EXECUTE=true to actually delete.");
    }
}

cleanupDrafts().catch(console.error);
