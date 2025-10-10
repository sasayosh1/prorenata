const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: 'skuaiF6GKMPzXiVAjI3F1EasATyv4YRnYXjw9eeYJEyUqgvwjTq15gJemzzJqc3GskkMwUwCoFD59EvFLMfiiLBuzYBOTUhYK7XNUQ4xzT9etGiCUnvjJzbsSJXdCSZm4TyPsLNqfwNT178wfxQor3OcJdvB50nWvcYTFsukSPKXov066Hwo'
});

// AIが生成した記事ドラフトデータ
const articleDraft = {
  _type: 'post',
  _id: 'drafts.', // これにより、ドキュメントが下書きとして作成されます
  title: '【シフトの悩み】看護助手の夜勤・交代制勤務を乗り切る5つのコツ',
  author: { _type: 'reference', _ref: 'aefbe415-6b34-4085-97b2-30b2aa12a6fa' }, // ProReNata編集部のIDを想定
  publishedAt: new Date().toISOString(),
  tags: ['シフト', '夜勤', '働き方', '悩み', '転職'],
  excerpt: '看護助手の不規則なシフト勤務は、体力的にも精神的にも大きな負担です。この記事では、夜勤や交代制勤務を乗り切るための具体的な5つのコツを、現役看護助手の視点から徹底解説します。生活リズムの整え方から、どうしても合わない場合のキャリアプランまで、あなたの悩みを解決するヒントが満載です。',
  body: [
    {
      _type: 'block', 
      style: 'normal',
      children: [{_type: 'span', text: '看護助手の仕事は、患者さんのケアに直接関わるやりがいのある専門職ですが、その一方で「シフト勤務」という大きな課題が伴います。特に夜勤や不規則な交代制は、生活リズムを崩しやすく、心身の不調につながることも少なくありません。「この働き方、いつまで続けられるんだろう…」と不安に感じている方も多いのではないでしょうか。'}]
    },
    {
      _type: 'block', 
      style: 'normal',
      children: [{_type: 'span', text: 'この記事では、そんな看護助手のシフト勤務の悩みを解消するために、今日から実践できる具体的な5つのコツをご紹介します。さらに、シフト勤務のメリット・デメリットを正しく理解し、どうしても今の働き方が合わないと感じた場合のキャリアプランについても解説します。あなたのワークライフバランスを改善するための一歩を、ここから踏み出しましょう。'}]
    },
    {
      _type: 'block', 
      style: 'h2',
      children: [{_type: 'span', text: '看護助手のシフト勤務、その実態とは？'}]
    },
    {
      _type: 'block', 
      style: 'normal',
      children: [{_type: 'span', text: '多くの病院や施設では、24時間体制で患者さんのケアを行うため、看護助手も交代制のシフト勤務が基本となります。一般的には「2交代制」または「3交代制」が採用されています.\n- 2交代制：日勤（約8時間）と夜勤（約16時間）の2つで構成。休みが多く感じやすいが、1回の夜勤が長いのが特徴です.\n- 3交代制：日勤、準夜勤、深夜勤の3つ（各約8時間）で構成。1回あたりの勤務時間は短いですが、勤務時間が細かく変動するため、生活リズムの調整が難しい側面があります。'}]
    },
    {
      _type: 'block', 
      style: 'h2',
      children: [{_type: 'span', text: 'シフト勤務を乗り切るための具体的なコツ5選'}]
    },
    {
      _type: 'block', 
      style: 'normal',
      children: [{_type: 'span', text: '1. 睡眠の質を最優先する：夜勤明けは、遮光カーテンやアイマスクを活用して、できるだけ暗く静かな環境で眠ることが重要です。寝る前にスマートフォンを見るのは避け、リラックスできる音楽を聴くなど、自分なりの入眠儀式を見つけましょう。'}]
    },
    {
      _type: 'block', 
      style: 'normal',
      children: [{_type: 'span', text: '2. 食生活を工夫する：勤務時間が不規則だと食事の時間も乱れがちです。消化の良いものを基本とし、特に夜勤前は揚げ物などを避け、軽めの食事を心がけましょう。また、休憩時間に手軽に栄養補給できるナッツやプロテインバーを準備しておくのもおすすめです。'}]
    },
    {
      _type: 'block', 
      style: 'normal',
      children: [{_type: 'span', text: '3. 積極的なリフレッシュ：休日は仕事のことを忘れ、趣味や運動に時間を使うことが心身の健康につながります。特に、太陽の光を浴びながらの散歩は、体内時計をリセットする効果も期待でき、おすすめです。'}]
    },
    {
      _type: 'block', 
      style: 'normal',
      children: [{_type: 'span', text: '4. シフト仲間との情報共有：同じ悩みを持つ同僚と、体調管理のコツやリフレッシュ方法について情報交換するのも有効です。「自分だけじゃない」と感じることで、精神的な負担が軽くなります。'}]
    },
    {
      _type: 'block', 
      style: 'normal',
      children: [{_type: 'span', text: '5. 事前のスケジュール管理：1ヶ月のシフトが出たら、早めにプライベートの予定を立ててしまいましょう。楽しみな予定を先に組むことで、仕事へのモチベーションが向上します。'}]
    },
    {
      _type: 'block', 
      style: 'h2',
      children: [{_type: 'span', text: 'どうしてもシフト勤務が合わない場合のキャリアプラン'}]
    },
    {
      _type: 'block', 
      style: 'normal',
      children: [{_type: 'span', text: '様々な工夫をしても、どうしても不規則な生活が体に合わないという方もいます。その場合は、無理をせず、自分の健康を第一に考えたキャリアチェンジも重要な選択肢です。看護助手の経験は、他の多くの職場で活かすことができます。例えば、日勤のみのクリニックや、介護施設のデイサービス、健診センターなどが考えられます。自分の経験をどう活かせるか、[INTERNAL_LINK: 看護助手のキャリアパス]について調べてみるのも良いでしょう。'}]
    },
    {
      _type: 'block', 
      style: 'h2',
      children: [{_type: 'span', text: 'まとめ'}]
    },
    {
      _type: 'block', 
      style: 'normal',
      children: [{_type: 'span', text: '看護助手のシフト勤務は決して楽ではありませんが、工夫次第で心身の負担を軽減することは可能です。今回ご紹介した5つのコツを実践し、自分に合った働き方を見つけてください。健康的なワークライフバランスを保ちながら、看護助手としてのキャリアを長く続けていくことを応援しています。'}]
    },
    {
      _type: 'block', 
      style: 'h3',
      children: [{_type: 'span', text: 'より良い職場環境を探している方へ'}]
    },
    {
      _type: 'block', 
      style: 'normal',
      children: [
        {_type: 'span', text: '現在のシフトに限界を感じ、日勤のみの職場や、より柔軟な働き方ができる場所を探しているなら、転職エージェントへの相談が第一歩です。'},
        {_type: 'span', text: '[AFFILIATE_LINK: 転職]'}
      ]
    },
    {
      _type: 'block', 
      style: 'normal',
      children: [
        {_type: 'span', text: '退職を考えているものの、伝え方や手続きに不安がある場合は、専門の退職代行サービスに相談する選択肢もあります。'},
        {_type: 'span', text: '[AFFILIATE_LINK: 退職代行]'}
      ]
    }
  ]
};

async function createArticleDraft() {
  console.log(`Creating draft for article: "${articleDraft.title}"`);
  try {
    const result = await client.create(articleDraft);
    console.log("\n--- Draft Creation Complete ---");
    console.log(`Successfully created draft with ID: ${result._id}`);
    console.log("You can now find this article in your Sanity Studio drafts.");
  } catch (error) {
    console.error('\nError creating draft:', error);
  }
}

createArticleDraft();