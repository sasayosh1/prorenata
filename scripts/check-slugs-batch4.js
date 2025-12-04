const { createClient } = require('@sanity/client');

const client = createClient({
    projectId: '72m8vhy2',
    dataset: 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
});

async function checkSlugs() {
    const keywords = [
        'コミュニケーション',
        '夜勤',
        '資格',
        '転職'
    ];

    console.log('Searching for articles matching keywords:');

    for (const keyword of keywords) {
        const query = `*[_type == "post" && title match "${keyword}"] {
            title,
            "slug": slug.current
        }`;
        const posts = await client.fetch(query);
        console.log(`\nKeyword: "${keyword}"`);
        posts.forEach(post => {
            console.log(`- ${post.title} (${post.slug})`);
        });
    }
}

checkSlugs();
