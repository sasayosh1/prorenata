#!/usr/bin/env node

/**
 * Revenue Optimization Template Inserter (GSC/GA4 driven)
 *
 * - Selects top N posts by opportunity:
 *   - GSC: high impressions + low CTR
 *   - GA4: has sessions but short duration
 * - Inserts/updates 3 template blocks in Sanity body, only within:
 *   <!-- revenue-opt:start --> ... <!-- revenue-opt:end -->
 * - Uses Shirazaki Sera tone (empathy → options → reassurance)
 * - Avoids pushy / definitive statements
 * - Prevents double insertion (idempotent)
 *
 * Usage:
 *   node scripts/revenue-optimize.cjs --limit 10 --days 7 --apply
 *   node scripts/revenue-optimize.cjs --limit 10 --days 7           # dry-run
 *
 * Required env:
 *   SANITY_WRITE_TOKEN=... (or SANITY_API_TOKEN)
 *
 * Optional env:
 *   REVENUE_OPT_TARGET_CTR=0.03
 *   REVENUE_OPT_TARGET_DURATION_SEC=45
 *   REVENUE_OPT_WEIGHT_GSC=1
 *   REVENUE_OPT_WEIGHT_GA4=1
 *   REVENUE_OPT_PROGRESS_FILE=analytics/revenue-optimize-last-run.json
 */

const { createClient } = require('@sanity/client');
const fs = require('fs');
const path = require('path');

const SANITY_PROJECT_ID = '72m8vhy2';
const SANITY_DATASET = 'production';
const SANITY_API_VERSION = '2024-01-01';

const PROTECTED_REVENUE_SLUGS = new Set([
  'nursing-assistant-compare-services-perspective',
  'comparison-of-three-resignation-agencies',
]);

function parseArgs(argv) {
  const args = {
    limit: 10,
    days: 7,
    apply: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const value = argv[i];
    if (value === '--limit') {
      args.limit = Number(argv[i + 1]);
      i++;
      continue;
    }
    if (value === '--days') {
      args.days = Number(argv[i + 1]);
      i++;
      continue;
    }
    if (value === '--apply') {
      args.apply = true;
      continue;
    }
    if (value === '--dry-run') {
      args.apply = false;
      continue;
    }
  }

  if (!Number.isFinite(args.limit) || args.limit <= 0) args.limit = 10;
  if (!Number.isFinite(args.days) || args.days <= 0) args.days = 7;

  return args;
}

function clampNumber(value, fallback) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function toDateStringUtc(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isoToYyyymmdd(iso) {
  return iso.replace(/-/g, '');
}

function randomKey() {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
}

function mean(values) {
  const filtered = values.filter((v) => Number.isFinite(v));
  if (filtered.length === 0) return 0;
  return filtered.reduce((a, b) => a + b, 0) / filtered.length;
}

function parseCsv(content) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = '';
  };
  const pushRow = () => {
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];

    if (inQuotes) {
      if (ch === '"') {
        const next = content[i + 1];
        if (next === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }

    if (ch === ',') {
      pushField();
      continue;
    }

    if (ch === '\r') continue;

    if (ch === '\n') {
      pushField();
      pushRow();
      continue;
    }

    field += ch;
  }

  pushField();
  if (row.length > 1 || (row.length === 1 && row[0] !== '')) pushRow();

  const header = rows.shift() || [];
  const records = [];
  for (const r of rows) {
    if (r.length === 1 && r[0] === '') continue;
    const rec = {};
    for (let i = 0; i < header.length; i++) {
      rec[header[i]] = r[i] ?? '';
    }
    records.push(rec);
  }
  return records;
}

function loadCsvRecords(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf8');
  if (!content.trim()) return [];
  return parseCsv(content);
}

function slugFromGscPageUrl(url = '') {
  try {
    const u = new URL(url);
    const match = u.pathname.match(/^\/(posts|article)\/([^/?#]+)$/);
    return match ? decodeURIComponent(match[2]) : null;
  } catch {
    return null;
  }
}

function slugFromGa4PagePath(pathname = '') {
  const match = pathname.match(/^\/(posts|article)\/([^/?#]+)$/);
  return match ? decodeURIComponent(match[2]) : null;
}

function computeGscScore({ impressions, ctr }, targetCtr) {
  if (!Number.isFinite(impressions) || impressions <= 0) return 0;
  const deficit = Math.max(0, targetCtr - (Number.isFinite(ctr) ? ctr : 0));
  const ratio = targetCtr > 0 ? deficit / targetCtr : 0;
  return impressions * ratio;
}

function computeGa4Score({ sessions, avgSessionDuration }, targetDurationSec) {
  if (!Number.isFinite(sessions) || sessions <= 0) return 0;
  const duration = Number.isFinite(avgSessionDuration) ? avgSessionDuration : 0;
  const deficit = Math.max(0, targetDurationSec - duration);
  const ratio = targetDurationSec > 0 ? deficit / targetDurationSec : 0;
  return sessions * ratio;
}

const MARKER_START = '<!-- revenue-opt:start -->';
const MARKER_END = '<!-- revenue-opt:end -->';

function revenueTemplateHtml({ position }) {
  const baseStyle =
    'border:1px solid #e5e7eb;background:#f8fafc;border-radius:14px;padding:14px 16px;line-height:1.75;';
  const badgeStyle =
    'display:inline-block;font-size:11px;font-weight:700;color:#6b7280;background:#eef2ff;border-radius:999px;padding:2px 8px;margin-bottom:8px;';
  const titleStyle = 'font-weight:700;font-size:15px;margin:0 0 6px;color:#111827;';
  const textStyle = 'margin:0;color:#374151;font-size:14px;';
  const linkStyle = 'display:inline-block;margin-top:10px;color:#1d4ed8;text-decoration:underline;';

  let title = '';
  let text = '';
  let href = '';
  let linkText = '';

  if (position === 'intro') {
    title = 'いまの働き方、少しだけ整理してみませんか';
    text =
      '「このままでいいのかな…」って感じる日、ありますよね。よかったら、転職サービスを“看護助手の目線だけ”でまとめた記事も置いておきます。読むだけでも大丈夫です。';
    href = '/posts/nursing-assistant-compare-services-perspective';
    linkText = '転職サービス比較を見る';
  } else if (position === 'middle') {
    title = '無理を続けない選択肢も、ちゃんとあります';
    text =
      '辞める・続ける、どちらが正解という話ではなくて。しんどさが強いときは「いま取れる手段」を知っておくと安心につながることがあります。';
    href = '/posts/comparison-of-three-resignation-agencies';
    linkText = '退職代行の比較を見る';
  } else {
    title = '読んだあと、次の一歩をゆっくり決めてくださいね';
    text =
      '焦らなくて大丈夫です。気になるところから、少しずつで。カテゴリ一覧から、近いテーマの記事も探せます。';
    href = '/categories';
    linkText = 'カテゴリ一覧へ';
  }

  return [
    MARKER_START,
    `<div data-revenue-opt="true" data-revenue-opt-position="${position}" style="${baseStyle}">`,
    `<div style="${badgeStyle}">ひと息メモ</div>`,
    `<div style="${titleStyle}">${title}</div>`,
    `<p style="${textStyle}">${text}</p>`,
    `<a href="${href}" style="${linkStyle}">${linkText}</a>`,
    `</div>`,
    MARKER_END,
  ].join('');
}

function detectRevenuePosition(html) {
  if (typeof html !== 'string') return null;
  if (!html.includes(MARKER_START) || !html.includes(MARKER_END)) return null;
  const match = html.match(/data-revenue-opt-position="(intro|middle|end)"/);
  return match ? match[1] : 'unknown';
}

function extractBlockText(block) {
  if (!block || block._type !== 'block') return '';
  const children = Array.isArray(block.children) ? block.children : [];
  return children.map((c) => (typeof c?.text === 'string' ? c.text : '')).join('');
}

function isDisclaimerBlock(block) {
  const text = extractBlockText(block).trim();
  return /^免責事項[:：]/.test(text);
}

function upsertRevenueBlocks(body) {
  const blocks = Array.isArray(body) ? body : [];

  const positions = { intro: null, middle: null, end: null };
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b?._type !== 'affiliateEmbed' || typeof b.html !== 'string') continue;
    const pos = detectRevenuePosition(b.html);
    if (!pos) continue;
    if (pos === 'unknown') return { changed: false, reason: 'unknown_marker_format', body: blocks };
    if (positions[pos] != null) return { changed: false, reason: `duplicate_${pos}`, body: blocks };
    positions[pos] = i;
  }

  const next = blocks.slice();
  const changes = [];

  const upsertExisting = (pos) => {
    const idx = positions[pos];
    if (idx == null) return;
    const existing = next[idx];
    const newHtml = revenueTemplateHtml({ position: pos });
    if (existing.html !== newHtml) {
      next[idx] = { ...existing, provider: 'revenue-opt', label: existing.label || 'revenue-opt', html: newHtml };
      changes.push(`update:${pos}`);
    }
  };

  for (const pos of ['intro', 'middle', 'end']) upsertExisting(pos);

  const insertBlock = (pos, atIndex) => {
    const block = {
      _type: 'affiliateEmbed',
      _key: randomKey(),
      provider: 'revenue-opt',
      label: 'revenue-opt',
      html: revenueTemplateHtml({ position: pos }),
    };
    next.splice(atIndex, 0, block);
    changes.push(`insert:${pos}`);
  };

  if (positions.intro == null) {
    let at = 0;
    for (let i = 0; i < next.length; i++) {
      const b = next[i];
      if (b?._type === 'block' && (b.style === 'normal' || !b.style)) {
        at = i + 1;
        break;
      }
    }
    insertBlock('intro', at);
  }

  if (positions.middle == null) {
    const mid = Math.floor(next.length / 2);
    let at = mid;
    for (let i = mid; i < next.length; i++) {
      const b = next[i];
      if (b?._type === 'block' && (b.style === 'h2' || b.style === 'h3')) {
        at = i + 1;
        break;
      }
    }
    insertBlock('middle', at);
  }

  if (positions.end == null) {
    const disclaimerIndex = next.findIndex((b) => isDisclaimerBlock(b));
    const at = disclaimerIndex !== -1 ? disclaimerIndex : next.length;
    insertBlock('end', at);
  }

  return { changed: changes.length > 0, changes, body: next };
}

function aggregateGsc({ records, startIso }) {
  const bySlug = new Map();

  for (const r of records) {
    const date = r.date;
    if (!date || typeof date !== 'string' || date < startIso) continue;
    const slug = slugFromGscPageUrl(r.page || '');
    if (!slug) continue;

    const clicks = Number(r.clicks || 0);
    const impressions = Number(r.impressions || 0);

    const current = bySlug.get(slug) || { clicks: 0, impressions: 0 };
    current.clicks += Number.isFinite(clicks) ? clicks : 0;
    current.impressions += Number.isFinite(impressions) ? impressions : 0;
    bySlug.set(slug, current);
  }

  const result = new Map();
  for (const [slug, v] of bySlug.entries()) {
    const ctr = v.impressions > 0 ? v.clicks / v.impressions : 0;
    result.set(slug, { clicks: v.clicks, impressions: v.impressions, ctr });
  }
  return result;
}

function aggregateGa4({ records, startYyyymmdd }) {
  const bySlug = new Map();

  for (const r of records) {
    const date = r.date;
    if (!date || typeof date !== 'string' || date < startYyyymmdd) continue;
    const slug = slugFromGa4PagePath(r.pagePath || '');
    if (!slug) continue;

    const sessions = Number(r.sessions || 0);
    const duration = Number(r.averageSessionDuration || 0);
    const current = bySlug.get(slug) || { sessions: 0, durationWeighted: 0 };

    const s = Number.isFinite(sessions) ? sessions : 0;
    const d = Number.isFinite(duration) ? duration : 0;

    current.sessions += s;
    current.durationWeighted += d * s;
    bySlug.set(slug, current);
  }

  const result = new Map();
  for (const [slug, v] of bySlug.entries()) {
    const avgSessionDuration = v.sessions > 0 ? v.durationWeighted / v.sessions : 0;
    result.set(slug, { sessions: v.sessions, avgSessionDuration });
  }
  return result;
}

async function main() {
  const args = parseArgs(process.argv);

  const sanityToken = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN;
  if (args.apply && !sanityToken) throw new Error('SANITY_WRITE_TOKEN (or SANITY_API_TOKEN) is required');

  const targetCtr = clampNumber(process.env.REVENUE_OPT_TARGET_CTR, 0.03);
  const targetDurationSec = clampNumber(process.env.REVENUE_OPT_TARGET_DURATION_SEC, 45);
  const weightGsc = clampNumber(process.env.REVENUE_OPT_WEIGHT_GSC, 1);
  const weightGa4 = clampNumber(process.env.REVENUE_OPT_WEIGHT_GA4, 1);

  const todayUtc = new Date();
  const startUtc = new Date(Date.UTC(todayUtc.getUTCFullYear(), todayUtc.getUTCMonth(), todayUtc.getUTCDate() - args.days));
  const startIso = toDateStringUtc(startUtc);
  const startYyyymmdd = isoToYyyymmdd(startIso);
  const endIso = toDateStringUtc(new Date(Date.UTC(todayUtc.getUTCFullYear(), todayUtc.getUTCMonth(), todayUtc.getUTCDate() - 1)));

  const ga4Path = path.join(process.cwd(), 'data', 'ga4_last30d.csv');
  const gscPath = path.join(process.cwd(), 'data', 'gsc_last30d.csv');

  const ga4Records = loadCsvRecords(ga4Path);
  const gscRecords = loadCsvRecords(gscPath);
  if (!ga4Records || !gscRecords) {
    throw new Error('Missing analytics CSV: data/ga4_last30d.csv and/or data/gsc_last30d.csv');
  }

  const gscBySlug = aggregateGsc({ records: gscRecords, startIso });
  const ga4BySlug = aggregateGa4({ records: ga4Records, startYyyymmdd });

  const allSlugs = new Set([...gscBySlug.keys(), ...ga4BySlug.keys()]);
  const scored = [];
  for (const slug of allSlugs) {
    if (PROTECTED_REVENUE_SLUGS.has(slug)) continue;
    const gsc = gscBySlug.get(slug) || null;
    const ga4 = ga4BySlug.get(slug) || null;
    const score = (gsc ? computeGscScore(gsc, targetCtr) * weightGsc : 0) + (ga4 ? computeGa4Score(ga4, targetDurationSec) * weightGa4 : 0);
    if (score <= 0) continue;
    scored.push({ slug, score, gsc, ga4 });
  }

  scored.sort((a, b) => b.score - a.score);
  const selected = scored.slice(0, args.limit);

  console.log('💰 Revenue optimize');
  console.log(`- Range (UTC): ${startIso}..${endIso}`);
  console.log(`- Limit: ${args.limit}`);
  console.log(`- Apply: ${args.apply}`);
  console.log(`- Selected: ${selected.length}`);

  if (!args.apply) {
    const progressFile =
      process.env.REVENUE_OPT_PROGRESS_FILE || path.join('analytics', 'revenue-optimize-last-run.json');
    fs.mkdirSync(path.dirname(progressFile), { recursive: true });
    fs.writeFileSync(
      progressFile,
      JSON.stringify(
        {
          ranAt: new Date().toISOString(),
          apply: false,
          rangeUtc: { startIso, endIso },
          limit: args.limit,
          thresholds: { targetCtr, targetDurationSec },
          selected,
          results: [],
        },
        null,
        2
      ) + '\n',
      'utf8'
    );
    console.log(`📄 Wrote progress: ${progressFile}`);
    return;
  }

  const sanity = createClient({
    projectId: SANITY_PROJECT_ID,
    dataset: SANITY_DATASET,
    apiVersion: SANITY_API_VERSION,
    useCdn: false,
    token: sanityToken,
  });

  const results = [];
  for (const item of selected) {
    const slug = item.slug;
    const doc = await sanity.fetch(
      `*[_type == "post" && slug.current == $slug][0]{ _id, title, maintenanceLocked, "slug": slug.current, body }`,
      { slug }
    );

    if (!doc?._id || !Array.isArray(doc.body)) {
      results.push({ slug, status: 'skip_not_found' });
      continue;
    }
    if (doc.maintenanceLocked) {
      results.push({ slug, status: 'skip_locked' });
      continue;
    }

    const { changed, reason, changes, body } = upsertRevenueBlocks(doc.body);
    if (!changed) {
      results.push({ slug, status: 'skip', reason: reason || 'no_change' });
      continue;
    }

    if (!args.apply) {
      console.log(`📝 DRY RUN: ${slug} (${changes.join(', ')})`);
      results.push({ slug, status: 'dry_run', changes });
      continue;
    }

    await sanity.patch(doc._id).set({ body }).commit();
    console.log(`✅ Updated: ${slug} (${changes.join(', ')})`);
    results.push({ slug, status: 'updated', changes });
  }

  const progressFile = process.env.REVENUE_OPT_PROGRESS_FILE || path.join('analytics', 'revenue-optimize-last-run.json');
  fs.mkdirSync(path.dirname(progressFile), { recursive: true });
  fs.writeFileSync(
    progressFile,
    JSON.stringify(
      {
        ranAt: new Date().toISOString(),
        apply: args.apply,
        rangeUtc: { startIso, endIso },
        limit: args.limit,
        thresholds: { targetCtr, targetDurationSec },
        selected: selected.map((s) => ({
          slug: s.slug,
          score: s.score,
          gsc: s.gsc,
          ga4: s.ga4,
        })),
        results,
      },
      null,
      2
    ) + '\n',
    'utf8'
  );

  console.log(`📄 Wrote progress: ${progressFile}`);
}

main().catch((error) => {
  console.error('❌ revenue-optimize failed:', error?.message || error);
  process.exit(1);
});
