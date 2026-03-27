const fs = require('fs');
const path = require('path');
const { createClient } = require('@sanity/client');
const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = require('dotenv').parse(fs.readFileSync(envPath));

function getClient() {
    return createClient({
        projectId: (envConfig.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2').trim(),
        dataset: 'production',
        apiVersion: '2024-01-01',
        token: (envConfig.SANITY_API_TOKEN || '').trim(),
        useCdn: false
    });
}

const client = getClient();

async function checkSlugs() {
    const posts = await client.fetch(`*[_type == "post"]{ "slug": slug.current, title }`);
    console.log("Current Sanity Slugs:");
    posts.forEach(p => console.log(`- ${p.slug}: ${p.title}`));
}

checkSlugs().catch(console.error);
