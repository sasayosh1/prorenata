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
    console.log('🔍 Searching for articles mentioning "ヒューマンライフケア"...\n');

    // Fetch all posts
    const posts = await client.fetch(`*[_type == "post"] {
        title,
        "slug": slug.current,
        body
    }`);

    let foundCount = 0;

    for (const post of posts) {
        if (!post.body || !Array.isArray(post.body)) continue;

        const bodyString = JSON.stringify(post.body);
        if (bodyString.includes('ヒューマンライフケア')) {
            foundCount++;
            console.log(`\n📄 Article: ${post.title}`);
            console.log(`   Slug: ${post.slug}`);
            console.log(`   URL: https://prorenata.jp/posts/${post.slug}`);

            console.log('   🔗 Links found in this article:');

            post.body.forEach(block => {
                if (block.markDefs && Array.isArray(block.markDefs)) {
                    block.markDefs.forEach(def => {
                        if (def._type === 'link' && def.href) {
                            // Find the text for this link
                            const linkChild = block.children.find(c => c.marks && c.marks.includes(def._key));
                            const text = linkChild ? linkChild.text : '(no text)';

                            console.log(`      - Text: "${text}"`);
                            console.log(`        URL: ${def.href}`);
                        }
                    });
                }
            });
        }
    }

    console.log(`\nFound ${foundCount} articles.`);
}

main().catch(console.error);
