const { createClient } = require('@sanity/client');

const client = createClient({
    projectId: '72m8vhy2',
    dataset: 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
});

async function listAllSlugs() {
    const query = `*[_type == "post"] {
        title,
        "slug": slug.current
    }`;
    const posts = await client.fetch(query);
    console.log('All Articles:');
    posts.forEach(post => {
        console.log(`- ${post.title} (${post.slug})`);
    });
}

listAllSlugs();
