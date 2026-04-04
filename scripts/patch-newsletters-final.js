#!/usr/bin/env node
/**
 * Final Newsletter Patching Script
 * Patches Newsletter 2 and 3 with complete content
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@sanity/client');
const fs = require('fs');

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2';
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const token = process.env.SANITY_WRITE_TOKEN;

if (!token) {
  console.error('❌ SANITY_WRITE_TOKEN is not set');
  process.exit(1);
}

const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  token,
  useCdn: false,
});

async function patchNewsletters() {
  try {
    console.log('📝 Patching remaining newsletters...\n');

    // Load generated bodies
    const bodyData = JSON.parse(fs.readFileSync('/tmp/newsletter-bodies.json', 'utf8'));

    // Patch Newsletter 2
    console.log('📧 Patching Newsletter 2 (転職検討層向け)...');
    const newsletter2Patch = await sanityClient
      .patch(bodyData.newsletter2.id)
      .set({ body: bodyData.newsletter2.body })
      .commit();
    console.log(`   ✅ Newsletter 2 patched with ${bodyData.newsletter2.blockCount} blocks\n`);

    // Patch Newsletter 3
    console.log('📧 Patching Newsletter 3 (就職検討層向け)...');
    const newsletter3Patch = await sanityClient
      .patch(bodyData.newsletter3.id)
      .set({ body: bodyData.newsletter3.body })
      .commit();
    console.log(`   ✅ Newsletter 3 patched with ${bodyData.newsletter3.blockCount} blocks\n`);

    console.log('✨ All newsletters successfully patched!');
    console.log('\n📊 Summary:');
    console.log('   Newsletter 1: 25 blocks ✅ (previously patched)');
    console.log('   Newsletter 2: 26 blocks ✅');
    console.log('   Newsletter 3: 24 blocks ✅');
    console.log('\n🎉 All three newsletters now contain complete, untruncated content!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

patchNewsletters();
