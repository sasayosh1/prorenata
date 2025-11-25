#!/usr/bin/env node
/**
 * タイトルと冒頭文を一括最適化
 * - 【】括弧を削除
 * - タイトルを30〜40文字に調整
 * - 冒頭の挨拶文を削除
 */

const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false
});

// 挨拶文パターン
const GREETING_PATTERNS = [
  /^(こんにちは|はじめまして|ようこそ)[。、！]/,
  /白崎セラです[。、！]/,
  /ProReNataブログ編集長の白崎セラです/,
  /ProReNataブログ編集長の看護助手です/,
  /ProReNataブログへようこそ/,
  /病棟で看護助手として働き始めて.*年になります/,
  /もうすぐ\d+年になります/,
  /皆さんの毎日の「お疲れさま」を応援しています/,
  /\d+歳の看護助手として、日々患者さんのケアに携わっています/
];

// タイトル最適化ルール
const TITLE_OPTIMIZATIONS = {
  // 【】括弧を削除して簡潔に
  'nursing-assistant-job-role-patient': '外来で役立つコミュニケーション術とスムーズな業務進行のコツ',
  'nursing-assistant-job-role': '看護助手とは？仕事内容から必要なスキルまで徹底解説',
  'nursing-assistant-job-market-analysis': '看護助手求人市場分析｜2025年上半期の動向と今後の予測',
  'nursing-assistant-latest-salary-comparison': '2025年最新｜看護助手の給料相場を職場別・地域別に徹底比較',
  'nursing-assistant-fee-revision-impact': '2024年診療報酬改定｜看護助手の業務範囲拡大が与える影響',
  'nursing-assistant-quit-retirement': '看護助手が辞めたいと思ったら？退職の選択肢とサービス比較',
  'nursing-assistant-career-change-experience': '看護助手が抱えがちな悩みと相談事例｜人間関係・技術・キャリアアップ',
  'nursing-assistant-no-experience': '看護助手の経験とは？未経験からベテランまで着実に成長する実践ガイド',
  'nursing-assistant-career-method': '看護助手の転職｜働きながら理想の職場を見つける方法',
  'nursing-assistant-night-shift-practical': '看護助手の夜勤・交代制勤務を乗り切る5つのコツ',

  // 長いタイトルを短縮
  'nursing-assistant-resignation-advice-workplace': '看護助手の円満退職完全ガイド｜同僚への伝え方から有給消化まで',
  'nursing-assistant-career-change-compass': '働きながら独学で医療知識を深める学習法とキャリアアップのヒント',
  'nursing-assistant-mental-care-patient': '看護助手の小さな行動が病棟全体に与える影響力と連携の秘訣',
  'nursing-assistant-mental-care-stress': '看護助手が精神的にきつい理由とストレスと向き合う秘策',
  'nursing-assistant-mental-care-compass': '看護助手として精神的に安定してやりがいを感じ続ける方法',
  'nursing-assistant-workplace-fit': '看護助手の質問苦手を克服｜職場で自信を持って聞ける実践ガイド',
  'nursing-assistant-patient-safety-key': '点滴ルートの基礎知識と患者安全を守る観察ポイント',
  'nursing-assistant-career-change-recommended': '看護助手の未来は暗くない｜経験を強みに変えるキャリア選択',
  'nursing-assistant-care-guide': '日々のケアが自信に変わる｜看護助手としてブランドを築く方法'
};

async function optimizeTitleAndIntro(slug) {
  console.log(`\n📝 処理中: ${slug}`);

  // maintenanceLockedチェック付き
  const post = await client.fetch(`
    *[_type == 'post' && slug.current == $slug && (!defined(maintenanceLocked) || maintenanceLocked == false)][0]{
      _id,
      title,
      body,
      maintenanceLocked
    }
  `, { slug });

  if (!post) {
    console.log(`  ❌ 記事が見つかりません`);
    return null;
  }

  const updates = {};
  const changes = [];
  const originalTitle = post.title;

  // 1. タイトル最適化
  if (TITLE_OPTIMIZATIONS[slug]) {
    const newTitle = TITLE_OPTIMIZATIONS[slug];
    if (newTitle !== originalTitle) {
      updates.title = newTitle;
      changes.push(`タイトル変更: ${originalTitle.length}文字 → ${newTitle.length}文字`);
    }
  }

  // 2. 冒頭の挨拶文削除
  let body = Array.isArray(post.body) ? [...post.body] : [];
  let greetingRemoved = false;

  if (body.length > 0 && body[0]._type === 'block' && body[0].style === 'normal') {
    const firstBlockText = body[0].children?.map(c => c.text).join('') || '';

    for (const pattern of GREETING_PATTERNS) {
      if (pattern.test(firstBlockText)) {
        body = body.slice(1); // 最初のブロックを削除
        greetingRemoved = true;
        changes.push(`冒頭挨拶文削除: ${firstBlockText.substring(0, 50)}...`);
        break;
      }
    }
  }

  if (greetingRemoved) {
    updates.body = body;
  }

  if (Object.keys(updates).length === 0) {
    console.log(`  ℹ️  変更なし`);
    return null;
  }

  // 3. Sanityにコミット
  try {
    await client
      .patch(post._id)
      .set(updates)
      .commit();

    console.log(`  ✅ 修正完了`);
    changes.forEach(change => console.log(`     - ${change}`));

    return {
      slug,
      originalTitle,
      newTitle: updates.title || originalTitle,
      changes
    };
  } catch (error) {
    console.log(`  ❌ コミット失敗: ${error.message}`);
    return null;
  }
}

async function optimizeAllTitlesAndIntros() {
  console.log('🔧 タイトル・冒頭文の一括最適化を開始\n');

  const targetSlugs = Object.keys(TITLE_OPTIMIZATIONS);
  console.log(`対象記事: ${targetSlugs.length}件\n`);

  const results = [];

  for (const slug of targetSlugs) {
    const result = await optimizeTitleAndIntro(slug);
    if (result) {
      results.push(result);
    }
    // 少し待機（API制限対策）
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n' + '='.repeat(70));
  console.log(`\n✅ 最適化完了: ${results.length}/${targetSlugs.length}件\n`);

  if (results.length > 0) {
    console.log('修正内容サマリー:\n');
    results.forEach((result, i) => {
      console.log(`${i + 1}. ${result.slug}`);
      console.log(`   修正前: ${result.originalTitle}`);
      console.log(`   修正後: ${result.newTitle}`);
      result.changes.forEach(change => console.log(`   - ${change}`));
      console.log('');
    });
  }
}

optimizeAllTitlesAndIntros().catch(console.error);
