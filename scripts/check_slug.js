const { createClient } = require('@sanity/client');
require('dotenv').config({ path: '.env.local' });

const client = createClient({
    projectId: process.env.SANITY_PROJECT_ID,
    dataset: process.env.SANITY_DATASET,
    useCdn: false,
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
});

async function main() {
    const query = `*[_type == "post" && _id == "drafts.ef93122b-fb7d-4438-84e0-d3e92a7e797a"][0]{title, slug}`;
    const doc = await client.fetch(query);
    console.log('Title:', doc.title);
    console.log('Slug:', doc.slug.current);
}

main().catch(console.error);
