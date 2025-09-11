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

async function showMissingContent() {
  try {
    console.log('📝 bodyが不足している記事とそのコンテンツ一覧\n');
    
    // JSONデータを読み込み
    const articlesData = JSON.parse(fs.readFileSync('./all-articles.json', 'utf8'));
    
    // Sanityからbodyが不足している記事を取得
    const postsWithoutBody = await client.fetch(`
      *[_type == "post" && !defined(body)] | order(title asc) {
        _id,
        title,
        slug
      }
    `);
    
    console.log(`📊 bodyが不足している記事数: ${postsWithoutBody.length}\n`);
    
    let htmlOutput = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>看護助手記事コンテンツ一覧</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .article { border: 1px solid #ddd; margin: 20px 0; padding: 15px; border-radius: 5px; }
        .title { color: #2c5aa0; font-size: 18px; font-weight: bold; margin-bottom: 10px; }
        .content { background: #f9f9f9; padding: 10px; border-radius: 3px; white-space: pre-wrap; }
        .no-content { color: #999; font-style: italic; }
        .index { color: #666; font-size: 14px; }
        .copy-btn { 
            background: #007cba; 
            color: white; 
            padding: 5px 10px; 
            border: none; 
            border-radius: 3px; 
            cursor: pointer; 
            margin: 5px 0;
        }
    </style>
</head>
<body>
    <h1>📝 看護助手記事 - bodyコンテンツ一覧</h1>
    <p>📊 全 ${postsWithoutBody.length} 記事のコンテンツ</p>
`;
    
    let foundCount = 0;
    
    postsWithoutBody.forEach((post, index) => {
      const matchingArticle = articlesData.find(article => 
        article.title === post.title
      );
      
      console.log(`\n${'='.repeat(80)}`);
      console.log(`📰 ${index + 1}/${postsWithoutBody.length}: "${post.title}"`);
      console.log(`🆔 ID: ${post._id}`);
      console.log(`🔗 Slug: ${post.slug?.current || 'なし'}`);
      console.log(`${'='.repeat(80)}`);
      
      htmlOutput += `
        <div class="article">
            <div class="index">${index + 1}/${postsWithoutBody.length}</div>
            <div class="title">${post.title}</div>
            <p><strong>ID:</strong> ${post._id}</p>
            <p><strong>Slug:</strong> ${post.slug?.current || 'なし'}</p>
      `;
      
      if (matchingArticle && matchingArticle.content) {
        foundCount++;
        console.log('\n📝 コンテンツ:');
        console.log('─'.repeat(80));
        console.log(matchingArticle.content);
        console.log('─'.repeat(80));
        
        htmlOutput += `
            <button class="copy-btn" onclick="copyToClipboard('content${index}')">📋 コピー</button>
            <div class="content" id="content${index}">${matchingArticle.content.replace(/\n/g, '<br>')}</div>
        `;
      } else {
        console.log('\n❌ JSONにcontentが見つかりません');
        htmlOutput += '<div class="no-content">❌ JSONにcontentが見つかりません</div>';
      }
      
      htmlOutput += '</div>';
    });
    
    htmlOutput += `
    <script>
        function copyToClipboard(elementId) {
            const element = document.getElementById(elementId);
            const text = element.innerText;
            navigator.clipboard.writeText(text).then(() => {
                alert('コンテンツをクリップボードにコピーしました！');
            });
        }
    </script>
    </body>
    </html>
    `;
    
    // HTMLファイルに保存
    fs.writeFileSync('./content-list.html', htmlOutput);
    
    console.log(`\n\n📈 結果サマリー:`);
    console.log(`✅ コンテンツ有り: ${foundCount}記事`);
    console.log(`❌ コンテンツなし: ${postsWithoutBody.length - foundCount}記事`);
    console.log(`📊 合計: ${postsWithoutBody.length}記事`);
    console.log(`\n📄 詳細リストを content-list.html に保存しました`);
    console.log(`🌐 ブラウザで開いてコンテンツを簡単にコピーできます`);
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

showMissingContent();