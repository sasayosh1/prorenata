const { createClient } = require('@sanity/client');
require('dotenv').config({ path: '../.env.local' });

const SANITY_CONFIG = {
  projectId: '72m8vhy2',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN
};

// 栄養・排泄に関する用語（白崎セラ口調）
const nutritionTerms = [
  {
    term: '経口（ケイコウ）',
    description: '口から食事や薬をとることです。経口摂取とも言います。',
    example: '「ケイコウで食べられると、その表情に安心が出ますね」。自分で食べられることは大きな喜びです。'
  },
  {
    term: '経管（ケイカン）',
    description: 'チューブで胃に栄養を入れることです。経管栄養とも言います。',
    example: '「ケイカンは、一見こわそうだけど慣れで落ち着きますね」。患者さんも徐々に慣れていきます。'
  },
  {
    term: '水分摂取量（スイブンセッシュリョウ）',
    description: '飲んだ量のことです。1日にどのくらい水分をとったかを記録します。',
    example: '「スイブンは、時にすごく日によってバラつきますね」。体調や気温で変動があります。'
  },
  {
    term: '排尿回数（ハイニョウカイスウ）',
    description: 'トイレに行く回数のことです。尿の回数を記録します。',
    example: '「ハイニョウの回数は、夜に増える日も多いですね」。夜間頻尿は高齢者によく見られます。'
  },
  {
    term: '便性（ベンセイ）',
    description: '便の硬さや形状のことです。ブリストル便形状スケールで評価します。',
    example: '「ベンセイはブリストルで番号がついてて便利ですね」。7段階で記録できるので共有しやすいです。'
  }
];

async function updateNutritionSection() {
  console.log('栄養・排泄セクションの更新を開始します...\n');

  const sanityClient = createClient(SANITY_CONFIG);

  // 既存記事を取得
  console.log('既存記事を取得中...');
  const post = await sanityClient.fetch(
    `*[_type == "post" && slug.current == $slug][0] {
      _id,
      _rev,
      title,
      slug,
      body,
      tags,
      categories,
      author,
      publishedAt,
      excerpt
    }`,
    { slug: 'nursing-assistant-medical-terms' }
  );

  if (!post) {
    console.error('記事が見つかりませんでした。');
    return;
  }

  console.log('記事取得完了:', post.title);

  // 新しい栄養・排泄セクションのブロックを生成
  console.log('\n新しい栄養・排泄セクションを生成中...');

  const nutritionBlocks = [
    {
      _type: 'block',
      style: 'h3',
      children: [{ _type: 'span', text: '栄養・排泄に関する用語' }]
    },
    {
      _type: 'block',
      style: 'normal',
      children: [{
        _type: 'span',
        text: '食事や排泄に関する基本用語です。患者さんの栄養状態や排泄パターンを把握することは、日々のケアの基礎となります。'
      }]
    }
  ];

  // 各用語をブロックとして追加
  nutritionTerms.forEach(item => {
    // 用語名（太字）
    nutritionBlocks.push({
      _type: 'block',
      style: 'normal',
      children: [
        { _type: 'span', text: `・${item.term}`, marks: ['strong'] }
      ]
    });

    // 説明文
    nutritionBlocks.push({
      _type: 'block',
      style: 'normal',
      children: [{ _type: 'span', text: item.description }]
    });

    // 使い方の例
    nutritionBlocks.push({
      _type: 'block',
      style: 'normal',
      children: [
        { _type: 'span', text: '使い方：', marks: ['em'] },
        { _type: 'span', text: item.example }
      ]
    });

    // 空行
    nutritionBlocks.push({
      _type: 'block',
      style: 'normal',
      children: [{ _type: 'span', text: '' }]
    });
  });

  // 既存のbodyから、栄養・排泄セクションを置き換え
  console.log('\n栄養・排泄セクションを記事に挿入中...');

  let newBody = [];
  let nutritionInserted = false;

  for (let i = 0; i < post.body.length; i++) {
    const block = post.body[i];

    // 既存のH3「体位・移動」セクションの後に挿入
    if (block.style === 'h3' &&
        block.children?.[0]?.text?.includes('体位・移動')) {
      newBody.push(block);

      // 体位・移動セクションの内容をスキップ（次のH3まで）
      let skipUntilNextH3 = true;
      while (skipUntilNextH3 && i + 1 < post.body.length) {
        i++;
        if (post.body[i].style === 'h3' || post.body[i].style === 'h2') {
          skipUntilNextH3 = false;
          i--; // 次のH3/H2を保持するため戻る
        } else {
          newBody.push(post.body[i]); // 体位・移動の内容を保持
        }
      }

      // 栄養・排泄セクションを挿入
      newBody.push(...nutritionBlocks);
      nutritionInserted = true;
      continue;
    }

    // 既存のH3「栄養・排泄」セクションがあれば削除
    if (block.style === 'h3' &&
        block.children?.[0]?.text?.includes('栄養・排泄')) {
      // このセクションをスキップ（次のH3まで）
      let skipUntilNextH3 = true;
      while (skipUntilNextH3 && i + 1 < post.body.length) {
        i++;
        if (post.body[i].style === 'h3' || post.body[i].style === 'h2') {
          skipUntilNextH3 = false;
          i--; // 次のH3/H2を保持するため戻る
        }
      }
      continue;
    }

    // それ以外のブロックはそのまま追加
    newBody.push(block);
  }

  if (!nutritionInserted) {
    console.error('体位・移動セクションが見つかりませんでした。');
    return;
  }

  // 記事を更新
  console.log('\nSanityに記事を保存中...');

  const updatedPost = {
    ...post,
    body: newBody,
    _type: 'post'
  };

  delete updatedPost._rev;

  const result = await sanityClient.createOrReplace(updatedPost);

  console.log('\n✅ 栄養・排泄セクションの更新が完了しました！');
  console.log('記事ID:', result._id);
  console.log('総ブロック数:', newBody.length);
}

updateNutritionSection().catch(console.error);
