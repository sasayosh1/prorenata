const { createClient } = require('@sanity/client');
const { removeClosingRemarks } = require('./utils/postHelpers');

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN
});

(async () => {
  const post = await client.fetch(`*[_type == 'post' && slug.current == $slug][0] {
    _id,
    title,
    body
  }`, { slug: 'nursing-assistant-article-945126-1' });

  if (!post) {
    console.log('記事が見つかりません');
    return;
  }

  console.log('=== 元の記事 ===');
  console.log('タイトル:', post.title);
  console.log('段落数:', post.body.length);

  // 最後の5段落を表示
  console.log('\n--- 最後の5段落 ---');
  const lastBlocks = post.body.slice(-5);
  lastBlocks.forEach((block, idx) => {
    if (block._type === 'block') {
      const text = block.children?.map(c => c.text || '').join('');
      console.log(`段落${idx + 1}: ${text}`);
    }
  });

  console.log('\n=== 処理後 ===');
  const processedBody = removeClosingRemarks(post.body);
  console.log('段落数:', processedBody.length);

  // 最後の5段落を表示
  console.log('\n--- 処理後の最後の5段落 ---');
  const lastProcessedBlocks = processedBody.slice(-5);
  lastProcessedBlocks.forEach((block, idx) => {
    if (block._type === 'block') {
      const text = block.children?.map(c => c.text || '').join('');
      console.log(`段落${idx + 1}: ${text}`);
    }
  });

  // 変更があるかチェック
  const changed = JSON.stringify(post.body) !== JSON.stringify(processedBody);
  console.log('\n変更あり:', changed);

})();
