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
      continue;
    }
    
    keyCounter++;
    const uniqueKey = `${Date.now()}_${keyCounter}_${Math.random().toString(36).substr(2, 9)}`;
    
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
    } else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
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

// シンプルなコンテンツ生成関数
function generateArticleContent(title) {
  const content = `
## 概要

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

継続的な学習と実践を通じて、より良い医療サービスの提供に貢献していきましょう。
`;
  
  return content;
}

async function updatePostsWithContent() {
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
    
    let updateCount = 0;
    let errorCount = 0;
    
    for (const post of postsWithoutBody) {
      try {
        console.log(`🔄 "${post.title}" - bodyコンテンツを追加中...`);
        
        // コンテンツを生成
        const generatedContent = generateArticleContent(post.title);
        const bodyBlocks = convertMarkdownToPortableText(generatedContent);
        
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

updatePostsWithContent();