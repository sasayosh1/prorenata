const { createClient } = require('@sanity/client');

const client = createClient({
    projectId: 'aoxze287',
    dataset: 'production',
    apiVersion: '2024-01-01',
    useCdn: false,
    token: process.env.TOYAMA_SANITY_TOKEN
});

async function findArticles() {
    console.log('Searching for articles...');

    // Search for titles containing keywords
    const keywords = ['シャルロッテ', 'ふわどら', 'ひみのはな'];

    for (const keyword of keywords) {
        const query = `*[_type == "post" && title match "*${keyword}*"]{_id, title, slug}`;
        const docs = await client.fetch(query);

        console.log(`\n--- Results for "${keyword}" ---`);
        if (docs.length > 0) {
            docs.forEach(doc => {
                console.log(`Title: ${doc.title}`);
                console.log(`Slug: ${doc.slug.current}`);
                console.log(`ID: ${doc._id}`);
            });
        } else {
            console.log('No matches found.');
        }
    }
}

findArticles();
