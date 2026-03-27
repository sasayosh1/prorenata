const { createClient } = require('@sanity/client');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const client = createClient({
    projectId: '72m8vhy2',
    dataset: 'production',
    apiVersion: '2024-01-01',
    token: envConfig.SANITY_API_TOKEN.trim(),
    useCdn: false
});

async function findSlugs() {
    const keywords = ['辞めたい', '面接', '履歴書', 'ロードマップ'];
    console.log("Searching for articles with keywords:", keywords);
    
    const posts = await client.fetch(`*[_type == "post" && (title match "*辞めたい*" || title match "*面接*" || title match "*履歴書*" || title match "*ロードマップ*")]{ title, "slug": slug.current }`);
    
    posts.forEach(p => {
        console.log(`- Title: "${p.title}" | Slug: "${p.slug}"`);
    });
}

findSlugs().catch(console.error);
