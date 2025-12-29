const { createClient } = require('next-sanity');
const fs = require('fs');
const path = require('path');
const { inboxDir } = require('./utils/antigravityPaths.cjs');

const client = createClient({
    projectId: '72m8vhy2',
    dataset: 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN, // Needs token for write access
    useCdn: false,
});

// Map of Post ID (or order) to Image Path
// Updated to use generated combined images (v2) for unique anime style
// 1. Shoes (9f6xTbJiqM1HBxBrXolcZm) -> mixed_shoes_thumbnail_v2
// 2. Guide (f3bbd9d1...) -> mixed_guide_thumbnail_v2
// 3. Scholarship (SzUxrrzdcuBDmahbHkaQ1w) -> mixed_scholarship_thumbnail_v2
// 4. Communication (577431d4...) -> mixed_communication_thumbnail_v2
// 5. Roles (xTfm06TmDEW5bLJjXjBzkL) -> mixed_roles_thumbnail_v2
// 6. Recruitment (fc67aa26...) -> mixed_recruitment_thumbnail_v2

const INBOX_IMAGES_DIR = inboxDir('prorenata', 'images');

const MAPPING = [
    {
        postId: '9f6xTbJiqM1HBxBrXolcZm', // Shoes
        imagePath: path.join(INBOX_IMAGES_DIR, 'sera_shoes_existing_1024x576.png')
    },
    // {
    //     postId: 'f3bbd9d1-a011-42d8-80b4-42a76196f147', // Guide / Types
    //     imagePath: '/Users/sasakiyoshimasa/prorenata/processed_images/sera_guide_1200x630.png'
    // },
    // {
    //     postId: 'SzUxrrzdcuBDmahbHkaQ1w', // Scholarship
    //     imagePath: '/Users/sasakiyoshimasa/prorenata/processed_images/sera_scholarship_1200x630.png'
    // },
    // {
    //     postId: '577431d4-a38e-40be-895d-02aed4de68ea', // Communication
    //     imagePath: '/Users/sasakiyoshimasa/prorenata/processed_images/sera_communication_1200x630.png' 
    // },
    // {
    //     postId: 'xTfm06TmDEW5bLJjXjBzkL', // Roles / Nurse Elderly
    //     imagePath: '/Users/sasakiyoshimasa/prorenata/processed_images/sera_roles_1200x630.png'
    // },
    // {
    //     postId: 'fc67aa26-02eb-4655-8af7-b904d6c1c01e', // Recruitment / Salary
    //     imagePath: '/Users/sasakiyoshimasa/prorenata/processed_images/sera_recruitment_1200x630.png'
    // }
];

async function uploadImage(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            console.error(`File not found: ${filePath}`);
            return null;
        }
        const fileStream = fs.createReadStream(filePath);
        const doc = await client.assets.upload('image', fileStream, {
            filename: path.basename(filePath),
        });
        console.log(`Uploaded image: ${doc._id}`);
        return doc._id;
    } catch (error) {
        console.error(`Upload failed for ${filePath}:`, error);
        return null;
    }
}

async function updatePost(postId, imageAssetId) {
    try {
        const patch = client.patch(postId).set({
            mainImage: {
                _type: 'image',
                asset: {
                    _type: 'reference',
                    _ref: imageAssetId
                }
            }
        });
        const result = await patch.commit();
        console.log(`Updated post ${postId}`);
        return result;
    } catch (error) {
        console.error(`Update failed for post ${postId}:`, error);
    }
}

async function main() {
    for (const item of MAPPING) {
        console.log(`Processing post ${item.postId}...`);
        const assetId = await uploadImage(item.imagePath);
        if (assetId) {
            await updatePost(item.postId, assetId);
        }
    }
    console.log('Done!');
}

main();
