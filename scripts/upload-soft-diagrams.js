const { createClient } = require('@sanity/client');
const fs = require('fs');
const path = require('path');
const { inboxDir } = require('./utils/antigravityPaths.cjs');

const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN;
if (!token) {
    console.error('Error: SANITY_WRITE_TOKEN or SANITY_API_TOKEN is required.');
    process.exit(1);
}

const client = createClient({
    projectId: '72m8vhy2',
    dataset: 'production',
    apiVersion: '2024-01-01',
    token,
    useCdn: false,
});

const INBOX_DIAGRAMS_DIR = inboxDir('prorenata', 'diagrams');

const DIAGRAMS = [
    {
        slug: 'nursing-assistant-latest-salary-comparison',
        filePath: 'public/images/chibichara/diagrams/nursing-assistant-salary-comparison.svg',
        alt: '看護助手の職場別給与比較',
        caption: '病院・介護施設・クリニックの給与比較',
        targetHeadingKeywords: ['給与', '給料', '比較', '職場']
    },
    {
        slug: 'nursing-assistant-daily-schedule',
        filePath: 'public/images/chibichara/diagrams/nursing-assistant-daily-schedule.svg',
        alt: '看護助手の1日の流れ',
        caption: '日勤の基本的なスケジュール',
        targetHeadingKeywords: ['1日', 'スケジュール', '流れ', '業務']
    },
    {
        slug: 'nursing-assistant-resignation-advice-insights',
        filePath: 'public/images/chibichara/diagrams/nursing-assistant-resignation-steps.svg',
        alt: '看護助手の円満退職の流れ',
        caption: 'スムーズに次のステップへ進むための5ステップ',
        targetHeadingKeywords: ['退職', '辞める', '流れ', '手順']
    },
    {
        slug: 'nursing-assistant-to-nurse-route',
        filePath: 'public/images/chibichara/diagrams/nursing-assistant-to-nurse-path.svg',
        alt: '看護助手から看護師へのルート',
        caption: '働きながらステップアップを目指す',
        targetHeadingKeywords: ['看護師', 'ルート', 'キャリア', 'ステップ']
    },
    {
        slug: 'nursing-assistant-career-vision',
        filePath: 'public/images/chibichara/diagrams/nursing-assistant-career-options.svg',
        alt: '看護助手のキャリアビジョン',
        caption: '経験を活かした次のステップを考える',
        targetHeadingKeywords: ['キャリア', '将来', 'ビジョン', 'ステップ']
    }
];

async function uploadAndInsertDiagrams() {
    console.log('=== Uploading and Inserting Soft-Style Diagrams ===\n');

    for (const item of DIAGRAMS) {
        try {
            console.log(`\nProcessing: ${item.slug}`);

            // 1. Upload Image
            const filePath = path.join(INBOX_DIAGRAMS_DIR, path.basename(item.filePath));
            if (!fs.existsSync(filePath)) {
                console.error(`  ❌ File not found: ${filePath}`);
                continue;
            }

            const fileStream = fs.createReadStream(filePath);
            console.log(`  📤 Uploading ${path.basename(item.filePath)}...`);

            const asset = await client.assets.upload('image', fileStream, {
                filename: path.basename(item.filePath),
            });
            console.log(`  ✅ Uploaded with ID: ${asset._id}`);

            // 2. Fetch article
            const query = `*[_type == "post" && slug.current == $slug][0]`;
            const post = await client.fetch(query, { slug: item.slug });

            if (!post) {
                console.error(`  ❌ Post not found: ${item.slug}`);
                continue;
            }

            console.log(`  📄 Found article: ${post.title}`);

            // 3. Find insertion point in body
            if (!post.body || !Array.isArray(post.body)) {
                console.error(`  ❌ Post body is empty or invalid`);
                continue;
            }

            let insertIndex = -1;

            // Try to find a relevant heading
            for (let i = 0; i < post.body.length; i++) {
                const block = post.body[i];
                if (block.style && block.style.startsWith('h') && block.children) {
                    const headingText = block.children
                        .map(child => child.text)
                        .join('')
                        .toLowerCase();

                    // Check if heading contains any target keywords
                    const hasKeyword = item.targetHeadingKeywords.some(keyword =>
                        headingText.includes(keyword.toLowerCase())
                    );

                    if (hasKeyword) {
                        insertIndex = i + 1; // Insert after this heading
                        console.log(`  🎯 Found target heading: "${headingText.substring(0, 50)}..."`);
                        break;
                    }
                }
            }

            // If no specific heading found, insert after first H2
            if (insertIndex === -1) {
                for (let i = 0; i < post.body.length; i++) {
                    if (post.body[i].style === 'h2') {
                        insertIndex = i + 1;
                        console.log(`  📍 Inserting after first H2`);
                        break;
                    }
                }
            }

            // If still no position, insert near the beginning (after intro)
            if (insertIndex === -1) {
                insertIndex = Math.min(3, post.body.length);
                console.log(`  📍 Inserting near beginning (position ${insertIndex})`);
            }

            // 4. Create image block
            const imageBlock = {
                _type: 'image',
                _key: `diagram_${Date.now()}`,
                asset: {
                    _type: 'reference',
                    _ref: asset._id,
                },
                alt: item.alt,
                caption: item.caption
            };

            // 5. Insert into body
            const updatedBody = [
                ...post.body.slice(0, insertIndex),
                imageBlock,
                ...post.body.slice(insertIndex),
            ];

            // 6. Update post
            await client
                .patch(post._id)
                .set({ body: updatedBody })
                .commit();

            console.log(`  ✅ Successfully inserted diagram into article`);
            console.log(`  📊 Position: ${insertIndex} of ${post.body.length + 1} blocks`);

        } catch (error) {
            console.error(`\n❌ Error processing ${item.slug}:`, error.message);
        }
    }

    console.log('\n\n=== Upload and Insertion Complete ===');
}

// Run the script
uploadAndInsertDiagrams().catch(console.error);
