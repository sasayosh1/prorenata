const { createClient } = require('@sanity/client');
require('dotenv').config({ path: '../.env.local' });

const SANITY_CONFIG = {
  projectId: '72m8vhy2',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN
};

// 医療器具・物品に関する用語（白崎セラ口調）
const medicalEquipmentTerms = [
  {
    term: 'ネブライザー',
    description: '吸入で薬を霧にして使う器械です。気道に直接薬を届けられます。',
    example: '「ネブライザーは音とモクモクが出るので、初めての人は驚きやすいですね」と、事前に説明することが多いです。'
  },
  {
    term: 'パルスオキシメーター',
    description: '指にはさんでSpO₂（酸素飽和度）をはかる器械です。痛みはありません。',
    example: '「パルスオキシメーターをピッと挟んで数字が動くのを見ると安心します」。患者さんも一緒に確認できる器械です。'
  },
  {
    term: 'ナースコール',
    description: '呼び出しボタンのことです。患者さんがスタッフを呼ぶときに使います。',
    example: '「ナースコールのボタンを押せば、スタッフが気づける安心の道具ですね」と、使い方を丁寧にお伝えします。'
  },
  {
    term: 'スライディングシート',
    description: '移動や体位変換で摩擦を減らす布です。患者さんの身体への負担を軽減します。',
    example: '「スライディングシートを使うと、体がふしぎなほど軽く動く感じがありますね」。力仕事の負担も減ります。'
  },
  {
    term: '吸引器（キュウインキ）',
    description: '痰を吸って外に取り出す器械です。呼吸を楽にするための処置に使います。',
    example: '「吸引器は音と吸われる感じで気持ちがソワソワする人も多いです」。声かけを工夫しています。'
  },
  {
    term: '酸素ボンベ（サンソボンベ）',
    description: '酸素を運べるようにまとめたボンベです。移動時の酸素供給に使います。',
    example: '「酸素ボンベは移動のときは転倒リスクもよく考えます」。安全な取り扱いが大切です。'
  },
  {
    term: 'カテーテル（尿）（ニョウカテ）',
    description: '尿を外へ流すチューブです。尿道カテーテルとも言います。',
    example: '「ニョウカテは引っ張らないように気をつけます」。移動介助のときは特に注意が必要です。'
  },
  {
    term: '尿バッグ（ニョウバッグ）',
    description: '尿をためる袋です。カテーテルと接続して使います。',
    example: '「尿バッグは色・量・にごりをみるのがポイントですね」。観察項目を意識しています。'
  },
  {
    term: 'ガーゼ',
    description: '傷や皮膚を守る布です。創部の保護や清潔保持に使います。',
    example: '「ガーゼは貼り替えの時に観察もしやすくなりますね」。交換のタイミングも大切です。'
  },
  {
    term: 'テープ',
    description: '固定や保護でよく使うものです。医療用テープには様々な種類があります。',
    example: '「テープは皮膚が弱い人には特に優しく扱います」。かぶれやすい方には低刺激タイプを選びます。'
  }
];

async function updateMedicalEquipmentSection() {
  console.log('医療器具・物品セクションの更新を開始します...\n');

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

  // 新しい医療器具・物品セクションのブロックを生成
  console.log('\n新しい医療器具・物品セクションを生成中...');

  const medicalEquipmentBlocks = [
    {
      _type: 'block',
      style: 'h3',
      children: [{ _type: 'span', text: '医療器具・物品に関する用語' }]
    },
    {
      _type: 'block',
      style: 'normal',
      children: [{
        _type: 'span',
        text: '現場でよく使用する医療器具や物品の名称を理解することで、スムーズな業務遂行が可能になります。安全な取り扱いのためにも重要な知識です。'
      }]
    }
  ];

  // 各用語をブロックとして追加
  medicalEquipmentTerms.forEach(item => {
    // 用語名（太字）
    medicalEquipmentBlocks.push({
      _type: 'block',
      style: 'normal',
      children: [
        { _type: 'span', text: `・${item.term}`, marks: ['strong'] }
      ]
    });

    // 説明文
    medicalEquipmentBlocks.push({
      _type: 'block',
      style: 'normal',
      children: [{ _type: 'span', text: item.description }]
    });

    // 使い方の例
    medicalEquipmentBlocks.push({
      _type: 'block',
      style: 'normal',
      children: [
        { _type: 'span', text: '使い方：', marks: ['em'] },
        { _type: 'span', text: item.example }
      ]
    });

    // 空行
    medicalEquipmentBlocks.push({
      _type: 'block',
      style: 'normal',
      children: [{ _type: 'span', text: '' }]
    });
  });

  // 既存のbodyから、医療器具・物品セクションを置き換え
  console.log('\n医療器具・物品セクションを記事に挿入中...');

  let newBody = [];
  let equipmentInserted = false;

  for (let i = 0; i < post.body.length; i++) {
    const block = post.body[i];

    // 既存のH3「検査・処置」セクションの後に挿入
    if (block.style === 'h3' &&
        block.children?.[0]?.text?.includes('検査・処置')) {
      newBody.push(block);

      // 検査・処置セクションの内容をスキップ（次のH3まで）
      let skipUntilNextH3 = true;
      while (skipUntilNextH3 && i + 1 < post.body.length) {
        i++;
        if (post.body[i].style === 'h3' || post.body[i].style === 'h2') {
          skipUntilNextH3 = false;
          i--; // 次のH3/H2を保持するため戻る
        } else {
          newBody.push(post.body[i]); // 検査・処置の内容を保持
        }
      }

      // 医療器具・物品セクションを挿入
      newBody.push(...medicalEquipmentBlocks);
      equipmentInserted = true;
      continue;
    }

    // 既存のH3「医療器具・物品」セクションがあれば削除
    if (block.style === 'h3' &&
        block.children?.[0]?.text?.includes('医療器具・物品')) {
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

  if (!equipmentInserted) {
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

  console.log('\n✅ 医療器具・物品セクションの更新が完了しました！');
  console.log('記事ID:', result._id);
  console.log('総ブロック数:', newBody.length);
}

updateMedicalEquipmentSection().catch(console.error);
