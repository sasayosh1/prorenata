const { createClient } = require('@sanity/client');
require('dotenv').config({ path: '../.env.local' });

const SANITY_CONFIG = {
  projectId: '72m8vhy2',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN
};

// 症状・病態に関する用語（白崎セラ口調）
const symptomsTerms = [
  {
    term: '発熱（ハツネツ）',
    description: '体温がいつもより高い状態のことです。通常、37.5℃以上を発熱と呼びます。',
    example: '「ハツネツが出ている時は、少しの変化も気になりますね」と、注意深く観察しています。'
  },
  {
    term: '悪寒（オカン）',
    description: '寒気のことです。身体が震える感じがします。発熱の前兆として現れることが多いです。',
    example: '「オカンを訴える時は、体温が上がる前ぶれのことも多いです」。早めの対応が大切です。'
  },
  {
    term: '嘔気（オウキ）',
    description: '吐きそうな感じのことです。吐き気とも言います。',
    example: '「オウキが強いと、急に食べられなくなることもありますね」。食事量の変化に注意します。'
  },
  {
    term: '嘔吐（オウト）',
    description: '吐くことです。胃の内容物を口から出す状態を指します。',
    example: '「オウトの量と回数、タイミングを覚えておきます」。報告時に必要な情報です。'
  },
  {
    term: 'しびれ',
    description: 'ビリビリ・ジンジンする違和感のことです。神経の異常を示すことがあります。',
    example: '「しびれは片側だけなのか確認したいです」。脳血管障害の可能性も考慮します。'
  },
  {
    term: '動悸（ドウキ）',
    description: '胸のドキドキ感のことです。心臓の拍動を自分で感じる状態です。',
    example: '「ドウキが出ると、利用者さんは不安になりやすいですね」。落ち着いて対応することが大切です。'
  },
  {
    term: '息苦しさ（イキグルシサ）',
    description: '呼吸がしんどい状態のことです。呼吸困難とも言います。',
    example: '「イキグルシサが強い日は、無理しない動き方が大切ですね」。安静を保つよう声かけします。'
  },
  {
    term: '痰（タン）',
    description: '呼吸器から出るネバネバした分泌物のことです。色や量で状態を判断します。',
    example: '「タンの色や量は毎日差が出ますね」。変化を観察して報告します。'
  },
  {
    term: '喘鳴（ゼンメイ）',
    description: 'ゼーゼー、ヒューヒューという呼吸音のことです。気道が狭くなっている時に聞こえます。',
    example: '「ゼンメイが聞こえたら、呼吸の観察を深めます」。すぐに看護師さんに報告します。'
  },
  {
    term: 'むくみ（浮腫・フシュ）',
    description: '水分がたまって腫れる状態のことです。医学用語では「浮腫（フシュ）」と言います。',
    example: '「フシュは押して戻りの速さにも注目しています」。圧痕が残るかどうかを確認します。'
  },
  {
    term: '脱水（ダッスイ）',
    description: '体の水分が足りない状態のことです。高齢者は特に注意が必要です。',
    example: '「ダッスイは口の中の乾きで気づくこともありますね」。早めの水分補給を促します。'
  },
  {
    term: '便秘（ベンピ）',
    description: '便が出にくい状態のことです。排便回数が減ったり、便が硬くなります。',
    example: '「ベンピは数日続いたら、便の性状も一緒に観察します」。食事や水分摂取も確認します。'
  },
  {
    term: '下痢（ゲリ）',
    description: '水っぽい便が出る状態のことです。排便回数も増えることが多いです。',
    example: '「ゲリになると、脱水のほうも心配ですね」。水分補給に気をつけます。'
  },
  {
    term: '血尿（ケツニョウ）',
    description: 'オシッコに血が混じる状態のことです。尿の色で判断します。',
    example: '「ケツニョウは、まず色の変化で気がつきます」。赤色やピンク色の尿に注意します。'
  },
  {
    term: '胸やけ（ムネヤケ）',
    description: '胸のあたりが熱くなる違和感のことです。胃酸が逆流することで起こります。',
    example: '「ムネヤケが続くと、食事量が落ちることもありますね」。食後の様子を観察します。'
  }
];

async function updateSymptomsSection() {
  console.log('症状・病態セクションの更新を開始します...\n');

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

  // 新しい症状・病態セクションのブロックを生成
  console.log('\n新しい症状・病態セクションを生成中...');

  const symptomsBlocks = [
    {
      _type: 'block',
      style: 'h3',
      children: [{ _type: 'span', text: '症状・病態に関する用語' }]
    },
    {
      _type: 'block',
      style: 'normal',
      children: [{
        _type: 'span',
        text: '患者さんの身体に現れる症状を正しく理解することで、状態変化に早く気づけます。適切な観察と報告のために重要な用語です。'
      }]
    }
  ];

  // 各用語をブロックとして追加
  symptomsTerms.forEach(item => {
    // 用語名（太字）
    symptomsBlocks.push({
      _type: 'block',
      style: 'normal',
      children: [
        { _type: 'span', text: `・${item.term}`, marks: ['strong'] }
      ]
    });

    // 説明文
    symptomsBlocks.push({
      _type: 'block',
      style: 'normal',
      children: [{ _type: 'span', text: item.description }]
    });

    // 使い方の例
    symptomsBlocks.push({
      _type: 'block',
      style: 'normal',
      children: [
        { _type: 'span', text: '使い方：', marks: ['em'] },
        { _type: 'span', text: item.example }
      ]
    });

    // 空行
    symptomsBlocks.push({
      _type: 'block',
      style: 'normal',
      children: [{ _type: 'span', text: '' }]
    });
  });

  // 既存のbodyに、症状・病態セクションを挿入
  console.log('\n症状・病態セクションを記事に挿入中...');

  let newBody = [];
  let symptomsInserted = false;

  for (let i = 0; i < post.body.length; i++) {
    const block = post.body[i];

    // H3「身体・解剖に関する用語」の後に挿入
    if (block.style === 'h3' &&
        block.children?.[0]?.text?.includes('身体・解剖')) {
      newBody.push(block);

      // 身体・解剖セクションの内容をスキップ（次のH3まで）
      let skipUntilNextH3 = true;
      while (skipUntilNextH3 && i + 1 < post.body.length) {
        i++;
        if (post.body[i].style === 'h3' || post.body[i].style === 'h2') {
          skipUntilNextH3 = false;
          i--; // 次のH3/H2を保持するため戻る
        } else {
          newBody.push(post.body[i]); // 身体・解剖の内容を保持
        }
      }

      // 症状・病態セクションを挿入
      newBody.push(...symptomsBlocks);
      symptomsInserted = true;
      continue;
    }

    // 既存のH3「症状・病態」セクションがあれば削除
    if (block.style === 'h3' &&
        block.children?.[0]?.text?.includes('症状・病態')) {
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

  if (!symptomsInserted) {
    console.error('身体・解剖セクションが見つかりませんでした。');
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

  console.log('\n✅ 症状・病態セクションの更新が完了しました！');
  console.log('記事ID:', result._id);
  console.log('総ブロック数:', newBody.length);
}

updateSymptomsSection().catch(console.error);
