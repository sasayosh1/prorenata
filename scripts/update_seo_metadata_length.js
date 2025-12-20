const { createClient } = require('@sanity/client');

const client = createClient({
    projectId: '72m8vhy2',
    dataset: 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN || 'skCHyaNwM7IJU5RSAkrE3ZGFEYVcXx3lJzbKIz0a8HNUJmTwHRn1phhfsAYXZSeAVeWo2ogJj0COIwousCyb2MLGPwyxe4FuDbDETY2xz5hkjuUIcdz6YcubOZ5SfRywxB2Js8r4vKtbOmlbLm1pXJyHl0Kgajis2MgxilYSTpkEYe6GGWEu',
    useCdn: false,
});

async function updateSeoMetadataLength() {
    console.log('=== Updating SEO Metadata (Length Adjustment) ===\n');

    // 1. Retirement Agency Comparison
    const retirementSlug = 'comparison-of-three-resignation-agencies';
    // Original: ~98 chars
    // New: ~135 chars (Added service names in parens and reassurance at end)
    const retirementMeta = '「上司に言えない」「トラブルが怖い」と悩む看護助手へ。即日退職が可能で、失敗しない退職代行サービス3社（弁護士法人みやび・即ヤメ・ガイア）を厳選比較。費用や連絡手段、有給消化の交渉まで、あなたの状況に合った選び方を徹底解説します。これで明日からもう行かなくて大丈夫。';

    await updatePost(retirementSlug, retirementMeta);

    // 2. Job Services Comparison
    const jobSlug = 'nursing-assistant-compare-services-perspective';
    // Original: ~97 chars
    // New: ~138 chars (Added service names in parens and "with examples")
    const jobMeta = '「給料を上げたい」「今の職場がきつい」という看護助手におすすめの転職サイト3社（ヒューマンライフケア・リニューケア・かいご畑）を徹底比較。無資格・未経験OKや夜勤なしなど、希望条件に強いエージェントの選び方と、失敗しない年収アップのコツを実例付きで紹介します。';

    await updatePost(jobSlug, jobMeta);

    console.log('\n✨ SEO Metadata Length Update Complete!');
}

async function updatePost(slug, metaDescription) {
    const post = await client.fetch(`*[_type == "post" && slug.current == $slug][0]`, { slug });

    if (!post) {
        console.error(`❌ Post not found: ${slug}`);
        return;
    }

    await client.patch(post._id).set({
        metaDescription: metaDescription,
        autoEditLock: true // Maintain lock
    }).commit();

    console.log(`✅ Updated ${slug}`);
    console.log(`   Length: ${metaDescription.length} chars`);
    console.log(`   Content: ${metaDescription}`);
}

updateSeoMetadataLength().catch(console.error);
