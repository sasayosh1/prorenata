const { createClient } = require('@sanity/client');

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

async function updateSeoMetadata() {
    console.log('=== Updating SEO Metadata ===\n');

    // 1. Retirement Agency Comparison
    const retirementSlug = 'comparison-of-three-resignation-agencies';
    const retirementMeta = '「上司に言えない」「トラブルが怖い」と悩む看護助手へ。即日退職が可能で、失敗しない退職代行サービス3社を厳選比較。費用や連絡手段、有給消化の交渉まで、あなたの状況に合った選び方を徹底解説します。';
    const retirementExcerpt = '「もう限界…」と感じている看護助手のために、即日で会社に行かなくて済む退職代行サービスを厳選。弁護士対応の有無や費用の違いを整理し、安全に退職するための選び方をまとめました。';

    await updatePost(retirementSlug, retirementMeta, retirementExcerpt);

    // 2. Job Services Comparison
    const jobSlug = 'nursing-assistant-compare-services-perspective';
    const jobMeta = '「給料を上げたい」「今の職場がきつい」という看護助手におすすめの転職サイト3社を徹底比較。無資格・未経験OKや夜勤なしなど、あなたの希望条件に強いエージェントの選び方と、給料アップのコツを紹介します。';
    const jobExcerpt = '看護助手の転職で失敗したくない方へ。求人の質やサポート体制が異なる大手3社を比較し、あなたのキャリアプランや希望する働き方に最適なサービスがどこか、現場視点で解説しています。';

    await updatePost(jobSlug, jobMeta, jobExcerpt);

    console.log('\n✨ SEO Metadata Update Complete!');
}

async function updatePost(slug, metaDescription, excerpt) {
    const post = await client.fetch(`*[_type == "post" && slug.current == $slug][0]`, { slug });

    if (!post) {
        console.error(`❌ Post not found: ${slug}`);
        return;
    }

    await client.patch(post._id).set({
        metaDescription: metaDescription,
        excerpt: excerpt,
        autoEditLock: true // Maintain lock
    }).commit();

    console.log(`✅ Updated ${slug}`);
    console.log(`   Meta: ${metaDescription.substring(0, 30)}...`);
    console.log(`   Excerpt: ${excerpt.substring(0, 30)}...`);
}

updateSeoMetadata().catch(console.error);
