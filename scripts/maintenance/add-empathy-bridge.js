#!/usr/bin/env node
/**
 * Append "empathy -> goal page" bridge blocks to empathy posts only.
 *
 * Usage:
 *   node scripts/maintenance/add-empathy-bridge.js --dry-run --limit=20
 *   node scripts/maintenance/add-empathy-bridge.js --apply --limit=20
 *
 * Optional:
 *   --slugs=a,b,c            target specific slugs
 *   --dataset=production
 *   --project-id=xxxx
 *   --transfer-href=/posts/<slug>   (転職ゴール)
 *   --resign-href=/posts/<slug>     (退職ゴール)
 */

const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { createClient } = require('@sanity/client');

try {
  require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });
} catch {
  // noop
}

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const dryRun = args.includes('--dry-run') || !apply;

const limitArg = args.find((v) => v.startsWith('--limit=')) || '';
const limit = Number.parseInt(limitArg.replace('--limit=', ''), 10) || 20;

const slugArg = args.find((v) => v.startsWith('--slugs=')) || '';
const targetSlugs = slugArg
  ? slugArg.replace('--slugs=', '').split(',').map(s => s.trim()).filter(Boolean)
  : [];

const datasetArg = args.find((v) => v.startsWith('--dataset=')) || '';
const projectArg = args.find((v) => v.startsWith('--project-id=')) || '';
const transferHrefArg = args.find((v) => v.startsWith('--transfer-href=')) || '';
const resignHrefArg = args.find((v) => v.startsWith('--resign-href=')) || '';

const token =
  process.env.SANITY_WRITE_TOKEN ||
  process.env.SANITY_API_TOKEN ||
  process.env.SANITY_TOKEN ||
  '';

if (apply && !token) {
  console.error('FATAL: SANITY_WRITE_TOKEN (or SANITY_API_TOKEN) is required for --apply.');
  process.exit(1);
}

const projectId =
  projectArg.replace('--project-id=', '') ||
  process.env.SANITY_PROJECT_ID ||
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ||
  '72m8vhy2';

const dataset =
  datasetArg.replace('--dataset=', '') ||
  process.env.SANITY_DATASET ||
  process.env.NEXT_PUBLIC_SANITY_DATASET ||
  'production';

const client = createClient({
  projectId,
  dataset,
  apiVersion: process.env.SANITY_API_VERSION || '2024-01-01',
  token: token || undefined,
  useCdn: false
});

// ゴールページ（あなたが確定したもの）
const DEFAULT_TRANSFER_SLUG = 'nursing-assistant-compare-services-perspective';
const DEFAULT_RESIGN_SLUG = 'comparison-of-three-resignation-agencies';

const TRANSFER_HREF =
  transferHrefArg.replace('--transfer-href=', '') || `/posts/${DEFAULT_TRANSFER_SLUG}`;
const RESIGN_HREF =
  resignHrefArg.replace('--resign-href=', '') || `/posts/${DEFAULT_RESIGN_SLUG}`;

// 二重追加防止用のマーカー（フィールド名）
const MARK_FIELD = 'empathyBridgeAdded';

function makeKey() {
  return randomUUID().replace(/-/g, '').slice(0, 12);
}

function toPlainText(blocks = []) {
  return blocks
    .filter((b) => b && b._type === 'block')
    .map((b) => (b.children || []).map((c) => c.text || '').join(''))
    .join('\n');
}

function hasBridgeAlready(blocks = []) {
  const text = toPlainText(blocks);
  if (text.includes('今日はそれだけで十分')) return true;
  if (text.includes('考え方をまとめた記事があります')) return true;

  // リンクhrefでも判定
  for (const block of blocks) {
    if (!block || block._type !== 'block') continue;
    const markDefs = Array.isArray(block.markDefs) ? block.markDefs : [];
    for (const def of markDefs) {
      if (!def || def._type !== 'link') continue;
      if (def.href === TRANSFER_HREF || def.href === RESIGN_HREF) {
        // ただし他用途リンクと誤判定しないよう、文言でも軽く見る
        if (text.includes('整理') || text.includes('考え方')) return true;
      }
    }
  }
  return false;
}

function detectRoute(text) {
  const t = String(text || '');

  const resignSignals = [
    '退職','辞め','限界','つらい','人間関係','夜勤','疲','パワハラ','もう無理','しんどい'
  ];
  const transferSignals = [
    '転職','将来','キャリア','年収','面接','このまま','続け','環境を変','スキル'
  ];

  const r = resignSignals.some(s => t.includes(s));
  const tr = transferSignals.some(s => t.includes(s));

  if (r && !tr) return 'resign';
  if (tr && !r) return 'transfer';
  return 'both';
}

function block(text) {
  return {
    _type: 'block',
    _key: makeKey(),
    style: 'normal',
    children: [{ _type: 'span', _key: makeKey(), text }]
  };
}

function linkBlock(route) {
  const transferKey = makeKey();
  const resignKey = makeKey();

  // 表示文言（サービス名ゼロ）
  const resignText = '辞めるか迷っている人向けの整理記事';
  const transferText = '続けるか迷っている人向けの整理記事';

  const markDefs = [];
  const children = [];

  if (route === 'resign' || route === 'both') {
    markDefs.push({ _key: resignKey, _type: 'link', href: RESIGN_HREF, openInNewTab: false });
    children.push({
      _type: 'span',
      _key: makeKey(),
      text: `▶ ${resignText}`,
      marks: [resignKey]
    });
  }

  if (route === 'both') {
    children.push({ _type: 'span', _key: makeKey(), text: '\n' });
  }

  if (route === 'transfer' || route === 'both') {
    markDefs.push({ _key: transferKey, _type: 'link', href: TRANSFER_HREF, openInNewTab: false });
    children.push({
      _type: 'span',
      _key: makeKey(),
      text: `▶ ${transferText}`,
      marks: [transferKey]
    });
  }

  return {
    _type: 'block',
    _key: makeKey(),
    style: 'normal',
    markDefs,
    children
  };
}

function buildBridgeBlocks(route) {
  return [
    block('ここまで読んで、「自分だけじゃなかった」と思えたなら、今日はそれだけで十分です。'),
    block('すぐに答えを出さなくてもいいし、無理に決める必要もありません。'),
    block('ただ、もし「この先どうするか」を少しだけ整理したくなったら、考え方をまとめた記事があります。'),
    linkBlock(route)
  ];
}

async function main() {
  // 対象取得：共感記事のみ
  // 既に add-empathy-cta で empathy_layer を入れている前提で拾う（無ければ --slugs 指定で対応）
  const queryAuto = `
    *[
      _type=="post" &&
      defined(empathy_layer) &&
      !defined(${MARK_FIELD}) &&
      defined(slug.current)
    ] | order(_updatedAt desc)[0...$limit]{
      _id, title, "slug": slug.current, body, empathy_layer
    }
  `;

  const queryBySlugs = `
    *[
      _type=="post" &&
      slug.current in $slugs
    ] | order(_updatedAt desc)[0...$limit]{
      _id, title, "slug": slug.current, body, empathy_layer
    }
  `;

  const posts = targetSlugs.length > 0
    ? await client.fetch(queryBySlugs, { slugs: targetSlugs, limit })
    : await client.fetch(queryAuto, { limit });

  if (!Array.isArray(posts) || posts.length === 0) {
    console.log('[empathy-bridge] No target posts found.');
    console.log('[empathy-bridge] If empathy_layer is missing, run with --slugs=... for empathy posts.');
    return;
  }

  let updated = 0;
  let skipped = 0;

  for (const post of posts) {
    const body = Array.isArray(post.body) ? post.body : [];
    const text = toPlainText(body);

    // 二重追加防止（本文 or マーカー）
    if (post[MARK_FIELD] || hasBridgeAlready(body)) {
      skipped += 1;
      continue;
    }

    const route = detectRoute(text);
    const bridge = buildBridgeBlocks(route);
    const nextBody = body.concat(bridge);

    console.log(`\n[empathy-bridge] ${post.slug || post._id}`);
    console.log(`- route: ${route}`);
    console.log(`- append blocks: ${bridge.length}`);

    if (dryRun) continue;

    await client
      .patch(post._id)
      .set({ body: nextBody, [MARK_FIELD]: true })
      .commit();

    updated += 1;
  }

  console.log(`\n[empathy-bridge] mode=${dryRun ? 'dry-run' : 'apply'} total=${posts.length} updated=${updated} skipped=${skipped}`);
}

main().catch((err) => {
  console.error('[empathy-bridge] FATAL:', err?.message || err);
  process.exit(1);
});
