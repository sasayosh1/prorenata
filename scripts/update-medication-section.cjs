const { createClient } = require('@sanity/client');
require('dotenv').config({ path: '../.env.local' });

const SANITY_CONFIG = {
  projectId: '72m8vhy2',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN
};

// 薬剤・治療に関する用語（白崎セラ口調）
const medicationTerms = [
  {
    term: '鎮痛剤（チンツウザイ）',
    description: '痛みをやわらげる薬のことです。頭痛や腰痛など、様々な痛みに使われます。',
    example: '「チンツウザイを飲んで、表情が少しゆるむのを見るとホッとします」。効果が現れる様子を観察します。'
  },
  {
    term: '解熱鎮痛剤（ゲネツチンツウザイ）',
    description: '熱を下げつつ痛みもやわらげる薬のことです。風邪や発熱時によく使われます。',
    example: '「ゲネツチンツウザイで、食欲が戻ることもありますね」。体調の変化を見守ります。'
  },
  {
    term: '抗生剤（コウセイザイ）',
    description: '細菌に対して使う薬のことです。感染症の治療に使用します。',
    example: '「コウセイザイは、決められた回数でしっかり使うのが大事ですね」。服薬管理をサポートします。'
  },
  {
    term: '下剤（ゲザイ）',
    description: '便が出やすくなる薬のことです。便秘の治療に使われます。',
    example: '「ゲザイを使う日は、水分の飲む量も意識したいですね」。排便状況を確認します。'
  },
  {
    term: '下痢止め（ゲリドメ）',
    description: 'ゆるい便を止める薬のことです。下痢の症状を改善します。',
    example: '「ゲリドメは、一気に止まる感じが怖いと言う人もいますね」。患者さんの不安に寄り添います。'
  },
  {
    term: '整腸剤（セイチョウザイ）',
    description: 'おなかの中（腸）の調子をととのえる薬です。腸内環境を改善します。',
    example: '「セイチョウザイは、ふんわりした実感の人も多いですね」。効果の現れ方は人それぞれです。'
  },
  {
    term: '利尿剤（リニョウザイ）',
    description: '尿を出して、水分を減らす薬です。むくみや心不全の治療に使われます。',
    example: '「リニョウザイの日は、トイレの声かけ回数が増えますね」。排尿パターンの変化に注意します。'
  },
  {
    term: '血糖降下薬（ケットウコウカヤク）',
    description: '血液中の糖を下げる薬です。糖尿病の治療に使われます。',
    example: '「食事とケットウの関係を意識する場面が増えますね」。血糖値の変動を観察します。'
  },
  {
    term: '皮膚外用剤（ヒフガイヨウザイ）',
    description: '塗るタイプの薬のことです。軟膏やクリームなどがあります。',
    example: '「ほんのり冷たい感じ、部位によって好き嫌いも出ますね」。塗り心地の個人差に配慮します。'
  },
  {
    term: '点眼薬（テンガンヤク）',
    description: '目にさす薬のことです。目薬とも言います。',
    example: '「テンガンヤクは、一滴の温度が人によって印象が違いますね」。点眼の感覚は人それぞれです。'
  }
];

async function updateMedicationSection() {
  console.log('薬剤・治療セクションの更新を開始します...\n');

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

  // 新しい薬剤・治療セクションのブロックを生成
  console.log('\n新しい薬剤・治療セクションを生成中...');

  const medicationBlocks = [
    {
      _type: 'block',
      style: 'h3',
      children: [{ _type: 'span', text: '薬剤・治療に関する用語' }]
    },
    {
      _type: 'block',
      style: 'normal',
      children: [{
        _type: 'span',
        text: '薬剤の種類や効果を理解することで、患者さんへの声かけや観察ポイントが明確になります。安全な薬剤管理のためにも大切な知識です。'
      }]
    }
  ];

  // 各用語をブロックとして追加
  medicationTerms.forEach(item => {
    // 用語名（太字）
    medicationBlocks.push({
      _type: 'block',
      style: 'normal',
      children: [
        { _type: 'span', text: `・${item.term}`, marks: ['strong'] }
      ]
    });

    // 説明文
    medicationBlocks.push({
      _type: 'block',
      style: 'normal',
      children: [{ _type: 'span', text: item.description }]
    });

    // 使い方の例
    medicationBlocks.push({
      _type: 'block',
      style: 'normal',
      children: [
        { _type: 'span', text: '使い方：', marks: ['em'] },
        { _type: 'span', text: item.example }
      ]
    });

    // 空行
    medicationBlocks.push({
      _type: 'block',
      style: 'normal',
      children: [{ _type: 'span', text: '' }]
    });
  });

  // 既存のbodyから、薬剤・治療セクションを置き換え
  console.log('\n薬剤・治療セクションを記事に挿入中...');

  let newBody = [];
  let medicationInserted = false;

  for (let i = 0; i < post.body.length; i++) {
    const block = post.body[i];

    // 既存のH3「医療器具・物品」セクションの後に挿入
    if (block.style === 'h3' &&
        block.children?.[0]?.text?.includes('医療器具・物品')) {
      newBody.push(block);

      // 医療器具・物品セクションの内容をスキップ（次のH3まで）
      let skipUntilNextH3 = true;
      while (skipUntilNextH3 && i + 1 < post.body.length) {
        i++;
        if (post.body[i].style === 'h3' || post.body[i].style === 'h2') {
          skipUntilNextH3 = false;
          i--; // 次のH3/H2を保持するため戻る
        } else {
          newBody.push(post.body[i]); // 医療器具・物品の内容を保持
        }
      }

      // 薬剤・治療セクションを挿入
      newBody.push(...medicationBlocks);
      medicationInserted = true;
      continue;
    }

    // 既存のH3「薬剤・治療」セクションがあれば削除
    if (block.style === 'h3' &&
        block.children?.[0]?.text?.includes('薬剤・治療')) {
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

  if (!medicationInserted) {
    console.error('医療器具・物品セクションが見つかりませんでした。');
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

  console.log('\n✅ 薬剤・治療セクションの更新が完了しました！');
  console.log('記事ID:', result._id);
  console.log('総ブロック数:', newBody.length);
}

updateMedicationSection().catch(console.error);
