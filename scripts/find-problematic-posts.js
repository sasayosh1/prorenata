const { createClient } = require('@sanity/client');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local'), override: true });

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN || process.env.SANITY_TOKEN,
  useCdn: false
});

async function findProblems() {
  const posts = await client.fetch(`*[_type == "post"]{ _id, title, "slug": slug.current, body }`);
  console.log(`Checking ${posts.length} posts...`);

  const results = {
    shortSummaries: [],
    weirdAffiliates: []
  };

  posts.forEach(post => {
    if (!post.body || !Array.isArray(post.body)) return;

    // Check Summary
    const summaryIndex = post.body.findIndex(b => b.style === 'h2' && (b.children?.[0]?.text === 'まとめ' || b.children?.[0]?.text === 'さいごに'));
    if (summaryIndex !== -1) {
      const remaining = post.body.slice(summaryIndex + 1);
      const contentBlocks = remaining.filter(b => b.style === 'normal' || b.listItem);
      if (contentBlocks.length <= 1) {
        results.shortSummaries.push({ slug: post.slug, title: post.title, count: contentBlocks.length });
      }
    }

    // Check Affiliates
    post.body.forEach((block, i) => {
      if (block._type === 'affiliateEmbed') {
        const prev = post.body[i - 1];
        if (prev && (prev.style === 'h2' || prev.style === 'h3' || prev.listItem)) {
          results.weirdAffiliates.push({ slug: post.slug, title: post.title, reason: `After ${prev.style || 'list'}` });
        }
      }
    });
  });

  console.log('\n--- Short Summaries ---');
  results.shortSummaries.forEach(p => console.log(`${p.slug}: ${p.count} blocks`));

  console.log('\n--- Weird Affiliates ---');
  results.weirdAffiliates.forEach(p => console.log(`${p.slug}: ${p.reason}`));
}

findProblems().catch(console.error);
