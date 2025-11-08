const { createClient } = require('@sanity/client');
require('dotenv').config({ path: '../.env.local' });

const SANITY_CONFIG = {
  projectId: '72m8vhy2',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN
};

// 身体・解剖に関する用語（白崎セラ口調）
const anatomyTerms = [
  {
    term: '頭部（トウブ）',
    description: 'あたま全体を指します。表情や意識レベルの観察に重要な部位です。',
    example: '「トウブの観察で、表情の変化を早く見つけたいですね」と、日々の様子を気にかけています。'
  },
  {
    term: '顔面（ガンメン）',
    description: '顔まわりのことです。表情や皮膚の色をよく観察する部位です。',
    example: '「ガンメンは、表情や皮膚の色をよく見ます」。患者さんの体調変化のサインが現れやすい場所です。'
  },
  {
    term: '口腔（コウクウ）',
    description: '口の中のことです。口腔ケアは食事後や就寝前に行います。',
    example: '「コウクウは食事後のケアが大切ですね」と、清潔保持を心がけています。'
  },
  {
    term: '咽頭（イントウ）',
    description: 'のどの奥の部分です。飲み込みや呼吸に関わる重要な場所です。',
    example: '「イントウの違和感を訴えていらっしゃいます」と看護師さんに報告することがあります。'
  },
  {
    term: '頸部（ケイブ）',
    description: '首まわりのことです。リンパ節や血管が通る重要な部位です。',
    example: '「ケイブのむくみは見落とさないようにしています」。異変に早く気づくことが大切です。'
  },
  {
    term: '胸部（キョウブ）',
    description: '胸の範囲を指します。心臓や肺がある重要な部位です。',
    example: '「キョウブの動きと呼吸のリズムは一緒に観察します」。呼吸状態の把握に役立ちます。'
  },
  {
    term: '腹部（フクブ）',
    description: 'おなかの部分です。消化器系の臓器が集まっています。',
    example: '「フクブが張っている感じがすると言われました」と、患者さんの訴えを伝えます。'
  },
  {
    term: '上肢（ジョウシ）',
    description: '腕全体のことです。肩から手先までを指します。',
    example: '「ジョウシの可動域、日によって変わることもありますね」と、日々の変化を観察します。'
  },
  {
    term: '下肢（カシ）',
    description: 'あし全体のことです。股関節から足先までを指します。',
    example: '「カシのむくみは触れて確認しています」。浮腫の有無をチェックする大切な部位です。'
  },
  {
    term: '末梢（マッショウ）',
    description: '手足の先端部分のことです。血液循環の状態を知る手がかりになります。',
    example: '「マッショウの冷たさは循環を考えるヒントになりますね」。体温や血流の状態を確認します。'
  },
  {
    term: '皮膚（ヒフ）',
    description: '体をおおう表面のことです。乾燥や発疹などの異常を観察します。',
    example: '「ヒフの状態が、乾燥か湿りかを意識しています」。スキンケアの参考になります。'
  },
  {
    term: '粘膜（ネンマク）',
    description: '皮膚よりやわらかい、口や鼻などの内側の面です。乾燥しやすい部分です。',
    example: '「ネンマクは乾きやすい人もいらっしゃいますね」。保湿ケアが必要なこともあります。'
  },
  {
    term: '関節（カンセツ）',
    description: '骨と骨のつなぎ目のことです。身体の動きを可能にする重要な部位です。',
    example: '「カンセツは痛みが出ると動きが急に減りますね」。痛みの訴えには注意が必要です。'
  },
  {
    term: '脊椎（セキツイ）',
    description: '背骨のことです。体を支える柱のような役割があります。',
    example: '「セキツイのラインは体位変換で当たりやすいです」。褥瘡予防のために気をつけています。'
  },
  {
    term: '仙骨（センコツ）',
    description: 'おしりの真ん中にある骨です。褥瘡ができやすい部位として知られています。',
    example: '「センコツは褥瘡リスクが特に高いですね」。体位変換時には特に注意しています。'
  }
];

async function updateAnatomySection() {
  console.log('身体・解剖セクションの更新を開始します...\n');

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

  // 新しい身体・解剖セクションのブロックを生成
  console.log('\n新しい身体・解剖セクションを生成中...');

  const anatomyBlocks = [
    {
      _type: 'block',
      style: 'h3',
      children: [{ _type: 'span', text: '身体・解剖に関する用語' }]
    },
    {
      _type: 'block',
      style: 'normal',
      children: [{
        _type: 'span',
        text: '身体の各部位の名称を正しく理解することで、看護師さんとのコミュニケーションがスムーズになります。観察ポイントを把握する上でも重要です。'
      }]
    }
  ];

  // 各用語をブロックとして追加
  anatomyTerms.forEach(item => {
    // 用語名（太字）
    anatomyBlocks.push({
      _type: 'block',
      style: 'normal',
      children: [
        { _type: 'span', text: `・${item.term}`, marks: ['strong'] }
      ]
    });

    // 説明文
    anatomyBlocks.push({
      _type: 'block',
      style: 'normal',
      children: [{ _type: 'span', text: item.description }]
    });

    // 使い方の例
    anatomyBlocks.push({
      _type: 'block',
      style: 'normal',
      children: [
        { _type: 'span', text: '使い方：', marks: ['em'] },
        { _type: 'span', text: item.example }
      ]
    });

    // 空行
    anatomyBlocks.push({
      _type: 'block',
      style: 'normal',
      children: [{ _type: 'span', text: '' }]
    });
  });

  // 既存のbodyに、身体・解剖セクションを挿入
  console.log('\n身体・解剖セクションを記事に挿入中...');

  let newBody = [];
  let anatomyInserted = false;

  for (let i = 0; i < post.body.length; i++) {
    const block = post.body[i];

    // H3「バイタルサインに関する用語」の後に挿入
    if (block.style === 'h3' &&
        block.children?.[0]?.text?.includes('バイタルサイン')) {
      newBody.push(block);

      // バイタルサインセクションの内容をスキップ（次のH3まで）
      let skipUntilNextH3 = true;
      while (skipUntilNextH3 && i + 1 < post.body.length) {
        i++;
        if (post.body[i].style === 'h3' || post.body[i].style === 'h2') {
          skipUntilNextH3 = false;
          i--; // 次のH3/H2を保持するため戻る
        } else {
          newBody.push(post.body[i]); // バイタルサインの内容を保持
        }
      }

      // 身体・解剖セクションを挿入
      newBody.push(...anatomyBlocks);
      anatomyInserted = true;
      continue;
    }

    // 既存のH3「身体に関する用語」や「身体・解剖」セクションがあれば削除
    if (block.style === 'h3' &&
        (block.children?.[0]?.text?.includes('身体に関する用語') ||
         block.children?.[0]?.text?.includes('身体・解剖'))) {
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

  if (!anatomyInserted) {
    console.error('バイタルサインセクションが見つかりませんでした。');
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

  console.log('\n✅ 身体・解剖セクションの更新が完了しました！');
  console.log('記事ID:', result._id);
  console.log('総ブロック数:', newBody.length);
}

updateAnatomySection().catch(console.error);
