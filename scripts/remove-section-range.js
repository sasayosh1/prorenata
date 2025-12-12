require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const { createClient } = require('@sanity/client');

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
});

async function removeSectionRange(slug, startKey, endKey) {
    if (!slug || !startKey || !endKey) {
        console.error('Error: Slug, startKey, and endKey are required.');
        process.exit(1);
    }

    try {
        const article = await client.fetch(
            `*[_type == "post" && slug.current == $slug][0] { _id, body, title }`,
            { slug }
        );

        if (!article || !article.body) {
            console.log('Article not found or body is empty.');
            return;
        }

        let newBody = [];
        let inRange = false;
        let removedCount = 0;

        for (const block of article.body) {
            if (block._key === startKey) {
                inRange = true;
            }
            if (!inRange) {
                newBody.push(block);
            } else {
                removedCount++;
            }
            if (block._key === endKey) {
                inRange = false;
            }
        }

        if (removedCount > 0) {
            await client
                .patch(article._id)
                .set({ body: newBody })
                .commit();
            console.log(`Removed ${removedCount} blocks from ${article.title} between ${startKey} and ${endKey}.`);
        } else {
            console.log(`No blocks removed in ${article.title}. Check startKey and endKey.`);
        }

    } catch (error) {
        console.error('Error removing section range:', error);
    }
}

const slug = process.argv[2];
const startKey = process.argv[3];
const endKey = process.argv[4];
removeSectionRange(slug, startKey, endKey);
