const { createClient } = require('@sanity/client');
const fs = require('fs');

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  perspective: 'published'
});

async function compareTitles() {
  try {
    const articlesData = JSON.parse(fs.readFileSync('./all-articles.json', 'utf8'));
    const sanityPosts = await client.fetch('*[_type == "post"]{title}');
    
    console.log('📊 データ比較結果:');
    console.log(`JSON記事数: ${articlesData.length}`);
    console.log(`Sanity記事数: ${sanityPosts.length}\n`);
    
    console.log('🔍 一致する記事タイトル:');
    let matchCount = 0;
    sanityPosts.forEach(sanityPost => {
      const match = articlesData.find(article => article.title === sanityPost.title);
      if (match) {
        matchCount++;
        console.log(`✅ "${sanityPost.title}"`);
      }
    });
    
    console.log(`\n📈 マッチング率: ${matchCount}/${sanityPosts.length} (${Math.round(matchCount/sanityPosts.length*100)}%)\n`);
    
    console.log('❌ 一致しないSanity記事（最初の10件）:');
    let unmatchedCount = 0;
    sanityPosts.forEach(sanityPost => {
      const match = articlesData.find(article => article.title === sanityPost.title);
      if (!match && unmatchedCount < 10) {
        unmatchedCount++;
        console.log(`${unmatchedCount}. "${sanityPost.title}"`);
      }
    });
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

compareTitles();