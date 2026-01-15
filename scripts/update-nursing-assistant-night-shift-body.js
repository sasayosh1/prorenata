const { createClient } = require('@sanity/client');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

// Required for revalidate after apply:
// SITE_URL=https://prorenata.jp
// REVALIDATE_SECRET=your-secret
// REVALIDATE_ENDPOINT=/api/revalidate (optional)
const SLUG = 'nursing-assistant-night-shift';
const CONTENT = `夜勤専従の看護助手とはどんな働き方か

夜勤専従とは、日勤を行わず、夜勤のみを担当する看護助手の働き方です。
主に夕方から翌朝まで勤務し、1回あたり16時間前後のシフトが一般的です。

看護助手は、夜勤中も医療行為は行わず、患者さんの生活支援や環境整備、看護師の補助を担います。

夜勤専従は、収入を重視したい人や、日中の時間を自由に使いたい人に選ばれやすい働き方です。

夜勤専従の看護助手の主な仕事内容

夜勤中の仕事内容は、日勤と比べて人手が少ない中での安定運用が求められます。

夜間の主な業務内容は次の通りです。
・病室・病棟の巡回
・体位交換、排泄介助の補助
・ナースコール対応の補助
・環境整備、物品補充
・看護師への報告・連携

夜間は検査や入退院が少ないため、決められた業務を落ち着いてこなす時間帯が多いのが特徴です。
一方で、急変時は人数が少ないため、迅速な報告と冷静な対応が求められます。

夜勤専従の看護助手の給料・収入目安

夜勤専従が注目される理由の一つが、収入の高さです。

夜勤専従の収入が高くなりやすい理由は、
・深夜割増賃金（22時〜翌5時は25％以上）
・夜勤手当の支給
・1回あたりの勤務時間が長い
といった点にあります。

施設や地域差はありますが、日勤のみと比べて月収が5万〜10万円以上高くなるケースもあります。

ただし、夜勤手当の金額、賞与や退職金の有無、常勤か非常勤かによって条件は大きく異なります。
求人を見る際は、基本給ではなく総支給額を確認することが重要です。

夜勤専従で働くメリット

収入を安定して確保しやすいこと、勤務日数が少ないこと、日中の時間を自由に使いやすいことは、夜勤専従の大きな利点です。
また、人の出入りが少ない時間帯に業務へ集中しやすい点も、向いている人には働きやすさにつながります。

夜勤専従で働くデメリット

一方で、昼夜逆転による体力的負担や生活リズムの乱れには注意が必要です。
夜間はスタッフ数が少ないため、急変時の精神的プレッシャーが大きくなることもあります。

また、夜勤専従の求人は数が限られており、即戦力を求められるケースが多い点も理解しておく必要があります。

夜勤専従が向いている人・向いていない人

夜勤専従は、収入を重視したい人、夜型の生活に比較的適応しやすい人、一人で落ち着いて働くことが苦にならない人に向いています。

一方で、生活リズムの乱れに弱い人や、常にチームで動く働き方を好む人には負担が大きくなる場合があります。

夜勤専従を選ぶ前に確認しておきたいポイント

夜勤回数と月収のバランス、仮眠や休憩体制、研修やフォロー体制の有無、将来的に日勤へ切り替えられるかどうかは事前に確認しておきたいポイントです。
特に仮眠が取れる環境かどうかは、長く続けられるかを左右します。

まとめ

夜勤専従の看護助手は、収入と自由時間を確保しやすい一方で、体力や自己管理が求められる働き方です。
向き・不向きを整理し、自分の生活スタイルに合う条件を選ぶことが重要になります。

迷っている場合は、今の職場条件と自分が負担に感じている点を書き出して整理してみると、判断しやすくなります。

免責事項
この記事は、看護助手としての一般的な情報提供を目的としています。
勤務条件や業務内容は施設・地域によって異なるため、詳細は各職場でご確認ください。`;

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

const H2_TITLES = new Set([
  '夜勤専従の看護助手とはどんな働き方か',
  '夜勤専従の看護助手の主な仕事内容',
  '夜勤専従の看護助手の給料・収入目安',
  '夜勤専従で働くメリット',
  '夜勤専従で働くデメリット',
  '夜勤専従が向いている人・向いていない人',
  '夜勤専従を選ぶ前に確認しておきたいポイント',
  'まとめ'
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

    if (line.startsWith('・')) {
      flushParagraph();
      blocks.push(makeBlock({ text: line.replace(/^・\s*/, ''), listItem: 'bullet' }));
      continue;
    }

    paragraphLines.push(line);
  }

  flushParagraph();
  return blocks;
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
    .set({ title: '夜勤専従の看護助手とは？仕事内容・給料・向いている人を現場目線で解説', body: blocks })
    .commit({ dryRun });

  console.log(`${dryRun ? 'DRY_RUN' : 'APPLIED'}: ${post._id} (${post.title})`);
  console.log(`Blocks: ${blocks.length}`);

  if (!dryRun) {
    await triggerRevalidate([
      `/posts/${SLUG}`,
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
