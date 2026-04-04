#!/usr/bin/env node
/**
 * Newsletter Truncation Fix
 * Directly patches three newsletter documents with complete, properly formatted PortableText content
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@sanity/client');

// Use environment variables or fallback to known values
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2';
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const token = process.env.SANITY_WRITE_TOKEN;

if (!token) {
  console.error('❌ SANITY_WRITE_TOKEN is not set in .env.local');
  process.exit(1);
}

const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  token,
  useCdn: false,
});

// Helper to create a paragraph block
function createBlock(text, style = 'normal') {
  return {
    _type: 'block',
    _key: Math.random().toString(36).substr(2, 9),
    style,
    children: [
      {
        _type: 'span',
        _key: Math.random().toString(36).substr(2, 9),
        text,
        marks: [],
      },
    ],
    markDefs: [],
  };
}

// Helper to create a heading block
function createHeading(text, level = 'h2') {
  return {
    _type: 'block',
    _key: Math.random().toString(36).substr(2, 9),
    style: level,
    children: [
      {
        _type: 'span',
        _key: Math.random().toString(36).substr(2, 9),
        text,
        marks: [],
      },
    ],
    markDefs: [],
  };
}

// Complete Newsletter 1: 現役看護助手向け
const newsletter1Body = [
  createBlock('転職を考えている理由は何ですか？'),
  createBlock(''),
  createBlock('給与が低い、人間関係がつらい、体力的にきつい……。看護助手の仕事をしていて、そう感じることは決して珍しくありません。'),
  createBlock(''),
  createBlock('わたしも感じていました。夜勤で疲れた身体で出勤して、「これでいいのかな」と思ったことが何度もあります。そんなふうに モヤモヤしている気持ちは、とても自然なこと。でも、その気持ちとどう向き合うかで、これからが変わります。'),
  createBlock(''),
  createHeading('現役が感じている5つの悩み', 'h2'),
  createBlock(''),
  createBlock('給与への不満'),
  createBlock(''),
  createBlock('「同じ仕事量なのに、他の病院では給料がもっと高い」という情報を知ってしまうと、モヤモヤは増します。夜勤手当、残業代、昇給の遅さ……給与の課題は離職理由の上位にあります。'),
  createBlock(''),
  createBlock('体力的な限界'),
  createBlock(''),
  createBlock('看護助手の仕事は身体を使います。夜勤を重ねると、疲労は蓄積します。「いつまでこのペースで続けられるのだろう」という不安は、誰もが一度は感じるはずです。'),
  createBlock(''),
  createBlock('人間関係のストレス'),
  createBlock(''),
  createBlock('医師、看護師、他の助手……多くの人と関わる職場だからこそ、人間関係のトラブルは大きなストレスになります。特に先輩からの指導が厳しい環境では、心が疲れます。'),
  createBlock(''),
  createBlock('やりがい不足'),
  createBlock(''),
  createBlock('ルーティンワークが多い職場では、「自分が何のためにここで働いているのか」という疑問が湧いてきます。患者さんの笑顔が見られることもあれば、そうでない日もあります。'),
  createBlock(''),
  createBlock('キャリアの見通しが立たない'),
  createBlock(''),
  createBlock('看護助手のキャリアってどこに向かうのか、不透明に感じることもあります。「このまま10年後も同じ仕事をしているのかな」という不安は、転職を考えるきっかけになります。'),
  createBlock(''),
  createHeading('今の職場で続けるための小さな工夫', 'h2'),
  createBlock(''),
  createBlock('副業を検討する'),
  createBlock(''),
  createBlock('給与が低いなら、副業という選択肢もあります。休日の時間を活用して、別の収入源を作ることで、心理的な余裕が生まれます。'),
  createBlock(''),
  createBlock('体調管理を意識的に'),
  createBlock(''),
  createBlock('十分な睡眠、バランスの良い食事、定期的な運動。基本的なことですが、これが身体の疲労感を和らげます。'),
  createBlock(''),
  createBlock('コミュニケーションを工夫する'),
  createBlock(''),
  createBlock('人間関係がつらいなら、話しやすい人を見つけたり、相談できる環境を整えることが大事です。一人で抱え込まないことが重要です。'),
  createBlock(''),
  createHeading('続けるか、転職するかを判断する視点', 'h2'),
  createBlock(''),
  createBlock('「このままでいいのか」と感じるのは、自分の気持ちと向き合っている証拠です。無理をして続ける必要もなければ、勢いで辞める必要もありません。'),
  createBlock(''),
  createBlock('自分の気持ちを大事にしながら、一歩ずつ判断していってくださいね。'),
  createBlock(''),
  createBlock('応援しています。'),
];

// Complete Newsletter 2: 転職検討層向け
const newsletter2Body = [
  createBlock('転職って、本当に大きな決断ですよね。'),
  createBlock(''),
  createBlock('「今の職場を離れていいのかな」「新しい環境でやっていけるかな」――そんなふうに揺れる気持ちは、とても自然なものです。わたしも、転職を迷ったことがあります。'),
  createBlock(''),
  createBlock('でも、迷っているということは、今の働き方やこれからのキャリアを真剣に考え始めているサイン。その気持ちを大事にしてほしいです。'),
  createBlock(''),
  createHeading('転職を考える主な理由 TOP 5', 'h2'),
  createBlock(''),
  createBlock('給与や待遇を改善したい'),
  createBlock(''),
  createBlock('「同じ仕事なのに、他の病院のほうが給料がいい」と気づいたとき、転職が頭をよぎります。'),
  createBlock(''),
  createBlock('職場環境を変えたい'),
  createBlock(''),
  createBlock('人間関係、夜勤の負担、やりがいの有無……職場の雰囲気は、仕事満足度に大きく影響します。'),
  createBlock(''),
  createBlock('キャリアを積みたい'),
  createBlock(''),
  createBlock('認定資格を取りたい、別の診療科で経験を積みたい、という前向きな理由で転職を考える人も多いです。'),
  createBlock(''),
  createBlock('自分らしく働きたい'),
  createBlock(''),
  createBlock('「患者さんとの関わり方」「ワークライフバランス」など、自分の価値観を大事にしたいという思いから転職を決める人も増えています。'),
  createBlock(''),
  createBlock('心理的なハードルを乗り越えたい'),
  createBlock(''),
  createBlock('新しい環境への不安、一から人間関係を作る心理的負担……。転職には、目に見えない心理的コストがあります。'),
  createBlock(''),
  createHeading('転職を前向きな選択にするための実践的なステップ', 'h2'),
  createBlock(''),
  createBlock('ステップ1: 自己分析をする'),
  createBlock(''),
  createBlock('なぜ転職したいのか、紙やメモに書き出してみてください。給与、環境、キャリア……複数の理由があるかもしれません。優先順位をつけることで、どんな職場を探すべきかが見えてきます。'),
  createBlock(''),
  createBlock('ステップ2: 情報を集める'),
  createBlock(''),
  createBlock('転職サイト、口コミ、先輩の話……様々な情報源から、興味のある職場について調べます。ここで時間をかけることで、後悔しない選択につながります。'),
  createBlock(''),
  createBlock('ステップ3: スキルを整理する'),
  createBlock(''),
  createBlock('今の職場で身につけたスキル、経験を整理しておくと、職務経歴書や面接で説得力が増します。'),
  createBlock(''),
  createBlock('ステップ4: 応募から面接まで'),
  createBlock(''),
  createBlock('履歴書、職務経歴書を丁寧に作成して応募。面接では、自分の気持ちと経験を素直に伝えることが大切です。'),
  createBlock(''),
  createHeading('転職も、続けるのも、正解', 'h2'),
  createBlock(''),
  createBlock('迷うのは自然です。でも、準備をしてから動くことで、後悔しにくい選択ができます。'),
  createBlock(''),
  createBlock('あなたの決断を応援しています。'),
];

// Complete Newsletter 3: 就職検討層向け
const newsletter3Body = [
  createBlock('看護助手という職業に興味を持ってくれて、ありがとうございます。'),
  createBlock(''),
  createBlock('わたしは看護助手として働いています。患者さんの日常のお世話をしたり、スタッフのサポートをしたり……毎日、様々な場面で人と関わる仕事です。'),
  createBlock(''),
  createBlock('「看護助手って、実際のところどんな仕事？」「向いている人ってどんな人？」そんな疑問を持つあなたに、現場の視点からお話ししたいです。'),
  createBlock(''),
  createHeading('看護助手という仕事の特徴', 'h2'),
  createBlock(''),
  createBlock('患者さんとの距離が近い仕事です。食事、排泄、入浴などの日常のお世話を通じて、患者さんの回復を間近で見ることができます。'),
  createBlock(''),
  createBlock('また、医師や看護師のサポートも重要な役割です。スタッフが患者さんの医療に専念できるよう、環境整備や雑務を担当します。'),
  createBlock(''),
  createBlock('給与、労働条件、キャリアパスは職場によって様々です。選ぶ職場によって、働き方が大きく変わります。'),
  createBlock(''),
  createHeading('向いている人の特徴と資格について', 'h2'),
  createBlock(''),
  createBlock('向いている人の特徴'),
  createBlock(''),
  createBlock('患者さんのお世話に喜びを感じられる人、コミュニケーションが得意な人、体力に自信のある人が向いています。'),
  createBlock(''),
  createBlock('資格について'),
  createBlock(''),
  createBlock('看護助手になるのに、特定の資格は必須ではありません。ただし、認定資格を取得することで、仕事の幅が広がり、キャリアの信用度も増します。'),
  createBlock(''),
  createBlock('学歴について'),
  createBlock(''),
  createBlock('看護助手の仕事には学歴の制限はありません。高卒でも、専門学校卒でも、大学卒でも、誰でも目指せます。'),
  createBlock(''),
  createHeading('就職前にやっておくべき３つのこと', 'h2'),
  createBlock(''),
  createBlock('体力づくり'),
  createBlock(''),
  createBlock('移乗介護、立ちっぱなしの勤務など、身体を使う仕事です。事前に運動習慣をつけておくと、現場での疲労が減ります。'),
  createBlock(''),
  createBlock('コミュニケーション基礎'),
  createBlock(''),
  createBlock('患者さんや多くのスタッフと関わるので、丁寧な言葉遣い、聞き方、話し方の基本を学んでおくと、現場で役立ちます。'),
  createBlock(''),
  createBlock('医療知識の予習'),
  createBlock(''),
  createBlock('病院の基本的な構造、医療用語、感染対策など、基礎知識があると、現場での不安が減ります。'),
  createBlock(''),
  createHeading('わたしから応援メッセージ', 'h2'),
  createBlock(''),
  createBlock('看護助手の仕事は大変なこともあります。でも、患者さんの笑顔、スタッフとのチームワーク、自分の成長を感じたとき、やりがいは本当に大きいです。'),
  createBlock(''),
  createBlock('一緒に現場で頑張りましょう。応援しています。'),
];

async function fixNewsletterTruncation() {
  try {
    console.log('🔧 Newsletter truncation fix started...\n');
    console.log(`📌 Project ID: ${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}`);
    console.log(`📌 Dataset: ${process.env.NEXT_PUBLIC_SANITY_DATASET}\n`);

    // Get existing documents to preserve metadata
    let existingDocs = await sanityClient.fetch(
      `*[_type == "newsletter"] | order(emailNumber asc) { _id, emailNumber, subject, theme, notes, sent }`
    );

    console.log(`📊 Found ${existingDocs.length} newsletter documents\n`);

    if (existingDocs.length < 3) {
      // Try to get the first 3 documents regardless of emailNumber
      console.log('⚠️  Getting first 3 documents by creation order...');
      existingDocs = await sanityClient.fetch(
        `*[_type == "newsletter"] | order(_createdAt asc) [0...3] { _id, emailNumber, subject, theme, notes, sent }`
      );
      console.log(`📊 Retrieved ${existingDocs.length} documents by creation order\n`);
    }

    if (existingDocs.length < 3) {
      console.error('❌ Expected at least 3 newsletter documents, found:', existingDocs.length);
      process.exit(1);
    }

    const updates = [
      {
        id: existingDocs[0]._id,
        number: 1,
        body: newsletter1Body,
        subject: existingDocs[0].subject,
        theme: existingDocs[0].theme,
        notes: existingDocs[0].notes,
      },
      {
        id: existingDocs[1]._id,
        number: 2,
        body: newsletter2Body,
        subject: existingDocs[1].subject,
        theme: existingDocs[1].theme,
        notes: existingDocs[1].notes,
      },
      {
        id: existingDocs[2]._id,
        number: 3,
        body: newsletter3Body,
        subject: existingDocs[2].subject,
        theme: existingDocs[2].theme,
        notes: existingDocs[2].notes,
      },
    ];

    for (const update of updates) {
      console.log(`📝 Patching Newsletter ${update.number}...`);

      const patch = {
        set: {
          body: update.body,
        },
      };

      await sanityClient.patch(update.id).set(patch.set).commit();

      // Verify the patch by counting blocks
      const patched = await sanityClient.getDocument(update.id);
      const blockCount = patched.body ? patched.body.length : 0;
      console.log(`   ✅ Newsletter ${update.number} patched with ${blockCount} blocks\n`);
    }

    console.log('✨ All newsletters patched successfully!');
    console.log('\n📊 Summary:');
    console.log('   Newsletter 1: ~600 words (現役看護助手向け)');
    console.log('   Newsletter 2: ~600 words (転職検討層向け)');
    console.log('   Newsletter 3: ~600 words (就職検討層向け)');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixNewsletterTruncation();
