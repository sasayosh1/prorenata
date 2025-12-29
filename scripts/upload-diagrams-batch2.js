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
        slug: 'nursing-assistant-icu-emergency-duties',
        filePath: 'public/images/chibichara/diagrams/nursing-assistant-icu-duties.svg',
        alt: 'ICU・救急での看護助手業務',
        caption: '緊張感のある現場で求められる動き',
        targetHeadingKeywords: ['ICU', '救急', '業務', '役割']
    },
    {
        slug: 'nursing-assistant-suitable-person-characteristics',
        filePath: 'public/images/chibichara/diagrams/nursing-assistant-suitable-types.svg',
        alt: '看護助手に向いている人の特徴',
        caption: 'あなたはどのタイプ？',
        targetHeadingKeywords: ['向いて', '特徴', 'タイプ', '性格']
    },
    {
        slug: 'nursing-assistant-vital-signs-support',
        filePath: 'public/images/chibichara/diagrams/nursing-assistant-vital-signs.svg',
        alt: 'バイタルサイン測定のサポート',
        caption: '正確な測定をアシストする流れ',
        targetHeadingKeywords: ['バイタル', '測定', 'サポート', '手順']
    },
    {
        slug: 'nursing-assistant-emr-system-changes',
        filePath: 'public/images/chibichara/diagrams/nursing-assistant-emr-changes.svg',
        alt: '電子カルテ導入前後の変化',
        caption: '業務効率はどう変わった？',
        targetHeadingKeywords: ['電子カルテ', '導入', '変化', '効率']
    },
    {
        slug: 'nursing-assistant-uniform-selection',
        filePath: 'public/images/chibichara/diagrams/nursing-assistant-uniform-selection.svg',
        alt: '看護助手のユニフォーム選び',
        caption: '快適に働くための選択ポイント',
        targetHeadingKeywords: ['ユニフォーム', '選び方', 'ポイント', '服装']
    }
];

async function uploadAndInsertDiagrams() {
    console.log('=== Uploading and Inserting Batch 2 Diagrams ===\n');

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

    console.log('\n\n=== Batch 2 Upload and Insertion Complete ===');
}

// Run the script
uploadAndInsertDiagrams().catch(console.error);
