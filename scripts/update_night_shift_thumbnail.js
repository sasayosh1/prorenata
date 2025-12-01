const { createClient } = require('next-sanity');
const fs = require('fs');
const path = require('path');

// Hardcoded token from user rules as fallback
const token = process.env.SANITY_API_TOKEN || 'skCHyaNwM7IJU5RSAkrE3ZGFEYVcXx3lJzbKIz0a8HNUJmTwHRn1phhfsAYXZSeAVeWo2ogJj0COIwousCyb2MLGPwyxe4FuDbDETY2xz5hkjuUIcdz6YcubOZ5SfRywxB2Js8r4vKtbOmlbLm1pXJyHl0Kgajis2MgxilYSTpkEYe6GGWEu';
const projectId = '72m8vhy2';
const dataset = 'production';
const apiVersion = '2024-01-01';

const client = createClient({
    projectId,
    dataset,
    apiVersion,
    token,
    useCdn: false,
});

const TARGET_SLUG = 'nursing-assistant-night-shift-journey';
const IMAGE_PATH = '/Users/sasakiyoshimasa/prorenata/AI画像生成/sera_night_shift_16x9.png';

async function main() {
    try {
        // 1. Find the post
        console.log(`Finding post with slug: ${TARGET_SLUG}...`);
        const query = `*[_type == "post" && slug.current == $slug][0]._id`;
        const postId = await client.fetch(query, { slug: TARGET_SLUG });

        if (!postId) {
            console.error('Post not found!');
            process.exit(1);
        }
        console.log(`Found post ID: ${postId}`);

        // 2. Upload image
        console.log(`Uploading image from: ${IMAGE_PATH}...`);
        if (!fs.existsSync(IMAGE_PATH)) {
            console.error('Image file not found!');
            process.exit(1);
        }

        const fileStream = fs.createReadStream(IMAGE_PATH);
        const imageAsset = await client.assets.upload('image', fileStream, {
            filename: path.basename(IMAGE_PATH),
        });
        console.log(`Uploaded image asset ID: ${imageAsset._id}`);

        // 3. Patch post
        console.log('Updating post...');
        await client.patch(postId).set({
            mainImage: {
                _type: 'image',
                asset: {
                    _type: 'reference',
                    _ref: imageAsset._id
                }
            }
        }).commit();

        console.log('Successfully updated post with new thumbnail!');

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main();
