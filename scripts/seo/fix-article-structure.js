const { createClient } = require('@sanity/client');

const client = createClient({
    projectId: '72m8vhy2',
    dataset: 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
});

// Articles that were modified by SEO scripts
const AFFECTED_SLUGS = [
    'nursing-assistant-operating-room-duties',
    'nursing-assistant-bottom-myth',
    'nursing-assistant-patient-transfer-safety'
];

// Section titles added by our scripts that need to be removed
const SECTIONS_TO_REMOVE = [
    'キャリアアップを目指すなら',
    '現状を変えたいあなたへ',
    '実務に役立つスキル',
    'シーン別ストレッチャー操作のコツ'
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

    // Find the disclaimer section (免責事項)
    const disclaimerIndex = post.body.findIndex(block =>
        block._type === 'block' &&
        block.children &&
        block.children.some(child =>
            child.text && child.text.includes('参考資料・厚生労働省 職業情報提供サイト')
        )
    );

    if (disclaimerIndex === -1) {
        console.log(`  ⚠️  Disclaimer not found, checking for added sections...`);

        // Even if disclaimer not found, remove our added sections
        const cleanedBody = post.body.filter(block => {
            if (block._type === 'block' && block.children) {
                const text = block.children.map(c => c.text || '').join('');
                return !SECTIONS_TO_REMOVE.some(section => text.includes(section));
            }
            return true;
        });

        if (cleanedBody.length !== post.body.length) {
            await client.patch(post._id).set({ body: cleanedBody }).commit();
            console.log(`  ✅ Removed ${post.body.length - cleanedBody.length} blocks`);
        } else {
            console.log(`  ℹ️  No changes needed`);
        }
        return;
    }

    console.log(`  Found disclaimer at index: ${disclaimerIndex}`);

    // Keep everything up to and including the disclaimer
    const cleanedBody = post.body.slice(0, disclaimerIndex + 1);

    const removedCount = post.body.length - cleanedBody.length;

    if (removedCount > 0) {
        await client.patch(post._id)
            .set({ body: cleanedBody })
            .commit();
        console.log(`  ✅ Removed ${removedCount} blocks after disclaimer`);
    } else {
        console.log(`  ℹ️  No content after disclaimer`);
    }
}

async function main() {
    console.log('=== Fixing Article Structure Violations ===\n');
    console.log('Affected articles:', AFFECTED_SLUGS.length);

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
