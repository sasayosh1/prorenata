const { createClient } = require('@sanity/client');

const client = createClient({
    projectId: 'aoxze287', // Toyama Blog Project ID
    dataset: 'production',
    apiVersion: '2024-01-01',
    useCdn: false,
    token: process.env.TOYAMA_SANITY_TOKEN
});

const SLUGS = [
    'toyama-city-cake-station',
    'toyama-city-50',
    'himi-city-onsen'
];

async function verifySlugs() {
    console.log('Verifying slugs...');
    for (const slug of SLUGS) {
        const query = `*[_type == "post" && slug.current == "${slug}"][0]{_id, title, slug}`;
        const doc = await client.fetch(query);
        if (doc) {
            console.log(`✅ Found: ${slug} (${doc.title})`);
        } else {
            console.error(`❌ Not Found: ${slug}`);
        }
    }
}

verifySlugs();
