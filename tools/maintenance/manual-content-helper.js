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

// シンプルなコンテンツ生成関数
function generateArticleContent(title) {
  const content = `## 概要

${title}について、現場経験豊富な専門家の知見を基に詳しく解説します。

## 基本的な知識

看護助手として働く上で重要なポイントを以下にまとめました。

- 医療現場での基本的な心構え
- 患者様との適切なコミュニケーション
- 看護師との連携の取り方
- 安全で効率的な業務の進め方

## 実践のポイント

### 日常業務での注意点

実際の現場では以下の点に注意しながら業務を行うことが大切です：

- 感染対策の徹底
- 患者様のプライバシー保護
- 正確な情報伝達
- チームワークを重視した行動

### スキルアップのために

継続的な成長のため、以下のような取り組みを心がけましょう：

- 研修への積極的な参加
- 先輩職員からの指導を素直に受ける
- 医療知識の継続的な学習
- 実践を通じた経験の蓄積

## まとめ

${title}について重要なポイントを整理しました。医療現場で働く看護助手として、常に患者様の安全と安心を最優先に考え、専門性を高めながら業務に取り組むことが重要です。

継続的な学習と実践を通じて、より良い医療サービスの提供に貢献していきましょう。`;
  
  return content;
}

async function createManualEditList() {
  try {
    console.log('📖 bodyが不足している記事を取得中...');
    
    const postsWithoutBody = await client.fetch(`
      *[_type == "post" && !defined(body)] | order(title asc) {
        _id,
        title,
        slug
      }
    `);
    
    console.log(`📊 bodyが不足している記事: ${postsWithoutBody.length}件\n`);
    
    let htmlOutput = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>看護助手記事 手動編集用リスト</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .article { border: 1px solid #ddd; margin: 20px 0; padding: 15px; border-radius: 5px; }
        .title { color: #2c5aa0; font-size: 18px; font-weight: bold; margin-bottom: 10px; }
        .content { background: #f9f9f9; padding: 10px; border-radius: 3px; white-space: pre-wrap; font-family: monospace; }
        .copy-btn { 
            background: #007cba; 
            color: white; 
            padding: 8px 15px; 
            border: none; 
            border-radius: 3px; 
            cursor: pointer; 
            margin: 5px 0;
        }
        .copy-btn:hover { background: #005a8b; }
        .index { color: #666; font-size: 14px; margin-bottom: 10px; }
        .sanity-link { color: #007cba; text-decoration: none; }
        .sanity-link:hover { text-decoration: underline; }
        .instructions { 
            background: #e7f3ff; 
            padding: 15px; 
            border-radius: 5px; 
            margin-bottom: 20px;
            border-left: 4px solid #007cba;
        }
    </style>
</head>
<body>
    <h1>📝 看護助手記事 手動編集用リスト</h1>
    <div class="instructions">
        <h3>📋 手動編集の手順:</h3>
        <ol>
            <li><strong>Sanity Studio を開く:</strong> <a href="http://localhost:3333" target="_blank" class="sanity-link">http://localhost:3333</a></li>
            <li><strong>記事を検索:</strong> Content > Post で該当記事のタイトルを検索</li>
            <li><strong>コンテンツをコピー:</strong> 下記の「📋 コピー」ボタンをクリック</li>
            <li><strong>Body フィールドに貼り付け:</strong> Sanity Studio の Body フィールドに貼り付け</li>
            <li><strong>保存:</strong> 右上の「Publish」ボタンをクリック</li>
        </ol>
    </div>
    
    <p>📊 全 ${postsWithoutBody.length} 記事のコンテンツ</p>
`;
    
    postsWithoutBody.forEach((post, index) => {
      const generatedContent = generateArticleContent(post.title);
      
      htmlOutput += `
        <div class="article">
            <div class="index">${index + 1}/${postsWithoutBody.length}</div>
            <div class="title">${post.title}</div>
            <p><strong>ID:</strong> ${post._id}</p>
            <p><strong>Slug:</strong> ${post.slug?.current || 'なし'}</p>
            <button class="copy-btn" onclick="copyToClipboard('content${index}')">📋 コピー</button>
            <div class="content" id="content${index}">${generatedContent}</div>
        </div>
      `;
    });
    
    htmlOutput += `
    <script>
        function copyToClipboard(elementId) {
            const element = document.getElementById(elementId);
            const text = element.innerText;
            navigator.clipboard.writeText(text).then(() => {
                const button = element.previousElementSibling;
                const originalText = button.innerText;
                button.innerText = '✅ コピー完了!';
                button.style.background = '#28a745';
                setTimeout(() => {
                    button.innerText = originalText;
                    button.style.background = '#007cba';
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy: ', err);
                alert('コピーに失敗しました。手動でコンテンツを選択してコピーしてください。');
            });
        }
    </script>
    </body>
    </html>
    `;
    
    // HTMLファイルに保存
    fs.writeFileSync('./manual-content-list.html', htmlOutput);
    
    console.log(`\n📄 手動編集用リストを manual-content-list.html に保存しました`);
    console.log(`🌐 ブラウザで開くには: open manual-content-list.html`);
    console.log(`🔗 Sanity Studio: http://localhost:3333`);
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

createManualEditList();