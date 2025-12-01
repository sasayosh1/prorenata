const { createClient } = require('next-sanity');
const fs = require('fs');
const path = require('path');

const client = createClient({
    projectId: '72m8vhy2',
    dataset: 'production',
    apiVersion: '2024-01-01',
    useCdn: false,
    token: process.env.SANITY_API_TOKEN
});

async function main() {
    const slug = 'nursing-assistant-resignation-advice-workplace';
    const imagePath = '/Users/sasakiyoshimasa/.gemini/antigravity/brain/d4deae55-fb9e-4548-bdc1-774c4b911355/sera_resignation_v2_1764549607859.png';

    console.log(`Processing ${slug}...`);

    try {
        // 1. Find the post
        const post = await client.fetch(`*[_type == "post" && slug.current == $slug][0]{_id, title}`, { slug });

        if (!post) {
            console.error(`Post not found: ${slug}`);
            return;
        }
        console.log(`Found post: ${post.title} (${post._id})`);

        // 2. Upload image
        if (!fs.existsSync(imagePath)) {
            console.error(`Image file not found: ${imagePath}`);
            return;
        }

        const fileStream = fs.createReadStream(imagePath);
        console.log('Uploading new image...');
        const imageAsset = await client.assets.upload('image', fileStream, {
            filename: 'sera_resignation_v2.png'
        });
        console.log(`Image uploaded: ${imageAsset._id}`);

        // 3. Patch the post - set both mainImage (thumbnail) and topImage
        console.log('Updating post...');
        await client.patch(post._id)
            .set({
                mainImage: {
                    _type: 'image',
                    asset: {
                        _type: 'reference',
                        _ref: imageAsset._id
                    }
                },
                topImage: {
                    _type: 'image',
                    asset: {
                        _type: 'reference',
                        _ref: imageAsset._id
                    }
                }
            })
            .commit();
        console.log('Post updated successfully with new image!');

    } catch (error) {
        console.error(`Error processing ${slug}:`, error);
    }
}

main();
