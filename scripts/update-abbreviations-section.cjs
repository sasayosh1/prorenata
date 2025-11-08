const { createClient } = require('@sanity/client');
require('dotenv').config({ path: '../.env.local' });

const SANITY_CONFIG = {
  projectId: '72m8vhy2',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN
};

// よく使う略語（白崎セラ口調）
const abbreviationTerms = [
  {
    term: 'VS',
    description: 'バイタルサインの略です。体温・脈拍・呼吸・血圧をまとめて指します。',
    example: '「VSの時間だね」と声をかけられたら、バイタル測定のタイミングです。'
  },
  {
    term: 'SpO₂',
    description: '酸素飽和度の略です。血液中の酸素の量を示します。',
    example: '「SpO₂、数字の動きが気になりますね」と、パルスオキシメーターの値を確認します。'
  },
  {
    term: 'BT',
    description: '体温（Body Temperature）の略です。発熱の有無を確認する基本指標です。',
    example: '「BT、微妙に極端じゃないですか」と、いつもと違う値に気づくことがあります。'
  },
  {
    term: 'BP',
    description: '血圧（Blood Pressure）の略です。心臓や血管の状態を示します。',
    example: '「BPの上、今日は低めっぽいですね」と、収縮期血圧の変化を観察します。'
  },
  {
    term: 'HR',
    description: '心拍数（Heart Rate）の略です。1分間の心臓の拍動回数です。',
    example: '「HR、数えながら表情も見ますね」。脈拍測定時は患者さんの様子も確認します。'
  },
  {
    term: 'RR',
    description: '呼吸数（Respiratory Rate）の略です。1分間の呼吸回数を指します。',
    example: '「RRは、手の動きでも分かりますね」。胸の上下だけでなく、呼吸の様子を観察します。'
  },
  {
    term: 'sat',
    description: 'サチュレーション（SpO₂）の略です。現場でよく使われる口語表現です。',
    example: '「sat 95切ると構えますね」。基準値を下回ったら注意深く観察します。'
  },
  {
    term: 'ECG',
    description: '心電図（Electrocardiogram）の略です。心臓の電気的活動を記録します。',
    example: '「ECG、電極位置で印象変わりますね」。正確な装着位置が大切です。'
  },
  {
    term: 'XP',
    description: 'レントゲン（X線撮影）の略です。X-ray Photographyの略称です。',
    example: '「XPの日は移動多めですね」。検査室への移動介助が増えます。'
  },
  {
    term: 'IV',
    description: '静脈注射（Intravenous）の略です。点滴ルートを指すこともあります。',
    example: '「IVルート触らないよう配慮しますね」。患者さんの動きに気をつけます。'
  },
  {
    term: 'NPO',
    description: '経口禁止（Nil Per Os）の略です。口から何も摂取できない状態を指します。',
    example: '「NPOのときは水分もしっかり確認しますね」。誤って飲食しないよう注意します。'
  },
  {
    term: 'IC',
    description: 'インフォームドコンセント（Informed Consent）の略です。説明と同意のことです。',
    example: '「ICのあとって少し表情がかわりますね」。患者さんの心情の変化に気づきます。'
  },
  {
    term: 'ADL',
    description: '日常生活動作（Activities of Daily Living）の略です。食事・排泄・移動などの基本動作です。',
    example: '「ADLの小さな差を拾いますね」。日々の変化を観察して記録します。'
  },
  {
    term: 'PO',
    description: '経口投与（Per Os）の略です。口から薬を飲むことを指します。',
    example: '「POでいけるとホッとしますね」。経口で服薬できることは大きな回復のサインです。'
  },
  {
    term: 'PRN',
    description: '必要時（Pro Re Nata）の略です。症状が出たときに使用する薬の指示です。',
    example: '「PRNは現場で本当によく見る単語ですね」。頓服薬の指示でよく使われます。'
  }
];

async function updateAbbreviationsSection() {
  console.log('よく使う略語セクションの更新を開始します...\n');

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

  // 新しいよく使う略語セクションのブロックを生成
  console.log('\n新しいよく使う略語セクションを生成中...');

  const abbreviationBlocks = [
    {
      _type: 'block',
      style: 'h3',
      children: [{ _type: 'span', text: 'よく使われる略語' }]
    },
    {
      _type: 'block',
      style: 'normal',
      children: [{
        _type: 'span',
        text: '医療現場では英語の略語が頻繁に使われます。これらの略語を理解することで、スタッフ間のコミュニケーションがスムーズになります。'
      }]
    }
  ];

  // 各用語をブロックとして追加
  abbreviationTerms.forEach(item => {
    // 用語名（太字）
    abbreviationBlocks.push({
      _type: 'block',
      style: 'normal',
      children: [
        { _type: 'span', text: `・${item.term}`, marks: ['strong'] }
      ]
    });

    // 説明文
    abbreviationBlocks.push({
      _type: 'block',
      style: 'normal',
      children: [{ _type: 'span', text: item.description }]
    });

    // 使い方の例
    abbreviationBlocks.push({
      _type: 'block',
      style: 'normal',
      children: [
        { _type: 'span', text: '使い方：', marks: ['em'] },
        { _type: 'span', text: item.example }
      ]
    });

    // 空行
    abbreviationBlocks.push({
      _type: 'block',
      style: 'normal',
      children: [{ _type: 'span', text: '' }]
    });
  });

  // 既存のbodyから、よく使う略語セクションを置き換え
  console.log('\nよく使う略語セクションを記事に挿入中...');

  let newBody = [];
  let abbreviationInserted = false;

  for (let i = 0; i < post.body.length; i++) {
    const block = post.body[i];

    // 既存のH3「栄養・排泄」セクションの後に挿入
    if (block.style === 'h3' &&
        block.children?.[0]?.text?.includes('栄養・排泄')) {
      newBody.push(block);

      // 栄養・排泄セクションの内容をスキップ（次のH3まで）
      let skipUntilNextH3 = true;
      while (skipUntilNextH3 && i + 1 < post.body.length) {
        i++;
        if (post.body[i].style === 'h3' || post.body[i].style === 'h2') {
          skipUntilNextH3 = false;
          i--; // 次のH3/H2を保持するため戻る
        } else {
          newBody.push(post.body[i]); // 栄養・排泄の内容を保持
        }
      }

      // よく使う略語セクションを挿入
      newBody.push(...abbreviationBlocks);
      abbreviationInserted = true;
      continue;
    }

    // 既存のH3「よく使う略語」や「略語」セクションがあれば削除
    if (block.style === 'h3' &&
        (block.children?.[0]?.text?.includes('よく使う略語') ||
         block.children?.[0]?.text?.includes('略語'))) {
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

  if (!abbreviationInserted) {
    console.error('栄養・排泄セクションが見つかりませんでした。');
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

  console.log('\n✅ よく使う略語セクションの更新が完了しました！');
  console.log('記事ID:', result._id);
  console.log('総ブロック数:', newBody.length);
  console.log('\n🎉 100語すべての追加が完了しました！');
}

updateAbbreviationsSection().catch(console.error);
