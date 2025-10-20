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
    "links": body[_type == "block"].children[_type == "link"] {
      href,
      "text": ^.children[marks == ^._key][0].text
    }
  }
`;

const posts = await client.fetch(query);

// ファイル登録済みのURL一覧を取得
const registeredUrls = Object.values(MOSHIMO_LINKS)
  .filter(link => link.active)
  .map(link => link.url);

console.log('📋 ファイル登録済みアフィリエイトURL:\n');
registeredUrls.forEach((url, i) => {
  console.log(`${i + 1}. ${url}`);
});
console.log('\n================================================================================\n');

// 未登録のアフィリエイトリンクを検出
const unregisteredLinks = new Map();

posts.forEach(post => {
  if (!post.links || post.links.length === 0) return;

  post.links.forEach(link => {
    const href = link.href || '';

    // アフィリエイトリンクかどうか判定
    const isAffiliate = href.includes('af.moshimo.com') ||
                       href.includes('amazon.co.jp') ||
                       href.includes('valuecommerce.com') ||
                       href.includes('a8.net');

    if (!isAffiliate) return;

    // ファイル登録済みかチェック
    const isRegistered = registeredUrls.some(registered => href.includes(registered) || registered.includes(href));

    if (!isRegistered) {
      if (!unregisteredLinks.has(href)) {
        unregisteredLinks.set(href, {
          url: href,
          text: link.text || '(テキストなし)',
          articles: []
        });
      }
      unregisteredLinks.get(href).articles.push({
        title: post.title,
        slug: post.slug,
        id: post._id
      });
    }
  });
});

if (unregisteredLinks.size > 0) {
  console.log(`🚨 ファイル未登録のアフィリエイトリンク: ${unregisteredLinks.size}件\n`);

  let index = 1;
  unregisteredLinks.forEach((data, url) => {
    console.log(`${index}. ${data.text}`);
    console.log(`   URL: ${url}`);
    console.log(`   使用回数: ${data.articles.length}回`);
    console.log(`   使用記事:`);
    data.articles.slice(0, 3).forEach(article => {
      console.log(`     - ${article.title} (${article.slug})`);
    });
    if (data.articles.length > 3) {
      console.log(`     ... 他${data.articles.length - 3}記事`);
    }
    console.log('');
    index++;
  });
} else {
  console.log('✅ すべてのアフィリエイトリンクがファイルに登録されています');
}

// 統計情報
console.log('\n================================================================================');
console.log('\n📊 統計サマリー:\n');
console.log(`総記事数: ${posts.length}件`);
console.log(`ファイル登録済みアフィリエイト: ${Object.keys(MOSHIMO_LINKS).filter(k => MOSHIMO_LINKS[k].active).length}種類`);
console.log(`ファイル未登録アフィリエイト: ${unregisteredLinks.size}種類`);
