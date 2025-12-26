const { createClient } = require('@sanity/client');

const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN;
if (!token) {
  console.error('Error: SANITY_WRITE_TOKEN or SANITY_API_TOKEN is required.');
  process.exit(1);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'aoxze287',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token
});

async function analyzeTermArticles() {
  console.log('📊 用語関連記事の分析中...\n');

  // 用語に関する記事を検索
  const termArticles = await client.fetch(`
    *[_type == "post" && (
      title match "*用語*" ||
      title match "*とは*" ||
      category->title match "*用語*" ||
      tags[]->name match "*用語*"
    )] | order(publishedAt desc) {
      _id,
      title,
      slug,
      publishedAt,
      category->{title},
      tags[]->{name},
      readTime
    }
  `);

  console.log(`✅ 用語関連記事: ${termArticles.length}件\n`);
  console.log('=== 用語関連記事一覧（最新20件） ===\n');

  termArticles.slice(0, 20).forEach((post, index) => {
    console.log(`${index + 1}. ${post.title}`);
    console.log(`   カテゴリー: ${post.category?.title || '未設定'}`);
    console.log(`   公開日: ${new Date(post.publishedAt).toLocaleDateString('ja-JP')}`);
    if (post.readTime) {
      console.log(`   読了時間: ${post.readTime}分`);
    }
    console.log('');
  });

  // カテゴリー別の集計
  console.log('\n=== カテゴリー別集計 ===\n');
  const categoryCount = {};
  termArticles.forEach(post => {
    const cat = post.category?.title || '未設定';
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  });

  Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      console.log(`${cat}: ${count}件`);
    });
}

analyzeTermArticles().catch(console.error);
