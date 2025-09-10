const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

// Generate a unique key
function generateKey(prefix = 'key') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function fixMissingKeys() {
  try {
    console.log('🔧 Sanity Missing Keys 修復開始...');
    console.log('');

    // 全ての投稿を取得
    const query = `*[_type == "post"]{
      _id,
      title,
      categories,
      body
    }`;
    
    const posts = await client.fetch(query);
    console.log(`📊 対象記事数: ${posts.length}件`);
    
    let fixedCount = 0;
    
    for (const post of posts) {
      let needsUpdate = false;
      const patches = {};
      
      // Categories配列の_key修復
      if (post.categories && Array.isArray(post.categories)) {
        const fixedCategories = post.categories.map((category, index) => {
          if (!category._key) {
            needsUpdate = true;
            return {
              ...category,
              _key: generateKey(`category_${index}`)
            };
          }
          return category;
        });
        
        if (needsUpdate) {
          patches.categories = fixedCategories;
        }
      }
      
      // Body配列の_key修復
      if (post.body && Array.isArray(post.body)) {
        let bodyNeedsUpdate = false;
        const fixedBody = post.body.map((block, index) => {
          if (!block._key) {
            bodyNeedsUpdate = true;
            return {
              ...block,
              _key: generateKey(`block_${index}`)
            };
          }
          
          // blockタイプの場合、children配列も確認
          if (block._type === 'block' && block.children && Array.isArray(block.children)) {
            const fixedChildren = block.children.map((child, childIndex) => {
              if (!child._key) {
                bodyNeedsUpdate = true;
                return {
                  ...child,
                  _key: generateKey(`span_${index}_${childIndex}`)
                };
              }
              return child;
            });
            
            if (bodyNeedsUpdate) {
              return {
                ...block,
                children: fixedChildren
              };
            }
          }
          
          return block;
        });
        
        if (bodyNeedsUpdate) {
          patches.body = fixedBody;
          needsUpdate = true;
        }
      }
      
      // 修正が必要な場合のみ更新
      if (needsUpdate) {
        try {
          await client
            .patch(post._id)
            .set(patches)
            .commit();
          
          console.log(`✅ 修復完了: "${post.title}"`);
          fixedCount++;
        } catch (error) {
          console.log(`❌ 修復失敗: "${post.title}" - ${error.message}`);
        }
      }
    }
    
    console.log('');
    console.log('🎉 Missing Keys 修復完了!');
    console.log(`📊 修復済み記事: ${fixedCount}件`);
    console.log(`📊 問題なし記事: ${posts.length - fixedCount}件`);
    console.log('');
    console.log('🔧 実行した修正:');
    console.log('   ✅ Categories配列の_key追加');
    console.log('   ✅ Body配列の_key追加');
    console.log('   ✅ Block内children配列の_key追加');
    console.log('   ✅ 一意なキーの生成と設定');
    console.log('');
    console.log('📱 Sanity Studio確認:');
    console.log('   🌐 http://localhost:3333/structure/post/');
    console.log('   👀 Categories・Body欄の警告が解消されているか確認');
    console.log('');
    
  } catch (error) {
    console.error('❌ エラー発生:', error.message);
    console.error('');
    console.error('🔍 対処方法:');
    console.error('1. SANITY_API_TOKENの設定確認');
    console.error('2. トークンの権限確認');
    console.error('3. ネットワーク接続確認');
  }
}

// 環境変数チェック
if (!process.env.SANITY_API_TOKEN) {
  console.error('❌ SANITY_API_TOKENが設定されていません');
  console.error('以下のコマンドで設定してください:');
  console.error('export SANITY_API_TOKEN="skkTjwpdrsjKKpaDxKVShzCSI7GMWE1r5TQdwl0b7LTylVPoAxzBg0oPqhtUQyfPjyvtZW2mu6nfUMNUJ"');
  process.exit(1);
}

fixMissingKeys();