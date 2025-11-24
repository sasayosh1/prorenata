const { createClient } = require('next-sanity');

const client = createClient({
    projectId: '72m8vhy2',
    dataset: 'production',
    apiVersion: '2024-01-01',
    useCdn: false,
});

async function main() {
    const query = `*[_type == "post"] | order(publishedAt desc)[0...6] {
    _id,
    title,
    "hasImage": defined(mainImage)
  }`;

    try {
        const posts = await client.fetch(query);
        console.log(JSON.stringify(posts, null, 2));
    } catch (error) {
        console.error('Error fetching posts:', error);
    }
}

main();
