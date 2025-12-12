require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const { createClient } = require('@sanity/client');

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
});

async function removeSpecificInternalLink(slug, targetHref) {
    if (!slug || !targetHref) {
        console.error('Error: Slug and targetHref are required.');
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

        let newBody = JSON.parse(JSON.stringify(article.body)); // Deep copy to avoid mutation issues
        let linkRemoved = false;

        for (let i = 0; i < newBody.length; i++) {
            const block = newBody[i];
            if (block.markDefs) {
                const originalMarkDefsLength = block.markDefs.length;
                block.markDefs = block.markDefs.filter(def => {
                    if (def._type === 'link' && def.href === targetHref) {
                        linkRemoved = true;
                        return false;
                    }
                    return true;
                });
                // If a markDef was removed, also clean up children marks pointing to it
                if (linkRemoved && originalMarkDefsLength > block.markDefs.length) {
                    const removedKey = article.body[i].markDefs.find(def => def.href === targetHref)?._key;
                    if (removedKey && block.children) {
                        block.children.forEach(child => {
                            if (child.marks) {
                                child.marks = child.marks.filter(mark => mark !== removedKey);
                            }
                        });
                    }
                }
            }
        }

        if (linkRemoved) {
            await client
                .patch(article._id)
                .set({ body: newBody })
                .commit();
            console.log(`Removed internal link with href "${targetHref}" from ${article.title}.`);
        } else {
            console.log(`Internal link with href "${targetHref}" not found in ${article.title}. No changes made.`);
        }

    } catch (error) {
        console.error('Error removing internal link:', error);
    }
}

const slug = process.argv[2];
const targetHref = process.argv[3];
removeSpecificInternalLink(slug, targetHref);
