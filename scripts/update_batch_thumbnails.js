const { createClient } = require('next-sanity');
const fs = require('fs');
const path = require('path');

const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN;
if (!token) {
    console.error('Error: SANITY_WRITE_TOKEN or SANITY_API_TOKEN is required.');
    process.exit(1);
}
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

const UPDATES = [
    {
        slug: 'nursing-assistant-terminology-guide',
        imagePath: '/Users/sasakiyoshimasa/prorenata/AI画像生成/sera_terminology_watercolor_16x9.png'
    },
    {
        slug: 'nursing-assistant-care-guide-toolbox', // Care Beauty (Using Job Change image)
        imagePath: '/Users/sasakiyoshimasa/prorenata/AI画像生成/sera_job_change_watercolor_16x9.png'
    },
    {
        slug: 'nursing-assistant-salary-update-career', // Salary Guide
        imagePath: '/Users/sasakiyoshimasa/prorenata/AI画像生成/sera_salary_watercolor_16x9.png'
    },
    {
        slug: 'nursing-scholarship-interest-risk', // Scholarship (Corrected slug)
        imagePath: '/Users/sasakiyoshimasa/prorenata/AI画像生成/sera_scholarship_watercolor_16x9.png'
    },
    {
        slug: 'nursing-assistant-recommended-shoes', // Shoes (Corrected slug)
        imagePath: '/Users/sasakiyoshimasa/prorenata/AI画像生成/sera_shoes_watercolor_16x9.png'
    },
    {
        slug: 'nursing-assistant-job-role-patient', // Outpatient (Corrected slug)
        imagePath: '/Users/sasakiyoshimasa/prorenata/AI画像生成/sera_outpatient_watercolor_16x9.png'
    }
];

async function updatePost(item) {
    try {
        console.log(`\nProcessing ${item.slug}...`);

        // 1. Find the post
        const query = `*[_type == "post" && slug.current == $slug][0]._id`;
        const postId = await client.fetch(query, { slug: item.slug });

        if (!postId) {
            console.error(`Post not found for slug: ${item.slug}`);
            return;
        }
        console.log(`Found post ID: ${postId}`);

        // 2. Upload image
        if (!fs.existsSync(item.imagePath)) {
            console.error(`Image file not found: ${item.imagePath}`);
            return;
        }

        const fileStream = fs.createReadStream(item.imagePath);
        const imageAsset = await client.assets.upload('image', fileStream, {
            filename: path.basename(item.imagePath),
        });
        console.log(`Uploaded image asset ID: ${imageAsset._id}`);

        // 3. Patch post
        await client.patch(postId).set({
            mainImage: {
                _type: 'image',
                asset: {
                    _type: 'reference',
                    _ref: imageAsset._id
                }
            }
        }).commit();

        console.log(`Successfully updated ${item.slug}!`);

    } catch (error) {
        console.error(`Error updating ${item.slug}:`, error.message);
    }
}

async function main() {
    console.log('Starting batch update of thumbnails...');
    for (const item of UPDATES) {
        await updatePost(item);
    }
    console.log('\nBatch update completed.');
}

main();
