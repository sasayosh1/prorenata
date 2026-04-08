const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '.env.local'),
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

async function checkNewsletters() {
  try {
    console.log('📋 ニュースレター構造を確認中...\n');

    const newsletters = await client.fetch(
      `*[_type == "newsletter"] | order(emailNumber asc) { 
        _id, 
        emailNumber, 
        subject, 
        body[0...3] { 
          _key, 
          _type, 
          style, 
          children[] { text },
          markDefs
        },
        "bodyLength": length(body)
      }`
    );

    for (const nl of newsletters) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`📧 emailNumber ${nl.emailNumber}`);
      console.log(`件名: ${nl.subject}`);
      console.log(`総ブロック数: ${nl.bodyLength}`);
      console.log(`${'='.repeat(80)}\n`);

      // 最初の3ブロックを表示
      nl.body.forEach((block, idx) => {
        console.log(`ブロック ${idx + 1}:`);
        console.log(`  _type: ${block._type}`);
        console.log(`  style: ${block.style || 'なし'}`);
        if (block.children && block.children.length > 0) {
          const text = block.children.map(c => c.text).join('');
          console.log(`  内容: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
        }
        if (block.markDefs && block.markDefs.length > 0) {
          console.log(`  ⚠️  markDefs あり (${block.markDefs.length}個)`);
        }
        console.log('');
      });
    }
  } catch (error) {
    console.error('❌ エラー:', error.message);
    process.exit(1);
  }
}

checkNewsletters();
