#!/usr/bin/env node
/**
 * 退職関連記事のアフィリエイトリンクを修正
 * - 転職系アフィリエイト（kaigobatake, humanlifecare）を削除
 * - 退職代行比較記事への内部リンクを追加
 */

const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false
});

// 退職関連記事のslug一覧
const RETIREMENT_SLUGS = [
  'nursing-assistant-resignation-advice-workplace',
  'nursing-assistant-resignation-advice-top',
  'nursing-assistant-quitting-relationships',
  'nursing-assistant-quit-experiences',
  'nursing-assistant-resignation-advice-insights',
  'nursing-assistant-resignation-advice-long',
  'nursing-assistant-resignation-advice',
  'nursing-assistant-before-quitting-considerations',
  'nursing-assistant-quit-retirement'
];

function generateKey() {
  return Math.random().toString(36).substring(2, 10);
}

function findSummaryIndex(blocks) {
  return blocks.findIndex(block =>
    block._type === 'block' &&
    block.style === 'h2' &&
    block.children?.some(child => child.text === 'まとめ')
  );
}

function findDisclaimerIndex(blocks) {
  return blocks.findIndex(block =>
    block._type === 'block' &&
    block.children?.some(child => child.text?.startsWith('免責事項'))
  );
}

async function fixRetirementArticle(slug) {
  console.log(`\n📝 処理中: ${slug}`);

  // 記事を取得
  const post = await client.fetch(`
    *[_type == 'post' && slug.current == $slug][0]{
      _id,
      title,
      body
    }
  `, { slug });

  if (!post) {
    console.log(`  ❌ 記事が見つかりません`);
    return null;
  }

  let body = Array.isArray(post.body) ? [...post.body] : [];
  let changes = [];

  // 1. 転職系アフィリエイトブロックを削除
  const beforeCount = body.length;
  body = body.filter(block => {
    if (block._type === 'affiliateEmbed') {
      const linkKey = block.linkKey || '';
      if (linkKey === 'kaigobatake' || linkKey === 'humanlifecare') {
        changes.push(`削除: ${linkKey}`);
        return false;
      }
    }
    return true;
  });
  const removedCount = beforeCount - body.length;

  // 2. 既存の退職代行比較記事への内部リンクをチェック
  const hasComparisonLink = body.some(block =>
    block._type === 'block' &&
    block.markDefs?.some(mark =>
      mark._type === 'link' &&
      mark.href?.includes('/posts/comparison-of-three-resignation-agencies')
    )
  );

  // 3. 内部リンクがない場合は追加
  if (!hasComparisonLink) {
    const summaryIndex = findSummaryIndex(body);
    const disclaimerIndex = findDisclaimerIndex(body);

    let insertIndex = body.length;
    if (disclaimerIndex !== -1) {
      insertIndex = disclaimerIndex;
    } else if (summaryIndex !== -1) {
      // まとめセクションの最後（次のH2または記事末尾）
      insertIndex = summaryIndex + 1;
      while (insertIndex < body.length && body[insertIndex]._type !== 'block' || body[insertIndex].style !== 'h2') {
        insertIndex++;
      }
    }

    const linkMarkKey = generateKey();
    const internalLinkBlock = {
      _type: 'block',
      _key: `internal-link-${generateKey()}`,
      style: 'normal',
      markDefs: [
        {
          _type: 'link',
          _key: linkMarkKey,
          href: '/posts/comparison-of-three-resignation-agencies'
        }
      ],
      children: [
        {
          _type: 'span',
          text: '退職の段取りを進める前に、看護助手の視点で３社を比較した記事でチェックポイントを整理しておきましょう。 ',
          marks: []
        },
        {
          _type: 'span',
          text: '退職代行３社のメリット・デメリット徹底比較を読む',
          marks: [linkMarkKey]
        }
      ]
    };

    body.splice(insertIndex, 0, internalLinkBlock);
    changes.push('内部リンク追加: comparison-of-three-resignation-agencies');
  }

  if (changes.length === 0) {
    console.log(`  ℹ️  変更なし`);
    return null;
  }

  // 4. Sanityにコミット
  try {
    await client
      .patch(post._id)
      .set({ body })
      .commit();

    console.log(`  ✅ 修正完了`);
    changes.forEach(change => console.log(`     - ${change}`));

    return {
      slug,
      title: post.title,
      removedCount,
      changes
    };
  } catch (error) {
    console.log(`  ❌ コミット失敗: ${error.message}`);
    return null;
  }
}

async function fixAllRetirementArticles() {
  console.log('🔧 退職関連記事のアフィリエイトリンク修正を開始\n');
  console.log(`対象記事: ${RETIREMENT_SLUGS.length}件\n`);

  const results = [];

  for (const slug of RETIREMENT_SLUGS) {
    const result = await fixRetirementArticle(slug);
    if (result) {
      results.push(result);
    }
    // 少し待機（API制限対策）
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n✅ 修正完了: ${results.length}/${RETIREMENT_SLUGS.length}件\n`);

  if (results.length > 0) {
    console.log('修正内容サマリー:');
    results.forEach((result, i) => {
      console.log(`\n${i + 1}. ${result.title}`);
      console.log(`   Slug: ${result.slug}`);
      console.log(`   削除したブロック: ${result.removedCount}件`);
      result.changes.forEach(change => console.log(`   - ${change}`));
    });
  }
}

fixAllRetirementArticles().catch(console.error);
