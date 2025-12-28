#!/usr/bin/env node

/**
 * Sera Tone Score
 *
 * - Fetches all posts from Sanity
 * - Computes SeraToneScore (0-100) with lightweight heuristics
 * - Outputs `.analytics/sera-tone-report.json`
 * - (Optional) stores meta in Sanity (best-effort)
 *
 * Usage:
 *   node scripts/sera-tone-score.cjs
 *   node scripts/sera-tone-score.cjs --output .analytics/sera-tone-report.json
 *   node scripts/sera-tone-score.cjs --apply-meta
 *
 * Env:
 *   SANITY_API_TOKEN=... (or SANITY_WRITE_TOKEN)
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env.private' });
const { createClient } = require('@sanity/client');
const fs = require('fs');
const path = require('path');

const SANITY_PROJECT_ID =
  process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2';
const SANITY_DATASET =
  process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const SANITY_API_VERSION =
  process.env.SANITY_API_VERSION || process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01';

const EMPATHY_PHRASES = [
  'つらい',
  'しんどい',
  '大変',
  '不安',
  '心配',
  '苦しい',
  '焦る',
  '無理し',
  'よかったら',
  'もしよければ',
  'よければ',
  '大丈夫',
  'ありますよね',
  'わかります',
  '気持ち',
  'ひと息',
  '少しずつ',
  'ゆっくり',
  '安心',
  '〜かもしれません',
  'と思います',
  '…',
];

const COMMAND_PHRASES = [
  '必ず',
  '絶対',
  'すべき',
  'してください',
  'しなければ',
  'しなきゃ',
  'やるべき',
  '今すぐ',
  '急いで',
  '断言',
  '確実に',
  '〜しろ',
  '〜しなさい',
];

const REDUNDANT_PHRASES = [
  'という',
  'することができる',
  'することができます',
  'となります',
  'するようにする',
  'していく',
  'していきます',
];

// SERA_POSITION_RULE.md を踏まえた「断定主体/責任主体」っぽい表現を検出して減点する
// - セラ自身が制度/数字等を断言する
// - 「セラが教える」などの権威化
const POSITION_VIOLATION_PHRASES = [
  '看護助手の私が教える',
  '看護助手のわたしが教える',
  '現役看護助手の私が教える',
  '現役看護助手のわたしが教える',
  'セラが',
  'セラの',
];

const POSITION_AUTHORITY_KEYWORDS = [
  '平均年収',
  '給料',
  '給与',
  '賃金',
  '法律',
  '労働基準法',
  '制度',
  '診療報酬',
  '手当',
  '違法',
  '正しい',
  '必ず',
  '絶対',
];

function parseArgs(argv) {
  const args = {
    output: '.analytics/sera-tone-report.json',
    applyMeta: false,
    limit: null,
  };

  for (let i = 2; i < argv.length; i++) {
    const value = argv[i];
    if (value === '--output') {
      args.output = argv[i + 1] || args.output;
      i++;
      continue;
    }
    if (value === '--apply-meta') {
      args.applyMeta = true;
      continue;
    }
    if (value === '--limit') {
      args.limit = Number(argv[i + 1]);
      i++;
      continue;
    }
  }

  if (args.limit != null && (!Number.isFinite(args.limit) || args.limit <= 0)) {
    args.limit = null;
  }

  return args;
}

function clamp(min, value, max) {
  return Math.max(min, Math.min(max, value));
}

function extractBlockText(block) {
  if (!block) return '';
  if (block._type === 'block') {
    const children = Array.isArray(block.children) ? block.children : [];
    return children.map((c) => (typeof c?.text === 'string' ? c.text : '')).join('');
  }
  if (block._type === 'speechBubble' && typeof block.text === 'string') {
    return block.text;
  }
  return '';
}

function toPlainText(body) {
  const blocks = Array.isArray(body) ? body : [];
  return blocks
    .map(extractBlockText)
    .filter(Boolean)
    .join('\n')
    .replace(/\s+\n/g, '\n')
    .trim();
}

function countOccurrences(text, phrase) {
  if (!text || !phrase) return 0;
  let count = 0;
  let idx = 0;
  while (true) {
    idx = text.indexOf(phrase, idx);
    if (idx === -1) break;
    count++;
    idx += phrase.length;
  }
  return count;
}

function splitSentences(text) {
  if (!text) return [];
  const parts = text
    .split(/(?<=[。！？!?\n])/u)
    .map((s) => s.replace(/\s+/gu, ' ').trim())
    .filter(Boolean);
  return parts;
}

function computePoliteEndingStreakPenalty(sentences) {
  if (!Array.isArray(sentences) || sentences.length === 0) return { penalty: 0, streaks: 0, maxStreak: 0 };

  const politeEnding = (s) => /(?:です|ます|でした|ました|でしょう|ません)\s*[。！？!?]$/u.test(s);
  const shortish = (s) => s.length <= 28;

  let current = 0;
  let maxStreak = 0;
  let streaks = 0;

  for (const s of sentences) {
    if (politeEnding(s) && shortish(s)) {
      current += 1;
      if (current > maxStreak) maxStreak = current;
    } else {
      if (current >= 3) streaks += 1;
      current = 0;
    }
  }
  if (current >= 3) streaks += 1;

  const penalty = clamp(0, (maxStreak >= 3 ? (maxStreak - 2) * 4 : 0) + streaks * 2, 18);
  return { penalty, streaks, maxStreak };
}

function computeSeraToneScore(text) {
  const reasons = [];
  if (!text) {
    return { score: 0, reasons: ['本文が空です'] };
  }

  const sentences = splitSentences(text);
  const longSentenceCount = sentences.filter((s) => s.length >= 60).length;
  const longRatio = sentences.length ? longSentenceCount / sentences.length : 0;

  const empathyHits = EMPATHY_PHRASES.reduce((sum, p) => sum + countOccurrences(text, p.replace('〜', '')), 0);
  const commandHits = COMMAND_PHRASES.reduce((sum, p) => sum + countOccurrences(text, p.replace('〜', '')), 0);
  const redundantHits = REDUNDANT_PHRASES.reduce((sum, p) => sum + countOccurrences(text, p), 0);

  let score = 70;

  const empathyBonus = clamp(0, empathyHits * 2, 20);
  score += empathyBonus;
  if (empathyBonus > 0) reasons.push(`寄り添い表現: +${empathyBonus} (hits=${empathyHits})`);

  const commandPenalty = clamp(0, commandHits * 4, 28);
  score -= commandPenalty;
  if (commandPenalty > 0) reasons.push(`断定/命令: -${commandPenalty} (hits=${commandHits})`);

  // Position rule penalty: avoid turning Sera into an authority/decision maker.
  const violationHits = POSITION_VIOLATION_PHRASES.reduce(
    (sum, p) => sum + countOccurrences(text, p),
    0
  );
  const hasFirstPerson = /(?:^|\s)(?:わたし|私)(?:は|が|の|も)?/u.test(text);
  const hasNumbers = /\d/u.test(text);
  const authorityKeywordHits = POSITION_AUTHORITY_KEYWORDS.reduce(
    (sum, p) => sum + countOccurrences(text, p),
    0
  );

  let positionPenalty = 0;
  if (violationHits > 0) positionPenalty += Math.min(18, violationHits * 6);
  if (hasFirstPerson && (authorityKeywordHits > 0 || hasNumbers)) positionPenalty += 8;
  positionPenalty = clamp(0, positionPenalty, 26);

  score -= positionPenalty;
  if (positionPenalty > 0) {
    reasons.push(
      `ポジション逸脱(断定主体/権威化): -${positionPenalty} (violations=${violationHits}, authorityHits=${authorityKeywordHits})`
    );
  }

  const longPenalty = clamp(0, Math.round(longRatio * 30), 30);
  score -= longPenalty;
  if (longPenalty > 0) reasons.push(`長文率(>=60字): -${longPenalty} (ratio=${longRatio.toFixed(2)})`);

  const redundantPenalty = clamp(0, redundantHits * 2, 16);
  score -= redundantPenalty;
  if (redundantPenalty > 0) reasons.push(`冗長表現: -${redundantPenalty} (hits=${redundantHits})`);

  const streak = computePoliteEndingStreakPenalty(sentences);
  score -= streak.penalty;
  if (streak.penalty > 0) {
    reasons.push(`短文のです/ます連続: -${streak.penalty} (maxStreak=${streak.maxStreak}, streaks=${streak.streaks})`);
  }

  // Mild bonus for question-based softening
  const questionCount = countOccurrences(text, '？') + countOccurrences(text, '?');
  const questionBonus = clamp(0, questionCount, 6);
  score += questionBonus;
  if (questionBonus > 0) reasons.push(`問いかけ: +${questionBonus} (count=${questionCount})`);

  score = clamp(0, score, 100);

  // compact reasons
  const trimmedReasons = reasons.slice(0, 6);
  return { score, reasons: trimmedReasons };
}

function median(values) {
  const nums = values.filter((v) => Number.isFinite(v)).slice().sort((a, b) => a - b);
  if (nums.length === 0) return 0;
  const mid = Math.floor(nums.length / 2);
  if (nums.length % 2 === 0) return (nums[mid - 1] + nums[mid]) / 2;
  return nums[mid];
}

async function main() {
  const args = parseArgs(process.argv);

  const token = process.env.SANITY_API_TOKEN || process.env.SANITY_WRITE_TOKEN;
  if (!token) throw new Error('SANITY_API_TOKEN (or SANITY_WRITE_TOKEN) is required');

  const client = createClient({
    projectId: SANITY_PROJECT_ID,
    dataset: SANITY_DATASET,
    apiVersion: SANITY_API_VERSION,
    useCdn: false,
    token,
  });

  const limitClause = args.limit != null ? `[0...${args.limit}]` : '';
  const posts = await client.fetch(
    `*[_type == "post" && defined(slug.current) && defined(body[0]) && !(_id in path("drafts.**"))] | order(coalesce(publishedAt, _createdAt) desc) ${limitClause} {
      _id,
      title,
      "slug": slug.current,
      body,
      maintenanceLocked,
      internalOnly,
      seraToneScore,
      seraToneScoredAt
    }`
  );

  const items = [];
  const scores = [];

  for (const post of posts) {
    const plain = toPlainText(post.body);
    const { score, reasons } = computeSeraToneScore(plain);
    const updatedAt = new Date().toISOString();
    scores.push(score);
    items.push({
      id: post._id,
      slug: post.slug,
      title: post.title,
      score,
      reasons,
      maintenanceLocked: Boolean(post.maintenanceLocked),
      internalOnly: Boolean(post.internalOnly),
      updatedAt,
    });

    if (args.applyMeta) {
      try {
        await client
          .patch(post._id)
          .set({ seraToneScore: score, seraToneScoredAt: updatedAt })
          .commit({ autoGenerateArrayKeys: false });
      } catch (e) {
        // best-effort, do not fail scoring
      }
    }
  }

  const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const med = median(scores);
  const lowThreshold = 55;
  const lowCount = items.filter((i) => i.score < lowThreshold).length;

  const sortedLow = items
    .slice()
    .sort((a, b) => a.score - b.score)
    .slice(0, 10)
    .map((i) => ({ slug: i.slug, score: i.score, reasons: i.reasons }));

  console.log('🧾 Sera tone score report');
  console.log(`- Articles: ${items.length}`);
  console.log(`- Avg: ${avg.toFixed(1)}`);
  console.log(`- Median: ${med.toFixed(1)}`);
  console.log(`- Low (<${lowThreshold}): ${lowCount}`);
  if (sortedLow.length > 0) {
    console.log('🔻 Lowest 10');
    for (const entry of sortedLow) {
      console.log(`- ${entry.slug}: ${entry.score} (${entry.reasons.join(' / ')})`);
    }
  }

  const outputPath = path.resolve(process.cwd(), args.output);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const report = {
    generatedAt: new Date().toISOString(),
    total: items.length,
    summary: {
      average: Number(avg.toFixed(2)),
      median: Number(med.toFixed(2)),
      lowThreshold,
      lowCount,
    },
    items,
  };
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
  console.log(`📄 Wrote ${args.output}`);
}

main().catch((error) => {
  console.error('❌ sera-tone-score failed:', error?.message || error);
  // safety: do not crash scheduled workflows
  process.exit(0);
});
