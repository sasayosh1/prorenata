const { createClient } = require('@sanity/client');
const { separateAffiliateLinks } = require('./utils/postHelpers');

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
  }`, { slug: 'nursing-assistant-article-019823-1' });

  if (!post) {
    console.log('記事が見つかりません');
    return;
  }

  console.log('=== 元の記事 ===');
  console.log('タイトル:', post.title);
  console.log('段落数:', post.body.length);

  // アフィリエイトリンクを含む段落を探す
  const affiliateParagraphs = post.body.filter(block => {
    if (block._type !== 'block') return false;
    const hasAffiliateLink = block.markDefs?.some(markDef => {
      if (!markDef.href) return false;
      return /a8\.net|affiliate-b\.com|track\./i.test(markDef.href);
    });
    return hasAffiliateLink;
  });

  console.log('アフィリエイトリンクを含む段落数:', affiliateParagraphs.length);

  if (affiliateParagraphs.length > 0) {
    console.log('\n--- 元の段落内容 ---');
    affiliateParagraphs.forEach((para, idx) => {
      const text = para.children?.map(c => c.text || '').join('');
      console.log(`段落${idx + 1}: ${text}`);
    });
  }

  console.log('\n=== 処理後 ===');
  const processedBody = separateAffiliateLinks(post.body);
  console.log('段落数:', processedBody.length);

  // 処理後のアフィリエイトリンクを含む段落を確認
  const processedAffiliateParagraphs = processedBody.filter(block => {
    if (block._type !== 'block') return false;
    const hasAffiliateLink = block.markDefs?.some(markDef => {
      if (!markDef.href) return false;
      return /a8\.net|affiliate-b\.com|track\./i.test(markDef.href);
    });
    return hasAffiliateLink;
  });

  console.log('アフィリエイトリンクを含む段落数:', processedAffiliateParagraphs.length);

  if (processedAffiliateParagraphs.length > 0) {
    console.log('\n--- 処理後の段落内容 ---');
    processedAffiliateParagraphs.forEach((para, idx) => {
      const text = para.children?.map(c => c.text || '').join('');
      console.log(`段落${idx + 1}: ${text}`);
    });
  }

  // 変更があるかチェック
  const changed = JSON.stringify(post.body) !== JSON.stringify(processedBody);
  console.log('\n変更あり:', changed);

})();
