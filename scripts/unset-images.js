const { createClient } = require('next-sanity');

const client = createClient({
    projectId: '72m8vhy2',
    dataset: 'production',
    apiVersion: '2024-01-01',
    useCdn: false,
    token: process.env.SANITY_API_TOKEN
});

const SLUGS = [
    'nursing-assistant-recommended-shoes',
    'nursing-assistant-terminology-guide',
    'nursing-assistant-salary-update-career',
    'nursing-scholarship-interest-risk',
    'nursing-assistant-job-role-patient'
];

async function main() {
    for (const slug of SLUGS) {
        console.log(`Unsetting image for ${slug}...`);
        try {
            const post = await client.fetch(`*[_type == "post" && slug.current == $slug][0]{_id, title}`, { slug });
            if (post) {
                await client.patch(post._id).unset(['mainImage']).commit();
                console.log(`Unset image for ${post.title} (${post._id})`);
            } else {
                console.log(`Post not found: ${slug}`);
            }
        } catch (error) {
            console.error(`Error processing ${slug}:`, error.message);
        }
    }
}

main();
