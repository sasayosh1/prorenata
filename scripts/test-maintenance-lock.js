#!/usr/bin/env node
/**
 * maintenanceLocked機能の検証テスト
 */

const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false
});

async function testMaintenanceLock() {
  console.log('🔒 maintenanceLocked機能の検証テストを開始\n');

  // テスト対象の記事
  const testSlugs = [
    'comparison-of-three-resignation-agencies',
    'nursing-assistant-compare-services-perspective'
  ];

  console.log('='.repeat(70));
  console.log('\n1. ロック状態の確認\n');

  for (const slug of testSlugs) {
    const post = await client.fetch(`
      *[_type == 'post' && slug.current == $slug][0]{
        _id,
        title,
        maintenanceLocked,
        internalOnly
      }
    `, { slug });

    console.log(`記事: ${post.title}`);
    console.log(`  maintenanceLocked: ${post.maintenanceLocked}`);
    console.log(`  internalOnly: ${post.internalOnly}`);
    console.log('');
  }

  console.log('='.repeat(70));
  console.log('\n2. PUBLIC_POST_FILTERでの除外テスト\n');

  const PUBLIC_POST_FILTER =
    '(!defined(internalOnly) || internalOnly == false) && (!defined(maintenanceLocked) || maintenanceLocked == false)';

  const publicPosts = await client.fetch(`
    *[_type == 'post' && slug.current in $slugs && (${PUBLIC_POST_FILTER})]{
      title,
      slug,
      maintenanceLocked
    }
  `, { slugs: testSlugs });

  if (publicPosts.length === 0) {
    console.log('✅ PUBLIC_POST_FILTERは正常に機能しています');
    console.log('   ロックされた記事は除外されました\n');
  } else {
    console.log('❌ PUBLIC_POST_FILTERが機能していません！');
    console.log(`   ${publicPosts.length}件のロック記事が取得されました:\n`);
    publicPosts.forEach(post => {
      console.log(`   - ${post.title}`);
      console.log(`     maintenanceLocked: ${post.maintenanceLocked}`);
    });
    console.log('');
  }

  console.log('='.repeat(70));
  console.log('\n3. 個別チェック付きクエリのテスト\n');

  for (const slug of testSlugs) {
    const post = await client.fetch(`
      *[_type == 'post' && slug.current == $slug && (!defined(maintenanceLocked) || maintenanceLocked == false)][0]{
        title
      }
    `, { slug });

    if (!post) {
      console.log(`✅ ${slug}: 正しく除外されました`);
    } else {
      console.log(`❌ ${slug}: 除外されませんでした（記事が取得されました）`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n✅ 検証テスト完了\n');
}

testMaintenanceLock().catch(console.error);
