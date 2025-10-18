#!/usr/bin/env node

/**
 * 内部リンク自動設置スクリプト
 *
 * 全記事に適切な内部リンクを自動設置します。
 * - 各セクション（H2/H3）の内容を分析
 * - 関連する記事を検索してリンクを挿入
 * - セクション末尾または項目後に配置
 * - 既存の不適切なリンクを修正
 *
 * 使い方:
 *   node scripts/add-internal-links.js check              - リンク設置が必要な記事を確認
 *   node scripts/add-internal-links.js add <POST_ID>      - 特定の記事にリンク追加（DRY RUN）
 *   node scripts/add-internal-links.js add <POST_ID> --apply  - 実際に追加
 *   node scripts/add-internal-links.js add-all --apply    - 全記事に追加
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

// 内部リンクのキーワードマッピング（キーワード → slug）
const KEYWORD_TO_SLUG = {
  '夜勤': 'nursing-assistant-night-shift-hard',
  '夜勤のコツ': 'nursing-assistant-shift-night-shift-tips',
  '給料': 'nursing-assistant-average-salary-data',
  '給与': 'nursing-assistant-average-salary-data',
  '年収': 'nursing-assistant-salary-increase-nurse',
  '資格': 'nursing-assistant-qualifications-needed',
  '資格取得': 'nursing-assistant-get-qualifications-while-working',
  '転職': 'nursing-assistant-job-change-manual',
  '退職': 'nursing-assistant-quit-retirement',
  '辞める': 'nursing-assistant-quit-retirement',
  '辞めたい': 'nursing-assistant-top5-reasons-quitting',
  '仕事内容': 'nursing-assistant-job-description-beginners',
  '業務内容': 'nursing-assistant-job-description-beginners',
  '1日の流れ': 'nursing-assistant-daily-schedule',
  'スケジュール': 'nursing-assistant-daily-schedule',
  '志望動機': 'nursing-assistant-motivation-letter-examples',
  '面接': 'nursing-assistant-interview-questions-answers',
  '人間関係': 'nursing-assistant-stressful-relationships-solutions',
  'ストレス': 'nursing-assistant-stress-ranking',
  'やりがい': 'nursing-assistant-job-fulfillment',
  '向いている人': 'nursing-assistant-who-is-suited',
  '看護師との違い': 'nursing-assistant-vs-nurse-differences',
  '看護師になる': 'nursing-assistant-benefits-becoming-nurse',
  '看護学校': 'nursing-assistant-career-path-nursing-school',
  'キャリアパス': 'nursing-assistant-career-path-design',
  'スキルアップ': 'nursing-assistant-skillup-roadmap',
  '感染対策': 'nursing-assistant-infection-control-manual',
  '手洗い': 'nursing-assistant-infection-control-handwashing',
  'ユニフォーム': 'nursing-assistant-uniform-selection',
  '制服': 'nursing-assistant-uniform-selection',
  'ボーナス': 'nursing-assistant-bonus-situation',
  'シフト勤務': 'nursing-assistant-shift-work-difficultys',
  'パート': 'nursing-assistant-part-time-day',
  '未経験': 'nursing-assistant-qualifications-needed'
};

/**
 * テキストからキーワードを検出し、関連記事のslugを取得
 */
function findRelatedSlugs(text, currentSlug) {
  const relatedSlugs = new Set();

  // テキスト内のキーワードを検索
  for (const [keyword, slug] of Object.entries(KEYWORD_TO_SLUG)) {
    if (text.includes(keyword) && slug !== currentSlug) {
      relatedSlugs.add(slug);
    }
  }

  return Array.from(relatedSlugs);
}

/**
 * セクション（H2/H3）を解析して内部リンクを追加すべき箇所を検出
 */
function analyzeArticleForInternalLinks(post) {
  if (!post.body || post.body.length === 0) return [];

  const recommendations = [];
  let currentSection = null;
  let sectionContent = [];
  let sectionStartIndex = 0;

  post.body.forEach((block, index) => {
    const isHeading = block.style === 'h2' || block.style === 'h3';
    const isLastBlock = index === post.body.length - 1;

    if (isHeading || isLastBlock) {
      // 前のセクションを処理
      if (currentSection && sectionContent.length > 0) {
        const sectionText = sectionContent
          .map(b => b.children?.map(c => c.text).join('') || '')
          .join(' ');

        // セクション内のテキストから関連記事を検索
        const relatedSlugs = findRelatedSlugs(sectionText, post.slug);

        if (relatedSlugs.length > 0) {
          // セクションの最後に内部リンクを追加
          recommendations.push({
            sectionTitle: currentSection,
            insertAfterIndex: index - 1,
            relatedSlugs: relatedSlugs.slice(0, 2), // 最大2つまで
            sectionText: sectionText.substring(0, 100) + '...'
          });
        }
      }

      // 新しいセクション開始
      if (isHeading) {
        currentSection = block.children?.map(c => c.text).join('') || '';
        sectionContent = [];
        sectionStartIndex = index;
      }
    } else {
      // セクション内のコンテンツを追加
      if (block._type === 'block') {
        sectionContent.push(block);
      }
    }
  });

  return recommendations;
}

/**
 * 内部リンクブロックを生成
 */
function createInternalLinkBlock(slug, title, linkText) {
  // markDefのキーを生成（一意なID）
  const markKey = `link-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  return {
    _type: 'block',
    _key: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    style: 'normal',
    children: [
      {
        _type: 'span',
        _key: `span-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: `📖 関連記事: `,
        marks: []
      },
      {
        _type: 'span',
        _key: `span-link-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: linkText || title,
        marks: [markKey]
      }
    ],
    markDefs: [
      {
        _key: markKey,
        _type: 'link',
        href: `/posts/${slug}`
      }
    ]
  };
}

/**
 * 記事に内部リンクを追加
 */
async function addInternalLinksToPost(postId, apply = false) {
  // 記事データを取得
  const post = await client.fetch(`
    *[_id == $id][0] {
      _id,
      title,
      "slug": slug.current,
      body,
      "categories": categories[]->{title}
    }
  `, { id: postId });

  if (!post) {
    console.log(`❌ 記事が見つかりません: ${postId}\n`);
    return { added: 0, failed: true };
  }

  console.log(`\n📝 記事「${post.title}」`);
  console.log(`   ID: ${post._id}`);
  console.log(`   Slug: ${post.slug}`);

  // 内部リンク追加箇所を分析
  const recommendations = analyzeArticleForInternalLinks(post);

  if (recommendations.length === 0) {
    console.log(`   ✅ 適切な内部リンク追加箇所が見つかりません\n`);
    return { added: 0, failed: false };
  }

  console.log(`   🔍 ${recommendations.length}箇所に内部リンクを追加可能`);

  // 全記事データを取得（リンク先のタイトル取得用）
  const allPosts = await client.fetch(`
    *[_type == "post" && defined(slug.current)] {
      "slug": slug.current,
      title
    }
  `);

  const slugToTitle = {};
  allPosts.forEach(p => {
    slugToTitle[p.slug] = p.title;
  });

  let newBody = [...post.body];
  let linksAdded = 0;
  let offset = 0; // インデックスのオフセット

  for (const rec of recommendations) {
    console.log(`   - セクション「${rec.sectionTitle}」の後に追加:`);

    for (const relatedSlug of rec.relatedSlugs) {
      const linkTitle = slugToTitle[relatedSlug];
      if (!linkTitle) {
        console.log(`     ⚠️  リンク先が見つかりません: ${relatedSlug}`);
        continue;
      }

      const linkBlock = createInternalLinkBlock(relatedSlug, linkTitle);
      const insertIndex = rec.insertAfterIndex + 1 + offset;

      console.log(`     📖 「${linkTitle}」`);

      if (apply) {
        newBody.splice(insertIndex, 0, linkBlock);
        offset++;
        linksAdded++;
      }
    }
  }

  if (!apply) {
    console.log(`   ℹ️  DRY RUN モード（実際には追加しません）\n`);
    return { added: 0, failed: false };
  }

  if (linksAdded === 0) {
    console.log(`   ⚠️  追加可能なリンクがありません\n`);
    return { added: 0, failed: false };
  }

  try {
    await client
      .patch(postId)
      .set({ body: newBody })
      .commit();

    console.log(`   ✅ ${linksAdded}個の内部リンクを追加しました\n`);
    return { added: linksAdded, failed: false };

  } catch (error) {
    console.error(`   ❌ エラー: ${error.message}\n`);
    return { added: 0, failed: true };
  }
}

/**
 * 内部リンクが不足している記事を検出
 */
async function checkInternalLinks() {
  console.log('🔍 内部リンクが不足している記事を検索中...\n');

  const posts = await client.fetch(`
    *[_type == "post" && defined(slug.current)] {
      _id,
      title,
      "slug": slug.current,
      body
    }
  `);

  const needsLinks = [];

  for (const post of posts) {
    const recommendations = analyzeArticleForInternalLinks(post);
    if (recommendations.length > 0) {
      needsLinks.push({
        id: post._id,
        title: post.title,
        slug: post.slug,
        linkOpportunities: recommendations.length
      });
    }
  }

  return needsLinks;
}

/**
 * メイン処理
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'check';
  const apply = args.includes('--apply');

  console.log('🔗 内部リンク自動設置ツール\n');
  console.log('============================================================\n');

  try {
    if (command === 'check') {
      const needsLinks = await checkInternalLinks();

      if (needsLinks.length === 0) {
        console.log('✅ すべての記事に適切な内部リンクが設置されています\n');
        return;
      }

      console.log(`📊 内部リンクを追加できる記事: ${needsLinks.length}件\n`);

      needsLinks.slice(0, 20).forEach((item, i) => {
        console.log(`${i + 1}. ${item.title}`);
        console.log(`   ID: ${item.id}`);
        console.log(`   追加可能箇所: ${item.linkOpportunities}箇所`);
        console.log(`   URL: /posts/${item.slug}\n`);
      });

      if (needsLinks.length > 20) {
        console.log(`   ...他 ${needsLinks.length - 20}記事\n`);
      }

      console.log('\n特定の記事にリンクを追加するには:');
      console.log('  node scripts/add-internal-links.js add <POST_ID> --apply');
      console.log('\n全記事に追加するには:');
      console.log('  node scripts/add-internal-links.js add-all --apply\n');

    } else if (command === 'add') {
      const postId = args[1];
      if (!postId) {
        console.log('❌ POST_IDを指定してください\n');
        return;
      }

      await addInternalLinksToPost(postId, apply);

    } else if (command === 'add-all') {
      const needsLinks = await checkInternalLinks();

      console.log(`🚀 ${needsLinks.length}記事に内部リンクを追加します\n`);
      console.log('============================================================\n');

      let totalAdded = 0;
      let totalFailed = 0;

      for (const item of needsLinks) {
        const result = await addInternalLinksToPost(item.id, apply);
        totalAdded += result.added;
        if (result.failed) totalFailed++;
      }

      console.log('============================================================');
      console.log('📊 処理結果サマリー\n');
      console.log(`   対象記事: ${needsLinks.length}件`);
      console.log(`   追加した内部リンク: ${totalAdded}個`);
      console.log(`   エラー: ${totalFailed}件`);

      if (!apply) {
        console.log('\n⚠️  DRY RUN モード: 実際には追加していません');
        console.log('   実際に追加するには --apply オプションを追加してください\n');
      } else {
        console.log('\n✅ すべての記事に内部リンクを追加しました\n');
      }

    } else {
      console.log('❌ 不明なコマンド: ' + command);
      console.log('\n使い方:');
      console.log('  node scripts/add-internal-links.js check');
      console.log('  node scripts/add-internal-links.js add <POST_ID> --apply');
      console.log('  node scripts/add-internal-links.js add-all --apply\n');
    }

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  }
}

// 実行
main();
