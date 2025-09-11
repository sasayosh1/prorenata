const { createClient } = require('@sanity/client');
const fs = require('fs');

// Sanity クライアントの設定
const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN
});

async function uploadTitlesOnly() {
  try {
    console.log('📖 JSONファイルから記事を読み込み中...');
    const articles = JSON.parse(fs.readFileSync('./all-articles.json', 'utf8'));
    
    console.log(`📊 合計 ${articles.length} 記事のタイトルをアップロード開始`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      
      try {
        // タイトルのみの記事を作成
        const postData = {
          _type: 'post',
          title: article.title,
          publishedAt: new Date().toISOString(),
          // slug と body は後で追加予定
        };
        
        const result = await client.create(postData);
        successCount++;
        
        console.log(`✅ ${i + 1}/${articles.length}: "${article.title}"`);
        
        // API制限を避けるため少し待機
        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
      } catch (error) {
        errorCount++;
        console.error(`❌ エラー (${i + 1}/${articles.length}): ${article.title}`);
        console.error('詳細:', error.message);
      }
    }
    
    console.log('\n📈 アップロード完了:');
    console.log(`✅ 成功: ${successCount} 記事`);
    console.log(`❌ エラー: ${errorCount} 記事`);
    console.log(`📊 合計: ${articles.length} 記事`);
    
  } catch (error) {
    console.error('❌ 致命的エラー:', error);
  }
}

// 実行
uploadTitlesOnly();