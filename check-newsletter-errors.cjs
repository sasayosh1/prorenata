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

async function checkNewsletterErrors() {
  try {
    console.log('🔍 ニュースレターエラー箇所を検出中...\n');

    const newsletters = await client.fetch(
      `*[_type == "newsletter"] | order(emailNumber asc) { 
        _id, 
        emailNumber, 
        subject, 
        body 
      }`
    );

    for (const nl of newsletters) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`📧 emailNumber ${nl.emailNumber}`);
      console.log(`件名: ${nl.subject}`);
      console.log(`${'='.repeat(80)}\n`);

      // 見出しだった可能性のあるテキスト（短くて独立した文）を検出
      let issues = [];
      nl.body.forEach((block, idx) => {
        if (block._type === 'block' && block.children) {
          const text = block.children.map(c => c.text).join('');
          
          // エラー検出パターン：
          // 1. text が 20 文字以下で、句点がない（見出しの可能性）
          // 2. markDefs に問題がある
          // 3. style が有効でない
          
          if (text.length > 0 && text.length < 30 && !text.includes('。') && !text.includes('？')) {
            issues.push({
              blockIdx: idx,
              text: text,
              type: '見出し化された可能性',
              style: block.style
            });
          }
          
          // text が完全に空のブロック
          if (text.trim().length === 0) {
            issues.push({
              blockIdx: idx,
              text: '(空)',
              type: '空のブロック',
              style: block.style
            });
          }
        }
        
        // markDefs エラー検出
        if (block.markDefs && block.markDefs.length > 0) {
          block.markDefs.forEach((mark, midx) => {
            if (!mark._type || !mark._key) {
              issues.push({
                blockIdx: idx,
                text: `markDef ${midx}: _type=${mark._type}, _key=${mark._key}`,
                type: '⚠️  Invalid markDef'
              });
            }
          });
        }
      });

      if (issues.length > 0) {
        console.log(`⚠️  検出された問題: ${issues.length}件\n`);
        issues.forEach(issue => {
          console.log(`  ブロック ${issue.blockIdx}: [${issue.type}]`);
          console.log(`    内容: ${issue.text}`);
          if (issue.style) console.log(`    style: ${issue.style}`);
          console.log('');
        });
      } else {
        console.log('✅ 問題なし\n');
      }
    }
  } catch (error) {
    console.error('❌ エラー:', error.message);
    process.exit(1);
  }
}

checkNewsletterErrors();
