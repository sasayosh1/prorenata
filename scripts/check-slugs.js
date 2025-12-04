const { createClient } = require('@sanity/client');

const client = createClient({
    projectId: '72m8vhy2',
    dataset: 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
});

async function checkSlugs() {
    const query = `*[_type == "post" && title match "看護師" && title match "ルート"] {
        title,
        "slug": slug.current
    }`;
    const posts = await client.fetch(query);
    console.log('Found articles matching "看護師" and "ルート":');
    posts.forEach(post => {
        console.log(`- ${post.title} (${post.slug})`);
    });
}

checkSlugs();
