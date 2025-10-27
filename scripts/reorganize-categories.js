const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false
});

// カテゴリ統合・改名計画
const categoryPlan = [
  // 統合: 「就職・転職活動」(15件) + 「退職・転職サポート」(1件) → 「転職」
  {
    newTitle: '転職',
    description: '就職・転職活動、退職準備に関する情報',
    mergeSources: ['就職・転職活動', '退職・転職サポート']
  },
  // 統合: 「キャリア・資格」(36件) + 「資格取得」(0件) → 「キャリア」
  {
    newTitle: 'キャリア',
    description: 'キャリア形成、資格取得に関する情報',
    mergeSources: ['キャリア・資格', '資格取得']
  },
  // 改名のみ
  { newTitle: '仕事内容', description: '仕事内容・役割に関する情報', mergeSources: ['仕事内容・役割'] },
  { newTitle: '実務', description: '現場での実務や効率化のノウハウ', mergeSources: ['実務・ノウハウ'] },
  { newTitle: 'スキル', description: '看護助手に必要なスキル', mergeSources: ['必要なスキル'] },
  { newTitle: '効率化', description: '業務効率化のテクニック', mergeSources: ['効率化テクニック'] },
  { newTitle: '給与', description: '給与、待遇、労働条件に関する情報', mergeSources: ['給与・待遇'] },
  { newTitle: '悩み', description: '職場での悩みや相談に関するアドバイス', mergeSources: ['悩み・相談'] },
  { newTitle: '患者対応', description: '患者対応に関する情報', mergeSources: ['患者対応'] },
  { newTitle: '感染対策', description: '感染対策に関する情報', mergeSources: ['感染対策'] },
  { newTitle: '医療', description: '医療現場の基本知識', mergeSources: ['医療現場の基本'] },
  { newTitle: '看護師', description: '看護師を目指す方への情報', mergeSources: ['看護師への道'] },
  { newTitle: '職場', description: '病院、クリニック、介護施設など職場別の情報', mergeSources: ['職場別情報'] },
  { newTitle: '基礎', description: '看護助手の基本的な知識と入門情報', mergeSources: ['基礎知識・入門'] }
];

async function reorganizeCategories() {
  console.log('\n📋 カテゴリ再編成スクリプト\n');
  console.log('='.repeat(80));

  // 現在のカテゴリ取得
  const currentCategories = await client.fetch(`*[_type == "category"] { _id, title, description }`);
  console.log(`現在のカテゴリ数: ${currentCategories.length}種類\n`);

  // カテゴリマップ作成（タイトル → ID）
  const categoryMap = {};
  currentCategories.forEach(cat => {
    categoryMap[cat.title] = cat._id;
  });

  const newCategoryIds = {};
  const categoriesToDelete = [];

  for (const plan of categoryPlan) {
    console.log(`\n📌 処理中: ${plan.newTitle}`);
    console.log(`   統合元: ${plan.mergeSources.join(', ')}`);

    const sourceIds = plan.mergeSources
      .map(title => categoryMap[title])
      .filter(Boolean);

    if (sourceIds.length === 0) {
      console.log('   ⚠️  統合元カテゴリが見つかりません');
      continue;
    }

    // 最初のカテゴリを新しいタイトルに改名
    const primaryId = sourceIds[0];
    const primaryTitle = plan.mergeSources[0];

    // カテゴリを更新（改名）
    await client
      .patch(primaryId)
      .set({
        title: plan.newTitle,
        description: plan.description
      })
      .commit();

    console.log(`   ✅ 「${primaryTitle}」→「${plan.newTitle}」に改名`);
    newCategoryIds[plan.newTitle] = primaryId;

    // 統合する追加カテゴリがある場合
    if (sourceIds.length > 1) {
      for (let i = 1; i < sourceIds.length; i++) {
        const mergeId = sourceIds[i];
        const mergeTitle = plan.mergeSources[i];

        // このカテゴリを使用している記事を取得
        const postsWithCategory = await client.fetch(
          `*[_type == "post" && references($categoryId)] { _id, title }`,
          { categoryId: mergeId }
        );

        console.log(`   📝 「${mergeTitle}」の記事数: ${postsWithCategory.length}件`);

        // 各記事のカテゴリを新しいカテゴリに変更
        for (const post of postsWithCategory) {
          try {
            // カテゴリ参照を取得
            const postData = await client.fetch(
              `*[_id == $postId][0] { categories }`,
              { postId: post._id }
            );

            // 古いカテゴリを新しいカテゴリに置き換え
            const updatedCategories = postData.categories
              .filter(ref => ref._ref !== mergeId)
              .concat([{ _type: 'reference', _ref: primaryId }]);

            // 重複削除
            const uniqueCategories = Array.from(
              new Map(updatedCategories.map(ref => [ref._ref, ref])).values()
            );

            await client
              .patch(post._id)
              .set({ categories: uniqueCategories })
              .commit();

            // draft も同時に更新
            const draftId = `drafts.${post._id.replace(/^drafts\./, '')}`;
            await client
              .patch(draftId)
              .set({ categories: uniqueCategories })
              .commit()
              .catch(() => null);
          } catch (error) {
            console.error(`      ❌ 記事更新エラー: ${post.title}`, error.message);
          }
        }

        console.log(`   ✅ ${postsWithCategory.length}件の記事を「${plan.newTitle}」に移動`);

        // 統合元カテゴリを削除リストに追加
        categoriesToDelete.push({ id: mergeId, title: mergeTitle });
      }
    }
  }

  // 統合元カテゴリを削除
  console.log(`\n🗑️  統合元カテゴリの削除\n`);
  for (const cat of categoriesToDelete) {
    try {
      await client.delete(cat.id);
      console.log(`   ✅ 「${cat.title}」を削除`);
    } catch (error) {
      console.error(`   ❌ 削除エラー: ${cat.title}`, error.message);
    }
  }

  // 最終確認
  const finalCategories = await client.fetch(`*[_type == "category"] | order(title asc) { title }`);
  console.log('\n' + '='.repeat(80));
  console.log(`\n📊 再編成完了！\n`);
  console.log(`新しいカテゴリ数: ${finalCategories.length}種類\n`);
  console.log('【新カテゴリ一覧】');
  finalCategories.forEach((cat, i) => {
    console.log(`${i + 1}. ${cat.title}`);
  });
  console.log('\n' + '='.repeat(80));
}

reorganizeCategories().catch(console.error);
