import { createClient } from '@sanity/client';

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
      href
    }
  }
`;

const posts = await client.fetch(query);

let otherLinksFound = false;

posts.forEach(post => {
  if (!post.links || post.links.length === 0) return;

  const otherLinks = post.links.filter(link => {
    const href = link.href || '';
    return !href.includes('af.moshimo.com') &&
           !href.includes('amazon.co.jp') &&
           href.trim() !== '';
  });

  if (otherLinks.length > 0) {
    if (!otherLinksFound) {
      console.log('📋 もしも・Amazon以外のリンクがある記事:\n');
      otherLinksFound = true;
    }
    console.log(`タイトル: ${post.title}`);
    console.log(`Slug: ${post.slug}`);
    console.log('リンク:');
    otherLinks.forEach(link => {
      console.log(`  - ${link.href}`);
    });
    console.log('');
  }
});

if (!otherLinksFound) {
  console.log('もしも・Amazon以外のリンクは見つかりませんでした。');
}
