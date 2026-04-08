#!/usr/bin/env node

/**
 * ニュースレターのリライト・修復スクリプト
 *
 * 処理内容:
 * 1. 空のブロックを削除
 * 2. 見出しテキスト（30文字以下で句点なし）を削除または導入文に統合
 * 3. H2/H3を normal に変換
 * 4. Invalid markDef を修正
 * 5. 文章の流れを改善
 *
 * 実行方法:
 * node scripts/rewrite-newsletters.cjs
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

// 見出しテキストの検出（短いテキストで句点なし）
function isHeadingText(block) {
  if (!block || !block.children) return false;

  const text = block.children.map(child =>
    typeof child === 'string' ? child : (child.text || '')
  ).join('');

  // 30文字以下で句点がなく、3文字以上
  return text.length > 2 && text.length <= 30 && !text.includes('。') && !text.includes('？');
}

// 見出しテキストを導入文に統合
function createIntroductionFromHeading(headingText) {
  // 見出しテキストから導入文を生成
  return `まず考えたいのは、${headingText}についてです。`;
}

// ブロックをクリーンアップ
function cleanBlock(block) {
  if (!block) return null;

  // 空のブロックをスキップ
  if (!block.children || block.children.length === 0 ||
      block.children.every(child => !child.text && !child)) {
    return null;
  }

  // markDefs をクリーンアップ
  let markDefs = block.markDefs || [];
  if (Array.isArray(markDefs)) {
    markDefs = markDefs.filter(def => def && def._key && def._type);
  } else {
    markDefs = [];
  }

  return {
    ...block,
    style: block.style === 'h2' || block.style === 'h3' ? 'normal' : block.style,
    markDefs: markDefs.length > 0 ? markDefs : undefined,
  };
}

// ニュースレターを処理
async function rewriteNewsletter(newsletter) {
  const { _id, emailNumber, subject, body } = newsletter;

  if (!body || !Array.isArray(body)) {
    console.log(`⚠️  emailNumber ${emailNumber}: body が無効です`);
    return null;
  }

  let newBody = [];
  let removedBlocks = 0;
  let fixedHeadings = 0;
  let cleanedMarkDefs = 0;

  for (let i = 0; i < body.length; i++) {
    const block = body[i];
    const cleaned = cleanBlock(block);

    if (!cleaned) {
      removedBlocks++;
      continue;
    }

    // 見出しテキストの検出と導入文への変換
    if (isHeadingText(block)) {
      const headingText = block.children.map(child =>
        typeof child === 'string' ? child : (child.text || '')
      ).join('');

      // 次のブロックが存在する場合、導入文を追加
      if (i + 1 < body.length) {
        const introduction = createIntroductionFromHeading(headingText);
        newBody.push({
          _key: block._key || `intro-${i}`,
          _type: 'block',
          style: 'normal',
          children: [{ _key: `text-${i}`, _type: 'span', text: introduction, marks: [] }],
        });
        fixedHeadings++;
      }
    } else {
      // 通常のブロック
      if (cleaned.markDefs && cleaned.markDefs.length > 0) {
        cleanedMarkDefs++;
      }
      newBody.push(cleaned);
    }
  }

  return {
    _id,
    emailNumber,
    subject,
    newBody,
    stats: {
      totalBlocks: body.length,
      removedBlocks,
      fixedHeadings,
      cleanedMarkDefs,
      finalBlocks: newBody.length,
    }
  };
}

async function main() {
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
      const result = await rewriteNewsletter(newsletter);
      if (result) {
        updates.push(result);

        console.log(`📧 emailNumber ${result.emailNumber}`);
        console.log(`   ├─ 削除: ${result.stats.removedBlocks}ブロック`);
        console.log(`   ├─ 見出し統合: ${result.stats.fixedHeadings}個`);
        console.log(`   ├─ markDef修正: ${result.stats.cleanedMarkDefs}個`);
        console.log(`   └─ 最終: ${result.stats.finalBlocks}ブロック`);
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

        console.log(`   ✅ emailNumber ${update.emailNumber} - 完了`);
      }

      console.log('\n✨ すべてのニュースレターがリライトされました！');
    }
  } catch (error) {
    console.error('❌ エラー:', error.message);
    process.exit(1);
  }
}

main();
