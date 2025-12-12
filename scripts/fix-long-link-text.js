require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const { createClient } = require('@sanity/client');

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
});

async function fixLongLinkText(slug, oldText, newText, targetHref) {
    if (!slug || !oldText || !newText || !targetHref) {
        console.error('Error: Slug, oldText, newText, and targetHref are required.');
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

        let newBody = JSON.parse(JSON.stringify(article.body)); // Deep copy
        let changed = false;

        for (const block of newBody) {
            if (block.markDefs) {
                for (const markDef of block.markDefs) {
                    if (markDef._type === 'link' && markDef.href === targetHref) {
                        if (block.children) {
                            for (const child of block.children) {
                                if (child.marks && child.marks.includes(markDef._key) && child.text === oldText) {
                                    child.text = newText;
                                    changed = true;
                                }
                            }
                        }
                    }
                }
            }
        }

        if (changed) {
            await client
                .patch(article._id)
                .set({ body: newBody })
                .commit();
            console.log(`Updated link text in ${article.title}.`);
        } else {
            console.log(`Link with text "${oldText}" and href "${targetHref}" not found or not matching in ${article.title}. No changes made.`);
        }

    } catch (error) {
        console.error('Error fixing long link text:', error);
    }
}

const slug = process.argv[2];
const oldText = process.argv[3];
const newText = process.argv[4];
const targetHref = process.argv[5];

fixLongLinkText(slug, oldText, newText, targetHref);
