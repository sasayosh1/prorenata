const { createClient } = require('@sanity/client');
require('dotenv').config({ path: '../.env.local' });

const SANITY_CONFIG = {
  projectId: '72m8vhy2',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN
};

// バイタルサインに関する用語（白崎セラ口調）
const vitalSignsTerms = [
  {
    term: 'バイタルサイン（バイタル）',
    description: '生命の調子を示す基本指標です。体温・脈拍・呼吸・血圧の4つを指します。',
    example: '「バイタル測定の時間です」と声をかけられたら、これら4つをチェックするタイミングだと分かります。'
  },
  {
    term: '体温（タイオン）',
    description: '身体の熱の高さを示す値です。正常値は36.0〜37.0℃程度。',
    example: '「今日のタイオン、いつもよりちょっと高めですね」と患者さんに伝えると、体調の変化に気づいてもらえます。'
  },
  {
    term: '脈拍（ミャクハク）',
    description: '心臓が1分間に打つ回数のことです。正常値は60〜100回/分。',
    example: '「ミャクハク測定中、リズムが少し早いかな」と感じたら、看護師さんに報告します。'
  },
  {
    term: '血圧（ケツアツ）',
    description: '血管の中の圧力を示す値です。正常値は収縮期120/拡張期80mmHg程度。',
    example: '「ケツアツの上の数字がいつもの基準からズレていますね」と気づいたら、すぐに確認します。'
  },
  {
    term: '呼吸数（コキュウスウ）',
    description: '1分間の呼吸回数のことです。正常値は12〜20回/分。',
    example: '「コキュウスウが少し多めかもしれません」と感じたら、患者さんの様子をよく観察します。'
  },
  {
    term: 'SpO₂（エスピーオーツー）',
    description: '血液中の酸素の量を示す値です。正常値は95%以上。経皮的動脈血酸素飽和度とも言います。',
    example: '「エスピーオーツーが下がっていると心配になりますね」という場面では、パルスオキシメーターの数値をしっかり確認します。'
  },
  {
    term: 'サチュレーション',
    description: 'SpO₂の口語表現です。現場では「サチュ」と略して呼ばれることもあります。',
    example: '「サチュ95％切ってるから、ちょっと注意が必要ですね」と看護師さんに報告することがあります。'
  },
  {
    term: 'JCS（ジェイシーエス）',
    description: '日本で使われる意識レベルの評価指標です。0〜300の数値で表します。',
    example: '「ジェイシーエスでの評価を先に聞いてから動きます」と、患者さんの状態把握に役立てます。'
  },
  {
    term: 'GCS（ジーシーエス）',
    description: '海外由来の意識レベル評価指標です。開眼・言語・運動の3項目で評価します。',
    example: '「ジーシーエスは3つの項目で整理されているので、覚えやすいですね」と感じます。'
  },
  {
    term: '平熱（ヘイネツ）',
    description: 'その人の普段の基準となる体温のことです。個人差があります。',
    example: '「ヘイネツを知らないと、微熱かどうかの判断がブレてしまいます」ので、患者さんごとの平熱を把握することが大切です。'
  }
];

async function updateVitalSignsSection() {
  console.log('バイタルサインセクションの更新を開始します...\n');

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

  // 新しいバイタルサインセクションのブロックを生成
  console.log('\n新しいバイタルサインセクションを生成中...');

  const vitalSignsBlocks = [
    {
      _type: 'block',
      style: 'h3',
      children: [{ _type: 'span', text: 'バイタルサインに関する用語' }]
    },
    {
      _type: 'block',
      style: 'normal',
      children: [{
        _type: 'span',
        text: '現場で最も頻繁に使用される基本的な用語です。これらをしっかり理解することで、患者さんの状態変化に早く気づけるようになります。'
      }]
    }
  ];

  // 各用語をブロックとして追加
  vitalSignsTerms.forEach(item => {
    // 用語名（太字）
    vitalSignsBlocks.push({
      _type: 'block',
      style: 'normal',
      children: [
        { _type: 'span', text: `・${item.term}`, marks: ['strong'] }
      ]
    });

    // 説明文
    vitalSignsBlocks.push({
      _type: 'block',
      style: 'normal',
      children: [{ _type: 'span', text: item.description }]
    });

    // 使い方の例
    vitalSignsBlocks.push({
      _type: 'block',
      style: 'normal',
      children: [
        { _type: 'span', text: '使い方：', marks: ['em'] },
        { _type: 'span', text: item.example }
      ]
    });

    // 空行
    vitalSignsBlocks.push({
      _type: 'block',
      style: 'normal',
      children: [{ _type: 'span', text: '' }]
    });
  });

  // 既存のbodyに、バイタルサインセクションを挿入
  console.log('\nバイタルサインセクションを記事に挿入中...');

  let newBody = [];
  let vitalSignsInserted = false;

  for (let i = 0; i < post.body.length; i++) {
    const block = post.body[i];

    // H2「【完全版】看護助手が知っておくべき医療用語100選」の直後に挿入
    if (block.style === 'h2' &&
        block.children?.[0]?.text?.includes('看護助手が知っておくべき医療用語')) {
      newBody.push(block);

      // 導入文があればスキップ（次のブロックをチェック）
      if (i + 1 < post.body.length && post.body[i + 1].style === 'normal') {
        i++; // 導入文をスキップ
      }

      // バイタルサインセクションを挿入
      newBody.push(...vitalSignsBlocks);
      vitalSignsInserted = true;
      continue;
    }

    // 既存のH3「身体に関する用語」や「バイタルサイン」セクションがあれば削除
    if (block.style === 'h3' &&
        (block.children?.[0]?.text?.includes('バイタルサイン') ||
         block.children?.[0]?.text?.includes('身体に関する用語'))) {
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

  if (!vitalSignsInserted) {
    console.error('【完全版】看護助手が知っておくべき医療用語100選セクションが見つかりませんでした。');
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

  console.log('\n✅ バイタルサインセクションの更新が完了しました！');
  console.log('記事ID:', result._id);
  console.log('総ブロック数:', newBody.length);
}

updateVitalSignsSection().catch(console.error);
