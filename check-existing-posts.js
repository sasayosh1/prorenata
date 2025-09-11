const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  perspective: 'published'
});

async function checkExistingPosts() {
  try {
    console.log('🔍 Sanity内の既存記事を確認中...\n');
    
    const posts = await client.fetch(`
      *[_type == "post"] | order(_createdAt desc) {
        _id,
        title,
        slug,
        body,
        publishedAt,
        _createdAt,
        "hasSlug": defined(slug.current),
        "hasBody": defined(body),
        "bodyLength": length(body)
      }
    `);
    
    console.log(`📊 総記事数: ${posts.length}\n`);
    
    // 統計情報
    const withSlug = posts.filter(p => p.hasSlug).length;
    const withBody = posts.filter(p => p.hasBody).length;
    const withoutSlug = posts.filter(p => !p.hasSlug).length;
    const withoutBody = posts.filter(p => !p.hasBody).length;
    
    console.log('📈 統計情報:');
    console.log(`✅ slugあり: ${withSlug}記事`);
    console.log(`❌ slugなし: ${withoutSlug}記事`);
    console.log(`✅ bodyあり: ${withBody}記事`);
    console.log(`❌ bodyなし: ${withoutBody}記事\n`);
    
    // 最初の10記事の詳細
    console.log('📝 最初の10記事の詳細:');
    posts.slice(0, 10).forEach((post, index) => {
      console.log(`${index + 1}. "${post.title}"`);
      console.log(`   slug: ${post.hasSlug ? '✅' : '❌'} ${post.slug?.current || 'なし'}`);
      console.log(`   body: ${post.hasBody ? '✅' : '❌'} ${post.bodyLength ? `(${post.bodyLength}ブロック)` : 'なし'}`);
      console.log(`   作成日: ${new Date(post._createdAt).toLocaleDateString('ja-JP')}\n`);
    });
    
    // slug/bodyが不足している記事のリスト
    if (withoutSlug > 0 || withoutBody > 0) {
      console.log('🚨 対応が必要な記事:');
      
      if (withoutSlug > 0) {
        console.log(`\n📌 slugが不足している記事 (${withoutSlug}件):`);
        posts.filter(p => !p.hasSlug).slice(0, 5).forEach((post, index) => {
          console.log(`${index + 1}. "${post.title}"`);
        });
        if (withoutSlug > 5) console.log(`   ...他${withoutSlug - 5}件`);
      }
      
      if (withoutBody > 0) {
        console.log(`\n📌 bodyが不足している記事 (${withoutBody}件):`);
        posts.filter(p => !p.hasBody).slice(0, 5).forEach((post, index) => {
          console.log(`${index + 1}. "${post.title}"`);
        });
        if (withoutBody > 5) console.log(`   ...他${withoutBody - 5}件`);
      }
    }
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

checkExistingPosts();