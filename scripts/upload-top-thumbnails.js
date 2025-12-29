const { createClient } = require('next-sanity');
const fs = require('fs');
const path = require('path');
const { inboxDir } = require('./utils/antigravityPaths.cjs');

const client = createClient({
    projectId: '72m8vhy2',
    dataset: 'production',
    apiVersion: '2024-01-01',
    useCdn: false,
    token: process.env.SANITY_API_TOKEN
});

const INBOX_THUMBNAILS_DIR = inboxDir('prorenata', 'thumbnails');

const UPDATES = [
    {
        slug: 'nursing-assistant-recommended-shoes',
        imagePath: path.join(INBOX_THUMBNAILS_DIR, 'nursing-assistant-recommended-shoes_1200x630.png')
    },
    {
        slug: 'nursing-assistant-terminology-guide',
        imagePath: path.join(INBOX_THUMBNAILS_DIR, 'nursing-assistant-types_1200x630.png')
    },
    {
        slug: 'nursing-assistant-salary-update-career',
        imagePath: path.join(INBOX_THUMBNAILS_DIR, 'salary_career_1200x630.png')
    },
    {
        slug: 'nursing-scholarship-interest-risk',
        imagePath: path.join(INBOX_THUMBNAILS_DIR, 'scholarship_1200x630.png')
    },
    {
        slug: 'nursing-assistant-job-role-patient',
        imagePath: path.join(INBOX_THUMBNAILS_DIR, 'job_options_1200x630.png')
    }
];

async function main() {
    for (const update of UPDATES) {
        console.log(`Processing ${update.slug}...`);

        try {
            // 1. Find the post
            const post = await client.fetch(`*[_type == "post" && slug.current == $slug][0]{_id, title}`, { slug: update.slug });

            if (!post) {
                console.error(`Post not found: ${update.slug}`);
                continue;
            }
            console.log(`Found post: ${post.title} (${post._id})`);

            // 2. Upload image
            if (!fs.existsSync(update.imagePath)) {
                console.error(`Image file not found: ${update.imagePath}`);
                continue;
            }

            const fileStream = fs.createReadStream(update.imagePath);
            console.log('Uploading image...');
            const imageAsset = await client.assets.upload('image', fileStream, {
                filename: path.basename(update.imagePath)
            });
            console.log(`Image uploaded: ${imageAsset._id}`);

            // 3. Patch the post
            console.log('Updating post...');
            await client.patch(post._id)
                .set({
                    mainImage: {
                        _type: 'image',
                        asset: {
                            _type: 'reference',
                            _ref: imageAsset._id
                        }
                    }
                })
                .commit();
            console.log('Post updated successfully!\n');

        } catch (error) {
            console.error(`Error processing ${update.slug}:`, error);
        }
    }
}

main();
