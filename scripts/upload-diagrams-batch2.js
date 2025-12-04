const { createClient } = require('@sanity/client');
const fs = require('fs');
const path = require('path');

const client = createClient({
    projectId: '72m8vhy2',
    dataset: 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
});

const DIAGRAMS = [
    {
        slug: 'nursing-assistant-stressful-relationships-solutions',
        filePath: 'generated_diagrams/stress_relationships.svg',
        alt: '人間関係ストレス対処の3ステップ',
        targetHeadingKeywords: ['対処', 'ステップ', '方法']
    },
    {
        slug: 'nursing-assistant-become-nurse-guide',
        filePath: 'generated_diagrams/nurse_scholarship.svg',
        alt: '奨学金活用の3つのポイント',
        targetHeadingKeywords: ['奨学金', '費用', '支援']
    },
    {
        slug: 'nursing-assistant-to-nurse-route',
        filePath: 'generated_diagrams/nurse_route.svg',
        alt: '看護助手から看護師への3つのルート',
        targetHeadingKeywords: ['ルート', '方法', '道']
    },
    {
        slug: 'nursing-assistant-essentials-checklist',
        filePath: 'generated_diagrams/essentials_checklist.svg',
        alt: '看護助手の必須持ち物チェックリスト',
        targetHeadingKeywords: ['持ち物', 'アイテム', '必要']
    }
];

async function uploadAndInsertDiagrams() {
    console.log('=== Uploading and Inserting Additional Diagrams ===\n');

    for (const item of DIAGRAMS) {
        try {
            console.log(`Processing: ${item.slug}`);

            // 1. Upload Image
            const filePath = path.join(process.cwd(), item.filePath);
            if (!fs.existsSync(filePath)) {
                console.error(`  ❌ File not found: ${filePath}`);
                continue;
            }

            const fileStream = fs.createReadStream(filePath);
            console.log(`  Uploading ${item.filePath}...`);
            const asset = await client.assets.upload('image', fileStream, {
                filename: path.basename(filePath),
                contentType: 'image/svg+xml'
            });
            console.log(`  ✅ Uploaded asset: ${asset._id}`);

            // 2. Fetch Article
            const article = await client.fetch(`*[_type == "post" && slug.current == $slug][0]`, { slug: item.slug });
            if (!article) {
                console.error(`  ❌ Article not found: ${item.slug}`);
                continue;
            }

            // 3. Find Insertion Point
            let insertIndex = 1; // Default: after first block
            let foundHeading = false;

            if (article.body && Array.isArray(article.body)) {
                for (let i = 0; i < article.body.length; i++) {
                    const block = article.body[i];
                    if (block._type === 'block' && (block.style === 'h2' || block.style === 'h3')) {
                        const text = block.children.map(c => c.text).join('');
                        if (item.targetHeadingKeywords.some(kw => text.includes(kw))) {
                            insertIndex = i + 1;
                            foundHeading = true;
                            console.log(`  Found target heading: "${text}" at index ${i}`);
                            break;
                        }
                    }
                }
            }

            if (!foundHeading) {
                console.log('  ⚠️ Target heading not found, inserting after first H2 or at index 2');
                // Try to find first H2
                const firstH2Index = article.body.findIndex(b => b.style === 'h2');
                if (firstH2Index !== -1) {
                    insertIndex = firstH2Index + 1;
                } else {
                    insertIndex = Math.min(2, article.body.length);
                }
            }

            // 4. Create Image Block
            const imageBlock = {
                _type: 'image',
                _key: `diagram-${Date.now()}`,
                asset: {
                    _type: 'reference',
                    _ref: asset._id
                },
                alt: item.alt,
                caption: item.alt
            };

            // 5. Patch Article
            console.log(`  Inserting diagram at index ${insertIndex}...`);
            await client.patch(article._id)
                .insert('after', `body[${insertIndex - 1}]`, [imageBlock])
                .commit();

            console.log(`  ✅ Successfully inserted diagram into ${item.slug}\n`);

        } catch (error) {
            console.error(`  ❌ Error processing ${item.slug}:`, error.message);
        }
    }
}

uploadAndInsertDiagrams();
