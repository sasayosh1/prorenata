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
        slug: 'nursing-assistant-resume-writing',
        description: '看護助手の履歴書・志望動機の書き方を例文付きで解説。未経験でもそのまま使えるテンプレートや、採用担当者に響く自己PRのポイントを紹介します。'
    },
    {
        slug: 'nursing-assistant-interview-prep',
        description: '看護助手の面接でよく聞かれる質問と回答例を徹底解説。服装やマナー、逆質問のポイントまで、合格率を上げるための準備を網羅しました。'
    },
    {
        slug: 'nursing-assistant-patient-transfer-safety',
        description: '看護助手の重要業務、ストレッチャーや車椅子での患者移送手順を解説。事故を防ぐ安全確認のポイントや、ボディメカニクスを活用した介助方法を紹介。'
    },
    {
        slug: 'nursing-assistant-become-nurse-guide',
        description: '働きながら看護師資格を取得する最短ルートを解説。奨学金制度の活用法や、看護助手経験を活かした進学のメリット・デメリットを紹介します。'
    },
    {
        slug: 'nursing-assistant-essentials-checklist',
        description: '看護助手の仕事に必要な持ち物を完全リスト化。メモ帳やペンなどの必須アイテムから、あると便利な神グッズまで、現役目線で紹介します。'
    }
];

async function updateMetaDescriptions() {
    console.log('=== Updating Meta Descriptions ===\n');

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

updateMetaDescriptions();
