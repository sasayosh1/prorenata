const { createClient } = require('@sanity/client');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

async function testConnection() {
    console.log("Env check:");
    console.log("- Project ID:", process.env.NEXT_PUBLIC_SANITY_PROJECT_ID);
    console.log("- Token starts with:", process.env.SANITY_API_TOKEN ? process.env.SANITY_API_TOKEN.substring(0, 10) + "..." : "MISSING");

    const client = createClient({
        projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
        dataset: 'production',
        apiVersion: '2024-01-01',
        token: process.env.SANITY_API_TOKEN,
        useCdn: false
    });

    try {
        const posts = await client.fetch('*[_type == "post"][0...3]{ _id, title }');
        console.log("\nSuccess! Found posts:");
        posts.forEach(p => console.log(`- ${p.title}`));
    } catch (err) {
        console.error("\nConnection failed:");
        console.error(err);
    }
}

testConnection();
