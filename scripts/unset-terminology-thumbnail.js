const { createClient } = require('next-sanity');

const token = process.env.SANITY_API_TOKEN;
const projectId = '72m8vhy2';
const dataset = 'production';
const apiVersion = '2024-01-01';

if (!token) {
    console.error('SANITY_API_TOKEN is missing');
    process.exit(1);
}

const client = createClient({
    projectId,
    dataset,
    apiVersion,
    token,
    useCdn: false,
});

const TARGET_SLUG = 'nursing-assistant-terminology-guide';

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

        // 2. Unset mainImage
        console.log('Unsetting mainImage...');
        await client.patch(postId).unset(['mainImage']).commit();

        console.log('Successfully removed thumbnail/mainImage from post!');

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main();
