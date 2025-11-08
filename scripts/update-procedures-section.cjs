const { createClient } = require('@sanity/client');
require('dotenv').config({ path: '../.env.local' });

const SANITY_CONFIG = {
  projectId: '72m8vhy2',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN
};

// 検査・処置に関する用語（白崎セラ口調）
const proceduresTerms = [
  {
    term: '採血（サイケツ）',
    description: '血液を採取して検査に使うことです。血液検査の基本となる処置です。',
    example: '「サイケツの日は、朝から少し緊張する患者さんが多いですね」と、声かけを工夫しています。'
  },
  {
    term: 'ルート確保（ルートカクホ）',
    description: '点滴ルートを血管に入れておくことです。静脈路確保とも言います。',
    example: '「ルートカクホの後は、固定テープの状態をよく見ます」。ズレや腫れがないか確認します。'
  },
  {
    term: '静脈注射（ジョウミャクチュウシャ / IV）',
    description: '血管に直接薬剤を入れる注射のことです。英語でIV（Intravenous）とも言います。',
    example: '「IVがある時は、腕の向きに気をつけたいですね」。点滴の針が抜けないよう注意します。'
  },
  {
    term: '点滴（テンテキ）',
    description: '水分や薬をゆっくり体に入れることです。静脈から投与します。',
    example: '「テンテキの流量の変化が不快のサインになることもあります」。患者さんの様子を観察します。'
  },
  {
    term: '心電図（シンデンズ / ECG）',
    description: '心臓の動きを記録する検査です。英語でECG（Electrocardiogram）とも言います。',
    example: '「シンデンズは電極位置がずれると記録が変わりますね」。正しい位置に装着することが大切です。'
  },
  {
    term: 'レントゲン（レントゲン / XP）',
    description: '体の中を写真で撮る検査です。X線撮影のことで、XPとも略します。',
    example: '「XPがある日は、移動の声かけが多くなりますね」。検査室への移動をサポートします。'
  },
  {
    term: 'CT（シーティー）',
    description: '体の断面を撮る検査です。コンピュータ断層撮影（Computed Tomography）の略です。',
    example: '「シーティーの検査室は冷えていることが多いです」。患者さんに毛布をお渡しすることもあります。'
  },
  {
    term: 'MRI（エムアールアイ）',
    description: '磁気で体内を撮る検査です。磁気共鳴画像（Magnetic Resonance Imaging）の略です。',
    example: '「エムアールアイは音が大きいので、不安に感じやすいですね」。事前に説明すると安心してもらえます。'
  },
  {
    term: 'エコー（エコー）',
    description: '超音波で見る検査です。超音波検査とも言います。',
    example: '「エコーはベッドサイドでも行われることがありますね」。検査技師さんと協力します。'
  },
  {
    term: '血糖測定（ケットウソクテイ）',
    description: '血液中の糖の量を調べることです。糖尿病の管理に重要な検査です。',
    example: '「ケットウの値次第で、食事量も変わることがありますね」。測定結果を看護師さんに報告します。'
  },
  {
    term: '酸素投与（サンソトウヨ）',
    description: '酸素を追加で供給することです。鼻カニューレやマスクで投与します。',
    example: '「サンソトウヨの時は、カニューレの向きがズレやすいです」。定期的に確認しています。'
  },
  {
    term: '吸引（キュウイン）',
    description: '痰を吸って外に出すことです。呼吸を楽にするための処置です。',
    example: '「キュウインは回数とタイミングを記録しておきたいですね」。状態変化の把握に役立ちます。'
  },
  {
    term: '口腔ケア（コウクウケア）',
    description: '口の中をきれいに保つケアのことです。誤嚥性肺炎の予防にも重要です。',
    example: '「コウクウケアで食後の残りをやさしく取ります」。口腔内の清潔保持を心がけています。'
  },
  {
    term: '清拭（セイショク）',
    description: '体を拭いて清潔にすることです。入浴できない患者さんの清潔ケアです。',
    example: '「セイショクは背中の観察チャンスが多いですね」。皮膚の状態を確認しながら行います。'
  },
  {
    term: '褥瘡処置（ジョクソウショチ）',
    description: '床ずれのケアのことです。褥瘡の予防と治療を行います。',
    example: '「ジョクソウショチは、わたしにも感情が動く場面が多いです」。患者さんの痛みに寄り添いながら行います。'
  }
];

async function updateProceduresSection() {
  console.log('検査・処置セクションの更新を開始します...\n');

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

  // 新しい検査・処置セクションのブロックを生成
  console.log('\n新しい検査・処置セクションを生成中...');

  const proceduresBlocks = [
    {
      _type: 'block',
      style: 'h3',
      children: [{ _type: 'span', text: '検査・処置に関する用語' }]
    },
    {
      _type: 'block',
      style: 'normal',
      children: [{
        _type: 'span',
        text: '看護助手として検査や処置に関わる機会が多くあります。これらの用語を理解することで、患者さんのサポートをより適切に行えます。'
      }]
    }
  ];

  // 各用語をブロックとして追加
  proceduresTerms.forEach(item => {
    // 用語名（太字）
    proceduresBlocks.push({
      _type: 'block',
      style: 'normal',
      children: [
        { _type: 'span', text: `・${item.term}`, marks: ['strong'] }
      ]
    });

    // 説明文
    proceduresBlocks.push({
      _type: 'block',
      style: 'normal',
      children: [{ _type: 'span', text: item.description }]
    });

    // 使い方の例
    proceduresBlocks.push({
      _type: 'block',
      style: 'normal',
      children: [
        { _type: 'span', text: '使い方：', marks: ['em'] },
        { _type: 'span', text: item.example }
      ]
    });

    // 空行
    proceduresBlocks.push({
      _type: 'block',
      style: 'normal',
      children: [{ _type: 'span', text: '' }]
    });
  });

  // 既存のbodyから、検査・処置セクションを置き換え
  console.log('\n検査・処置セクションを記事に挿入中...');

  let newBody = [];
  let proceduresInserted = false;

  for (let i = 0; i < post.body.length; i++) {
    const block = post.body[i];

    // 既存のH3「検査・処置」セクションを見つけたら、新しいセクションに置き換え
    if (block.style === 'h3' &&
        block.children?.[0]?.text?.includes('検査・処置')) {
      // 新しい検査・処置セクションを挿入
      newBody.push(...proceduresBlocks);
      proceduresInserted = true;

      // 既存の検査・処置セクションの内容をスキップ（次のH3まで）
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

  if (!proceduresInserted) {
    console.error('検査・処置セクションが見つかりませんでした。');
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

  console.log('\n✅ 検査・処置セクションの更新が完了しました！');
  console.log('記事ID:', result._id);
  console.log('総ブロック数:', newBody.length);
}

updateProceduresSection().catch(console.error);
