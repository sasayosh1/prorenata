require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false
})

async function main() {
    console.log('🔍 Checking for articles updated during maintenance window...\n');

    // The maintenance ran around 2025-12-05T18:31 UTC (03:31 JST)
    // Let's check for updates between 18:00 and 20:00 UTC
    const startTime = '2025-12-05T18:00:00Z';
    const endTime = '2025-12-05T20:00:00Z';

    const posts = await client.fetch(`*[_type == "post" && _updatedAt >= $start && _updatedAt <= $end] {
        _id,
        title,
        "slug": slug.current,
        _updatedAt,
        body
    } | order(_updatedAt desc)`, { start: startTime, end: endTime });

    console.log(`Found ${posts.length} articles updated during maintenance window\n`);

    if (posts.length === 0) {
        console.log('✅ No articles found in this time range.');
        return;
    }

    // Check each for potential issues
    let issueCount = 0;
    posts.forEach(post => {
        const bodyLength = post.body ? post.body.length : 0;
        const isDraft = post._id.startsWith('drafts.');

        console.log(`${isDraft ? '📝' : '📄'} [${post._updatedAt}] ${post.title}`);
        console.log(`   ID: ${post._id}`);
        console.log(`   Slug: ${post.slug}`);
        console.log(`   Body Length: ${bodyLength}`);

        if (isDraft) {
            console.log(`   ⚠️  This is a DRAFT`);
            issueCount++;
        }
        console.log('');
    });

    console.log('='.repeat(60));
    console.log(`Total articles: ${posts.length}`);
    console.log(`Drafts found: ${issueCount}`);
    console.log('='.repeat(60));
}

main().catch(console.error);
