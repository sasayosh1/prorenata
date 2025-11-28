const { createClient } = require('next-sanity');

const client = createClient({
    projectId: '72m8vhy2',
    dataset: 'production',
    apiVersion: '2024-01-01',
    useCdn: false,
    token: process.env.SANITY_API_TOKEN
});

async function main() {
    try {
        // Fetch top 10 articles by views
        const query = `*[_type == "post"] | order(views desc) [0...10] {
            _id,
            title,
            "slug": slug.current,
            views,
            "hasImage": defined(mainImage)
        }`;

        const posts = await client.fetch(query);

        console.log('Top 10 Articles by Views:');
        posts.forEach((post, index) => {
            console.log(`${index + 1}. [${post.views || 0} views] ${post.title} (Has Image: ${post.hasImage})`);
            console.log(`   Slug: ${post.slug}`);
            console.log(`   ID: ${post._id}`);
            console.log('---');
        });

    } catch (error) {
        console.error('Error fetching posts:', error);
    }
}

main();
