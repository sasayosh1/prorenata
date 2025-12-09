const { createClient } = require('@sanity/client');
require('dotenv').config({ path: '../.env.local' });

const SANITY_CONFIG = {
  projectId: '72m8vhy2',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN
};

// 100個の医療用語データ（カテゴリ別）
const medicalTerms = {
  'バイタルサインに関する用語': [
    '体温（BT: Body Temperature）：身体の温度。正常値は36.0〜37.0℃。',
    '脈拍（P: Pulse）：心臓の拍動数。正常値は60〜100回/分。',
    '呼吸（R: Respiration）：1分間の呼吸回数。正常値は12〜20回/分。',
    '血圧（BP: Blood Pressure）：血管にかかる圧力。正常値は収縮期120/拡張期80mmHg程度。',
    'SpO2（経皮的動脈血酸素飽和度）：血液中の酸素濃度。正常値は95%以上。',
    '意識レベル：患者さんの覚醒状態。JCSやGCSで評価されます。',
    '体温計：体温を測定する器具。',
    '血圧計：血圧を測定する器具。',
    'パルスオキシメーター：SpO2を測定する指先に装着する器具。',
    'バイタルサイン（VS）：生命兆候。体温・脈拍・呼吸・血圧の総称。'
  ],
  '身体・解剖に関する用語': [
    '上肢：腕のこと。肩から手先まで。',
    '下肢：脚のこと。股関節から足先まで。',
    '腹部：お腹の部分。',
    '胸部：胸の部分。',
    '頭部：頭の部分。',
    '頸部：首の部分。',
    '皮膚：身体の表面を覆う組織。',
    '骨：身体の骨格を形成する硬い組織。',
    '筋肉：身体を動かす組織。',
    '関節：骨と骨をつなぐ部分。',
    '臓器：心臓・肺・肝臓など身体の器官。',
    '血管：血液が流れる管。動脈と静脈がある。',
    '神経：脳からの信号を伝える組織。',
    '粘膜：口・鼻・胃腸などの内側を覆う組織。',
    'リンパ節：免疫に関わる小さな器官。首・わきの下・鼠径部などにある。'
  ],
  '症状・病態に関する用語': [
    '発熱：体温が高い状態。通常37.5℃以上。',
    '疼痛（とうつう）：痛みのこと。',
    '浮腫（ふしゅ）：むくみ。体内に水分が溜まった状態。',
    '脱水：体内の水分が不足した状態。',
    'チアノーゼ：酸素不足で唇や爪が紫色になる状態。',
    '貧血：血液中の赤血球が不足した状態。',
    '嘔吐（おうと）：吐くこと。',
    '下痢：便が水のように柔らかい状態。',
    '便秘：便が出にくい状態。',
    '発疹（ほっしん）：皮膚に出る赤い斑点。',
    '咳嗽（がいそう）：咳のこと。',
    '喀痰（かくたん）：痰のこと。',
    '呼吸困難：息苦しさ。',
    '意識障害：意識がはっきりしない状態。',
    '麻痺（まひ）：身体の一部が動かせない状態。'
  ],
  '検査・処置に関する用語': [
    '採血：血液を採取すること。',
    '点滴（IV drip）：静脈から薬剤などを投与すること。',
    '吸引：痰などを吸い取ること。',
    '導尿：尿道からカテーテルを挿入し、排尿を促すこと。',
    '体位変換：寝たきりの患者さんの体の向きを変えること。',
    '清拭（せいしき）：身体を拭いて清潔にすること。',
    '入浴介助：入浴のお手伝い。',
    '食事介助：食事のお手伝い。',
    '排泄介助：トイレのお手伝い。',
    '移乗介助：ベッドから車椅子への移動のお手伝い。',
    '検温：体温を測定すること。',
    '血糖測定：血液中の糖分を測定すること。',
    '酸素投与：酸素を吸入してもらうこと。',
    '創傷処置：傷の手当て。',
    '包帯交換：古い包帯を新しいものに替えること。'
  ],
  '医療器具・物品に関する用語': [
    'カテーテル：体内に挿入して使用する管。',
    'ガーゼ：傷の手当てなどに使う布。',
    'シリンジ：注射器。',
    '酸素ボンベ：酸素を供給するための容器。',
    '車椅子：移動に使用する椅子。',
    'ストレッチャー：患者さんを運ぶベッド型の器具。',
    '点滴スタンド：点滴の袋を吊るすための棒。',
    '血圧計：血圧を測定する器具。',
    '体温計：体温を測定する器具。',
    '手袋（グローブ）：感染予防のために使用する使い捨て手袋。'
  ],
  '薬剤・治療に関する用語': [
    '内服薬：飲む薬。',
    '外用薬：塗る薬。',
    '注射薬：注射で投与する薬。',
    '抗生物質：細菌を殺す薬。',
    '解熱剤：熱を下げる薬。',
    '鎮痛剤：痛みを和らげる薬。',
    '消毒薬：細菌を殺すための薬液。',
    'リハビリテーション：機能回復訓練。',
    '輸液：点滴で水分や栄養を補給すること。',
    '処方箋：医師が薬を処方する指示書。'
  ],
  '体位・移動に関する用語': [
    '仰臥位（ぎょうがい）：仰向けの姿勢。',
    '側臥位（そくがい）：横向きの姿勢。',
    '腹臥位（ふくがい）：うつ伏せの姿勢。',
    'ファーラー位：上半身を起こした姿勢（30〜60度）。',
    '移乗：ベッドから車椅子などへの移動。'
  ],
  '栄養・排泄に関する用語': [
    '経口摂取：口から食べること。',
    '経管栄養：チューブから栄養を入れること。',
    '尿量：1日に出る尿の量。',
    '失禁：排泄を我慢できない状態。',
    'おむつ交換：おむつを新しいものに替えること。'
  ],
  'よく使われる略語': [
    'ADL（Activities of Daily Living）：日常生活動作。',
    'QOL（Quality of Life）：生活の質。',
    'Dr.（ドクター）：医師。',
    'Ns.（ナース）：看護師。',
    'OP（オペ）：手術。',
    'ICU（Intensive Care Unit）：集中治療室。',
    'ER（Emergency Room）：救急救命室。',
    'NPO（Nothing Per Oral）：絶食。',
    'IV（Intravenous）：静脈内。点滴のこと。',
    'IM（Intramuscular）：筋肉内。筋肉注射のこと。',
    'PRN（Pro Re Nata）：必要時。必要に応じて投与する指示。',
    'Stat（Statim）：直ちに。緊急の指示。',
    'TPN（Total Parenteral Nutrition）：完全静脈栄養。',
    'DNR（Do Not Resuscitate）：蘇生処置を行わない指示。',
    'ROM（Range of Motion）：関節の可動域。'
  ]
};

async function expandMedicalTermsArticle() {
  console.log('医療用語記事の手動拡充を開始します...\n');

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

  // Portable Text bodyを生成
  console.log('\n100個の医療用語を含むPortable Textを生成中...');

  const body = [];

  // 導入部分
  body.push({
    "_type": "block",
    "style": "normal",
    "children": [{"_type": "span", "text": "看護助手として働く中で、医療用語を理解することはとても大切ですよね。"}]
  });
  body.push({
    "_type": "block",
    "style": "normal",
    "children": [{"_type": "span", "text": "わたし自身、最初は聞き慣れない言葉ばかりで戸惑いましたが、少しずつ覚えていくうちに、看護師さんとのコミュニケーションがスムーズになり、患者さんのケアにも自信が持てるようになりました。"}]
  });
  body.push({
    "_type": "block",
    "style": "normal",
    "children": [{"_type": "span", "text": "この記事では、看護助手が知っておくべき医療用語100個を厳選してご紹介します。すべてを一度に覚える必要はありません。現場で実際に使われている言葉から、少しずつ慣れていきましょう。"}]
  });

  // メインセクション
  body.push({
    "_type": "block",
    "style": "h2",
    "children": [{"_type": "span", "text": "【完全版】看護助手が知っておくべき医療用語100選"}]
  });

  // 各カテゴリの用語を追加
  let termCount = 0;
  Object.entries(medicalTerms).forEach(([category, terms]) => {
    // カテゴリ見出し
    body.push({
      "_type": "block",
      "style": "h3",
      "children": [{"_type": "span", "text": category}]
    });

    // 簡単な説明
    let description = '';
    if (category === 'バイタルサインに関する用語') {
      description = '現場で最も頻繁に使用される用語です。患者さんの状態を把握する基本となります。';
    } else if (category === '身体・解剖に関する用語') {
      description = '身体の部位や構造を正確に伝えるために必要な用語です。';
    } else if (category === '症状・病態に関する用語') {
      description = '患者さんの症状を報告する際に使用する用語です。';
    } else if (category === '検査・処置に関する用語') {
      description = '日常的なケアや検査で使用される用語です。';
    } else if (category === '医療器具・物品に関する用語') {
      description = '業務で扱う器具や物品の名称です。';
    } else if (category === '薬剤・治療に関する用語') {
      description = '薬剤や治療方法に関連する用語です。';
    } else if (category === '体位・移動に関する用語') {
      description = '患者さんの姿勢や体位を表す用語です。';
    } else if (category === '栄養・排泄に関する用語') {
      description = '食事や排泄のケアで使用する用語です。';
    } else if (category === 'よく使われる略語') {
      description = 'カルテや看護師さんとの会話でよく使われる略語です。覚えておくと便利です。';
    }

    body.push({
      "_type": "block",
      "style": "normal",
      "children": [{"_type": "span", "text": description}]
    });

    // 用語リスト
    terms.forEach(term => {
      body.push({
        "_type": "block",
        "style": "normal",
        "listItem": "bullet",
        "children": [{"_type": "span", "text": term}]
      });
      termCount++;
    });
  });

  // 学習法セクション
  body.push({
    "_type": "block",
    "style": "h2",
    "children": [{"_type": "span", "text": "医療用語を効率よく覚えるための学習法"}]
  });
  body.push({
    "_type": "block",
    "style": "normal",
    "children": [{"_type": "span", "text": "100個の用語を見て、「こんなにたくさん覚えられない」と思われたかもしれません。でも大丈夫です。わたしからの提案をいくつかご紹介しますね。"}]
  });
  body.push({
    "_type": "block",
    "style": "normal",
    "listItem": "bullet",
    "children": [{"_type": "span", "text": "毎日少しずつ覚える：一度に全てを覚えようとせず、1日5個など無理のないペースで進めましょう。"}]
  });
  body.push({
    "_type": "block",
    "style": "normal",
    "listItem": "bullet",
    "children": [{"_type": "span", "text": "実際に使われている場面で覚える：業務中に耳にした言葉や、カルテに書かれている言葉をメモし、意味を調べる習慣をつけましょう。"}]
  });
  body.push({
    "_type": "block",
    "style": "normal",
    "listItem": "bullet",
    "children": [{"_type": "span", "text": "ノートにまとめる：自分なりのノートを作成すると、効率よく覚えられます。イラストを描くのもおすすめです。"}]
  });
  body.push({
    "_type": "block",
    "style": "normal",
    "listItem": "bullet",
    "children": [{"_type": "span", "text": "分からないことはすぐに質問する：疑問をそのままにせず、先輩や看護師さんに積極的に質問しましょう。"}]
  });

  // まとめセクション
  body.push({
    "_type": "block",
    "style": "h2",
    "children": [{"_type": "span", "text": "まとめ"}]
  });
  body.push({
    "_type": "block",
    "style": "normal",
    "children": [{"_type": "span", "text": "今日もお疲れさまでした。医療用語は最初は難しく感じるかもしれませんが、実際に使っているうちに自然と身につきます。"}]
  });
  body.push({
    "_type": "block",
    "style": "normal",
    "children": [{"_type": "span", "text": "焦らず、少しずつ、自分のペースで進めていきましょう。わたしも応援しています。"}]
  });

  console.log(`✅ Portable Text生成完了（用語数: ${termCount}個、総ブロック数: ${body.length}）`);

  // 記事を更新
  console.log('\nSanityに記事を保存中...');

  const updatedPost = {
    ...post,
    body: body,
    _type: 'post'
  };

  delete updatedPost._rev;

  try {
    const result = await sanityClient.createOrReplace(updatedPost);
    console.log('\n✅ 記事の更新が完了しました！');
    console.log('記事ID:', result._id);
    console.log('用語数:', termCount);
    console.log('総ブロック数:', body.length);
  } catch (error) {
    console.error('エラーが発生しました:', error.message);
  }
}

expandMedicalTermsArticle();
