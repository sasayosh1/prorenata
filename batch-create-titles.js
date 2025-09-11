const { createClient } = require('@sanity/client');
const fs = require('fs');

// 既存のトークンを使用
const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  perspective: 'published'
});

async function batchCreateTitles() {
  try {
    console.log('🔍 既存の記事をチェック中...');
    const existingPosts = await client.fetch('*[_type == "post"]');
    console.log(`📊 既存の記事数: ${existingPosts.length}`);
    
    if (existingPosts.length > 0) {
      console.log('✅ 既存の記事が見つかりました。作成をスキップします。');
      return;
    }
    
    const articles = JSON.parse(fs.readFileSync('./all-articles.json', 'utf8'));
    console.log(`📖 ${articles.length} 記事のタイトルを作成開始`);
    
    // 5記事ずつバッチで作成
    const batchSize = 5;
    let successCount = 0;
    
    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, i + batchSize);
      const docs = batch.map(article => ({
        _type: 'post',
        title: article.title,
        publishedAt: new Date().toISOString()
      }));
      
      try {
        await client.create(docs);
        successCount += docs.length;
        console.log(`✅ バッチ ${Math.floor(i/batchSize) + 1}: ${successCount}/${articles.length} 記事作成完了`);
        
        // API制限を避けるため待機
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`❌ バッチ ${Math.floor(i/batchSize) + 1} エラー:`, error.message);
      }
    }
    
    console.log(`\n🎉 作成完了: ${successCount}/${articles.length} 記事`);
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

batchCreateTitles();