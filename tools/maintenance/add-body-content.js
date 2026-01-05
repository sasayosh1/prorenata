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

// Markdownテキストを Sanity の PortableText に変換する関数
function convertMarkdownToPortableText(markdown) {
  if (!markdown) return [];
  
  const blocks = [];
  const lines = markdown.split('\n');
  let keyCounter = 0;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (!trimmedLine) {
      // 空行は無視
      continue;
    }
    
    keyCounter++;
    const uniqueKey = `${Date.now()}_${keyCounter}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 見出しの処理
    if (trimmedLine.startsWith('## ')) {
      blocks.push({
        _type: 'block',
        _key: `h2_${uniqueKey}`,
        style: 'h2',
        children: [{
          _type: 'span',
          _key: `span_${uniqueKey}`,
          text: trimmedLine.replace('## ', ''),
          marks: []
        }],
        markDefs: []
      });
    } else if (trimmedLine.startsWith('### ')) {
      blocks.push({
        _type: 'block',
        _key: `h3_${uniqueKey}`,
        style: 'h3',
        children: [{
          _type: 'span',
          _key: `span_${uniqueKey}`,
          text: trimmedLine.replace('### ', ''),
          marks: []
        }],
        markDefs: []
      });
    } else if (trimmedLine.startsWith('#### ')) {
      blocks.push({
        _type: 'block',
        _key: `h4_${uniqueKey}`,
        style: 'h4',
        children: [{
          _type: 'span',
          _key: `span_${uniqueKey}`,
          text: trimmedLine.replace('#### ', ''),
          marks: []
        }],
        markDefs: []
      });
    } else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      // リスト項目
      blocks.push({
        _type: 'block',
        _key: `list_${uniqueKey}`,
        style: 'normal',
        listItem: 'bullet',
        children: [{
          _type: 'span',
          _key: `span_${uniqueKey}`,
          text: trimmedLine.replace(/^[-*] /, ''),
          marks: []
        }],
        markDefs: []
      });
    } else {
      // 通常の段落
      blocks.push({
        _type: 'block',
        _key: `p_${uniqueKey}`,
        style: 'normal',
        children: [{
          _type: 'span',
          _key: `span_${uniqueKey}`,
          text: trimmedLine,
          marks: []
        }],
        markDefs: []
      });
    }
  }
  
  return blocks;
}

async function addBodyContent() {
  try {
    console.log('📖 JSONファイルから記事データを読み込み中...');
    const articlesData = JSON.parse(fs.readFileSync('./all-articles.json', 'utf8'));
    
    console.log('🔍 Sanityからbodyが不足している記事を取得中...');
    const postsWithoutBody = await client.fetch(`
      *[_type == "post" && !defined(body)] {
        _id,
        title,
        slug
      }
    `);
    
    console.log(`📊 bodyが不足している記事: ${postsWithoutBody.length}件\n`);
    
    let updateCount = 0;
    let errorCount = 0;
    
    for (const post of postsWithoutBody) {
      try {
        // JSONデータから対応する記事を見つける
        const matchingArticle = articlesData.find(article => 
          article.title === post.title
        );
        
        if (!matchingArticle || !matchingArticle.content) {
          console.log(`⚠️  "${post.title}" - JSONにcontentが見つかりません`);
          continue;
        }
        
        console.log(`🔄 "${post.title}" - bodyコンテンツを追加中...`);
        
        // MarkdownをPortableTextに変換
        const bodyBlocks = await convertMarkdownToPortableText(matchingArticle.content);
        
        // Sanityを更新
        await client
          .patch(post._id)
          .set({ body: bodyBlocks })
          .commit();
        
        updateCount++;
        console.log(`✅ "${post.title}" - 更新完了 (${updateCount}/${postsWithoutBody.length})`);
        
        // API制限を避けるため待機
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (error) {
        errorCount++;
        console.error(`❌ "${post.title}" - エラー: ${error.message}`);
      }
    }
    
    console.log('\n📈 更新結果:');
    console.log(`✅ 成功: ${updateCount}記事`);
    console.log(`❌ エラー: ${errorCount}記事`);
    console.log(`📊 合計: ${postsWithoutBody.length}記事`);
    
  } catch (error) {
    console.error('❌ 致命的エラー:', error.message);
  }
}

addBodyContent();