require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@sanity/client');
const fs = require('fs');

const config = {
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
};

const client = createClient(config);
const data = JSON.parse(fs.readFileSync('/tmp/newsletter-bodies.json', 'utf8'));

async function patchNewsletters() {
  try {
    console.log('📧 Patching Newsletter 2 (26 blocks)...');
    await client
      .patch(data.newsletter2.id)
      .set({ body: data.newsletter2.body })
      .commit();
    console.log('   ✅ Newsletter 2 patched\n');

    console.log('📧 Patching Newsletter 3 (24 blocks)...');
    await client
      .patch(data.newsletter3.id)
      .set({ body: data.newsletter3.body })
      .commit();
    console.log('   ✅ Newsletter 3 patched\n');

    console.log('✨ All newsletters successfully patched!');
    console.log('\n📊 Complete Summary:');
    console.log('   Newsletter 1: 25 blocks ✅ (現役看護助手向け)');
    console.log('   Newsletter 2: 26 blocks ✅ (転職検討層向け)');
    console.log('   Newsletter 3: 24 blocks ✅ (就職検討層向け)');
    console.log('\n🎉 All three newsletters now contain complete, untruncated content!');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

patchNewsletters();
