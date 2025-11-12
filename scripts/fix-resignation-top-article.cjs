const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false
});

async function fixArticle() {
  const slug = 'nursing-assistant-resignation-advice-top';

  console.log('記事を取得中...');
  const query = `*[_type == "post" && slug.current == $slug][0]{
    _id,
    _rev,
    title,
    slug,
    body
  }`;

  const article = await client.fetch(query, { slug });

  if (!article) {
    console.error('記事が見つかりません！');
    return;
  }

  console.log(`\n記事: ${article.title}`);
  console.log(`現在のブロック数: ${article.body.length}`);

  // 重複を削除：index 38以降で「まとめ」より前のブロックを削除
  // 「まとめ」セクションを見つける
  let summaryIndex = -1;
  for (let i = 38; i < article.body.length; i++) {
    if (article.body[i].style === 'h2') {
      const text = article.body[i].children?.[0]?.text || '';
      if (text === 'まとめ') {
        summaryIndex = i;
        break;
      }
    }
  }

  if (summaryIndex === -1) {
    console.error('「まとめ」セクションが見つかりません！');
    return;
  }

  console.log(`\n「まとめ」セクション位置: index ${summaryIndex}`);

  // 新しいbody: 前半（index 0-37）+ まとめセクション以降
  const newBody = [
    ...article.body.slice(0, 38),  // 前半部分（重複前まで）
    ...article.body.slice(summaryIndex)  // まとめセクション以降
  ];

  console.log(`\n修正後のブロック数: ${newBody.length}`);
  console.log(`削除されたブロック数: ${article.body.length - newBody.length}`);

  // 「次のステップ」という文言を含むブロックを削除
  const cleanedBody = newBody.filter((block, index) => {
    if (block.style === 'normal') {
      const text = block.children?.[0]?.text || '';
      if (text.includes('次のステップ') || text.includes('次の勤務')) {
        console.log(`[${index}] 削除: 「次のステップ」関連コンテンツ - ${text.substring(0, 50)}...`);
        return false;
      }
    }
    return true;
  });

  console.log(`\n「次のステップ」削除後のブロック数: ${cleanedBody.length}`);

  // Sanityに更新
  try {
    console.log('\nSanityに更新中...');
    await client
      .patch(article._id)
      .set({ body: cleanedBody })
      .commit();

    console.log('✅ 記事の更新が完了しました！');
    console.log(`\n修正内容:`);
    console.log(`- H2の重複セクション削除: 3セクション`);
    console.log(`- 「次のステップ」関連コンテンツ削除`);
    console.log(`- 最終ブロック数: ${cleanedBody.length}`);

  } catch (error) {
    console.error('エラー:', error);
  }
}

fixArticle().catch(console.error);
