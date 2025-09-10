const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

async function checkMetaDescriptions() {
  try {
    console.log('📊 Meta Description分析開始...');
    console.log('');

    // 全ての投稿を取得
    const query = `*[_type == "post"]{
      _id,
      title,
      metaDescription,
      excerpt
    }`;
    
    const posts = await client.fetch(query);
    console.log(`📄 対象記事数: ${posts.length}件`);
    console.log('');
    
    let shortDescriptions = [];
    let missingDescriptions = [];
    let goodDescriptions = [];
    
    posts.forEach((post, index) => {
      const metaDesc = post.metaDescription || '';
      const excerpt = post.excerpt || '';
      
      if (!metaDesc && !excerpt) {
        missingDescriptions.push({
          id: post._id,
          title: post.title,
          issue: 'Meta Description・Excerpt両方未設定'
        });
      } else if (metaDesc && metaDesc.length < 100) {
        shortDescriptions.push({
          id: post._id,
          title: post.title,
          metaDescription: metaDesc,
          length: metaDesc.length,
          issue: `Meta Description短すぎ（${metaDesc.length}文字）`
        });
      } else if (!metaDesc && excerpt && excerpt.length < 100) {
        shortDescriptions.push({
          id: post._id,
          title: post.title,
          metaDescription: excerpt,
          length: excerpt.length,
          issue: `Excerpt短すぎ（${excerpt.length}文字）`
        });
      } else {
        goodDescriptions.push({
          id: post._id,
          title: post.title,
          length: metaDesc ? metaDesc.length : excerpt.length,
          issue: '正常'
        });
      }
    });
    
    console.log('🚨 問題のある記事:');
    console.log('==================');
    
    if (missingDescriptions.length > 0) {
      console.log(`❌ Meta Description未設定: ${missingDescriptions.length}件`);
      missingDescriptions.forEach((post, index) => {
        console.log(`${index + 1}. "${post.title}"`);
        console.log(`   問題: ${post.issue}`);
        console.log('');
      });
    }
    
    if (shortDescriptions.length > 0) {
      console.log(`⚠️  Meta Description文字数不足: ${shortDescriptions.length}件`);
      shortDescriptions.forEach((post, index) => {
        console.log(`${index + 1}. "${post.title}"`);
        console.log(`   問題: ${post.issue}`);
        console.log(`   現在: "${post.metaDescription}"`);
        console.log('');
      });
    }
    
    console.log('✅ 正常な記事:');
    console.log('==================');
    console.log(`正常記事: ${goodDescriptions.length}件`);
    
    console.log('');
    console.log('📊 統計サマリー:');
    console.log(`   ❌ 未設定: ${missingDescriptions.length}件`);
    console.log(`   ⚠️  文字数不足: ${shortDescriptions.length}件`);
    console.log(`   ✅ 正常: ${goodDescriptions.length}件`);
    console.log(`   📝 修正必要: ${missingDescriptions.length + shortDescriptions.length}件`);
    
    return {
      missing: missingDescriptions,
      short: shortDescriptions,
      good: goodDescriptions
    };
    
  } catch (error) {
    console.error('❌ エラー発生:', error.message);
  }
}

// 環境変数チェック
if (!process.env.SANITY_API_TOKEN) {
  console.error('❌ SANITY_API_TOKENが設定されていません');
  console.error('以下のコマンドで設定してください:');
  console.error('export SANITY_API_TOKEN="skkTjwpdrsjKKpaDxKVShzCSI7GMWE1r5TQdwl0b7LTylVPoAxzBg0oPqhtUQyfPjyvtZW2mu6nfUMNUJ"');
  process.exit(1);
}

checkMetaDescriptions();