const { createClient } = require('@sanity/client');
require('dotenv').config({ path: '../.env.local' });

const SANITY_CONFIG = {
  projectId: '72m8vhy2',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN
};

// 体位・移動に関する用語（白崎セラ口調）
const positioningTerms = [
  {
    term: '仰臥位（ギョウガイ / あおむけ）',
    description: 'あおむけになる体位のことです。背中を下にして寝る姿勢です。',
    example: '「ギョウガイは、胸や腹の動きが見やすいですね」。呼吸状態の観察に適した体位です。'
  },
  {
    term: '伏臥位（フクガイ / うつぶせ）',
    description: 'うつぶせになる体位のことです。お腹を下にして寝る姿勢です。',
    example: '「フクガイは、人によっては圧迫感が強いですね」。体位変換時には患者さんの反応を確認します。'
  },
  {
    term: '半側臥位（ハンソクガイ）',
    description: '横向きで少し開く体位のことです。完全な側臥位より安定感があります。',
    example: '「ハンソクガイは、背中の当たりやすい所を交互に休ませます」。褥瘡予防に有効な体位です。'
  },
  {
    term: 'Fowler位（ファーラーイ）',
    description: '上体を30〜45度くらい起こす体位です。ベッドの頭側を上げた状態です。',
    example: '「ファーラーイは呼吸しやすいって声がよく出ますね」。食事や会話の際にも使われる体位です。'
  },
  {
    term: 'トランスファー（移乗・イジョウ）',
    description: 'ベッドから車椅子などへの移り変えのことです。移乗介助とも言います。',
    example: '「イジョウの時は、声かけをゆっくりはっきり伝えます」。安全な移動のために大切なコミュニケーションです。'
  }
];

async function updatePositioningSection() {
  console.log('体位・移動セクションの更新を開始します...\n');

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

  // 新しい体位・移動セクションのブロックを生成
  console.log('\n新しい体位・移動セクションを生成中...');

  const positioningBlocks = [
    {
      _type: 'block',
      style: 'h3',
      children: [{ _type: 'span', text: '体位・移動に関する用語' }]
    },
    {
      _type: 'block',
      style: 'normal',
      children: [{
        _type: 'span',
        text: '患者さんの体位変換や移動介助に関わる基本用語です。安全で適切なケアを提供するために必要な知識です。'
      }]
    }
  ];

  // 各用語をブロックとして追加
  positioningTerms.forEach(item => {
    // 用語名（太字）
    positioningBlocks.push({
      _type: 'block',
      style: 'normal',
      children: [
        { _type: 'span', text: `・${item.term}`, marks: ['strong'] }
      ]
    });

    // 説明文
    positioningBlocks.push({
      _type: 'block',
      style: 'normal',
      children: [{ _type: 'span', text: item.description }]
    });

    // 使い方の例
    positioningBlocks.push({
      _type: 'block',
      style: 'normal',
      children: [
        { _type: 'span', text: '使い方：', marks: ['em'] },
        { _type: 'span', text: item.example }
      ]
    });

    // 空行
    positioningBlocks.push({
      _type: 'block',
      style: 'normal',
      children: [{ _type: 'span', text: '' }]
    });
  });

  // 既存のbodyから、体位・移動セクションを置き換え
  console.log('\n体位・移動セクションを記事に挿入中...');

  let newBody = [];
  let positioningInserted = false;

  for (let i = 0; i < post.body.length; i++) {
    const block = post.body[i];

    // 既存のH3「薬剤・治療」セクションの後に挿入
    if (block.style === 'h3' &&
        block.children?.[0]?.text?.includes('薬剤・治療')) {
      newBody.push(block);

      // 薬剤・治療セクションの内容をスキップ（次のH3まで）
      let skipUntilNextH3 = true;
      while (skipUntilNextH3 && i + 1 < post.body.length) {
        i++;
        if (post.body[i].style === 'h3' || post.body[i].style === 'h2') {
          skipUntilNextH3 = false;
          i--; // 次のH3/H2を保持するため戻る
        } else {
          newBody.push(post.body[i]); // 薬剤・治療の内容を保持
        }
      }

      // 体位・移動セクションを挿入
      newBody.push(...positioningBlocks);
      positioningInserted = true;
      continue;
    }

    // 既存のH3「体位・移動」セクションがあれば削除
    if (block.style === 'h3' &&
        block.children?.[0]?.text?.includes('体位・移動')) {
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

  if (!positioningInserted) {
    console.error('薬剤・治療セクションが見つかりませんでした。');
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

  console.log('\n✅ 体位・移動セクションの更新が完了しました！');
  console.log('記事ID:', result._id);
  console.log('総ブロック数:', newBody.length);
}

updatePositioningSection().catch(console.error);
