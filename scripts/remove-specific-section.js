require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const { createClient } = require('@sanity/client');

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
});

async function removeSpecificSection(slug, targetKey) {
    if (!slug || !targetKey) {
        console.error('Error: Slug and targetKey are required.');
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

        let newBody = article.body.filter(block => block._key !== targetKey);
        
        if (newBody.length < article.body.length) {
            await client
                .patch(article._id)
                .set({ body: newBody })
                .commit();
            console.log(`Removed section with key "${targetKey}" from ${article.title}.`);
        } else {
            console.log(`Section with key "${targetKey}" not found in ${article.title}. No changes made.`);
        }

    } catch (error) {
        console.error('Error removing section:', error);
    }
}

const slug = process.argv[2];
const targetKey = process.argv[3];
removeSpecificSection(slug, targetKey);
