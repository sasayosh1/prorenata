const { createClient } = require('@sanity/client');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

// Required for revalidate after apply:
// SITE_URL=https://prorenata.jp
// REVALIDATE_SECRET=your-secret
// REVALIDATE_ENDPOINT=/api/revalidate (optional)
const SLUG = 'nursing-assistant-become-nurse-guide';

const LINK_URLS = {
  NIGHT: '/posts/nursing-assistant-night-shift',
  STRESS: '/posts/nursing-assistant-stress-ranking',
};

function makeSpan(text, marks = []) {
  return {
    _type: 'span',
    _key: Math.random().toString(36).slice(2, 10),
    text,
    marks,
  };
}

function makeBlock({ text, style = 'normal', listItem, level, spans, markDefs }) {
  const block = {
    _type: 'block',
    _key: Math.random().toString(36).slice(2, 10),
    style,
    children: spans || [makeSpan(text)],
    markDefs: markDefs || [],
  };
  if (listItem) {
    block.listItem = listItem;
    block.level = level || 1;
  }
  return block;
}

function blockText(block) {
  if (!block || !Array.isArray(block.children)) return '';
  return block.children.map((child) => child.text || '').join('');
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

function buildCalloutBlock({ titleText, lines, links }) {
  const markDefs = [];
  const spans = [];

  spans.push(makeSpan(titleText, ['strong']));
  spans.push(makeSpan('\n'));

  lines.forEach((line, index) => {
    spans.push(makeSpan(line));
    spans.push(makeSpan('\n'));
    if (index === lines.length - 1 && (!links || links.length === 0)) {
      return;
    }
  });

  if (Array.isArray(links)) {
    links.forEach((link, index) => {
      const markKey = `link-${Math.random().toString(36).slice(2, 9)}`;
      markDefs.push({ _key: markKey, _type: 'link', href: link.href, openInNewTab: false });
      spans.push(makeSpan(link.text, [markKey]));
      if (index < links.length - 1) {
        spans.push(makeSpan('\n'));
      }
    });
  }

  return makeBlock({
    style: 'callout',
    spans,
    markDefs,
  });
}

function replaceTargetParagraph({ block, targetSentence }) {
  const text = blockText(block);
  if (!text.includes(targetSentence)) return null;
  const trimmed = text.replace(targetSentence, '').replace(/\s+$/, '').trim();
  if (!trimmed) return null;
  return makeBlock({ text: trimmed, style: 'normal' });
}

function insertSummaryClosing(body) {
  const blocks = [...body];
  const summaryIndex = blocks.findIndex(
    (block) => block?._type === 'block' && block.style === 'h2' && blockText(block).includes('まとめ（迷ったらここだけ）')
  );
  if (summaryIndex < 0) return blocks;

  const nextH3Index = blocks.findIndex(
    (block, idx) => idx > summaryIndex && block?._type === 'block' && block.style === 'h3'
  );
  const insertAt = nextH3Index > 0 ? nextH3Index : summaryIndex + 1;

  const closingBlocks = [
    makeBlock({ text: '不安が強い時は、まずルートの方向性を一つ決めてください。' }),
    makeBlock({ text: 'そこから職場調整と費用のあたりを付けるだけで、次の動きが見えてきます。' }),
    makeBlock({ text: '急がなくて大丈夫です。今できる範囲で一つずつ進めましょう。' }),
  ];

  const calloutBlock = buildCalloutBlock({
    titleText: '次にやること（10分）',
    lines: [
      '・学校候補を1つだけ決める',
      '・見学か資料請求の導線を確保する',
      '・家計の固定費を1つ削る',
    ],
    links: [],
  });

  const sanitizedCallout = {
    ...calloutBlock,
    children: calloutBlock.children.map((child) => ({ ...child, marks: [] })),
    markDefs: [],
  };

  return [
    ...blocks.slice(0, insertAt),
    ...closingBlocks,
    sanitizedCallout,
    ...blocks.slice(insertAt),
  ];
}

async function run({ dryRun }) {
  const client = createClient({
    projectId: process.env.SANITY_PROJECT_ID,
    dataset: process.env.SANITY_DATASET,
    apiVersion: '2024-01-01',
    token: process.env.SANITY_WRITE_TOKEN,
    useCdn: false,
  });

  const post = await client.fetch(
    '*[_type == "post" && slug.current == $slug][0]{_id,title,slug,_updatedAt,body}',
    { slug: SLUG }
  );

  if (!post) throw new Error(`No post found for slug: ${SLUG}`);

  const relatedPosts = await client.fetch(
    '*[_type == "post" && slug.current in ["nursing-assistant-night-shift","nursing-assistant-stress-ranking"]]{title, slug}',
  );

  const titleMap = new Map(
    (Array.isArray(relatedPosts) ? relatedPosts : []).map((p) => [p.slug, p.title])
  );

  const nightTitle = titleMap.get('nursing-assistant-night-shift') || '夜勤専従の看護助手とは？仕事内容・給料・向いている人を現場目線で解説';
  const stressTitle = titleMap.get('nursing-assistant-stress-ranking') || '看護助手のストレス原因ランキング';

  const newBody = [];
  const blocks = Array.isArray(post.body) ? post.body : [];

  const faqCallout = buildCalloutBlock({
    titleText: '関連記事で、先に不安を潰しておく',
    lines: [
      '睡眠が崩れるとストレスが増え、学習効率が下がりやすいです。',
      '夜勤で稼ぐ選択肢もありますが、向き不向きと条件確認が欠かせません。',
    ],
    links: [
      { text: stressTitle, href: LINK_URLS.STRESS },
      { text: nightTitle, href: LINK_URLS.NIGHT },
    ],
  });

  blocks.forEach((block) => {
    const text = blockText(block);

    if (block?._type === 'block' && block.style === 'normal' && text.includes('夜勤専従の記事も参考にしてください。')) {
      const replaced = replaceTargetParagraph({
        block,
        targetSentence: '夜勤専従の記事も参考にしてください。',
      });
      if (replaced) newBody.push(replaced);
      return;
    }

    if (block?._type === 'block' && block.style === 'normal' && text.includes('ストレスの関連記事も確認しておくと安心です。')) {
      const replaced = replaceTargetParagraph({
        block,
        targetSentence: 'ストレスの関連記事も確認しておくと安心です。',
      });
      if (replaced) newBody.push(replaced);
      return;
    }

    newBody.push(block);
  });

  const finalBody = insertSummaryClosing(newBody);

  const faqStart = finalBody.findIndex(
    (block) => block?._type === 'block' && block.style === 'h2' && blockText(block).includes('よくある質問')
  );
  let faqEnd = finalBody.length;
  if (faqStart >= 0) {
    for (let i = faqStart + 1; i < finalBody.length; i += 1) {
      const block = finalBody[i];
      if (block?._type === 'block' && block.style === 'h2') {
        faqEnd = i;
        break;
      }
    }
  }

  let cleanedFinalBody = finalBody;
  if (faqStart >= 0) {
    const before = finalBody.slice(0, faqStart + 1);
    const faqBlocks = finalBody.slice(faqStart + 1, faqEnd);
    const after = finalBody.slice(faqEnd);

    const filteredFaq = faqBlocks.filter((block) => {
      const text = blockText(block);
      if (!text) return true;
      if (text.includes('関連記事で、先に不安を潰しておく')) return false;
      if (text.includes('nursing-assistant-night-shift')) return false;
      if (text.includes('nursing-assistant-stress-ranking')) return false;
      return block.style !== 'callout';
    });

    const h3Targets = [
      '未経験でも看護師学校は受かる？',
      '夜勤専従にすると勉強と両立できる？',
      '年齢が高くても間に合う？',
    ];

    const h3Order = [];
    filteredFaq.forEach((block) => {
      if (block?._type === 'block' && block.style === 'h3') {
        h3Order.push(blockText(block));
      }
    });

    const lastFaqIndex = filteredFaq.reduce((idx, block, i) => {
      if (block?._type === 'block' && block.style === 'h3' && blockText(block).includes(h3Targets[2])) return i;
      return idx;
    }, -1);

    let insertIndex = filteredFaq.length;
    if (lastFaqIndex >= 0) {
      insertIndex = lastFaqIndex + 1;
      while (insertIndex < filteredFaq.length) {
        const block = filteredFaq[insertIndex];
        if (block?._type === 'block' && block.style === 'h3') break;
        insertIndex += 1;
      }
    }

    const rebuiltFaq = [
      ...filteredFaq.slice(0, insertIndex),
      faqCallout,
      ...filteredFaq.slice(insertIndex),
    ];

    cleanedFinalBody = [...before, ...rebuiltFaq, ...after];
  }

  const h2List = cleanedFinalBody
    .filter((block) => block?._type === 'block' && block.style === 'h2')
    .map((block) => blockText(block))
    .filter(Boolean);
  const h3List = cleanedFinalBody
    .filter((block) => block?._type === 'block' && block.style === 'h3')
    .map((block) => blockText(block))
    .filter(Boolean);

  const recomputeFaqEnd = () => {
    if (faqStart < 0) return cleanedFinalBody.length;
    for (let i = faqStart + 1; i < cleanedFinalBody.length; i += 1) {
      const block = cleanedFinalBody[i];
      if (block?._type === 'block' && block.style === 'h2') {
        return i;
      }
    }
    return cleanedFinalBody.length;
  };

  const finalFaqEnd = recomputeFaqEnd();

  const faqH3Order = faqStart >= 0
    ? cleanedFinalBody
      .slice(faqStart + 1, finalFaqEnd)
      .filter((block) => block?._type === 'block' && block.style === 'h3')
      .map((block) => blockText(block))
    : [];

  const faqHasCalloutAtEnd = (() => {
    if (faqStart < 0) return false;
    const faqSlice = cleanedFinalBody.slice(faqStart + 1, finalFaqEnd);
    for (let i = faqSlice.length - 1; i >= 0; i -= 1) {
      const block = faqSlice[i];
      if (block?._type === 'block' && block.style === 'callout') return true;
      if (block?._type === 'block' && block.style === 'h3') return false;
    }
    return false;
  })();

  const result = await client
    .patch(post._id)
    .set({ body: cleanedFinalBody })
    .commit({ dryRun });

  console.log(`${dryRun ? 'DRY_RUN' : 'APPLIED'}: ${post._id}`);
  console.log(`slug: ${post.slug?.current || SLUG}`);
  console.log(`title: ${post.title}`);
  console.log(`updatedAt: ${post._updatedAt || ''}`);
  console.log(`blocks: ${cleanedFinalBody.length}`);
  console.log(`h2: ${h2List.join(' / ')}`);
  console.log(`h3: ${h3List.join(' / ')}`);
  console.log(`faq h3: ${faqH3Order.join(' / ')}`);
  console.log(`faq callout at end: ${faqHasCalloutAtEnd ? 'yes' : 'no'}`);

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
