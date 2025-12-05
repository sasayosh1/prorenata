const { createClient } = require('@sanity/client');
const fs = require('fs');
const path = require('path');

// Initialize Sanity client
const client = createClient({
    projectId: '72m8vhy2',
    dataset: 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
});

const IMAGE_PATH = path.join(process.cwd(), 'public/images/thumbnails/sera_reference_thumbnail.png');
const TARGET_SLUG = 'nursing-assistant-resume-writing';

async function main() {
    try {
        console.log(`Uploading image from ${IMAGE_PATH}...`);

        if (!fs.existsSync(IMAGE_PATH)) {
            throw new Error(`Image file not found at ${IMAGE_PATH}`);
        }

        const imageBuffer = fs.readFileSync(IMAGE_PATH);
        const asset = await client.assets.upload('image', imageBuffer, {
            filename: 'sera_reference_thumbnail.png',
        });

        console.log(`Image uploaded successfully. Asset ID: ${asset._id}`);

        // Find the article ID
        const query = `*[_type == "post" && slug.current == $slug][0]._id`;
        const articleId = await client.fetch(query, { slug: TARGET_SLUG });

        if (!articleId) {
            throw new Error(`Article with slug "${TARGET_SLUG}" not found.`);
        }

        console.log(`Updating article ${articleId}...`);

        await client.patch(articleId)
            .set({
                mainImage: {
                    _type: 'image',
                    asset: {
                        _type: 'reference',
                        _ref: asset._id,
                    },
                    alt: '履歴書を書く白崎セラ',
                },
            })
            .commit();

        console.log('Article updated successfully!');

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

main();
