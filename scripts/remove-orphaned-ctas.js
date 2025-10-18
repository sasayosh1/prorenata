#!/usr/bin/env node

/**
 * 孤立した訴求文（CTA）削除スクリプト
 *
 * アフィリエイトリンクが削除されたが、訴求文だけ残っている箇所を検出して削除します。
 *
 * 使い方:
 *   node scripts/remove-orphaned-ctas.js check              - 削除対象の訴求文を確認
 *   node scripts/remove-orphaned-ctas.js remove --apply     - 実際に削除を実行
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

// 訴求文のパターン
const CTA_PATTERNS = [
  '⚖️ 退職でお悩みの方へ',
  '退職でお悩みの方へ',
  '🔍 関西圏で転職をお考えの方へ',
  '関西圏で転職をお考えの方へ',
  '看護助手の求人を探す',
  'おすすめの転職サービス',
  '👇',
  '▼',
  '弁護士による退職代行サービス',
  '【汐留パートナーズ】',
  '【アルバトロス転職】',
  'について詳しくはこちら'
];

/**
 * テキストに訴求文パターンが含まれるかチェック
 */
function containsCTA(text) {
  if (!text) return false;
  return CTA_PATTERNS.some(pattern => text.includes(pattern));
}

/**
 * ブロックにアフィリエイトリンクが含まれるかチェック
 */
function hasAffiliateLink(block) {
  if (!block || !block.children) return false;

  return block.children.some(child => {
    if (!child.marks || child.marks.length === 0) return false;

    return child.marks.some(markKey => {
      // markKeyが文字列で、長さが10以上の場合はリンクIDの可能性が高い
      return typeof markKey === 'string' && markKey.length > 10;
    });
  });
}

/**
 * 孤立したCTA（訴求文）ブロックを検出
 */
async function findOrphanedCTAs() {
  console.log('🔍 孤立した訴求文を検索中...\n');

  const posts = await client.fetch(`
    *[_type == "post" && defined(body)] {
      _id,
      title,
      "slug": slug.current,
      body
    }
  `);

  const results = [];

  posts.forEach(post => {
    if (!post.body) return;

    const blocksToRemove = [];

    post.body.forEach((block, index) => {
      if (block._type !== 'block' || !block.children) return;

      const text = block.children.map(c => c.text || '').join('');

      // このブロック自体がCTA訴求文を含むかチェック
      if (containsCTA(text)) {
        // このブロック自体にリンクがあるか
        const hasLink = hasAffiliateLink(block);

        if (!hasLink) {
          // リンクがない場合、このブロックは孤立したCTA
          blocksToRemove.push({
            index,
            text: text.trim()
          });
        }
      }
    });

    if (blocksToRemove.length > 0) {
      results.push({
        postId: post._id,
        title: post.title,
        slug: post.slug,
        blocks: blocksToRemove
      });
    }
  });

  return results;
}

/**
 * 孤立したCTAを削除
 */
async function removeOrphanedCTAs(orphanedCTAs, apply = false) {
  if (orphanedCTAs.length === 0) {
    console.log('✅ 孤立した訴求文は見つかりませんでした\n');
    return { removed: 0, failed: 0 };
  }

  console.log(`📊 ${orphanedCTAs.length}記事から孤立した訴求文を削除します\n`);

  let totalRemoved = 0;
  let totalFailed = 0;

  for (const item of orphanedCTAs) {
    console.log(`📝 記事「${item.title}」`);
    console.log(`   ID: ${item.postId}`);
    console.log(`   削除する訴求文ブロック: ${item.blocks.length}個`);

    item.blocks.forEach(block => {
      console.log(`     - [${block.index}] "${block.text.substring(0, 60)}..."`);
    });

    if (!apply) {
      console.log(`   ℹ️  DRY RUN モード（実際には削除しません）\n`);
      continue;
    }

    try {
      // 記事の最新データを取得
      const post = await client.fetch(`*[_id == $id][0]`, { id: item.postId });

      if (!post || !post.body) {
        console.log(`   ⚠️  記事が見つかりません\n`);
        totalFailed++;
        continue;
      }

      // 削除するインデックスを降順でソート（後ろから削除）
      const indices = item.blocks.map(b => b.index).sort((a, b) => b - a);

      let newBody = [...post.body];
      indices.forEach(index => {
        newBody.splice(index, 1);
      });

      // 更新
      await client
        .patch(item.postId)
        .set({ body: newBody })
        .commit();

      console.log(`   ✅ 削除完了\n`);
      totalRemoved += item.blocks.length;

    } catch (error) {
      console.error(`   ❌ エラー: ${error.message}\n`);
      totalFailed++;
    }
  }

  return { removed: totalRemoved, failed: totalFailed };
}

/**
 * メイン処理
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'check';
  const apply = args.includes('--apply');

  console.log('🔗 孤立した訴求文（CTA）削除ツール\n');
  console.log('============================================================\n');

  try {
    const orphanedCTAs = await findOrphanedCTAs();

    if (command === 'check') {
      // チェックのみ
      if (orphanedCTAs.length === 0) {
        console.log('✅ 孤立した訴求文は見つかりませんでした\n');
        return;
      }

      console.log(`🔍 孤立した訴求文が見つかりました: ${orphanedCTAs.length}記事\n`);

      orphanedCTAs.slice(0, 20).forEach((item, i) => {
        console.log(`${i + 1}. ${item.title}`);
        console.log(`   ID: ${item.postId}`);
        console.log(`   削除対象: ${item.blocks.length}個のブロック`);
        item.blocks.forEach(block => {
          console.log(`     - "${block.text.substring(0, 60)}..."`);
        });
        console.log(`   URL: /posts/${item.slug}\n`);
      });

      if (orphanedCTAs.length > 20) {
        console.log(`   ...他 ${orphanedCTAs.length - 20}記事\n`);
      }

      console.log('\n削除を実行するには:');
      console.log('  node scripts/remove-orphaned-ctas.js remove --apply\n');

    } else if (command === 'remove') {
      const result = await removeOrphanedCTAs(orphanedCTAs, apply);

      console.log('============================================================');
      console.log('📊 処理結果サマリー\n');
      console.log(`   対象記事: ${orphanedCTAs.length}件`);
      console.log(`   削除した訴求文ブロック: ${result.removed}個`);
      console.log(`   エラー: ${result.failed}件`);

      if (!apply) {
        console.log('\n⚠️  DRY RUN モード: 実際には削除していません');
        console.log('   実際に削除するには --apply オプションを追加してください\n');
      } else {
        console.log('\n✅ すべての孤立した訴求文を削除しました\n');
      }
    } else {
      console.log('❌ 不明なコマンド: ' + command);
      console.log('\n使い方:');
      console.log('  node scripts/remove-orphaned-ctas.js check');
      console.log('  node scripts/remove-orphaned-ctas.js remove --apply\n');
    }

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  }
}

// 実行
main();
