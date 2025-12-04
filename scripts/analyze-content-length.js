const { createClient } = require('@sanity/client');

const client = createClient({
    projectId: '72m8vhy2',
    dataset: 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
});

async function analyzeContentLength() {
    console.log('=== Analyzing Content Length ===\n');

    // Fetch all posts with their body
    const posts = await client.fetch(`
        *[_type == "post"] {
            title,
            slug,
            body,
            "charCount": length(pt::text(body))
        } | order(charCount asc)
    `);

    const thinContent = posts.filter(p => p.charCount < 1500);

    console.log(`Total Articles: ${posts.length}`);
    console.log(`Thin Content (< 1500 chars): ${thinContent.length}\n`);

    console.log('--- Top 20 Thin Articles ---');
    thinContent.slice(0, 20).forEach(p => {
        console.log(`${p.charCount} chars: ${p.title} (${p.slug.current})`);
    });
}

analyzeContentLength();
