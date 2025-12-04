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
        slug: 'nursing-assistant-career-vision',
        filePath: 'generated_diagrams/career_vision.svg',
        alt: '看護助手のキャリアステップ',
        targetHeadingKeywords: ['キャリア', 'ステップ', '将来']
    },
    {
        slug: 'nursing-assistant-suitable-person-characteristics',
        filePath: 'generated_diagrams/characteristics.svg',
        alt: '看護助手に向いている人の3つの特徴',
        targetHeadingKeywords: ['特徴', '向いている', '適性']
    },
    {
        slug: 'nursing-assistant-latest-salary-comparison',
        filePath: 'generated_diagrams/salary_comparison.svg',
        alt: '看護助手の平均給与比較（月収）',
        targetHeadingKeywords: ['給料', '年収', '比較']
    },
    {
        slug: 'nursing-assistant-terminology-guide',
        filePath: 'generated_diagrams/terminology_guide.svg',
        alt: '看護助手の用語マスターマップ',
        targetHeadingKeywords: ['用語', '言葉', '意味']
    },
    {
        slug: 'nursing-assistant-operating-room-duties',
        filePath: 'generated_diagrams/operating_room.svg',
        alt: '手術室看護助手の主な業務フロー',
        targetHeadingKeywords: ['業務', '仕事', '流れ']
    }
];

async function uploadAndInsertDiagrams() {
    console.log('=== Uploading and Inserting Batch 5 Diagrams ===\n');

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
