import { createClient } from '@sanity/client';
import { MOSHIMO_LINKS } from './moshimo-affiliate-links.js';

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN
});

const query = `
  *[_type == "post"] {
    _id,
    title,
    "slug": slug.current,
    "links": body[_type == "block"].markDefs[_type == "link"] {
      href
    }
  }
`;

const posts = await client.fetch(query);

// ファイル登録済みのアフィリエイト情報をマップ化
const affiliateStats = {};

Object.entries(MOSHIMO_LINKS).forEach(([key, link]) => {
  if (!link.active) return;

  affiliateStats[key] = {
    name: link.name,
    category: link.category,
    url: link.url,
    reward: link.reward,
    linkCount: 0,
    articleCount: 0,
    articles: new Set()
  };
});

// 各記事のリンクを分析
posts.forEach(post => {
  if (!post.links || post.links.length === 0) return;

  post.links.forEach(link => {
    if (!link || !link.href) return;
    const href = link.href || '';

    // アフィリエイトリンクでない場合はスキップ
    const isAffiliate = href.includes('af.moshimo.com') ||
                       href.includes('amazon.co.jp') ||
                       href.includes('valuecommerce.com') ||
                       href.includes('a8.net');

    if (!isAffiliate) return;

    // どのアフィリエイトに該当するか判定
    let matched = false;
    Object.entries(MOSHIMO_LINKS).forEach(([key, affiliate]) => {
      if (!affiliate.active || matched) return;

      // URLの主要部分を抽出して比較
      const extractId = (url) => {
        const aIdMatch = url.match(/a_id=(\d+)/);
        const pIdMatch = url.match(/p_id=(\d+)/);
        const sidMatch = url.match(/sid=(\d+)/);
        const pidMatch = url.match(/pid=(\d+)/);
        const a8Match = url.match(/a8mat=([^&\s]+)/);

        return {
          aId: aIdMatch ? aIdMatch[1] : null,
          pId: pIdMatch ? pIdMatch[1] : null,
          sid: sidMatch ? sidMatch[1] : null,
          pid: pidMatch ? pidMatch[1] : null,
          a8: a8Match ? a8Match[1] : null
        };
      };

      const hrefIds = extractId(href);
      const affiliateIds = extractId(affiliate.url);

      // IDが一致するか判定
      const isMatch =
        (hrefIds.aId && affiliateIds.aId && hrefIds.aId === affiliateIds.aId) ||
        (hrefIds.sid && affiliateIds.sid && hrefIds.sid === affiliateIds.sid) ||
        (hrefIds.a8 && affiliateIds.a8 && hrefIds.a8 === affiliateIds.a8);

      if (isMatch) {
        affiliateStats[key].linkCount++;
        affiliateStats[key].articles.add(post._id);
        matched = true;
      }
    });
  });
});

// 記事数を計算
Object.keys(affiliateStats).forEach(key => {
  affiliateStats[key].articleCount = affiliateStats[key].articles.size;
  delete affiliateStats[key].articles; // Setは表示しない
});

// 使用回数順にソート
const sortedStats = Object.entries(affiliateStats)
  .sort((a, b) => b[1].linkCount - a[1].linkCount);

console.log('📊 ファイル登録済みアフィリエイト詳細統計\n');
console.log('================================================================================\n');

let totalLinks = 0;
let totalArticles = new Set();

sortedStats.forEach(([key, stats], index) => {
  console.log(`${index + 1}. ${stats.name}`);
  console.log(`   カテゴリ: ${stats.category}`);
  console.log(`   報酬: ${stats.reward}`);
  console.log(`   リンク使用回数: ${stats.linkCount}回`);
  console.log(`   使用記事数: ${stats.articleCount}記事`);
  console.log(`   使用割合: ${((stats.linkCount / posts.length) * 100).toFixed(1)}% (全記事中)`);
  console.log('');

  totalLinks += stats.linkCount;
});

console.log('================================================================================\n');
console.log('📈 総合統計:\n');
console.log(`総記事数: ${posts.length}件`);
console.log(`アフィリエイト種類数: ${sortedStats.length}種類`);
console.log(`アフィリエイトリンク総数: ${totalLinks}件`);
console.log(`アフィリエイトを含む記事数: ${posts.filter(p => p.links && p.links.length > 0).length}件`);
console.log('');

// カテゴリ別集計
const categoryStats = {};
sortedStats.forEach(([key, stats]) => {
  if (!categoryStats[stats.category]) {
    categoryStats[stats.category] = {
      linkCount: 0,
      articleCount: 0
    };
  }
  categoryStats[stats.category].linkCount += stats.linkCount;
  categoryStats[stats.category].articleCount += stats.articleCount;
});

console.log('📂 カテゴリ別統計:\n');
Object.entries(categoryStats)
  .sort((a, b) => b[1].linkCount - a[1].linkCount)
  .forEach(([category, stats]) => {
    console.log(`${category}:`);
    console.log(`  リンク数: ${stats.linkCount}回`);
    console.log(`  使用記事数: ${stats.articleCount}記事`);
    console.log(`  割合: ${((stats.linkCount / totalLinks) * 100).toFixed(1)}%`);
    console.log('');
  });
