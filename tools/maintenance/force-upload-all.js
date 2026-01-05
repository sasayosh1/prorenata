const fs = require('fs');
const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  token: 'skkTjwpdrsjKKpaDxKVShzCSI7GMWE1r5TQdwl0b7LTylVPoAxzBg0oPqhtUQyfPjyvtZW2mu6nfUMNUJ',
  useCdn: false,
  apiVersion: '2024-01-01'
});

async function forceUploadAll() {
  try {
    console.log('🔧 全記事の強制アップロードを開始...\n');
    
    const articlesData = fs.readFileSync('/Users/user/prorenata/all-articles.json', 'utf8');
    const articles = JSON.parse(articlesData);
    
    for (const article of articles) {
      if (article.body && Array.isArray(article.body) && article.body.length > 0) {
        console.log(`📝 Processing: ${article.title}`);
        console.log(`   Body blocks: ${article.body.length}`);
        
        try {
          // 一時的にbodyを削除
          await client.patch(article._id).unset(['body']).commit();
          console.log('   ✅ Cleared body field');
          
          // 少し待機
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // bodyを再設定
          await client.patch(article._id).set({ body: article.body }).commit();
          console.log('   ✅ Re-uploaded body field');
          
          // 検証
          const doc = await client.getDocument(article._id);
          console.log(`   ✅ Verified: ${doc.body ? doc.body.length : 0} blocks\n`);
          
        } catch (error) {
          console.log(`   ❌ Error: ${error.message}\n`);
        }
      } else {
        console.log(`⚠️  ${article.title} - No body data to upload\n`);
      }
    }
    
    console.log('🎉 All articles processed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

forceUploadAll();