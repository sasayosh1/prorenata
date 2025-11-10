const { createClient } = require('@sanity/client');
const { ensureReferenceKeys } = require('./utils/keyHelpers');

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false
});

async function fixTechCategoryPosts() {
  console.log('\n🔧 「テクノロジー」カテゴリ記事の修正開始\n');

  // 全カテゴリ取得
  const categories = await client.fetch(`*[_type == "category"] { _id, title }`);
  const categoryMap = {};
  categories.forEach(cat => {
    categoryMap[cat.title] = cat._id;
  });

  // 3つの記事とその適切なカテゴリ
  const fixMapping = [
    {
      id: '73924fd4-b938-4911-aadf-9549d306ef08',
      title: '心に寄り添う看護助手のあなたへ：精神的な負担を軽くするヒント',
      newCategory: '悩み'
    },
    {
      id: '9d8dddf8-d2b7-480c-92b6-4c1725837885',
      title: '日々のケアが自信に変わる！看護助手として「わたしらしいブランド」を築く方法',
      newCategory: '転職'
    },
    {
      id: 'gxyxv316c0oeG6AdOIZRvr',
      title: '【看護助手の転職】忙しい毎日でも大丈夫！働きながら理想の職場を見つける方法',
      newCategory: '転職'
    }
  ];

  for (const item of fixMapping) {
    const categoryId = categoryMap[item.newCategory];

    if (!categoryId) {
      console.log(`❌ カテゴリ「${item.newCategory}」が見つかりません`);
      continue;
    }

    try {
      // drafts と published 両方を更新
      const draftId = `drafts.${item.id}`;

      // draft を更新
      await client
        .patch(draftId)
        .set({
          categories: ensureReferenceKeys([{ _type: 'reference', _ref: categoryId }])
        })
        .commit()
        .catch(() => null); // drafts がない場合は無視

      // published を更新
      await client
        .patch(item.id)
        .set({
          categories: ensureReferenceKeys([{ _type: 'reference', _ref: categoryId }])
        })
        .commit()
        .catch(() => null); // published がない場合は無視

      console.log(`✅ ${item.title}`);
      console.log(`   カテゴリ変更: テクノロジー → ${item.newCategory}\n`);
    } catch (error) {
      console.error(`❌ エラー: ${item.title}`, error.message);
    }
  }

  console.log('✅ 記事のカテゴリ修正完了\n');
}

fixTechCategoryPosts().catch(console.error);
