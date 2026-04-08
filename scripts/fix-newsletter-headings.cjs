#!/usr/bin/env node

/**
 * ニュースレターのH2/H3タグをnormalに変換するスクリプト
 * 用途: 記事構成と読みやすさを保ちながら見出しタグを削除
 *
 * 実行方法:
 * node scripts/fix-newsletter-headings.cjs
 */

const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '..', '.env.local'),
  override: true,
});

const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
});

async function fixNewsletters() {
  try {
    console.log('🔍 ニュースレターを取得中...\n');

    // Fetch all newsletters
    const newsletters = await client.fetch(
      `*[_type == "newsletter"] | order(emailNumber asc) { _id, emailNumber, subject, body }`
    );

    console.log(`✅ ${newsletters.length}件のニュースレターが見つかりました\n`);

    const updates = [];

    // Process each newsletter
    for (const newsletter of newsletters) {
      const { _id, emailNumber, subject } = newsletter;
      let headingCount = 0;

      // Convert H2/H3 to normal style
      const newBody = newsletter.body.map((block) => {
        if (block.style === 'h2' || block.style === 'h3') {
          headingCount++;
          return {
            ...block,
            style: 'normal',
          };
        }
        return block;
      });

      if (headingCount > 0) {
        console.log(`📧 emailNumber ${emailNumber}`);
        console.log(`   └─ ${headingCount}個のHeading タグを削除`);
        console.log(`   └─ 件名: ${subject.substring(0, 50)}...`);

        updates.push({
          _id,
          newBody,
          headingCount,
        });
      }
    }

    // Commit updates
    if (updates.length > 0) {
      console.log(`\n📤 ${updates.length}件の更新をコミット中...\n`);

      for (const update of updates) {
        await client
          .patch(update._id)
          .set({ body: update.newBody })
          .commit();

        console.log(`   ✅ emailNumber ${newsletters.find(n => n._id === update._id).emailNumber} - 完了`);
      }

      console.log('\n✨ すべてのニュースレターが修正されました！');
    } else {
      console.log('ℹ️  H2/H3タグなし - 修正不要');
    }
  } catch (error) {
    console.error('❌ エラー:', error.message);
    process.exit(1);
  }
}

fixNewsletters();
