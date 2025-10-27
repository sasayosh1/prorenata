const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
});

/**
 * タイトルからキーワードテール分類
 * - ショートテール: 主要キーワード1-2個（シンプルなタイトル、20-30文字）
 * - ミドルテール: 主要キーワード3-4個（具体的なタイトル、31-45文字）
 * - ロングテール: 主要キーワード5個以上（超具体的、46文字以上）
 */
function classifyTail(title) {
  const length = title.length;

  // 文字数ベースの簡易分類（調整後）
  if (length <= 30) {
    return 'short';
  } else if (length <= 45) {
    return 'middle';
  } else {
    return 'long';
  }
}

function getTailLabel(tail) {
  switch (tail) {
    case 'short':
      return 'ショート';
    case 'middle':
      return 'ミドル';
    case 'long':
      return 'ロング';
    default:
      return '不明';
  }
}

async function analyzeKeywordTail() {
  console.log('\n📊 キーワードテール分析\n');
  console.log('='.repeat(80));

  try {
    const posts = await client.fetch(`
      *[_type == "post"] {
        _id,
        title,
        "slug": slug.current,
        _createdAt
      } | order(_createdAt desc)
    `);

    console.log(`総記事数: ${posts.length}件\n`);

    const tailCount = {
      short: [],
      middle: [],
      long: []
    };

    posts.forEach(post => {
      const tail = classifyTail(post.title);
      tailCount[tail].push(post);
    });

    const shortCount = tailCount.short.length;
    const middleCount = tailCount.middle.length;
    const longCount = tailCount.long.length;

    const shortPercent = ((shortCount / posts.length) * 100).toFixed(1);
    const middlePercent = ((middleCount / posts.length) * 100).toFixed(1);
    const longPercent = ((longCount / posts.length) * 100).toFixed(1);

    console.log('【テール分布】\n');
    console.log(`  ショートテール（1-2語、20-30文字）: ${shortCount}件 (${shortPercent}%)`);
    console.log(`  ミドルテール（3-4語、31-45文字）  : ${middleCount}件 (${middlePercent}%)`);
    console.log(`  ロングテール（5語以上、46文字-）  : ${longCount}件 (${longPercent}%)\n`);

    console.log('【目標比率（CLAUDE.md）】\n');
    console.log('  ショートテール: 10-15% (15-20記事 / 150記事中)');
    console.log('  ミドルテール  : 35-40% (50-60記事 / 150記事中)');
    console.log('  ロングテール  : 45-55% (70-80記事 / 150記事中)\n');

    console.log('='.repeat(80));

    // 不足しているテールを表示
    const targetShort = 12.5; // 10-15%の中央値
    const targetMiddle = 37.5; // 35-40%の中央値
    const targetLong = 50; // 45-55%の中央値

    const shortDiff = parseFloat(shortPercent) - targetShort;
    const middleDiff = parseFloat(middlePercent) - targetMiddle;
    const longDiff = parseFloat(longPercent) - targetLong;

    console.log('\n【不足/過剰分析】\n');

    if (shortDiff < -2) {
      console.log(`  🔴 ショートテール不足: ${Math.abs(shortDiff).toFixed(1)}% （目標より少ない）`);
    } else if (shortDiff > 2) {
      console.log(`  ⚠️  ショートテール過剰: +${shortDiff.toFixed(1)}% （目標より多い）`);
    } else {
      console.log(`  ✅ ショートテール: 適正範囲`);
    }

    if (middleDiff < -2) {
      console.log(`  🔴 ミドルテール不足: ${Math.abs(middleDiff).toFixed(1)}% （目標より少ない）`);
    } else if (middleDiff > 2) {
      console.log(`  ⚠️  ミドルテール過剰: +${middleDiff.toFixed(1)}% （目標より多い）`);
    } else {
      console.log(`  ✅ ミドルテール: 適正範囲`);
    }

    if (longDiff < -2) {
      console.log(`  🔴 ロングテール不足: ${Math.abs(longDiff).toFixed(1)}% （目標より少ない）`);
    } else if (longDiff > 2) {
      console.log(`  ⚠️  ロングテール過剰: +${longDiff.toFixed(1)}% （目標より多い）`);
    } else {
      console.log(`  ✅ ロングテール: 適正範囲`);
    }

    console.log('\n='.repeat(80));

    // サンプル表示
    console.log('\n【ショートテールの例（TOP10）】\n');
    tailCount.short.slice(0, 10).forEach((post, i) => {
      console.log(`${i + 1}. ${post.title} (${post.title.length}文字)`);
    });

    console.log('\n【ミドルテールの例（TOP10）】\n');
    tailCount.middle.slice(0, 10).forEach((post, i) => {
      console.log(`${i + 1}. ${post.title} (${post.title.length}文字)`);
    });

    console.log('\n【ロングテールの例（TOP10）】\n');
    tailCount.long.slice(0, 10).forEach((post, i) => {
      console.log(`${i + 1}. ${post.title} (${post.title.length}文字)`);
    });

    console.log('\n='.repeat(80));

    return {
      total: posts.length,
      short: { count: shortCount, percent: parseFloat(shortPercent), posts: tailCount.short },
      middle: { count: middleCount, percent: parseFloat(middlePercent), posts: tailCount.middle },
      long: { count: longCount, percent: parseFloat(longPercent), posts: tailCount.long }
    };
  } catch (error) {
    console.error('❌ エラー:', error.message);
    return null;
  }
}

analyzeKeywordTail().catch(console.error);

module.exports = { analyzeKeywordTail, classifyTail };
