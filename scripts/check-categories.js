const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
});

async function checkCategories() {
  // 全カテゴリ取得
  const categories = await client.fetch(`*[_type == "category"] { _id, title }`);

  // 全記事取得
  const posts = await client.fetch(`
    *[_type == "post"] {
      _id,
      title,
      "slug": slug.current,
      "categories": categories[]->title,
      _createdAt
    } | order(_createdAt desc)
  `);

  console.log('\n📊 カテゴリ分布レポート\n');
  console.log('='.repeat(80));
  console.log(`総記事数: ${posts.length}件`);
  console.log(`総カテゴリ数: ${categories.length}種類\n`);

  // カテゴリ別集計
  const categoryCount = {};
  const uncategorized = [];
  const inappropriateCategories = [];

  categories.forEach(cat => {
    categoryCount[cat.title] = [];
  });

  posts.forEach(post => {
    if (!post.categories || post.categories.length === 0) {
      uncategorized.push(post);
    } else {
      post.categories.forEach(catTitle => {
        if (categoryCount[catTitle]) {
          categoryCount[catTitle].push(post);
        }
      });

      // 「テクノロジー」カテゴリが看護助手記事に割り当てられている場合
      if (post.categories.includes('テクノロジー')) {
        inappropriateCategories.push(post);
      }
    }
  });

  // カテゴリ別記事数を表示（記事数が多い順）
  const sortedCategories = Object.entries(categoryCount)
    .sort((a, b) => b[1].length - a[1].length);

  console.log('【カテゴリ別記事数】\n');
  const totalPosts = posts.length;
  sortedCategories.forEach(([catTitle, categoryPosts], index) => {
    const percentage = ((categoryPosts.length / totalPosts) * 100).toFixed(1);
    console.log(`${index + 1}. ${catTitle}: ${categoryPosts.length}件 (${percentage}%)`);
  });

  console.log('\n' + '='.repeat(80));

  // カテゴリなしの記事
  if (uncategorized.length > 0) {
    console.log(`\n🔴 カテゴリ未設定の記事: ${uncategorized.length}件\n`);
    uncategorized.slice(0, 10).forEach((post, i) => {
      console.log(`${i + 1}. ${post.title}`);
      console.log(`   ID: ${post._id}`);
      console.log(`   URL: /posts/${post.slug}\n`);
    });
  }

  // テクノロジーカテゴリの記事を詳細表示
  if (inappropriateCategories.length > 0) {
    console.log('\n' + '='.repeat(80));
    console.log(`\n🚨 「テクノロジー」カテゴリが割り当てられている記事: ${inappropriateCategories.length}件\n`);

    inappropriateCategories.forEach((post, i) => {
      console.log(`${i + 1}. ${post.title}`);
      console.log(`   ID: ${post._id}`);
      console.log(`   カテゴリ: ${post.categories.join(', ')}`);
      console.log(`   URL: /posts/${post.slug}`);
      console.log(`   作成日: ${new Date(post._createdAt).toLocaleString('ja-JP')}\n`);
    });
  }

  console.log('='.repeat(80));
}

checkCategories().catch(console.error);
