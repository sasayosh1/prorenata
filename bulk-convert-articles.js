const fs = require('fs');
const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  token: 'skkTjwpdrsjKKpaDxKVShzCSI7GMWE1r5TQdwl0b7LTylVPoAxzBg0oPqhtUQyfPjyvtZW2mu6nfUMNUJ',
  useCdn: false,
  apiVersion: '2024-01-01'
});

function generateKey() {
  return Math.random().toString(36).substring(2, 11);
}

function markdownToPortableText(content) {
  if (!content) return [];
  
  const lines = content.split('\n');
  const blocks = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    let block = {
      _key: generateKey(),
      _type: 'block',
      children: []
    };
    
    // 見出しの処理
    if (line.startsWith('### ')) {
      block.style = 'h3';
      block.children.push({
        _key: generateKey(),
        _type: 'span',
        text: line.replace('### ', '')
      });
    } else if (line.startsWith('## ')) {
      block.style = 'h2';
      block.children.push({
        _key: generateKey(),
        _type: 'span',
        text: line.replace('## ', '')
      });
    } else if (line.startsWith('#### ')) {
      block.style = 'h4';
      block.children.push({
        _key: generateKey(),
        _type: 'span',
        text: line.replace('#### ', '')
      });
    } else if (line.startsWith('-   **') && line.includes('**:')) {
      // リスト項目の処理
      const match = line.match(/^-   \*\*(.*?)\*\*: (.*)/);
      if (match) {
        block.style = 'normal';
        block.listItem = 'bullet';
        block.level = 1;
        block.children = [
          {
            _key: generateKey(),
            _type: 'span',
            text: match[1],
            marks: ['strong']
          },
          {
            _key: generateKey(),
            _type: 'span',
            text: ': ' + match[2]
          }
        ];
      }
    } else if (line.startsWith('-   ')) {
      // 通常のリスト項目
      block.style = 'normal';
      block.listItem = 'bullet';
      block.level = 1;
      block.children.push({
        _key: generateKey(),
        _type: 'span',
        text: line.replace('-   ', '')
      });
    } else if (line.length > 0) {
      // 通常の段落
      block.style = 'normal';
      
      // **bold** マークの処理
      const parts = line.split(/(\*\*.*?\*\*)/);
      for (const part of parts) {
        if (part.startsWith('**') && part.endsWith('**')) {
          block.children.push({
            _key: generateKey(),
            _type: 'span',
            text: part.slice(2, -2),
            marks: ['strong']
          });
        } else if (part) {
          block.children.push({
            _key: generateKey(),
            _type: 'span',
            text: part
          });
        }
      }
    }
    
    if (block.children.length > 0) {
      blocks.push(block);
    }
  }
  
  return blocks;
}

async function bulkConvertArticles() {
  try {
    console.log('📚 記事の一括変換を開始...\n');
    
    // all-articles.jsonを読み込み
    const articlesData = fs.readFileSync('/Users/user/prorenata/all-articles.json', 'utf8');
    const articles = JSON.parse(articlesData);
    
    console.log(`📋 全${articles.length}記事を処理します\n`);
    
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      
      console.log(`📝 [${i + 1}/${articles.length}] ${article.title}`);
      
      // 既にbodyがある場合はスキップ
      if (article.body && Array.isArray(article.body) && article.body.length > 0) {
        console.log('  ✅ Already converted, uploading to Sanity...');
      } else if (article.content) {
        console.log('  🔄 Converting markdown to Portable Text...');
        article.body = markdownToPortableText(article.content);
        console.log(`  📦 Created ${article.body.length} blocks`);
      } else {
        console.log('  ⚠️  No content found, skipping...');
        continue;
      }
      
      // Sanityにアップロード
      try {
        await client
          .patch(article._id)
          .set({ body: article.body })
          .commit();
        console.log('  ✅ Uploaded to Sanity');
      } catch (error) {
        console.log(`  ❌ Sanity upload failed: ${error.message}`);
      }
      
      console.log('');
    }
    
    // 更新されたJSONファイルを保存
    fs.writeFileSync('/Users/user/prorenata/all-articles.json', JSON.stringify(articles, null, 2));
    console.log('🎉 All articles converted and uploaded!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

bulkConvertArticles();