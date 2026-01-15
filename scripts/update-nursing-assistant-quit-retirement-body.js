const { createClient } = require('@sanity/client');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

// Required for revalidate after apply:
// SITE_URL=https://prorenata.jp
// REVALIDATE_SECRET=your-secret
// REVALIDATE_ENDPOINT=/api/revalidate (optional)
const SLUG = 'nursing-assistant-quit-retirement';
const CONTENT = `看護助手が辞めたいと思ったら？退職の選択肢とサービス比較

PR
当記事はアフィリエイト広告を利用しています。選定基準については運営方針をご覧ください。

イントロダクション
看護助手として「もう限界かも」と感じるのは珍しくありません。人手不足、夜勤続き、理不尽なやり取り。
わたし自身も現場で同じ壁にぶつかり、体も心もすり減った経験があります。

こうしたしんどさは、あなた一人のせいではありません。
現場の構造的な負荷が重なっているだけです。
まずは自分を責めず、「どう動けば安全で後悔の少ない道を選べるか」を一緒に整理しましょう。

看護助手が辞めたいと感じるリアルな理由
給料が上がりにくく、責任や業務量に見合わないと感じること。人手不足で休憩も削られ、感謝より「もっとやって」が多い現場。
コミュニケーションのすれ違いで心が削られ、腰や膝の痛みが蓄積し、夜勤で生活リズムが壊れていく。

どれもよくある悩みで、あなたが弱いわけではありません。
まずは「つらい」と口に出していい。そう受け止めてください。

参考: 厚生労働省 職業情報提供サイト（看護助手）

退職を考えたらまずやるべき準備
退職理由の整理：本音（負担、賃金、人間関係）と、伝える建前（家庭都合、キャリア見直し）を切り分けておくと話しやすくなります。

有給残日数の確認と消化計画：退職日から逆算して、早めに申請するスケジュールをメモに。

給与締め日、保険、離職票の確認：月末締めか、社保切替・雇用保険手続きのスケジュールを把握しておくと安心です。

トラブル防止メモ：上司とのやり取り、引き継ぎ内容、シフト調整を簡単に記録しておくと交渉の根拠になります。

信頼できる人に相談：同僚、家族、労組、専門窓口。感情の整理と第三者の視点があるだけで、決断の重さが少し軽くなるはずです。

参考: NsPace Career 看護助手の転職・年収コラム

看護助手が取れる3つの退職方法
自分で退職を伝える
費用ゼロで進められます。職場との関係が極端に悪くなく、交渉に慣れている人向け。
引き継ぎを自分で段取りできる余力があるなら、もっともシンプルです。

退職代行サービスを利用する
連絡や交渉を任せられます。上司と話すのが怖い、ハラスメントがある、即日で職場を離れたい場合に有効。
弁護士・労組運営を選べば法的にも安心度が高くなります。

サポートを受けながら自分で伝える（セルフ退職）
テンプレや相談を受けつつ、自分名義で進める方法。コストを抑えたいが手順に不安がある人向けです。
メッセージ文例が欲しいときにも有効。

比較の目安
・自分で伝える: 0円 / 即日性△ / 法的安心度△
・退職代行: 数万円 / 即日性◎ / 法的安心度○〜◎（弁護士・労組なら◎）
・セルフ退職: 低〜中コスト / 即日性○（テンプレ依存） / 安心度△〜○

それぞれの方法で「いまの自分にとって何が一番ラクか」を基準に選んで大丈夫です。

退職代行を使う場合・使わない場合の差分
使わない場合：上司との面談や引き継ぎの段取りを自分で行う必要があります。日程調整のストレスはあるものの、費用を抑えられます。
関係が悪くない職場なら、円満退職しやすいメリットもあります。

使う場合：連絡や交渉を任せられるので、心理的・時間的な負担が大きく減ります。
特にハラスメントや強い引き止めがある場合、第三者が間に入ることで安全に進められます。

選び方のポイント：弁護士・労組など合法運営か、医療介護の相談実績があるか、24時間相談できるか、即日対応の可否。

自分で退職を伝える場合のポイント
・伝え方テンプレ：「家庭の事情で○月末に退職を希望します。引き継ぎは文書で準備しますので、日程をご相談させてください。」
・本音を建前に変える：人手不足→家庭都合・キャリア見直し、賃金不満→別分野で経験を積みたい。
・引き止め回避：退職日は確定ベースで伝え、延長は難しいと先に言う。引き継ぎ内容と期限をセットで提示し、感情論ではなくスケジュールで会話する。
・スケジュール：意思表明→退職日確定→引き継ぎ→有給消化→離職票・証明書の受領。無理せず少しずつ進める。

退職代行サービスの安全性と選び方
弁護士／労働組合を推奨：法的交渉や書類対応を適法に行えるため、未払賃金や有休消化の交渉も安心度が上がります。

非弁業者のリスク：不当請求、手続き不備、トラブル時に対応できない可能性があります。合法運営か、実績と口コミをできるだけ確認。

医療現場で起こりがちなトラブル：有休消化の交渉がうまくいかない、退職書類が遅れる、引き継ぎ拒否を理由に退職を渋られる、など。

進行イメージ：無料相談→申込・支払い→会社連絡（代行）→退職意思伝達→書類・精算確認→完了。流れを知るだけでも不安は軽くなります。

安心して利用できる退職代行サービス比較（3社）
弁護士法人みやび（法的安心・全国対応）
弁護士が直接対応し、未払賃金やハラスメント交渉も相談可。医療・介護の実績が多く、書類や有休消化にも配慮。
非弁リスクを避けたい人に向きます。

退職代行 即ヤメ（スピード・24時間相談）
LINEで24時間相談でき、即日退職を目指しやすい。連絡を自分で取りたくない人、夜間相談したい人向け。
スピード優先で動きたいときに。

弁護士法人ガイア法律事務所（医療介護の相談実績）
医療・介護案件の経験が多く、就業規則や引き継ぎ手順にも配慮。LINE/メール相談で進めやすく、現場事情を理解してほしい人向け。

推奨理由（公平・中立）
非弁リスクを避け、医療介護の相談実績と即日性・安心度を基準に3社を掲載。どれが自分に合うか、特徴から選びましょう。
より詳しい比較は、退職代行3社の徹底比較記事で確認できます。

よくある質問（FAQ）
Q: 即日退職はできる？
A: 代行を使えば可能性が高い。弁護士・労組系が安心。

Q: 夜勤中でも辞められる？
A: 原則シフト調整後が望ましいが、体調や安全次第では早めに相談を。

Q: 有給は使える？
A: 未消化分は取得を主張できる。退職日から逆算して計画的に申請を。

Q: 退職後の職場の反応は？
A: 手続きが適法に済めば過度に気にしなくてOK。

Q: トラブルが起きたら？
A: 記録を残し、弁護士・労組・信頼できる代行へ相談。非弁業者は避ける。

「辞めてもいい」「限界なら逃げてもいい」。
あなたの健康と人生が最優先です。無料相談も活用し、無理をせず次の一歩へ進んでください。
安心して退職するための選択肢は、できるだけあります。

まとめ
「自分で退職を伝える」「退職代行サービスを利用する」「サポートを受けながら自分で伝える（セルフ退職）」の3つの視点で整理しました。

忙しい日でも意識しやすいポイントは、次の通りです。
・自分で伝える方法に目を向ける
・退職代行サービスという選択肢を知る
・セルフ退職という中間的な方法もあると理解する

退職の段取りを進める前に、退職と転職それぞれの比較記事で、判断の軸を整理しておくと落ち着いて選びやすくなります。
・退職：おすすめ退職代行3社比較
・転職：看護助手向け転職サービス3社比較

免責事項と情報の取り扱いについて
当サイトの記事は、厚生労働省の資料や一般的な業界慣習、複数の求人データに基づき作成していますが、すべてのケースに当てはまることを保証するものではありません。

医療行為、労務トラブル、税務、給与計算など個別の判断が必要な場合は、必ず医師・弁護士・税理士・社会保険労務士等の専門家にご相談ください。

※紹介しているサービスや求人条件は、記事公開/更新時点の情報です。最新の詳細は各公式サイトにて必ずご確認ください。`;

const H2_TITLES = new Set([
  'イントロダクション',
  '看護助手が辞めたいと感じるリアルな理由',
  '退職を考えたらまずやるべき準備',
  '看護助手が取れる3つの退職方法',
  '退職代行を使う場合・使わない場合の差分',
  '自分で退職を伝える場合のポイント',
  '退職代行サービスの安全性と選び方',
  '安心して利用できる退職代行サービス比較（3社）',
  '推奨理由（公平・中立）',
  'よくある質問（FAQ）',
  'まとめ',
  '免責事項と情報の取り扱いについて'
]);

const H3_TITLES = new Set([
  '自分で退職を伝える',
  '退職代行サービスを利用する',
  'サポートを受けながら自分で伝える（セルフ退職）',
  '比較の目安',
  '弁護士法人みやび（法的安心・全国対応）',
  '退職代行 即ヤメ（スピード・24時間相談）',
  '弁護士法人ガイア法律事務所（医療介護の相談実績）'
]);

function makeSpan(text) {
  return {
    _type: 'span',
    _key: Math.random().toString(36).slice(2, 10),
    text,
    marks: []
  };
}

function makeBlock({ text, style = 'normal', listItem, level }) {
  const block = {
    _type: 'block',
    _key: Math.random().toString(36).slice(2, 10),
    style,
    children: [makeSpan(text)],
    markDefs: []
  };
  if (listItem) {
    block.listItem = listItem;
    block.level = level || 1;
  }
  return block;
}

function buildBlocksFromText(content) {
  const lines = content.split(/\r?\n/);
  const blocks = [];
  let paragraphLines = [];

  const flushParagraph = () => {
    if (paragraphLines.length === 0) return;
    const text = paragraphLines.join(' ').trim();
    if (text) {
      blocks.push(makeBlock({ text }));
    }
    paragraphLines = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      continue;
    }

    if (H2_TITLES.has(line)) {
      flushParagraph();
      blocks.push(makeBlock({ text: line, style: 'h2' }));
      continue;
    }

    if (H3_TITLES.has(line)) {
      flushParagraph();
      blocks.push(makeBlock({ text: line, style: 'h3' }));
      continue;
    }

    if (line.startsWith('・')) {
      flushParagraph();
      blocks.push(makeBlock({ text: line.replace(/^・\s*/, ''), listItem: 'bullet' }));
      continue;
    }

    if (line.startsWith('Q:') || line.startsWith('A:')) {
      flushParagraph();
      blocks.push(makeBlock({ text: line }));
      continue;
    }

    paragraphLines.push(line);
  }

  flushParagraph();
  return blocks;
}

async function triggerRevalidate(paths) {
  const siteUrl = process.env.SITE_URL;
  const secret = process.env.REVALIDATE_SECRET;
  const endpoint = process.env.REVALIDATE_ENDPOINT || '/api/revalidate';

  if (!siteUrl || !secret) {
    console.warn('[revalidate] skipped: SITE_URL or REVALIDATE_SECRET is missing');
    return;
  }

  const url = new URL(endpoint, siteUrl);
  try {
    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, paths }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.warn(`[revalidate] failed: ${res.status} ${res.statusText} ${text}`);
      return;
    }
    const json = await res.json().catch(() => ({}));
    console.log(`[revalidate] ok: ${JSON.stringify(json)}`);
  } catch (error) {
    console.warn(`[revalidate] error: ${error?.message || error}`);
  }
}

async function run({ dryRun }) {
  const client = createClient({
    projectId: process.env.SANITY_PROJECT_ID,
    dataset: process.env.SANITY_DATASET,
    apiVersion: '2024-01-01',
    token: process.env.SANITY_WRITE_TOKEN,
    useCdn: false
  });

  const post = await client.fetch(
    '*[_type == "post" && slug.current == $slug][0]{_id,title}',
    { slug: SLUG }
  );

  if (!post) {
    throw new Error(`No post found for slug: ${SLUG}`);
  }

  const blocks = buildBlocksFromText(CONTENT);
  const result = await client
    .patch(post._id)
    .set({ body: blocks })
    .commit({ dryRun });

  console.log(`${dryRun ? 'DRY_RUN' : 'APPLIED'}: ${post._id} (${post.title})`);
  console.log(`Blocks: ${blocks.length}`);
  if (!dryRun) {
    await triggerRevalidate([
      `/posts/${post.slug?.current || SLUG}`,
      '/posts',
    ]);
  }
  return result;
}

const dryRun = process.argv.includes('--dry-run');

run({ dryRun }).catch((error) => {
  console.error(error);
  process.exit(1);
});
