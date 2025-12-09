require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')
const fs = require('fs')
const path = require('path')

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false
})

const SAMPLE_SLUGS = [
    'nursing-assistant-compare-services-perspective', // Career/Job Change
    'nursing-assistant-daily-schedule', // Daily Work
    'nursing-assistant-mental-care-stress' // Emotional Support
]

async function main() {
    console.log('📥 Fetching sample articles...\n');

    const outputDir = path.join(__dirname, '../samples');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    for (const slug of SAMPLE_SLUGS) {
        console.log(`Fetching: ${slug}`);

        const article = await client.fetch(
            `*[_type == "post" && slug.current == $slug && !(_id in path("drafts.**"))][0] {
                _id,
                title,
                "slug": slug.current,
                description,
                body
            }`,
            { slug }
        );

        if (!article) {
            console.log(`  ❌ Not found\n`);
            continue;
        }

        // Save to file
        const filename = path.join(outputDir, `${slug}.json`);
        fs.writeFileSync(filename, JSON.stringify(article, null, 2), 'utf8');

        console.log(`  ✅ Saved to ${filename}`);
        console.log(`  Title: ${article.title}`);
        console.log(`  Body blocks: ${article.body ? article.body.length : 0}\n`);
    }

    console.log('='.repeat(60));
    console.log('✅ All sample articles fetched');
    console.log(`📁 Saved to: ${outputDir}`);
}

main().catch(console.error);
