const { createClient } = require('next-sanity');

const client = createClient({
    projectId: '72m8vhy2',
    dataset: 'production',
    apiVersion: '2024-01-01',
    useCdn: false,
});

async function main() {
    const query = `*[_type == "post" && title match "*夜勤明け*"] {
        title,
        "slug": slug.current
    }`

    try {
        const posts = await client.fetch(query);
        console.log(JSON.stringify(posts, null, 2));
    } catch (error) {
        console.error('Error fetching posts:', error);
    }
}

main();
