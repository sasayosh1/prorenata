require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const { createClient } = require('@sanity/client');

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
});

async function removeSections(slug, sectionText) {
    if (!slug || !sectionText) {
        console.error('Error: Slug and section text are required.');
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

        let newBody = [...article.body];
        let removedCount = 0;

        // Remove all occurrences of the specified section
        newBody = newBody.filter(block => {
            if (block._type === 'block' && block.children && block.children.some(child => child.text.includes(sectionText))) {
                removedCount++;
                return false;
            }
            return true;
        });

        if (removedCount > 0) {
            await client
                .patch(article._id)
                .set({ body: newBody })
                .commit();
            console.log(`Removed ${removedCount} instances of "${sectionText}" from ${article.title}.`);
        } else {
            console.log(`"${sectionText}" not found in ${article.title}. No changes made.`);
        }

    } catch (error) {
        console.error('Error removing sections:', error);
    }
}

const slug = process.argv[2];
const sectionText = process.argv[3];
removeSections(slug, sectionText);
