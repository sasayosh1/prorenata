require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const { createClient } = require('@sanity/client');
const { createBackup } = require('./backup-utility');

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
});

async function replacePronoun(slug, oldPronoun, newPronoun) {
    if (!slug || !oldPronoun || !newPronoun) {
        console.error('Error: Slug, oldPronoun, and newPronoun are required.');
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
            if (block.children) {
                for (const child of block.children) {
                    if (child.text && child.text.includes(oldPronoun)) {
                        child.text = child.text.replace(new RegExp(oldPronoun, 'g'), newPronoun);
                        changed = true;
                    }
                }
            }
        }

        if (changed) {
            await createBackup(article._id, 'replace-pronoun');
            await client
                .patch(article._id)
                .set({ body: newBody })
                .commit();
            console.log(`Replaced pronoun in ${article.title}.`);
        } else {
            console.log(`Pronoun "${oldPronoun}" not found in ${article.title}. No changes made.`);
        }

    } catch (error) {
        console.error('Error replacing pronoun:', error);
    }
}

const slug = process.argv[2];
const oldPronoun = process.argv[3];
const newPronoun = process.argv[4];

replacePronoun(slug, oldPronoun, newPronoun);
