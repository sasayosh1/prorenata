/**
 * normalize-empathy-bridge.js
 *
 * 目的:
 * - 既に「共感ブリッジ（退職/転職のキラーページ誘導）」が入っている記事を検出し
 * - 形式を統一して「1記事につきブリッジは1つ」に整理する（重複・表記ゆれを正規化）
 *
 * 注意:
 * - このスクリプトは既存ブリッジの「正規化」が主目的（新規追加は add-empathy-bridge 側）
 */

import 'dotenv/config';
import process from 'node:process';

const HELP = `
Usage:
  node scripts/maintenance/normalize-empathy-bridge.js \\
    --dry-run|--apply \\
    --dataset=production|staging \\
    --retirement-goal=<slug> \\
    --jobchange-goal=<slug> \\
    [--limit=100] \\
    [--tail=40]

Notes:
  - dry-run: 変更は保存しない
  - apply  : 変更を Sanity に保存する
`;

function parseArgs(argv) {
  const args = {};
  for (const a of argv.slice(2)) {
    if (!a.startsWith('--')) continue;
    const [k, v] = a.replace(/^--/, '').split('=');
    if (v === undefined) args[k] = true;
    else args[k] = v;
  }
  return args;
}

function must(v, name) {
  if (!v) throw new Error(`Missing required arg: --${name}\n${HELP}`);
  return v;
}

/** Portable Text からプレーンテキストを荒く抽出（検出用） */
function portableTextToText(body) {
  if (!Array.isArray(body)) return '';
  const parts = [];
  for (const b of body) {
    if (!b) continue;
    if (typeof b === 'string') parts.push(b);
    if (b._type === 'block' && Array.isArray(b.children)) {
      parts.push(
        b.children
          .map((c) => (c && typeof c.text === 'string' ? c.text : ''))
          .join('')
      );
    }
  }
  return parts.join('\n');
}

/** 既存ブリッジの検出（ゴールslugへの参照が入っているか） */
function hasGoalLink(text, goalSlug) {
  if (!text || !goalSlug) return false;
  // 内部リンク表記ゆれに対応（/posts/slug, /slug, slug だけ等）
  const patterns = [
    `/${goalSlug}`,
    `/posts/${goalSlug}`,
    goalSlug,
  ];
  return patterns.some((p) => text.includes(p));
}

const SANITY_API_VERSION = '2024-01-01';

async function sanityFetch(projectId, dataset, token, query, params = {}) {
  const url = new URL(`https://${projectId}.api.sanity.io/v${SANITY_API_VERSION}/data/query/${dataset}`);
  url.searchParams.set('query', query);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(`$${k}`, String(v));

  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Sanity query failed: ${res.status} ${res.statusText}\n${t}`);
  }
  return res.json();
}

async function sanityPatch(projectId, dataset, token, docId, patchOps) {
  const url = `https://${projectId}.api.sanity.io/v${SANITY_API_VERSION}/data/mutate/${dataset}`;
  const body = { mutations: [{ patch: { id: docId, ...patchOps } }] };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Sanity mutate failed: ${res.status} ${res.statusText}\n${t}`);
  }
  return res.json();
}

function buildNormalizedBridgeBlocks({ retirementGoal, jobchangeGoal }) {
  // ここはあなたのサイトのブリッジUIに合わせて最小限の PortableText を生成
  // 既存 add-empathy-bridge.js の block と合わせる想定
  return [
    {
      _type: 'block',
      style: 'normal',
      children: [{ _type: 'span', text: '「辞めたい」「転職したい」と思ったら、まずは比較で迷いを減らそう。' }],
      markDefs: [],
    },
    {
      _type: 'block',
      style: 'normal',
      children: [
        { _type: 'span', text: '・退職：' },
        { _type: 'span', text: 'おすすめ退職代行3社比較', marks: ['linkRet'] },
      ],
      markDefs: [
        { _key: 'linkRet', _type: 'link', href: `/posts/${retirementGoal}` },
      ],
    },
    {
      _type: 'block',
      style: 'normal',
      children: [
        { _type: 'span', text: '・転職：' },
        { _type: 'span', text: '看護助手向け転職サービス3社比較', marks: ['linkJob'] },
      ],
      markDefs: [
        { _key: 'linkJob', _type: 'link', href: `/posts/${jobchangeGoal}` },
      ],
    },
  ];
}

/**
 * 既存の body 末尾にあるブリッジっぽい部分を「置換」する方針
 * - 末尾 tail ブロックだけを対象に、ゴールslugが出てくるブロック群を削除して、正規ブリッジに差し替える
 */
function normalizeBody(body, { retirementGoal, jobchangeGoal, tail }) {
  if (!Array.isArray(body) || body.length === 0) return { changed: false, body };

  const text = portableTextToText(body);
  const hasRet = hasGoalLink(text, retirementGoal);
  const hasJob = hasGoalLink(text, jobchangeGoal);
  if (!hasRet && !hasJob) return { changed: false, body };

  const start = Math.max(0, body.length - tail);
  const head = body.slice(0, start);
  const tailBlocks = body.slice(start);

  // tail の中で goalSlug が出る block をまるごと除外（雑だが安全側）
  const cleanedTail = tailBlocks.filter((b) => {
    const t = portableTextToText([b]);
    return !hasGoalLink(t, retirementGoal) && !hasGoalLink(t, jobchangeGoal);
  });

  const normalizedBridge = buildNormalizedBridgeBlocks({ retirementGoal, jobchangeGoal });
  const next = [...head, ...cleanedTail, ...normalizedBridge];

  return { changed: true, body: next };
}

async function main() {
  const args = parseArgs(process.argv);

  const dryRun = !!args['dry-run'];
  const apply = !!args['apply'];
  if (dryRun === apply) throw new Error(`Specify exactly one of --dry-run or --apply\n${HELP}`);

  const dataset = must(args.dataset, 'dataset');
  const retirementGoal = must(args['retirement-goal'] || args.retirementGoal, 'retirement-goal');
  const jobchangeGoal = must(args['jobchange-goal'] || args.jobchangeGoal, 'jobchange-goal');

  const limit = Number(args.limit ?? 100);
  const tail = Number(args.tail ?? 40);

  const projectId = process.env.SANITY_PROJECT_ID;
  const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN || process.env.SANITY_TOKEN || process.env.SANITY_READ_TOKEN || process.env.SANITY_API_READ_TOKEN;

  if (!projectId) throw new Error('SANITY_PROJECT_ID is missing in env');
  if (!token) console.warn('[normalize-empathy-bridge] WARN: token is not set (mutations will fail on apply)');

  // body フィールドはあなたのスキーマに合わせて body を参照（最近の修正で content → body になった前提）
  const query = `*[_type=="post"] | order(_updatedAt desc)[0...$limit]{
    _id, title, "slug": slug.current, body
  }`;

  const json = await sanityFetch(projectId, dataset, token, query, { limit });
  const posts = json?.result ?? [];

  let updated = 0;
  let skipped = 0;

  for (const post of posts) {
    const body = post.body;
    const { changed, body: nextBody } = normalizeBody(body, { retirementGoal, jobchangeGoal, tail });

    if (!changed) {
      skipped += 1;
      continue;
    }

    if (dryRun) {
      updated += 1;
      console.log(`- ${post.slug} | normalized`);
      continue;
    }

    await sanityPatch(projectId, dataset, token, post._id, {
      set: { body: nextBody },
    });
    updated += 1;
    console.log(`- ${post.slug} | updated`);
  }

  console.log(
    `\n[normalize-empathy-bridge] mode=${apply ? 'apply' : 'dry-run'} total=${posts.length} updated=${updated} skipped=${skipped}`
  );
}

main().catch((err) => {
  console.error('[normalize-empathy-bridge] FATAL:', err?.message || err);
  process.exit(1);
});

