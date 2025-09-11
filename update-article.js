const fs = require('fs');
const { createClient } = require('@sanity/client');

const articlesFilePath = '/Users/user/prorenata/all-articles.json';
const sanityToken = 'skkTjwpdrsjKKpaDxKVShzCSI7GMWE1r5TQdwl0b7LTylVPoAxzBg0oPqhtUQyfPjyvtZW2mu6nfUMNUJ';

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: sanityToken,
});

// MarkdownからPortable Textへの変換関数
function markdownToPortableText(markdown) {
  const blocks = [];
  const lines = markdown.split('\n');

  let currentBlock = null;

  lines.forEach(line => {
    // H2見出し
    if (line.startsWith('## ')) {
      if (currentBlock) {
        blocks.push(currentBlock);
      }
      currentBlock = {
        _key: Math.random().toString(36).substring(2, 15), // ユニークなキーを生成
        _type: 'block',
        style: 'h2',
        children: [{
          _key: Math.random().toString(36).substring(2, 15),
          _type: 'span',
          text: line.substring(3).trim()
        }]
      };
    }
    // H3見出し
    else if (line.startsWith('### ')) {
      if (currentBlock) {
        blocks.push(currentBlock);
      }
      currentBlock = {
        _key: Math.random().toString(36).substring(2, 15),
        _type: 'block',
        style: 'h3',
        children: [{
          _key: Math.random().toString(36).substring(2, 15),
          _type: 'span',
          text: line.substring(4).trim()
        }]
      };
    }
    // 箇条書き
    else if (line.startsWith('- ')) {
      if (!currentBlock || currentBlock.listItem !== 'bullet') {
        if (currentBlock) {
          blocks.push(currentBlock);
        }
        currentBlock = {
          _key: Math.random().toString(36).substring(2, 15),
          _type: 'block',
          listItem: 'bullet',
          level: 1,
          children: []
        };
      }
      // 太字の処理
      const text = line.substring(2).trim();
      const children = [];
      let lastIndex = 0;
      text.replace(/\*\*(.*?)\*\*/g, (match, p1, offset) => {
        if (offset > lastIndex) {
          children.push({
            _key: Math.random().toString(36).substring(2, 15),
            _type: 'span',
            text: text.substring(lastIndex, offset)
          });
        }
        children.push({
          _key: Math.random().toString(36).substring(2, 15),
          _type: 'span',
          marks: ['strong'],
          text: p1
        });
        lastIndex = offset + match.length;
        return match;
      });
      if (lastIndex < text.length) {
        children.push({
          _key: Math.random().toString(36).substring(2, 15),
          _type: 'span',
          text: text.substring(lastIndex)
        });
      }
      currentBlock.children.push(...children);
    }
    // 通常のテキスト
    else if (line.trim() !== '') {
      if (!currentBlock || currentBlock.style !== 'normal' || currentBlock.listItem) {
        if (currentBlock) {
          blocks.push(currentBlock);
        }
        currentBlock = {
          _key: Math.random().toString(36).substring(2, 15),
          _type: 'block',
          style: 'normal',
          children: []
        };
      }
      // 太字の処理
      const text = line.trim();
      const children = [];
      let lastIndex = 0;
      text.replace(/\*\*(.*?)\*\*/g, (match, p1, offset) => {
        if (offset > lastIndex) {
          children.push({
            _key: Math.random().toString(36).substring(2, 15),
            _type: 'span',
            text: text.substring(lastIndex, offset)
          });
        }
        children.push({
          _key: Math.random().toString(36).substring(2, 15),
          _type: 'span',
          marks: ['strong'],
          text: p1
        });
        lastIndex = offset + match.length;
        return match;
      });
      if (lastIndex < text.length) {
        children.push({
          _key: Math.random().toString(36).substring(2, 15),
          _type: 'span',
          text: text.substring(lastIndex)
        });
      }
      currentBlock.children.push(...children);
    }
    // 空行は新しいブロックの区切り
    else {
      if (currentBlock) {
        blocks.push(currentBlock);
        currentBlock = null;
      }
    }
  });

  if (currentBlock) {
    blocks.push(currentBlock);
  }

  return blocks;
}

const articleIdToUpdate = 'Jx7ptA0c3Aq7il8T99GtdA';
const newContent = `## 【完全ガイド】看護助手とは？仕事内容から必要なスキルまで徹底解説\n\n看護助手（ナースエイド、看護補助者とも呼ばれます）は、医療現場において看護師の指示のもと、患者さんの身の回りのお世話や診療の補助を行う専門職です。医療行為は行いませんが、患者さんに最も近い立場で療養生活を支え、医療チームの一員として欠かせない存在です。\n\n「人の役に立ちたい」「医療現場で働きたいけれど資格がない」という方にとって、看護助手は非常に魅力的な選択肢です。この記事では、看護助手の仕事内容、求められるスキル、やりがい、そしてキャリアパスまで、初心者の方にも分かりやすく徹底的に解説します。\n\n### 看護助手の具体的な仕事内容と役割\n\n看護助手の業務は多岐にわたりますが、大きく分けて「患者さんのケア」「看護師のサポート」「療養環境の整備」の3つに分類されます。\n\n#### 1. 患者さんの身の回りのお世話（身体介護・生活援助）\n患者さんが快適に療養生活を送れるよう、日常生活のサポートを行います。これは、患者さんの尊厳を守り、QOL（生活の質）を維持するために非常に重要な業務です。\n\n-   **食事の介助**: 食事の配膳・下膳、自力での食事が難しい患者さんへの食事介助（誤嚥防止の配慮を含む）。\n-   **清潔ケア**: 入浴介助、清拭（体を拭くこと）、洗髪、口腔ケア、着替えの介助など。患者さんの身体を清潔に保ち、感染予防にも繋がります。\n-   **排泄の介助**: トイレへの誘導、おむつ交換、ポータブルトイレの準備・片付けなど。患者さんのプライバシーに配慮し、尊厳を守ることが求められます。\n-   **移動の介助**: ベッドから車椅子への移乗、歩行介助、検査室やリハビリ室への付き添いなど。転倒防止に細心の注意を払います。\n-   **体位変換**: 寝たきりの患者さんの床ずれ（褥瘡）予防のため、定期的に体位を変える介助。\n\n#### 2. 看護師のサポート（診療補助・物品管理）\n看護師が専門的な医療行為や高度な判断に集中できるよう、その周辺業務をサポートします。\n\n-   **診療の補助**: 診察や検査で使用する医療器具の準備、洗浄、片付け、消毒・滅菌作業。\n-   **患者さんの誘導・搬送**: 診察室、検査室、手術室などへの患者さんの案内や搬送。\n-   **書類・伝票の整理**: カルテの整理、検査伝票の作成、物品請求書の作成など、事務的な業務。\n\n#### 3. 療養環境の整備\n患者さんが安心して過ごせる清潔で安全な環境を維持します。\n\n-   **病室の清掃・整理**: ベッド周りの清掃、床の清掃、整理整頓。\n-   **ベッドメイキング**: シーツや枕カバーの交換、ベッドの整頓。\n-   **環境整備**: 医療機器の点検補助、備品の補充など。\n\n### 看護助手に求められるスキルと資質\n\n看護助手として働く上で、特別な資格は必須ではありませんが、業務を円滑に進め、患者さんや医療チームに貢献するためには、いくつかの重要なスキルと資質が求められます。\n\n#### 1. コミュニケーション能力\n患者さんやそのご家族、そして医師や看護師など、多くの人と接する仕事です。\n-   **患者さんとのコミュニケーション**: 不安を抱える患者さんの話に耳を傾け、共感し、安心感を与える傾聴力と共感力。\n-   **医療チームとの連携**: 看護師からの指示を正確に理解し、患者さんの状態や変化を的確に報告・連絡・相談（報連相）する能力。\n\n#### 2. 観察力と判断力\n患者さんの些細な変化に気づくことが、容体の急変を防ぐ上で非常に重要です。\n-   **具体的な観察点**: 顔色、食欲、排泄状況、言動、表情など。\n-   **判断と報告**: 異常を察知したら、自己判断せずに速やかに看護師に報告する判断力と責任感。\n\n#### 3. 責任感と倫理観\n患者さんの命と健康に関わる現場であるため、担当する業務の一つひとつを丁寧かつ確実に行う強い責任感が不可欠です。また、患者さんのプライバシー保護や尊厳の尊重といった高い倫理観も求められます。\n\n#### 4. 体力と精神力\n患者さんの介助や移動など、体を動かす業務が多く、立ち仕事が中心です。また、人の生死に関わる現場であるため、精神的な負担も伴います。\n-   **体力**: シフト制勤務や夜勤に対応できる体力、患者さんを安全に介助できる身体能力。\n-   **精神力**: ストレスを管理し、冷静に対応できる精神的な強さ。\n\n#### 5. 協調性とチームワーク\n医療は医師、看護師、看護助手、リハビリ専門職など、多くの専門職が協力し合うチームプレーです。自分の役割を理解し、他のスタッフと協力しながら患者さんにとって最善のケアを提供しようとする協調性が求められます。\n\n### 看護助手のやりがいとキャリアパス\n\n看護助手は、患者さんから直接感謝の言葉をもらう機会が多く、人の役に立っていることを実感できる、非常にやりがいのある仕事です。\n\n#### やりがい\n-   **患者さんからの感謝**: 日常生活のサポートを通じて、患者さんの回復を間近で支え、感謝される喜び。\n-   **医療チームへの貢献**: 医療チームの一員として、患者さんの治療やケアに貢献している実感。\n-   **未経験からの挑戦**: 資格がなくても医療現場で働けるため、医療業界への第一歩として最適。\n\n#### キャリアパス\n看護助手としての経験は、将来のキャリアを広げるための貴重な土台となります。\n-   **介護福祉士**: 介護分野の国家資格。看護助手としての実務経験が受験資格に繋がります。\n-   **看護師**: 看護助手として医療現場を経験した後、看護学校に進学し、看護師を目指す道もあります。現場の知識があるため、学習内容をより深く理解できます。\n-   **医療事務**: 医療機関での事務業務に興味があれば、医療事務の資格取得も視野に入ります。\n-   **専門性の深化**: 特定の分野（例：手術室、ICU、認知症ケアなど）で経験を積み、その分野のスペシャリストを目指すことも可能です。\n\n### まとめ\n\n看護助手は、資格がなくても医療の最前線で患者さんを支え、医療チームに貢献できる、非常にやりがいのある仕事です。患者さんの身の回りのお世話から看護師のサポート、療養環境の整備まで多岐にわたる業務を通じて、思いやり、コミュニケーション能力、観察力、観察力、責任感、体力、協調性といった多様なスキルが求められます。\n\nこの記事を読んで看護助手の仕事に興味を持った方は、ぜひ一歩踏み出してみてはいかがでしょうか。あなたの温かい心が、医療現場で多くの患者さんを笑顔にする力となるでしょう。`;

fs.readFile(articlesFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading the file:', err);
    return;
  }
  try {
    const articles = JSON.parse(data);
    const articleIndex = articles.findIndex(article => article._id === articleIdToUpdate);

    if (articleIndex === -1) {
      console.error('Article not found');
      return;
    }

    articles[articleIndex].content = newContent; // contentフィールドを更新
    articles[articleIndex].body = markdownToPortableText(newContent); // bodyフィールドをPortable Textに変換して更新

    fs.writeFile(articlesFilePath, JSON.stringify(articles, null, 2), 'utf8', (err) => {
      if (err) {
        console.error('Error writing the file:', err);
        return;
      }
      console.log('Article content and body updated successfully.');
    });
  } catch (parseErr) {
    console.error('Error parsing JSON:', parseErr);
  }
});