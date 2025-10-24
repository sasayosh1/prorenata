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
## はじめに

白崎セラです。${title}について、わたしが現場で感じていることや気を付けていることをまとめました。同じ看護助手の方が少しでも安心して動けるように、ゆっくりでも着実に身につけられるポイントを書いています。

## 基本を整えるために

最初に押さえておきたいのは「焦らず、丁寧に」という姿勢です。わたしが新人の頃に助けられたのは、以下のような小さな習慣でした。

- 朝の申し送りでメモを取り、わからないことはその場で確認する
- 体調が悪そうな患者さんの声のトーンを必ず看護師へ伝える
- 動線を意識して準備を整えることで、余裕を持って動けるようにする

## 現場で役立った実践のヒント

### 一日の流れを整えるコツ

忙しい日こそ、わたしは「段取り表」を紙に書き出しています。時間帯ごとに優先順位をつけておくと、急な呼び出しが入っても慌てなくなりました。合間に呼吸を整える余白を意識しておくと、気持ちも落ち着きます。

### チームで動くための声かけ

医療チームは声の掛け合いが命だと感じています。例えば「◯◯さんの体位交換があと10分で必要です」と具体的に伝えると、周囲も動きやすくなります。自分だけで抱え込まず、早めに共有する方が患者さんの安全につながりました。

## 続けるための小さなごほうび

勤務が終わったら、わたしは近所のコンビニでプリンを買うことが多いです。たった数百円でも「今日もよく頑張った」と自分に言えます。皆さんも、自分に合った小さなごほうびを用意してみてくださいね。

## まとめ

${title}は一度で完璧にできなくても大丈夫です。わたしも何度も振り返りながら少しずつ身につけてきました。無理をしすぎず、分からないことは先輩に相談しながら、一緒に成長していきましょう。`;

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
