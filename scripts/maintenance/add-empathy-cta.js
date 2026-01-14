#!/usr/bin/env node
/**
 * Append empathy-article routing CTA and set empathy_layer.
 *
 * Usage:
 *   node scripts/maintenance/add-empathy-cta.js --dry-run --slugs=...
 *   node scripts/maintenance/add-empathy-cta.js --apply --slugs=...
 */

const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { createClient } = require('@sanity/client');

// 1. Load environment variables IMMEDIATELY
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  require('dotenv').config({ path: envPath });
} catch (e) {
  // noop
}

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const dryRun = args.includes('--dry-run') || !apply;

// Argument parsing for Project/Dataset overrides
const projectArg = (args.find((v) => v.startsWith('--project-id=')) || '').replace('--project-id=', '');
const datasetArg = (args.find((v) => v.startsWith('--dataset=')) || '').replace('--dataset=', '');
const limitArg = (args.find((v) => v.startsWith('--limit=')) || '').replace('--limit=', '');
const limit = Number.parseInt(limitArg, 10) || 50;
const slugArg = (args.find((v) => v.startsWith('--slugs=')) || '').replace('--slugs=', '');

const targetSlugs = slugArg
  ? slugArg
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  : [];

// 2. Resolve final Client Configuration
const projectId = projectArg || process.env.SANITY_PROJECT_ID || '72m8vhy2';
const dataset = datasetArg || process.env.SANITY_DATASET || 'production';
const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN;

if (apply && !token) {
  console.error('FATAL: SANITY_WRITE_TOKEN is required for --apply.');
  process.exit(1);
}

// 3. Initialize Client with strict Token Mode
const client = createClient({
  projectId,
  dataset,
  apiVersion: process.env.SANITY_API_VERSION || '2024-01-01',
  token,
  useCdn: false,
  // Force token-only mode and disable credentials capture from browser/CLI sessions
  authMode: 'token',
  withCredentials: false
});

console.log(`[empathy-cta] Config: project=${projectId} dataset=${dataset} token=${token ? 'SET' : 'MISSING'}`);

const DEFAULT_TRANSFER_SLUG = 'nursing-assistant-compare-services-perspective';
const DEFAULT_RESIGN_SLUG = 'comparison-of-three-resignation-agencies';
const TRANSFER_HREF = `/posts/${DEFAULT_TRANSFER_SLUG}`;
const RESIGN_HREF = `/posts/${DEFAULT_RESIGN_SLUG}`;

function makeKey() {
  return randomUUID().replace(/-/g, '').slice(0, 12);
}

function toPlainText(blocks = []) {
  return blocks
    .filter((b) => b && b._type === 'block')
    .map((b) => (b.children || []).map((c) => c.text || '').join(''))
    .join('\n');
}

function getLinkPresence(blocks = []) {
  let hasTransfer = false;
  let hasResign = false;
  for (const block of blocks) {
    if (!block || block._type !== 'block') continue;
    const markDefs = Array.isArray(block.markDefs) ? block.markDefs : [];
    if (
      markDefs.some(
        (def) =>
          def &&
          def._type === 'link' &&
          (def.href === TRANSFER_HREF || def.href === RESIGN_HREF)
      )
    ) {
      for (const def of markDefs) {
        if (!def || def._type !== 'link') continue;
        if (def.href === TRANSFER_HREF) hasTransfer = true;
        if (def.href === RESIGN_HREF) hasResign = true;
      }
    }
    const text = (block.children || []).map((c) => c.text || '').join('');
    if (text.includes(TRANSFER_HREF)) hasTransfer = true;
    if (text.includes(RESIGN_HREF)) hasResign = true;
  }
  return { hasTransfer, hasResign };
}

function detectLayer(text) {
  const normalized = String(text || '');
  const layer3Signals = ['どの選択', '正解も一つではない', '人それぞれ', '尊重', '選択は自由'];
  if (layer3Signals.some((s) => normalized.includes(s))) return 3;

  const decisionSignals = ['選択', '決断', '決める', '判断', '準備', '変える', '転職', '退職'];
  const touchesDecision = decisionSignals.some((s) => normalized.includes(s));

  if (!touchesDecision) return 1;
  return 2;
}

function buildCtaBlocks(layer) {
  const blocks = [];
  const linesByLayer = {
    1: [
      'ここまで読んで、気持ちが落ち着いたなら十分だ。',
      '今日は決めなくていいし、無理に前へ進む必要もない。',
      'もし、もう少し状況を整理したくなったら、',
      '選択肢の考え方をまとめた記事があります。',
      '読むだけでも大丈夫です。'
    ],
    2: [
      'いまの気持ちをそのままにしておくのも、一つの選択だ。',
      '同時に、環境を変えるという考え方があるのも事実です。',
      '判断を急がなくていいので、選び方や考え方だけ整理してもいいかもしれません。',
      '選び方や考え方を整理した記事があります。'
    ],
    3: [
      'ここまで読んでいる時点で、あなたはもう十分、自分のことを考えている。',
      '決断は人それぞれで、正解も一つではない。',
      'その前に、判断材料だけ整えておくという選択もあります。',
      '判断材料を整理する記事があります。'
    ]
  };

  const lines = linesByLayer[layer] || linesByLayer[2];

  const makeBlock = (text) => ({
    _type: 'block',
    _key: makeKey(),
    style: 'normal',
    children: [{ _type: 'span', _key: makeKey(), text }]
  });

  blocks.push(makeBlock(lines[0]));
  if (lines[1]) blocks.push(makeBlock(lines[1]));
  if (lines[2]) blocks.push(makeBlock(lines[2]));

  if (lines[3]) {
    const transferKey = makeKey();
    const resignKey = makeKey();
    blocks.push({
      _type: 'block',
      _key: makeKey(),
      style: 'normal',
      markDefs: [
        { _key: transferKey, _type: 'link', href: TRANSFER_HREF, openInNewTab: false },
        { _key: resignKey, _type: 'link', href: RESIGN_HREF, openInNewTab: false }
      ],
      children: [
        { _type: 'span', _key: makeKey(), text: lines[3], marks: [transferKey] },
        { _type: 'span', _key: makeKey(), text: ' / ' },
        { _type: 'span', _key: makeKey(), text: '退職の考え方を整理した記事', marks: [resignKey] },
        { _type: 'span', _key: makeKey(), text: 'もあります。' }
      ]
    });
  }
  if (layer === 1 && lines[4]) blocks.push(makeBlock(lines[4]));

  return blocks;
}

async function main() {
  if (targetSlugs.length === 0) {
    console.log('[empathy-cta] No target slugs provided. Use --slugs=slug1,slug2');
    return;
  }

  const posts = await client.fetch(
    '*[_type == "post" && slug.current in $slugs][0...$limit]{_id, title, "slug": slug.current, body, empathy_layer}',
    { slugs: targetSlugs, limit }
  );

  const postsArray = Array.isArray(posts) ? posts : [];
  if (postsArray.length === 0) {
    console.log('[empathy-cta] No posts found for target slugs.');
    return;
  }

  let updated = 0;
  let skipped = 0;

  for (const post of postsArray) {
    const body = Array.isArray(post.body) ? post.body : [];
    const presence = getLinkPresence(body);
    if (presence.hasTransfer && presence.hasResign) {
      skipped += 1;
      continue;
    }

    const text = toPlainText(body);
    const layer = detectLayer(text);
    const ctaBlocks = buildCtaBlocks(layer);
    const nextBody = body.concat(ctaBlocks);

    console.log(`\n[empathy-cta] Processing: ${post.slug || post._id}`);
    console.log(`- layer: ${post.empathy_layer || '(none)'} -> ${layer}`);
    console.log(`- append: ${ctaBlocks.length} blocks`);

    if (dryRun) {
      console.log(' (skip: dry-run)');
      continue;
    }

    try {
      await client.patch(post._id).set({ body: nextBody, empathy_layer: layer }).commit();
      updated += 1;
    } catch (err) {
      console.error(`ERROR updating ${post.slug}:`, err.message);
    }
  }

  console.log(`\n[empathy-cta] mode=${dryRun ? 'dry-run' : 'apply'} total=${postsArray.length} updated=${updated} skipped=${skipped}`);
}

main().catch((err) => {
  console.error('[empathy-cta] FATAL:', err.message || err);
  process.exit(1);
});
