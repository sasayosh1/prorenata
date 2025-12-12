require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const { createClient } = require('@sanity/client');

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
});

async function removeDisclaimerExtraContent(slug) {
    if (!slug) {
        console.error('Error: Slug is required.');
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

        const body = article.body;
        const disclaimerIndex = body.findIndex(block =>
            block._type === 'block' &&
            block.children &&
            block.children.some(child =>
                child.text && (
                    child.text.includes('免責事項')
                )
            )
        );

        if (disclaimerIndex === -1) {
            console.log(`No disclaimer found in ${article.title}. No changes made.`);
            return;
        }

        const newBody = body.slice(0, disclaimerIndex + 1);
        
        if (newBody.length < body.length) {
            await client
                .patch(article._id)
                .set({ body: newBody })
                .commit();
            console.log(`Removed content after disclaimer in ${article.title}.`);
        } else {
            console.log(`No extra content found after disclaimer in ${article.title}. No changes made.`);
        }

    } catch (error) {
        console.error('Error removing extra content:', error);
    }
}

const slug = process.argv[2];
removeDisclaimerExtraContent(slug);
