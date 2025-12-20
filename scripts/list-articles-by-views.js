const { createClient } = require('@sanity/client');

const client = createClient({
    projectId: 'souya3c9w',
    dataset: 'production',
    apiVersion: '2024-01-01',
    useCdn: false,
    token: process.env.SANITY_API_TOKEN
});

async function listArticlesByViews() {
    try {
        const posts = await client.fetch(`
      *[_type == "post"] | order(views desc) [0...50] {
        title,
        "slug": slug.current,
        views,
        "bodyText": pt::text(body)
      }
    `);

        console.log("Top articles by views:\n");
        posts.forEach((post, index) => {
            const views = post.views || 0;
            const hasContent = post.bodyText && post.bodyText.length > 100;
            console.log(`${index + 1}. ${post.title}`);
            console.log(`   Slug: ${post.slug}`);
            console.log(`   Views: ${views}`);
            console.log(`   Status: ${hasContent ? '✓ Has content' : '✗ No content'}`);
            console.log('');
        });

        return posts;
    } catch (error) {
        console.error('Error fetching articles:', error);
        process.exit(1);
    }
}

listArticlesByViews();
