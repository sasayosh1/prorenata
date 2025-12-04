const { createClient } = require('@sanity/client');

const client = createClient({
    projectId: '72m8vhy2',
    dataset: 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
});

const UPDATES = [
    {
        slug: 'nursing-assistant-stressful-relationships-solutions',
        description: '看護助手の人間関係ストレスを解消する3つのステップ。苦手な先輩への対処法や、ストレスを溜めない考え方、限界が来た時の相談先を紹介します。'
    },
    {
        slug: 'nursing-assistant-career-vision',
        description: '看護助手のキャリアプランと将来性を解説。資格取得による年収アップのシミュレーションや、介護福祉士・看護師へのステップアップ方法を紹介。'
    },
    {
        slug: 'nursing-assistant-aptitude-test',
        description: '看護助手に向いている人・向いていない人の特徴をチェックリストで診断。性格や体力面での適性を知り、ミスマッチを防ぐための自己分析に役立ててください。'
    },
    {
        slug: 'nursing-assistant-daily-schedule',
        description: '看護助手の1日の流れ（日勤・夜勤）をタイムスケジュールで公開。病院での具体的な業務内容や休憩時間、残業の実態についてリアルに解説します。'
    },
    {
        slug: 'nursing-assistant-interview-tips',
        description: '面接官が見ているポイントはここ！看護助手の面接で好印象を与えるコツや、逆質問の活用法、身だしなみの注意点を採用担当者目線で紹介。'
    }
];

async function updateMetaDescriptionsBatch2() {
    console.log('=== Updating Meta Descriptions (Batch 2) ===\n');

    for (const item of UPDATES) {
        try {
            console.log(`Processing: ${item.slug}`);
            const article = await client.fetch(`*[_type == "post" && slug.current == $slug][0]`, { slug: item.slug });

            if (!article) {
                console.error(`  ❌ Article not found: ${item.slug}`);
                continue;
            }

            await client.patch(article._id)
                .set({ description: item.description })
                .commit();

            console.log(`  ✅ Updated description for ${item.slug}`);

        } catch (error) {
            console.error(`  ❌ Error processing ${item.slug}:`, error.message);
        }
    }
}

updateMetaDescriptionsBatch2();
