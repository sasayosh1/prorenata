require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')
const fs = require('fs')
const path = require('path')

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false
})

// Sera's voice transformation guidelines
const TRANSFORMATION_GUIDELINES = `
Transform the article text to reflect Sera Shirasaki's voice with these rules:

1. First-person: Use "わたし" (hiragana) when sharing personal experiences
2. Perspective: Current nursing assistant (NOT former) - use present tense
3. Tone: Calm, composed, professional warmth (NO exclamation points!)
4. Readability: Aim for 3:7 kanji-to-hiragana ratio (excluding technical terms)
5. Add real workplace examples and colleague stories where appropriate
6. Balance realism with positivity - acknowledge challenges but provide solutions
7. Avoid overly casual language ("ですよね" → "です")
8. Avoid dramatic expressions
9. Keep technical terms in kanji (医療法人, 福利厚生, etc.)
10. Maintain factual accuracy

Examples:
- Before: "看護助手の仕事は大変ですが、やりがいもあります。"
- After: "看護助手の仕事は大変です。わたしも現場で働いていて、正直「きつい」と感じる日は何度もあります。でも、患者さんから「ありがとう」と言われた瞬間や、チームで協力して乗り越えた経験は、今でも大切な財産です。"
`;

function extractTextFromBlock(block) {
    if (!block.children) return '';
    return block.children.map(child => child.text || '').join('');
}

async function transformArticle(slug) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Transforming: ${slug}`);
    console.log('='.repeat(60));

    const samplePath = path.join(__dirname, '../samples', `${slug}.json`);
    const article = JSON.parse(fs.readFileSync(samplePath, 'utf8'));

    console.log(`Title: ${article.title}`);
    console.log(`Body blocks: ${article.body.length}`);
    console.log('\nnote: This is a placeholder for AI transformation.');
    console.log('In production, this would use Gemini API to transform text blocks.');
    console.log('\nFor now, creating a manual transformation plan...\n');

    // Extract text blocks for transformation
    const textBlocks = [];
    article.body.forEach((block, index) => {
        if (block._type === 'block' && block.children) {
            const text = extractTextFromBlock(block);
            if (text.length > 10) { // Skip very short blocks
                textBlocks.push({
                    index,
                    key: block._key,
                    style: block.style,
                    text: text.substring(0, 100) + (text.length > 100 ? '...' : '')
                });
            }
        }
    });

    console.log(`Found ${textBlocks.length} text blocks to transform`);
    console.log('\nFirst 5 blocks:');
    textBlocks.slice(0, 5).forEach((block, i) => {
        console.log(`${i + 1}. [${block.style}] ${block.text}`);
    });

    // Save transformation plan
    const planPath = path.join(__dirname, '../samples', `${slug}_transformation_plan.json`);
    fs.writeFileSync(planPath, JSON.stringify({
        slug,
        title: article.title,
        totalBlocks: article.body.length,
        textBlocksToTransform: textBlocks.length,
        guidelines: TRANSFORMATION_GUIDELINES,
        blocks: textBlocks
    }, null, 2), 'utf8');

    console.log(`\n✅ Transformation plan saved to: ${planPath}`);

    return {
        slug,
        title: article.title,
        blocksToTransform: textBlocks.length
    };
}

async function main() {
    console.log('🔄 Article Transformation with Sera\'s Voice\n');

    const slugs = [
        'nursing-assistant-compare-services-perspective',
        'nursing-assistant-daily-schedule',
        'nursing-assistant-mental-care-stress'
    ];

    const results = [];
    for (const slug of slugs) {
        const result = await transformArticle(slug);
        results.push(result);
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Transformation Summary');
    console.log('='.repeat(60));
    results.forEach((r, i) => {
        console.log(`${i + 1}. ${r.title}`);
        console.log(`   Blocks to transform: ${r.blocksToTransform}`);
    });
    console.log('\nNext step: Manual transformation of sample blocks');
    console.log('(AI transformation would require Gemini API integration)');
}

main().catch(console.error);
