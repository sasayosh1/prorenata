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
        slug: 'nursing-assistant-communication-skills', // Corrected
        filePath: 'generated_diagrams/communication_tips.svg',
        alt: '信頼されるコミュニケーションの基本',
        targetHeadingKeywords: ['基本', 'コツ', 'ポイント']
    },
    {
        slug: 'nursing-assistant-night-shift-reality', // Corrected
        filePath: 'generated_diagrams/night_shift.svg',
        alt: '夜勤を乗り切る！生活リズム調整法',
        targetHeadingKeywords: ['リズム', '調整', '過ごし方']
    },
    {
        slug: 'nursing-assistant-certification-guide', // Corrected
        filePath: 'generated_diagrams/certification_merit.svg',
        alt: '看護助手資格取得の3大メリット',
        targetHeadingKeywords: ['メリット', '利点', '良いこと']
    },
    {
        slug: 'nursing-assistant-job-change-manual', // Corrected
        filePath: 'generated_diagrams/career_change_timing.svg',
        alt: '転職にベストなタイミングは？',
        targetHeadingKeywords: ['タイミング', '時期', 'いつ']
    }
];

async function uploadAndInsertDiagrams() {
    console.log('=== Uploading and Inserting Batch 4 Diagrams (Corrected Slugs) ===\n');

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
