const { createClient } = require('@sanity/client');

const client = createClient({
    projectId: '72m8vhy2',
    dataset: 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
});

const AFFECTED_SLUGS = [
    'nursing-assistant-operating-room-duties',
    'nursing-assistant-bottom-myth',
    'nursing-assistant-patient-transfer-safety'
];

async function fixArticle(slug) {
    console.log(`\nProcessing: ${slug}...`);

    const query = `*[_type == "post" && slug.current == "${slug}"][0] { _id, body, title }`;
    const post = await client.fetch(query);

    if (!post) {
        console.error(`  ❌ Post not found`);
        return;
    }

    console.log(`  Title: ${post.title}`);
    console.log(`  Total blocks: ${post.body.length}`);

    // Find disclaimer - look for the actual disclaimer text pattern
    let disclaimerIndex = -1;
    for (let i = post.body.length - 1; i >= 0; i--) {
        const block = post.body[i];
        if (block._type === 'block' && block.children) {
            const text = block.children.map(c => c.text || '').join('');

            // Look for disclaimer patterns
            if (text.includes('参考資料') ||
                text.includes('厚生労働省') ||
                text.includes('職業情報提供サイト') ||
                text.includes('免責事項') ||
                text.includes('看護助手') && text.includes('情報提供')) {
                disclaimerIndex = i;
                console.log(`  Found disclaimer at index ${i}: "${text.substring(0, 50)}..."`);
                break;
            }
        }
    }

    if (disclaimerIndex === -1) {
        console.log(`  ⚠️  No disclaimer found - keeping all content`);
        return;
    }

    // Keep everything up to and including disclaimer
    const cleanedBody = post.body.slice(0, disclaimerIndex + 1);
    const removedCount = post.body.length - cleanedBody.length;

    if (removedCount > 0) {
        console.log(`  Removing ${removedCount} blocks after disclaimer...`);

        // Show what we're removing
        post.body.slice(disclaimerIndex + 1, disclaimerIndex + 3).forEach((block, idx) => {
            if (block._type === 'block' && block.children) {
                const text = block.children.map(c => c.text || '').join('').substring(0, 60);
                console.log(`    - Block ${idx + 1}: "${text}..."`);
            }
        });

        await client.patch(post._id)
            .set({ body: cleanedBody })
            .commit();
        console.log(`  ✅ Fixed`);
    } else {
        console.log(`  ℹ️  No content after disclaimer`);
    }
}

async function main() {
    console.log('=== Fixing Article Structure (Improved) ===\n');

    for (const slug of AFFECTED_SLUGS) {
        try {
            await fixArticle(slug);
        } catch (err) {
            console.error(`  ❌ Error: ${err.message}`);
        }
    }

    console.log('\n=== Done ===');
}

main();
