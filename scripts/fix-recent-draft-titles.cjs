#!/usr/bin/env node
/**
 * Fixes near-duplicate draft titles in Sanity (recent drafts only).
 *
 * Why:
 * - Recent auto-generated drafts can end up with very similar title templates,
 *   which hurts usability (list scan) and may be risky for SEO.
 *
 * Scope:
 * - Only drafts (`_id in path("drafts.**")`) and only the most recent ones.
 * - Does NOT change slugs (URLs remain stable).
 *
 * Usage:
 *   SANITY_WRITE_TOKEN=... node scripts/fix-recent-draft-titles.cjs --apply
 *   node scripts/fix-recent-draft-titles.cjs --dry-run
 */

const { createClient } = require('@sanity/client');
const path = require('node:path');
require('dotenv').config({ path: path.join(process.cwd(), '.env.local') }); // local

const APPLY = process.argv.includes('--apply');
const DRY_RUN = process.argv.includes('--dry-run') || !APPLY;

function toCodePoints(str) {
  return Array.from(String(str ?? ''));
}

function codePointLength(str) {
  return toCodePoints(str).length;
}

function sliceCodePoints(str, n) {
  return toCodePoints(str).slice(0, Math.max(0, n)).join('');
}

function normalizeForSimilarity(text) {
  return String(text || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[【】\[\]（）()]/g, ' ')
    .replace(/[・、。！？!?,:：\u3000]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function bigrams(text) {
  const s = normalizeForSimilarity(text).replace(/\s/g, '');
  if (s.length < 2) return [];
  const out = [];
  for (let i = 0; i < s.length - 1; i++) out.push(s.slice(i, i + 2));
  return out;
}

function diceSimilarity(a, b) {
  const A = bigrams(a);
  const B = bigrams(b);
  if (A.length === 0 || B.length === 0) return 0;
  const counts = new Map();
  for (const g of A) counts.set(g, (counts.get(g) || 0) + 1);
  let inter = 0;
  for (const g of B) {
    const n = counts.get(g) || 0;
    if (n > 0) {
      inter++;
      counts.set(g, n - 1);
    }
  }
  return (2 * inter) / (A.length + B.length);
}

function sanitizeTitle(input) {
  let title = String(input || '').trim();
  title = title.replace(/^【[^】]{1,40}】\s*/g, '');
  title = title.replace(/[【】\[\]（）()]/g, ' ');
  title = title.replace(/(?:…|\.{3,})+$/g, '').trim();
  title = title.replace(/徹底解説/g, 'ポイント整理');
  title = title.replace(/完全ガイド/g, '実践ガイド');
  title = title.replace(/チェックリスト/g, '整理ポイント');
  title = title.replace(/完全版/g, '要点整理');
  title = title.replace(/保存版/g, '要点整理');
  title = title.replace(/\s*[:：]\s*/g, '：');
  title = title.replace(/\s*・\s*/g, '・');
  title = title.replace(/\s+/g, ' ').trim();
  while (/[、,・…\.]$/.test(title)) title = title.slice(0, -1).trim();
  return title;
}

function buildCandidates(title) {
  const raw = String(title || '').trim();
  const t = sanitizeTitle(raw);

  // Detect topic from both raw and sanitized (sanitized may remove bracketed prefixes).
  const isInterview = /面接/.test(raw) || /面接/.test(t);
  const isSalary = /給料|年収|待遇|月収/.test(raw) || /給料|年収|待遇|月収/.test(t);
  const isComm =
    /コミュニケーション|信頼関係|患者|対応/.test(raw) || /コミュニケーション|信頼関係|患者|対応/.test(t);

  const hasSelfPR = /自己pr/i.test(raw) || raw.includes('自己PR') || /自己pr/i.test(t) || t.includes('自己PR');
  const hasMotivation = raw.includes('志望動機') || t.includes('志望動機');
  const hasQuestions = raw.includes('質問') || raw.includes('逆質問') || t.includes('質問') || t.includes('逆質問');

  const base = isInterview
    ? '看護助手の面接対策'
    : isSalary
      ? '看護助手の給料・待遇'
      : isComm
        ? '看護助手の患者対応'
        : '看護助手の仕事';

  const out = [];
  out.push(t);

  if (isInterview) {
    out.push(`${base}：当日までの準備の整理`);
    if (hasSelfPR || hasMotivation) out.push(`${base}：自己PR・志望動機の作り方 例文つき`);
    if (hasQuestions) out.push(`${base}：よくある質問の答え方とNG例`);
    out.push(`${base}：合否を分けるポイントと対策`);
  } else if (isSalary) {
    out.push(`${base}：平均月収・年収と上げる方法を整理`);
    out.push(`${base}：夜勤・資格・転職で上がる？現実ラインの見方`);
    out.push(`${base}：手当・働き方別の違いの整理`);
  } else if (isComm) {
    out.push(`${base}：信頼を築く声かけと観察のコツ`);
    out.push(`${base}：困った場面の対応例 現場で使える`);
    out.push(`${base}：トラブルを防ぐ情報共有のやり方`);
  } else {
    out.push(`${base}：新人が最初に押さえるコツと注意点`);
    out.push(`${base}：続けやすくなる業務の回し方の整理`);
    out.push(`${base}：ミスを減らす手順と声かけ`);
  }

  // Clamp to a reasonable range (avoid excessively long titles)
  return out
    .map((x) => sanitizeTitle(x))
    .map((x) => (codePointLength(x) > 65 ? sliceCodePoints(x, 65).trim() : x))
    .map((x) => {
      while (/[、,・…\.]$/.test(x)) x = x.slice(0, -1).trim();
      return x;
    })
    .filter(Boolean);
}

function pickBestDistinct(candidates, recentTitles) {
  const recent = Array.isArray(recentTitles) ? recentTitles.filter(Boolean) : [];
  let best = candidates[0] || '';
  let bestScore = Number.POSITIVE_INFINITY;
  for (const cand of candidates) {
    const sim = recent.reduce((m, t) => Math.max(m, diceSimilarity(cand, t)), 0);
    if (sim < bestScore) {
      bestScore = sim;
      best = cand;
    }
    if (sim < 0.62) break;
  }
  return best;
}

async function main() {
  const token = process.env.SANITY_WRITE_TOKEN;
  if (!token || !String(token).trim()) {
    console.error('FATAL: SANITY_WRITE_TOKEN is required.');
    process.exit(1);
  }

  const client = createClient({
    projectId: '72m8vhy2',
    dataset: 'production',
    useCdn: false,
    apiVersion: '2024-01-01',
    token,
  });

  const drafts = await client.fetch(
    `*[_type == "post" && _id in path("drafts.**")] | order(_createdAt desc)[0...12]{_id, title, "slug": slug.current, _createdAt}`
  );
  const recentPublishedTitles = await client.fetch(
    `*[_type == "post" && defined(title)] | order(coalesce(publishedAt,_createdAt) desc)[0...80].title`
  );

  const recentTitles = []
    .concat(Array.isArray(drafts) ? drafts.map((d) => d?.title) : [])
    .concat(Array.isArray(recentPublishedTitles) ? recentPublishedTitles : [])
    .filter(Boolean);

  const TOO_SIMILAR = 0.78;
  const updates = [];

  for (const d of Array.isArray(drafts) ? drafts : []) {
    const current = String(d?.title || '').trim();
    if (!current) continue;

    const maxSim = recentTitles
      .filter((t) => t !== current)
      .reduce((m, t) => Math.max(m, diceSimilarity(current, t)), 0);

    if (maxSim < TOO_SIMILAR && !/^【/.test(current) && !/(?:…|\.{3,})$/.test(current)) {
      continue;
    }

    const candidates = buildCandidates(current);
    const nextTitle = pickBestDistinct(candidates, recentTitles.filter((t) => t !== current));

    if (!nextTitle || nextTitle === current) continue;

    updates.push({ id: d._id, slug: d.slug, from: current, to: nextTitle });
    // Update recentTitles so the next pick sees the new title.
    recentTitles.push(nextTitle);
  }

  if (updates.length === 0) {
    console.log('[title-fix] No near-duplicate recent draft titles detected.');
    return;
  }

  console.log(`[title-fix] Will update ${updates.length} draft title(s). mode=${DRY_RUN ? 'dry-run' : 'apply'}`);
  for (const u of updates) {
    console.log(`- ${u.slug || u.id}: "${u.from}" -> "${u.to}"`);
  }

  if (DRY_RUN) return;

  for (const u of updates) {
    await client.patch(u.id).set({ title: u.to }).commit();
  }

  console.log('[title-fix] Applied updates.');
}

main().catch((err) => {
  console.error('[title-fix] FATAL:', err?.message || err);
  process.exit(1);
});
