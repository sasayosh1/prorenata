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
        slug: 'nursing-assistant-resume-writing',
        filePath: 'generated_diagrams/resume_motivation.svg',
        alt: '志望動機の黄金構成テンプレート',
        targetHeadingKeywords: ['志望動機', '例文', '書き方']
    },
    {
        slug: 'nursing-assistant-interview-prep',
        filePath: 'generated_diagrams/interview_qa.svg',
        alt: 'よくある質問と回答のポイント',
        targetHeadingKeywords: ['質問', '回答', '聞かれる']
    },
    {
        slug: 'nursing-assistant-patient-transfer-safety',
        filePath: 'generated_diagrams/wheelchair_transfer.svg',
        alt: '車椅子への移乗手順（ベッド→車椅子）',
        targetHeadingKeywords: ['車椅子', '移乗', '手順']
    },
    {
        slug: 'nursing-assistant-become-nurse-guide',
        filePath: 'generated_diagrams/nurse_study_schedule_weekly.svg',
        alt: '働きながら学ぶ！1週間のスケジュール例',
        targetHeadingKeywords: ['スケジュール', '生活', '両立']
    },
    {
        slug: 'nursing-assistant-operating-room-duties',
        filePath: 'generated_diagrams/clean_unclean_area.svg',
        alt: '手術室の「清潔・不潔」エリアマップ',
        targetHeadingKeywords: ['清潔', '不潔', 'エリア']
    }
];

async function uploadAndInsertDiagrams() {
    console.log('=== Uploading and Inserting Second Diagrams ===\n');

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
                console.log('  ⚠️ Target heading not found, inserting after first H2 or at index 3');
                // Try to find first H2
                const firstH2Index = article.body.findIndex(b => b.style === 'h2');
                if (firstH2Index !== -1) {
                    insertIndex = firstH2Index + 1;
                } else {
                    insertIndex = Math.min(3, article.body.length);
                }
            }

            // 4. Create Image Block
            const imageBlock = {
                _type: 'image',
                _key: `diagram-2nd-${Date.now()}`,
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
