const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  // Draft documents are hidden unless we query with drafts perspective.
  perspective: 'drafts',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
});

async function checkDrafts() {
  const drafts = await client.fetch(`
    *[_type == "post" && _id in path("drafts.**")] | order(_createdAt desc)[0...10] {
      _id,
      title,
      _createdAt,
      "author": author->name
    }
  `);

  console.log(`\n📝 最近作成されたドラフト記事（10件）:\n`);
  if (drafts.length === 0) {
    console.log('  ❌ ドラフト記事が見つかりません\n');
  } else {
    drafts.forEach((draft, i) => {
      const date = new Date(draft._createdAt);
      const now = new Date();
      const daysAgo = Math.floor((now - date) / (1000 * 60 * 60 * 24));

      console.log(`${i + 1}. ${draft.title}`);
      console.log(`   ID: ${draft._id}`);
      console.log(`   作成日: ${date.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })} (${daysAgo}日前)`);
      console.log(`   著者: ${draft.author || 'なし'}\n`);
    });
  }
}

checkDrafts().catch(console.error);
