const { createClient } = require('@sanity/client');
const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false
});

async function summary() {
  const posts = await client.fetch(`
    *[_type == 'post'] {
      _id,
      title,
      body
    }
  `);

  let totalPosts = posts.length;
  let postsWithInternalLinks = 0;
  let postsWithAffiliateLinks = 0;
  let postsWithExternalLinks = 0;
  let totalInternalLinks = 0;
  let totalAffiliateLinks = 0;
  let totalExternalLinks = 0;

  posts.forEach(post => {
    if (!post.body) return;

    let hasInternal = false;
    let hasAffiliate = false;
    let hasExternal = false;

    post.body.forEach(block => {
      if (!block.markDefs) return;

      block.markDefs.forEach(def => {
        if (def._type === 'link' && def.href) {
          // 内部リンク
          if (def.href.startsWith('/posts/')) {
            hasInternal = true;
            totalInternalLinks++;
          }
          // アフィリエイトリンク
          else if (def.href.includes('af.moshimo.com') || def.href.includes('amazon.co.jp') || def.href.includes('tcs-asp.net')) {
            hasAffiliate = true;
            totalAffiliateLinks++;
          }
          // 外部リンク（出典など）
          else if (def.href.startsWith('http')) {
            hasExternal = true;
            totalExternalLinks++;
          }
        }
      });
    });

    if (hasInternal) postsWithInternalLinks++;
    if (hasAffiliate) postsWithAffiliateLinks++;
    if (hasExternal) postsWithExternalLinks++;
  });

  console.log('📊 リンク実装状況サマリー\n');
  console.log('='.repeat(60));
  console.log(`総記事数: ${totalPosts}件\n`);

  console.log('【内部リンク】');
  console.log(`  記事数: ${postsWithInternalLinks}件 (${Math.round(postsWithInternalLinks/totalPosts*100)}%)`);
  console.log(`  総数: ${totalInternalLinks}個`);
  console.log(`  平均: ${(totalInternalLinks/totalPosts).toFixed(1)}個/記事\n`);

  console.log('【アフィリエイトリンク】');
  console.log(`  記事数: ${postsWithAffiliateLinks}件 (${Math.round(postsWithAffiliateLinks/totalPosts*100)}%)`);
  console.log(`  総数: ${totalAffiliateLinks}個`);
  console.log(`  平均: ${(totalAffiliateLinks/totalPosts).toFixed(1)}個/記事\n`);

  console.log('【外部リンク（出典など）】');
  console.log(`  記事数: ${postsWithExternalLinks}件 (${Math.round(postsWithExternalLinks/totalPosts*100)}%)`);
  console.log(`  総数: ${totalExternalLinks}個`);
  console.log(`  平均: ${(totalExternalLinks/totalPosts).toFixed(1)}個/記事`);
  console.log('='.repeat(60));
}

summary().catch(console.error);
