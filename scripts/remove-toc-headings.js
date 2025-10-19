#!/usr/bin/env node

/**
 * Body内の「もくじ」H2見出し削除スクリプト
 *
 * 理由: body外部に自動生成される目次があるため、body内の「もくじ」見出しは不要
 *
 * 使い方:
 *   node scripts/remove-toc-headings.js check          - もくじ見出しを含む記事を確認
 *   node scripts/remove-toc-headings.js remove --apply - 実際に削除
 */

const { createClient } = require('@sanity/client');
require('dotenv').config({ path: '.env.local' });

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
});

/**
 * もくじ見出しを含む記事を検出
 */
async function findPostsWithTOC() {
  const query = `*[_type == "post"] {
    _id,
    title,
    "slug": slug.current,
    body
  }`;

  try {
    const posts = await client.fetch(query);
    const postsWithTOC = [];

    posts.forEach(post => {
      if (!post.body || !Array.isArray(post.body)) return;

      const tocBlocks = post.body.filter(block => {
        if (block._type !== 'block') return false;
        if (block.style !== 'h2' && block.style !== 'h3') return false;

        const text = block.children
          ?.map(c => c.text || '')
          .join('')
          .trim();

        return /^(もくじ|目次|この記事の目次)$/i.test(text);
      });

      if (tocBlocks.length > 0) {
        postsWithTOC.push({
          ...post,
          tocBlocks,
          tocCount: tocBlocks.length
        });
      }
    });

    return postsWithTOC;

  } catch (error) {
    console.error('❌ エラー:', error.message);
    return [];
  }
}

/**
 * 記事から「もくじ」見出しを削除
 */
async function removeTOCFromPost(post, apply = false) {
  try {
    console.log(`\n📝 記事「${post.title}」`);
    console.log(`   ID: ${post._id}`);
    console.log(`   もくじ見出し数: ${post.tocCount}個`);

    if (!apply) {
      console.log(`   ℹ️  DRY RUN モード（実際には削除しません）`);
      post.tocBlocks.forEach((block, i) => {
        const text = block.children?.map(c => c.text).join('');
        console.log(`   - ${block.style}: "${text}"`);
      });
      return { removed: false, error: false };
    }

    // もくじブロックを除外
    const tocKeys = new Set(post.tocBlocks.map(b => b._key));
    const newBody = post.body.filter(block => !tocKeys.has(block._key));

    // 更新
    await client
      .patch(post._id)
      .set({ body: newBody })
      .commit();

    console.log(`   ✅ ${post.tocCount}個のもくじ見出しを削除しました\n`);
    return { removed: true, error: false, count: post.tocCount };

  } catch (error) {
    console.error(`   ❌ エラー: ${error.message}\n`);
    return { removed: false, error: true };
  }
}

/**
 * メイン処理
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'check';
  const apply = args.includes('--apply');

  console.log('🗑️  Body内「もくじ」見出し削除ツール\n');
  console.log('============================================================\n');

  // Draft記事を自動Publish
  if (apply && command === 'remove') {
    const { publishAllDrafts } = require('./publish-drafts');
    console.log('🔄 Draft記事を自動的にPublishします...\n');
    const publishResult = await publishAllDrafts(true);

    if (publishResult.published > 0) {
      console.log(`✅ ${publishResult.published}件のDraft記事をPublishしました\n`);
      console.log('============================================================\n');
    }
  }

  try {
    const postsWithTOC = await findPostsWithTOC();

    if (postsWithTOC.length === 0) {
      console.log('✅ Body内に「もくじ」見出しを含む記事はありません\n');
      return;
    }

    console.log(`📊 もくじ見出しを含む記事: ${postsWithTOC.length}件\n`);

    if (command === 'check') {
      let totalTOCBlocks = 0;

      postsWithTOC.forEach((post, i) => {
        console.log(`${i + 1}. ${post.title}`);
        console.log(`   ID: ${post._id}`);
        console.log(`   もくじ見出し数: ${post.tocCount}個`);
        post.tocBlocks.forEach(block => {
          const text = block.children?.map(c => c.text).join('');
          console.log(`   - ${block.style}: "${text}"`);
        });
        console.log(`   URL: /posts/${post.slug}\n`);
        totalTOCBlocks += post.tocCount;
      });

      console.log(`\n合計: ${totalTOCBlocks}個のもくじ見出し\n`);
      console.log('削除するには:');
      console.log('  node scripts/remove-toc-headings.js remove --apply\n');

    } else if (command === 'remove') {
      console.log(`🚀 ${postsWithTOC.length}記事からもくじ見出しを削除します\n`);
      console.log('============================================================\n');

      let totalRemoved = 0;
      let totalCount = 0;
      let totalFailed = 0;

      for (const post of postsWithTOC) {
        const result = await removeTOCFromPost(post, apply);

        if (result.removed) {
          totalRemoved++;
          totalCount += result.count;
        }
        if (result.error) {
          totalFailed++;
        }
      }

      console.log('============================================================');
      console.log('📊 処理結果サマリー\n');
      console.log(`   対象記事: ${postsWithTOC.length}件`);
      console.log(`   削除完了: ${totalRemoved}件`);
      console.log(`   削除した見出し数: ${totalCount}個`);
      console.log(`   エラー: ${totalFailed}件`);

      if (!apply) {
        console.log('\n⚠️  DRY RUN モード: 実際には削除していません');
        console.log('   実際に削除するには --apply オプションを追加してください\n');
      } else {
        console.log('\n✅ すべてのもくじ見出しの削除が完了しました\n');
      }

    } else {
      console.log('❌ 不明なコマンド: ' + command);
      console.log('\n使い方:');
      console.log('  node scripts/remove-toc-headings.js check');
      console.log('  node scripts/remove-toc-headings.js remove --apply\n');
    }

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  }
}

// 実行
main();
