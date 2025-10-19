#!/usr/bin/env node

/**
 * 文字数不足記事の自動加筆スクリプト
 *
 * Gemini APIを使用して文字数不足の記事に追加コンテンツを生成・追加します。
 *
 * 使い方:
 *   node scripts/expand-short-posts.js check              - 文字数不足の記事を確認
 *   node scripts/expand-short-posts.js expand <POST_ID>   - 特定の記事を加筆（DRY RUN）
 *   node scripts/expand-short-posts.js expand <POST_ID> --apply  - 実際に加筆
 *   node scripts/expand-short-posts.js expand-all --apply - 全記事を加筆
 */

const { createClient } = require('@sanity/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
});

// Gemini API初期化
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

/**
 * 文字数をカウント
 */
function countCharacters(body) {
  if (!body || !Array.isArray(body)) return 0;

  let charCount = 0;
  body.forEach(block => {
    if (block._type === 'block' && block.children) {
      block.children.forEach(child => {
        if (child.text) {
          charCount += child.text.length;
        }
      });
    }
  });

  return charCount;
}

/**
 * 文字数不足の記事を検出
 */
async function findShortPosts(minChars = 2000) {
  const query = `*[_type == "post"] {
    _id,
    title,
    "slug": slug.current,
    body,
    excerpt,
    "categories": categories[]->title
  }`;

  try {
    const posts = await client.fetch(query);
    const shortPosts = [];

    posts.forEach(post => {
      const charCount = countCharacters(post.body);
      if (charCount < minChars) {
        shortPosts.push({ ...post, charCount });
      }
    });

    shortPosts.sort((a, b) => a.charCount - b.charCount);
    return shortPosts;

  } catch (error) {
    console.error('❌ エラー:', error.message);
    return [];
  }
}

/**
 * 記事の本文をテキストに変換
 */
function bodyToText(body) {
  if (!body || !Array.isArray(body)) return '';

  return body
    .filter(block => block._type === 'block' && block.children)
    .map(block => {
      // 見出しの場合
      if (block.style === 'h2') {
        return '\n## ' + block.children.map(c => c.text || '').join('');
      } else if (block.style === 'h3') {
        return '\n### ' + block.children.map(c => c.text || '').join('');
      }
      // 通常テキスト
      return block.children.map(c => c.text || '').join('');
    })
    .join('\n');
}

/**
 * Gemini APIで追加コンテンツを生成
 */
async function generateAdditionalContent(post, targetChars = 2000) {
  const currentText = bodyToText(post.body);
  const currentChars = countCharacters(post.body);
  const additionalChars = Math.max(500, targetChars - currentChars);

  const prompt = `
あなたは看護助手に関する専門的な記事を執筆するライターです。

以下の記事に追加コンテンツを生成してください。

【記事タイトル】
${post.title}

【カテゴリ】
${post.categories?.join(', ') || 'なし'}

【現在の記事内容】
${currentText}

【要件】
1. 現在の文字数: ${currentChars}文字
2. 追加する文字数: 約${additionalChars}文字
3. 既存の見出し構成を維持しながら、各セクションに具体的な内容を追加
4. 読者にとって実用的で価値のある情報を提供
5. 断定表現は避け、「〜の傾向があります」「一般的には〜」などの柔らかい表現を使用
6. 統計データや数字を含める場合は、一般的な傾向として記載

【出力形式】
- 既存の記事構造に追加する形で、セクションごとに内容を追加
- 見出しは「## 」「### 」で記載
- 箇条書きの前には必ず説明文を入れる
- 自然で読みやすい日本語で記述

追加コンテンツを生成してください:
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('❌ Gemini API エラー:', error.message);
    return null;
  }
}

/**
 * 追加コンテンツをSanity形式に変換
 */
function convertToSanityBlocks(text) {
  const lines = text.split('\n').filter(line => line.trim());
  const blocks = [];

  lines.forEach(line => {
    const trimmed = line.trim();

    // H2見出し
    if (trimmed.startsWith('## ')) {
      blocks.push({
        _type: 'block',
        _key: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        style: 'h2',
        children: [{
          _type: 'span',
          _key: `span-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          text: trimmed.replace('## ', ''),
          marks: []
        }],
        markDefs: []
      });
    }
    // H3見出し
    else if (trimmed.startsWith('### ')) {
      blocks.push({
        _type: 'block',
        _key: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        style: 'h3',
        children: [{
          _type: 'span',
          _key: `span-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          text: trimmed.replace('### ', ''),
          marks: []
        }],
        markDefs: []
      });
    }
    // 通常テキスト
    else if (trimmed.length > 0) {
      blocks.push({
        _type: 'block',
        _key: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        style: 'normal',
        children: [{
          _type: 'span',
          _key: `span-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          text: trimmed,
          marks: []
        }],
        markDefs: []
      });
    }
  });

  return blocks;
}

/**
 * 記事を加筆
 */
async function expandPost(postId, apply = false) {
  try {
    // 記事データを取得
    const post = await client.fetch(`
      *[_id == $id][0] {
        _id,
        title,
        "slug": slug.current,
        body,
        excerpt,
        "categories": categories[]->title
      }
    `, { id: postId });

    if (!post) {
      console.log(`❌ 記事が見つかりません: ${postId}\n`);
      return { expanded: false, error: true };
    }

    const currentChars = countCharacters(post.body);

    console.log(`\n📝 記事「${post.title}」`);
    console.log(`   ID: ${post._id}`);
    console.log(`   現在の文字数: ${currentChars}文字`);
    console.log(`   カテゴリ: ${post.categories?.join(', ') || 'なし'}`);

    if (currentChars >= 2000) {
      console.log(`   ✅ 文字数は十分です（2000文字以上）\n`);
      return { expanded: false, error: false };
    }

    console.log(`   🔄 追加コンテンツを生成中...`);

    // Gemini APIで追加コンテンツを生成
    const additionalContent = await generateAdditionalContent(post, 2000);

    if (!additionalContent) {
      console.log(`   ❌ コンテンツ生成に失敗しました\n`);
      return { expanded: false, error: true };
    }

    console.log(`   ✅ コンテンツ生成完了`);
    console.log(`   📊 生成されたコンテンツ: ${additionalContent.length}文字\n`);

    if (!apply) {
      console.log(`   ℹ️  DRY RUN モード（実際には追加しません）`);
      console.log(`   生成されたコンテンツ（先頭500文字）:`);
      console.log(`   ${additionalContent.substring(0, 500)}...\n`);
      return { expanded: false, error: false };
    }

    // Sanity形式に変換
    const additionalBlocks = convertToSanityBlocks(additionalContent);
    const newBody = [...post.body, ...additionalBlocks];
    const newChars = countCharacters(newBody);

    // 更新
    await client
      .patch(postId)
      .set({ body: newBody })
      .commit();

    console.log(`   ✅ 記事を更新しました`);
    console.log(`   文字数: ${currentChars}文字 → ${newChars}文字（+${newChars - currentChars}文字）\n`);

    return { expanded: true, error: false, before: currentChars, after: newChars };

  } catch (error) {
    console.error(`   ❌ エラー: ${error.message}\n`);
    return { expanded: false, error: true };
  }
}

/**
 * メイン処理
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'check';
  const apply = args.includes('--apply');

  console.log('📝 文字数不足記事自動加筆ツール\n');
  console.log('============================================================\n');

  // Draft記事を自動Publish
  if (apply && (command === 'expand' || command === 'expand-all')) {
    const { publishAllDrafts } = require('./publish-drafts');
    console.log('🔄 Draft記事を自動的にPublishします...\n');
    const publishResult = await publishAllDrafts(true);

    if (publishResult.published > 0) {
      console.log(`✅ ${publishResult.published}件のDraft記事をPublishしました\n`);
      console.log('============================================================\n');
    }
  }

  try {
    if (command === 'check') {
      const shortPosts = await findShortPosts(2000);

      if (shortPosts.length === 0) {
        console.log('✅ すべての記事が2000文字以上です\n');
        return;
      }

      console.log(`📊 文字数不足の記事: ${shortPosts.length}件\n`);

      shortPosts.slice(0, 20).forEach((post, i) => {
        console.log(`${i + 1}. ${post.title}`);
        console.log(`   ID: ${post._id}`);
        console.log(`   文字数: ${post.charCount}文字`);
        console.log(`   カテゴリ: ${post.categories?.join(', ') || 'なし'}`);
        console.log(`   URL: /posts/${post.slug}\n`);
      });

      if (shortPosts.length > 20) {
        console.log(`   ...他 ${shortPosts.length - 20}件\n`);
      }

      console.log('\n特定の記事を加筆するには:');
      console.log('  node scripts/expand-short-posts.js expand <POST_ID> --apply');
      console.log('\n全記事を加筆するには:');
      console.log('  node scripts/expand-short-posts.js expand-all --apply\n');

    } else if (command === 'expand') {
      const postId = args[1];
      if (!postId) {
        console.log('❌ POST_IDを指定してください\n');
        return;
      }

      await expandPost(postId, apply);

    } else if (command === 'expand-all') {
      const shortPosts = await findShortPosts(2000);

      console.log(`🚀 ${shortPosts.length}記事を加筆します\n`);
      console.log('============================================================\n');

      let totalExpanded = 0;
      let totalFailed = 0;
      let totalCharsBefore = 0;
      let totalCharsAfter = 0;

      for (const post of shortPosts) {
        const result = await expandPost(post._id, apply);

        if (result.expanded) {
          totalExpanded++;
          totalCharsBefore += result.before;
          totalCharsAfter += result.after;
        }
        if (result.error) {
          totalFailed++;
        }

        // APIレート制限対策: 各リクエスト後に2秒待機
        if (apply) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      console.log('============================================================');
      console.log('📊 処理結果サマリー\n');
      console.log(`   対象記事: ${shortPosts.length}件`);
      console.log(`   加筆完了: ${totalExpanded}件`);
      console.log(`   エラー: ${totalFailed}件`);

      if (totalExpanded > 0) {
        const avgIncrease = Math.round((totalCharsAfter - totalCharsBefore) / totalExpanded);
        console.log(`   平均文字数増加: ${avgIncrease}文字/記事`);
      }

      if (!apply) {
        console.log('\n⚠️  DRY RUN モード: 実際には加筆していません');
        console.log('   実際に加筆するには --apply オプションを追加してください\n');
      } else {
        console.log('\n✅ すべての記事の加筆が完了しました\n');
      }

    } else {
      console.log('❌ 不明なコマンド: ' + command);
      console.log('\n使い方:');
      console.log('  node scripts/expand-short-posts.js check');
      console.log('  node scripts/expand-short-posts.js expand <POST_ID> --apply');
      console.log('  node scripts/expand-short-posts.js expand-all --apply\n');
    }

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  }
}

// 実行
main();
