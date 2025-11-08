const { createClient } = require('@sanity/client');
require('dotenv').config({ path: '../.env.local' });

const sanityClient = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN
});

async function checkArticle() {
  try {
    const post = await sanityClient.fetch(
      `*[_type == "post" && slug.current == $slug][0] {
        _id,
        title,
        slug,
        body,
        tags,
        categories[]->{ title }
      }`,
      { slug: 'nursing-assistant-medical-terms' }
    );

    if (!post) {
      console.log('記事が見つかりませんでした。');
      return;
    }

    console.log('=== 記事情報 ===');
    console.log('タイトル:', post.title);
    console.log('Slug:', post.slug.current);
    console.log('タグ:', post.tags);
    console.log('カテゴリ:', post.categories?.map(c => c.title).join(', '));
    console.log('\n=== 本文構造 ===');

    let termCount = 0;
    let h2Count = 0;
    let h3Count = 0;

    post.body.forEach((block, index) => {
      if (block.style === 'h2') {
        h2Count++;
        const text = block.children?.map(c => c.text).join('') || '';
        console.log(`\nH2 [${h2Count}]: ${text}`);
      } else if (block.style === 'h3') {
        h3Count++;
        const text = block.children?.map(c => c.text).join('') || '';
        console.log(`  H3 [${h3Count}]: ${text}`);
        termCount++;
      } else if (block.listItem === 'bullet' || block.listItem === 'number') {
        const text = block.children?.map(c => c.text).join('') || '';
        if (text.includes('：') || text.includes(':')) {
          const short = text.length > 60 ? text.slice(0, 60) + '...' : text;
          console.log(`    - ${short}`);
        }
      }
    });

    console.log(`\n=== カウント ===`);
    console.log(`H2見出し: ${h2Count}個`);
    console.log(`H3見出し: ${h3Count}個`);
    console.log(`総ブロック数: ${post.body.length}`);
  } catch (error) {
    console.error('エラー:', error.message);
  }
}

checkArticle();
