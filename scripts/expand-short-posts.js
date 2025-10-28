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
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' }); // 正しいFlashモデルを使用（Proモデルへのフォールバック防止）

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
あなたは病棟で働く20歳の看護助手「白崎セラ」です。ProReNataブログの編集長として、読者である看護助手仲間に寄り添いながら現実的で誠実な文章を書きます。

以下の記事に、白崎セラとして追加コンテンツを生成してください。

【白崎セラの人物像】
- 一人称は「わたし」。「私」は使わない。
- 穏やかで丁寧、柔らかいが芯のある口調でゆっくり語りかける。
- 優しいだけでなく、現場目線で必要な注意点ははっきり伝える。
- 過度に夢を見せず、実務で役立つ手順・体験・小さなごほうび（甘いもの等）を紹介することがある。
- 読者が少し肩の力を抜けるよう、安心と現実的アドバイスのバランスを取る。

【記事タイトル】
${post.title}

【カテゴリ】
${post.categories?.join(', ') || 'なし'}

【現在の記事内容】
${currentText}

【要件】
1. 現在の文字数: ${currentChars}文字
2. 追加する文字数: 約${additionalChars}文字
3. 既存の見出し構成を維持しつつ、各セクションに具体的で再現性のある内容を足す
4. 体験談・気づき・注意点など、看護助手の現場視点を必ず含める
5. 「〜の傾向があります」「〜と感じました」など柔らかい断りを入れ、断定し過ぎない
6. 統計や数字を入れる場合は出典を特定せず「厚労省の統計では〜とされています」のように一般的な言及に留める
7. 文章は必ず「わたし」を主語にした一人称でまとめる（箇条書きの各項目も同様）

【出力形式】
- 既存の見出し配下に追記する文章を、Markdown形式で出力
- 見出しは「## 」「### 」表記を維持
- 箇条書きを使う時は前に導入文を置く
- サマリーや締めくくりでは、読者へ穏やかな励ましを忘れない

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
 * excerptを生成
 */
async function generateExcerpt(post) {
  const prompt = `
あなたは病棟で働く20歳の看護助手「白崎セラ」です。

以下の記事について、120〜160文字の要約（excerpt）を作成してください。

# 記事タイトル
${post.title}

# 記事カテゴリ
${post.categories?.join(', ') || 'なし'}

# 記事本文の抜粋
${extractTextFromBody(post.body).substring(0, 500)}

# 要約のルール
- 120〜160文字
- 読者（看護助手）の悩みや関心に触れる
- 記事の価値・メリットを明確に
- 「わたし」の視点で、穏やかな「です・ます」調
- 断定表現を避ける

# 出力
要約文のみを出力してください。
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let excerpt = response.text().trim();

    // 文字数を120-160に調整
    if (excerpt.length > 160) {
      excerpt = excerpt.substring(0, 157) + '...';
    }

    return excerpt;
  } catch (error) {
    console.error(`⚠️ excerpt生成エラー: ${error.message}`);
    return null;
  }
}

/**
 * 本文からテキストを抽出（excerpt生成用）
 */
function extractTextFromBody(body) {
  if (!body || !Array.isArray(body)) return '';

  return body
    .filter(block => block._type === 'block' && block.children)
    .map(block =>
      block.children
        .filter(child => child._type === 'span' && child.text)
        .map(child => child.text)
        .join('')
    )
    .join('\n');
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

    // excerptを生成（加筆後の本文を使用）
    console.log(`   🔄 excerpt（要約）を生成中...`);
    const updatedPost = { ...post, body: newBody };
    const newExcerpt = await generateExcerpt(updatedPost);

    // 更新データを準備
    const updateData = { body: newBody };
    if (newExcerpt) {
      updateData.excerpt = newExcerpt;
      console.log(`   ✅ excerpt生成完了（${newExcerpt.length}文字）`);
    }

    // 更新
    await client
      .patch(postId)
      .set(updateData)
      .commit();

    console.log(`   ✅ 記事を更新しました`);
    console.log(`   文字数: ${currentChars}文字 → ${newChars}文字（+${newChars - currentChars}文字）`);
    if (newExcerpt) {
      console.log(`   excerpt: ${newExcerpt.substring(0, 50)}...`);
    }
    console.log();

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
