const { createClient } = require('@sanity/client');
const fs = require('fs');
const path = require('path');

const client = createClient({
    projectId: '72m8vhy2',
    dataset: 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
});

async function uploadThumbnail() {
    const slug = 'nursing-assistant-become-nurse-guide';
    const imagePath = '/Users/sasakiyoshimasa/.gemini/antigravity/brain/b86dfdac-67ce-47ae-99ea-a801e0d43c9c/become_nurse_thumbnail_v3_1764808163556.png';

    try {
        console.log(`Uploading thumbnail for ${slug}...`);

        if (!fs.existsSync(imagePath)) {
            console.error(`File not found: ${imagePath}`);
            return;
        }

        const fileStream = fs.createReadStream(imagePath);
        const asset = await client.assets.upload('image', fileStream, {
            filename: path.basename(imagePath)
        });

        console.log(`Uploaded asset: ${asset._id}`);

        const article = await client.fetch(`*[_type == "post" && slug.current == $slug][0]`, { slug });

        if (!article) {
            console.error('Article not found');
            return;
        }

        await client.patch(article._id)
            .set({
                mainImage: {
                    _type: 'image',
                    asset: {
                        _type: 'reference',
                        _ref: asset._id
                    },
                    alt: '勉強する看護助手'
                }
            })
            .commit();

        console.log('✅ Successfully updated mainImage');

    } catch (error) {
        console.error('Error:', error.message);
    }
}

uploadThumbnail();
