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
        slug: 'nursing-assistant-care-guide',
        description: '腰痛予防に必須！ボディメカニクスの基本原理と、看護助手の現場で使える実践的な介助テクニックをイラスト付きで解説します。'
    },
    {
        slug: 'nursing-assistant-qualification-study',
        description: '働きながら資格合格を目指す看護助手のための勉強スケジュール例。隙間時間の活用法や、効率的な学習の進め方を紹介。'
    },
    {
        slug: 'nursing-assistant-medical-terms',
        description: '看護助手の現場で頻出する医療用語・略語を一覧で解説。申し送りやカルテで困らないための、最低限知っておきたい用語集です。'
    },
    {
        slug: 'nursing-assistant-job-change-manual',
        description: '看護助手の転職を成功させる完全マニュアル。求人探しのコツから、履歴書・面接対策、円満退職の方法までステップ別に解説。'
    },
    {
        slug: 'nursing-assistant-night-shift-practical',
        description: '看護助手の夜勤を乗り切るための生活リズム調整法と、眠気対策・疲労回復のコツ。16時間夜勤の実態とあわせて紹介します。'
    },
    {
        slug: 'nursing-assistant-qualification-guide',
        description: '看護助手のキャリアアップに役立つ資格を難易度別に紹介。取得するメリットや、自分に合った資格の選び方を徹底解説。'
    },
    {
        slug: 'nursing-assistant-communication-guide', // Trying this slug
        description: '患者さんや医療スタッフとのコミュニケーション術。信頼関係を築くための言葉遣いや、報告・連絡・相談（ホウレンソウ）のポイント。'
    },
    {
        slug: 'nursing-assistant-latest-salary-comparison',
        description: '看護助手の給料相場を雇用形態・地域・経験年数別に比較。年収アップのための具体的な方法や、高待遇求人の見つけ方も解説。'
    },
    {
        slug: 'nursing-assistant-terminology-guide',
        description: '看護助手が知っておくべき専門用語をジャンル別に解説。ADL、QOL、バイタルサインなど、基本から応用まで網羅。'
    },
    {
        slug: 'nursing-assistant-operating-room-duties',
        description: '手術室（オペ室）看護助手の仕事内容とは？器械出しや外回り業務の流れ、清潔・不潔の区別など、特殊な環境での役割を解説。'
    }
];

async function updateMetaDescriptionsBatch3() {
    console.log('=== Updating Meta Descriptions (Batch 3: 11-20) ===\n');

    for (const item of UPDATES) {
        try {
            console.log(`Processing: ${item.slug}`);
            const article = await client.fetch(`*[_type == "post" && slug.current == $slug][0]`, { slug: item.slug });

            if (!article) {
                console.error(`  ❌ Article not found: ${item.slug}`);
                // Try alternative slug for communication guide if first fails
                if (item.slug === 'nursing-assistant-communication-guide') {
                    console.log('  Retrying with nursing-assistant-communication-tips...');
                    const altArticle = await client.fetch(`*[_type == "post" && slug.current == "nursing-assistant-communication-tips"][0]`);
                    if (altArticle) {
                        await client.patch(altArticle._id).set({ description: item.description }).commit();
                        console.log(`  ✅ Updated description for nursing-assistant-communication-tips`);
                    } else {
                        console.error(`  ❌ Article not found: nursing-assistant-communication-tips`);
                    }
                }
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

updateMetaDescriptionsBatch3();
