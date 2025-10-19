#!/usr/bin/env node

/**
 * Draft記事の自動Publish機能
 *
 * メンテナンススクリプト実行前に、Draft記事を自動的にPublishします。
 *
 * 使い方:
 *   node scripts/publish-drafts.js check   - Draft記事を確認
 *   node scripts/publish-drafts.js publish - Draft記事をPublish（DRY RUN）
 *   node scripts/publish-drafts.js publish --apply - 実際にPublish
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
 * Draft記事を検出
 */
async function findDraftPosts() {
  const query = `*[_type == "post" && _id in path("drafts.**")] {
    _id,
    title,
    "slug": slug.current,
    _createdAt,
    _updatedAt,
    "categories": categories[]->title
  }`;

  try {
    const drafts = await client.fetch(query);

    console.log(`\n📄 Draft記事: ${drafts.length}件\n`);

    if (drafts.length > 0) {
      drafts.forEach((draft, i) => {
        const createdDate = new Date(draft._createdAt);
        const daysAgo = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

        console.log(`${i + 1}. ${draft.title}`);
        console.log(`   Draft ID: ${draft._id}`);
        console.log(`   作成日: ${daysAgo}日前 (${createdDate.toLocaleDateString('ja-JP')})`);
        console.log(`   カテゴリ: ${draft.categories?.join(', ') || 'なし'}`);
        console.log(`   URL: /posts/${draft.slug}\n`);
      });
    }

    return drafts;
  } catch (error) {
    console.error('❌ エラー:', error.message);
    return [];
  }
}

/**
 * Draft記事をPublish
 */
async function publishDraft(draft, apply = false) {
  try {
    const publishedId = draft._id.replace('drafts.', '');

    console.log(`\n📝 Draft「${draft.title}」`);
    console.log(`   Draft ID: ${draft._id}`);
    console.log(`   Published ID: ${publishedId}`);

    if (!apply) {
      console.log(`   ℹ️  DRY RUN モード（実際にはPublishしません）\n`);
      return { published: false, error: false };
    }

    // Draft記事の全データを取得
    const draftDoc = await client.getDocument(draft._id);

    if (!draftDoc) {
      console.log(`   ❌ Draft記事が見つかりません\n`);
      return { published: false, error: true };
    }

    // Draft IDをPublished IDに変更してデータをコピー
    const publishedDoc = {
      ...draftDoc,
      _id: publishedId
    };

    // Draft特有のフィールドを削除
    delete publishedDoc._rev;

    // Published版を作成または更新
    await client.createOrReplace(publishedDoc);

    // Draft版を削除
    await client.delete(draft._id);

    console.log(`   ✅ Publishしました\n`);
    return { published: true, error: false };

  } catch (error) {
    console.error(`   ❌ エラー: ${error.message}\n`);
    return { published: false, error: true };
  }
}

/**
 * 全Draft記事をPublish
 */
async function publishAllDrafts(apply = false) {
  const drafts = await findDraftPosts();

  if (drafts.length === 0) {
    console.log('✅ Draft記事はありません\n');
    return { total: 0, published: 0, errors: 0 };
  }

  console.log(`🚀 ${drafts.length}件のDraft記事をPublishします\n`);
  console.log('============================================================\n');

  let totalPublished = 0;
  let totalErrors = 0;

  for (const draft of drafts) {
    const result = await publishDraft(draft, apply);

    if (result.published) {
      totalPublished++;
    }
    if (result.error) {
      totalErrors++;
    }
  }

  console.log('============================================================');
  console.log('📊 処理結果サマリー\n');
  console.log(`   Draft記事: ${drafts.length}件`);
  console.log(`   Publish完了: ${totalPublished}件`);
  console.log(`   エラー: ${totalErrors}件`);

  if (!apply) {
    console.log('\n⚠️  DRY RUN モード: 実際にはPublishしていません');
    console.log('   実際にPublishするには --apply オプションを追加してください\n');
  } else {
    console.log('\n✅ すべてのDraft記事のPublishが完了しました\n');
  }

  return {
    total: drafts.length,
    published: totalPublished,
    errors: totalErrors
  };
}

/**
 * メイン処理
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'check';
  const apply = args.includes('--apply');

  console.log('📄 Draft記事Publishツール\n');
  console.log('============================================================\n');

  try {
    if (command === 'check') {
      await findDraftPosts();
      console.log('Publishするには:');
      console.log('  node scripts/publish-drafts.js publish --apply\n');

    } else if (command === 'publish') {
      await publishAllDrafts(apply);

    } else {
      console.log('❌ 不明なコマンド: ' + command);
      console.log('\n使い方:');
      console.log('  node scripts/publish-drafts.js check');
      console.log('  node scripts/publish-drafts.js publish --apply\n');
    }

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  }
}

// モジュールとしてもexport
module.exports = {
  findDraftPosts,
  publishDraft,
  publishAllDrafts
};

// 直接実行時
if (require.main === module) {
  main();
}
