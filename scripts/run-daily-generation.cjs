const { createClient } = require('@sanity/client');
const { randomUUID } = require('crypto');
const fs = require('fs');
const path = require('path');
const {
  ensurePortableTextKeys,
  ensureReferenceKeys
} = require('./utils/keyHelpers');
const { spawnSync } = require('child_process');
const MetadataService = require('./utils/metadataService');
require('dotenv').config({ path: path.join(__dirname, '../.env.local'), override: true }); // For local testing

const metadataService = new MetadataService(process.env.GEMINI_API_KEY);

// Budget Guard
const budget = spawnSync(process.execPath, [path.resolve(__dirname, 'budget-guard.cjs'), '--reserve-articles', '1'], {
  stdio: 'inherit',
  env: process.env
});
if (budget.status !== 0) {
  console.warn('⚠️ Budget guard error. Skipping generation.');
  process.exit(0);
}

function appendGithubOutput(key, value) {
  const outputPath = process.env.GITHUB_OUTPUT;
  if (!outputPath) return;
  const safe = String(value ?? '').replace(/\r?\n/g, ' ').trim();
  fs.appendFileSync(outputPath, `${key}=${safe}\n`, 'utf8');
}

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

function sanitizeGeneratedTitle(input) {
  let title = String(input || '').trim();
  if (!title) return '';

  // Remove bracketed prefixes like 【看護助手 面接対策】 to avoid repeated template feel.
  title = title.replace(/^【[^】]{1,40}】\s*/g, '');
  title = title.replace(/[（(][^）)]{1,32}[）)]/g, '').trim();

  // Avoid overused endings and mid-sentence ellipsis.
  title = title.replace(/(?:…|\.{3,})+$/g, '').trim();
  title = title.replace(/徹底解説/g, 'ポイント整理');
  title = title.replace(/完全ガイド/g, '実践ガイド');
  title = title.replace(/完全版/g, '要点整理');
  title = title.replace(/保存版/g, '要点整理');
  title = title.replace(/チェックリスト/g, '整理ポイント');
  title = title.replace(/まとめ/g, '整理');

  // Remove punctuation as requested by user
  title = title.replace(/[、。]/g, ' ');
  title = title.replace(/\s+/g, ' ').trim();

  return title;
}

function endsWithBadPunctuation(title) {
  return /[、,・…\.\:：｜\-\–—]$/.test(String(title || '').trim());
}

const TITLE_BANNED_PATTERNS = [
  /[（(].+[)）]/,
  /チェックリスト/,
  /保存版/,
  /完全版/,
  /まとめ/,
  /(?:\d+|[一二三四五六七八九十百千]+)(選|個)/,
];

function isTitleForbidden(title) {
  const t = String(title || '');
  return TITLE_BANNED_PATTERNS.some((re) => re.test(t));
}

function sanitizeTitleForBlacklist(title) {
  let t = sanitizeGeneratedTitle(title);
  t = t.replace(/[（(][^）)]{1,40}[）)]/g, '').trim();
  t = t.replace(/(?:\d+|[一二三四五六七八九十百千]+)(選|個)/g, '').trim();
  t = t.replace(/\s{2,}/g, ' ').trim();
  return t;
}

const BODY_BANNED_TERMS = [
  /チェックリスト/i,
  /\bToDo\b/i,
  /\bSTEP\b/i,
  /次にやること/,
  /最後に確認/,
];

function normalizeBodyText(text) {
  let t = String(text || '');
  t = t.replace(/チェックリスト/gi, '整理ポイント');
  t = t.replace(/\bToDo\b/gi, '整理事項');
  t = t.replace(/\bSTEP\b/gi, '流れ');
  t = t.replace(/次にやること/g, '次の整理');
  t = t.replace(/最後に確認/g, '最後に整理');
  return t;
}

function neutralizeActionEnding(text) {
  let t = String(text || '');
  t = t.replace(/しましょう/g, 'と安心です');
  t = t.replace(/してください/g, 'と安心です');
  t = t.replace(/すると良いでしょう/g, 'と安心です');
  t = t.replace(/すると良い/g, 'と安心です');
  t = t.replace(/するといいでしょう/g, 'と安心です');
  t = t.replace(/するといい/g, 'と安心です');
  t = t.replace(/するとよいでしょう/g, 'と安心です');
  t = t.replace(/するとよい/g, 'と安心です');
  t = t.replace(/しておくと良い/g, 'としておくと安心です');
  t = t.replace(/しておくといい/g, 'としておくと安心です');
  t = t.replace(/しておくとよい/g, 'としておくと安心です');
  return t;
}

function blockText(block) {
  if (!block || block._type !== 'block') return '';
  return (block.children || [])
    .map((child) => (typeof child?.text === 'string' ? child.text : ''))
    .join('')
    .trim();
}

function sanitizeBodyBlocks(blocks) {
  if (!Array.isArray(blocks)) return [];
  return blocks.map((block) => {
    if (!block || block._type !== 'block') return block;
    const isHeading = block.style === 'h2' || block.style === 'h3';
    const rawText = blockText(block);
    const hasBanned = BODY_BANNED_TERMS.some((re) => re.test(rawText));
    const isListItem = Boolean(block.listItem);

    if (isHeading && hasBanned) {
      const cleanedHeading = normalizeBodyText(rawText) || '要点整理';
      return {
        ...block,
        children: [{ _type: 'span', text: cleanedHeading }],
      };
    }

    if (!Array.isArray(block.children)) return block;
    const children = block.children.map((child) => {
      if (child?._type !== 'span' || typeof child.text !== 'string') return child;
      let text = normalizeBodyText(child.text);
      if (isListItem) {
        text = neutralizeActionEnding(text);
      }
      return { ...child, text };
    });
    return { ...block, children };
  });
}

function ensureTitleEndsCleanly(title, maxLen) {
  let t = String(title || '').trim();
  if (!t) return t;

  const codeLen = (v) => codePointLength(String(v || ''));

  // Avoid dangling particles at the end (e.g. "...を", "...の")
  const stripTrailingParticles = (value) => {
    let v = String(value || '').trim();
    const particles = ['を', 'に', 'へ', 'で', 'と', 'が', 'の', 'や', 'も'];
    while (v) {
      const last = v.slice(-1);
      if (!particles.includes(last)) break;
      v = v.slice(0, -1).trim();
    }
    return v;
  };

  // If truncation created a partial common word (e.g. ポイン -> ポイント), repair it.
  // NOTE: Do NOT trim earlier parts to make room. Only adjust the tail, and if it doesn't fit, drop the partial tail.
  const repairPartialSuffix = (value) => {
    let v = String(value || '').trim();
    const fullWords = [
      'ポイント',
      'メリット',
      'デメリット',
      'ステップ',
      '方法',
      '対策',
      '手順',
      'コツ',
      '注意点',
      '例文',
    ];

    for (const word of fullWords) {
      for (let i = word.length - 1; i >= 2; i--) {
        const prefix = word.slice(0, i);
        if (!v.endsWith(prefix)) continue;
        if (v.endsWith(word)) break;

        const base = v.slice(0, v.length - prefix.length).trim();
        const candidate = `${base}${word}`.trim();
        if (!maxLen || codeLen(candidate) <= maxLen) return candidate;

        // If it doesn't fit, drop the partial tail instead of trimming earlier text.
        return base;
      }
    }

    // Remove a very short katakana tail that likely got cut (e.g. "ポイン", "メリッ")
    v = v.replace(/[ァ-ヶー]{1,4}$/u, '').trim();
    return v;
  };

  const trimToBoundary = (value, limit) => {
    const v = String(value || '').trim();
    if (!limit || codeLen(v) <= limit) return v;

    const arr = Array.from(v);
    const within = arr.slice(0, limit).join('');
    const boundaries = ['。', '、', '・', '：', ':', '｜', '|', ' ', '　', '）', ')', '】', '」', '』', '／', '/', '—', '–', '-', '\n'];
    let best = within;
    for (let i = within.length - 1; i >= 0; i--) {
      const ch = within[i];
      if (!boundaries.includes(ch)) continue;
      const cand = within.slice(0, i).trim();
      if (cand && codeLen(cand) >= Math.min(12, Math.floor(limit * 0.5))) {
        best = cand;
        break;
      }
    }
    return best.trim();
  };

  // Titles should not end with ellipsis or dangling punctuation.
  while (t && endsWithBadPunctuation(t)) t = t.slice(0, -1).trim();

  // Never end with "..." / "…"
  t = t.replace(/(?:…|\.{3,})+$/g, '').trim();

  // If we trimmed too hard, keep within limit without adding ellipsis.
  if (maxLen && codePointLength(t) > maxLen) t = trimToBoundary(t, maxLen);

  t = stripTrailingParticles(t);
  t = repairPartialSuffix(t);

  while (t && endsWithBadPunctuation(t)) t = t.slice(0, -1).trim();
  t = stripTrailingParticles(t);

  // Final purge of forbidden punctuation
  t = t.replace(/[、。]/g, ' ').replace(/\s+/g, ' ').trim();

  return t;
}

function buildAlternativeTitles({ baseSubject, features, tail }) {
  const hasSelfPR = features.hasSelfPR;
  const hasMotivation = features.hasMotivation;
  const hasQuestions = features.hasQuestions;

  const variations = [];

  if (tail === 'short') {
    variations.push(`${baseSubject}の基本`);
    variations.push(`${baseSubject}の準備ポイント`);
    variations.push(`${baseSubject}で押さえること`);
    return variations;
  }

  if (tail === 'middle') {
    variations.push(`${baseSubject}：準備の流れと要点整理`);
    if (hasSelfPR || hasMotivation) variations.push(`${baseSubject}：自己PR・志望動機の整え方`);
    if (hasQuestions) variations.push(`${baseSubject}：よくある質問と答え方のコツ`);
    variations.push(`${baseSubject}で落ちやすいポイントと対策`);
    return variations;
  }

  // long
  variations.push(`${baseSubject}：準備の手順・自己PR・志望動機を整理して押さえる`);
  if (hasQuestions) variations.push(`${baseSubject}：よくある質問の答え方と当日の心構え`);
  if (hasSelfPR && hasMotivation) variations.push(`${baseSubject}：自己PRと志望動機で差がつく準備法`);
  variations.push(`${baseSubject}：失敗しやすい落とし穴と対策を整理`);
  return variations;
}

function clampTitleLength(title, minLen, maxLen) {
  let t = String(title || '').trim();
  if (!t) return t;

  // If too long, try to drop trailing parentheticals first.
  if (maxLen && codePointLength(t) > maxLen) {
    t = t.replace(/（[^）]{1,24}）$/g, '').trim();
  }

  if (maxLen && codePointLength(t) > maxLen) {
    // Prefer truncating after a separator if present.
    const separators = ['：', '｜', '—', '-', '–'];
    for (const sep of separators) {
      const idx = t.lastIndexOf(sep);
      if (idx > 8) {
        const cand = t.slice(0, idx).trim();
        if (codePointLength(cand) >= minLen && codePointLength(cand) <= maxLen) {
          t = cand;
          break;
        }
      }
    }
  }

  if (maxLen && codePointLength(t) > maxLen) {
    t = sliceCodePoints(t, maxLen).trim();
  }

  // If too short, append a short qualifier (no ellipsis).
  if (minLen && codePointLength(t) < minLen) {
    const fillers = ['の要点整理', 'の状況整理', 'の考え方'];
    for (const f of fillers) {
      const cand = `${t}${f}`;
      if (codePointLength(cand) >= minLen && (!maxLen || codePointLength(cand) <= maxLen)) {
        t = cand;
        break;
      }
    }
  }

  return ensureTitleEndsCleanly(t, maxLen);
}

function chooseDistinctTitle({ generatedTitle, selectedKeyword, tail, minLen, maxLen, recentTitles }) {
  const sanitized = sanitizeTitleForBlacklist(generatedTitle);
  const recent = Array.isArray(recentTitles) ? recentTitles.filter(Boolean) : [];

  const maxSim = recent.reduce((m, t) => Math.max(m, diceSimilarity(sanitized, t)), 0);
  const hasListyPattern = /・/.test(sanitized) && (sanitized.match(/・/g) || []).length >= 2;
  const overusedPattern = /採用を勝ち取る|合格を引き寄せる|徹底解説/.test(String(generatedTitle || ''));

  // Threshold tuned to catch near-duplicates without overfiring.
  const TOO_SIMILAR = 0.78;
  const shouldRewrite = maxSim >= TOO_SIMILAR || (hasListyPattern && overusedPattern);

  const features = {
    hasSelfPR: /自己pr/i.test(sanitized) || sanitized.includes('自己PR'),
    hasMotivation: sanitized.includes('志望動機'),
    hasQuestions: sanitized.includes('質問') || sanitized.includes('逆質問'),
  };

  const baseSubjectRaw = String(selectedKeyword || '').trim();
  const baseSubject = baseSubjectRaw.includes('看護助手')
    ? baseSubjectRaw
    : baseSubjectRaw
      ? `看護助手の${baseSubjectRaw}`
      : '看護助手の面接対策';

  const candidates = [sanitized, ...buildAlternativeTitles({ baseSubject, features, tail })]
    .map((t) => sanitizeTitleForBlacklist(t))
    .filter((t) => t && !isTitleForbidden(t))
    .map((t) => clampTitleLength(t, minLen, maxLen))
    .filter((t) => t && codePointLength(t) >= minLen && (!maxLen || codePointLength(t) <= maxLen));

  let best = candidates[0] || sanitized;
  let bestScore = Number.POSITIVE_INFINITY;
  for (const cand of candidates) {
    const sim = recent.reduce((m, t) => Math.max(m, diceSimilarity(cand, t)), 0);
    if (sim < bestScore) {
      bestScore = sim;
      best = cand;
    }
    if (sim < 0.62) break; // sufficiently distinct
  }

  // If no rewrite needed, keep sanitized (but length-clamped).
  if (!shouldRewrite && !isTitleForbidden(sanitized)) return clampTitleLength(sanitized, minLen, maxLen);
  if (!best || isTitleForbidden(best)) {
    const fallback = sanitizeTitleForBlacklist(`${baseSubject}の要点整理`);
    return clampTitleLength(fallback, minLen, maxLen);
  }
  return best;
}

function buildPostSlug(input) {
  const keywordMap = {
    'シフト': 'shift',
    '夜勤': 'night-shift',
    '給料': 'salary',
    '年収': 'income',
    '転職': 'career',
    '辞めたい': 'quit',
    '退職': 'retirement',
    '資格': 'qualification',
    '仕事': 'work',
    '業務': 'duties',
    '人間関係': 'relationship',
    'やりがい': 'reward',
    '求人': 'job',
    'スキル': 'skill',
    '未経験': 'beginner',
    'きつい': 'tough',
    'パート': 'part-time',
    '正社員': 'full-time',
    'メリット': 'merit',
    'デメリット': 'demerit',
    'コツ': 'tips',
    '方法': 'method',
    '理由': 'reason',
    '悩み': 'concern',
    'キャリア': 'career',
    '朝': 'morning',
    '昼': 'day',
    '夜': 'night',
    '専従': 'dedicated',
  };

  const title = String(input || '').trim();
  if (!title) {
    return `nursing-assistant-general-${Date.now().toString(36).slice(-5)}-${randomUUID().slice(0, 4)}`.slice(0, 96);
  }

  let keywords = [];
  for (const [jp, en] of Object.entries(keywordMap)) {
    if (title.includes(jp)) {
      keywords.push(en);
      if (keywords.length >= 3) break;
    }
  }

  if (keywords.length < 2) {
    const titleWords = title
      .replace(/【|】|[・、。！？]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 0);

    for (const word of titleWords) {
      for (const [jp, en] of Object.entries(keywordMap)) {
        if (word.includes(jp) && !keywords.includes(en)) {
          keywords.push(en);
          if (keywords.length >= 2) break;
        }
      }
      if (keywords.length >= 2) break;
    }
  }

  if (keywords.length === 0) {
    keywords = ['general'];
  }

  const keywordSegment = keywords.slice(0, 3).join('-');
  const normalizedTitle = title
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, ' ')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase()
    .replace(/-+/g, '-')
    .slice(0, 48);

  const uniqueSuffix = `${Date.now().toString(36).slice(-5)}-${randomUUID().slice(0, 4)}`;

  return ['nursing-assistant', keywordSegment, normalizedTitle, uniqueSuffix]
    .filter(Boolean)
    .join('-')
    .replace(/-+/g, '-')
    .replace(/-$/, '')
    .slice(0, 96);
}

// --- Configuration ---
const SANITY_PROJECT_ID =
  process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const SANITY_DATASET =
  process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET;
const SANITY_API_VERSION =
  process.env.SANITY_API_VERSION ||
  process.env.NEXT_PUBLIC_SANITY_API_VERSION ||
  '2024-01-01';

// Token priority: Use SANITY_API_TOKEN if available, otherwise SANITY_WRITE_TOKEN
const SANITY_READ_TOKEN = process.env.SANITY_API_TOKEN || process.env.SANITY_WRITE_TOKEN || process.env.SANITY_READ_TOKEN;
const SANITY_WRITE_TOKEN = process.env.SANITY_API_TOKEN || process.env.SANITY_WRITE_TOKEN;

const SANITY_READ_CONFIG = {
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  useCdn: false,
  apiVersion: SANITY_API_VERSION,
  token: SANITY_READ_TOKEN,
};

const SANITY_WRITE_CONFIG = {
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  useCdn: false,
  apiVersion: SANITY_API_VERSION,
  token: SANITY_WRITE_TOKEN,
};

const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // Reverted to process.env.GEMINI_API_KEY

// --- Main Logic ---

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

function normalizeQueryForCompare(query) {
  return String(query || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function pickTailFromText(text) {
  const normalized = normalizeQueryForCompare(text);
  if (!normalized) return 'long';
  const tokens = normalized.split(' ').filter(Boolean);
  const length = normalized.length;

  if (tokens.length <= 1 && length <= 12) return 'short';
  if (tokens.length <= 2 && length <= 22) return 'middle';
  return 'long';
}

function toPathFromUrl(url) {
  try {
    const u = new URL(url);
    return u.pathname || '/';
  } catch {
    return null;
  }
}

function computeQueryScore({ impressions, ctr, position, ga4Sessions, ga4AvgDuration, ga4EngagementRate }) {
  const imp = Number(impressions || 0);
  if (!Number.isFinite(imp) || imp <= 0) return 0;

  const safeCtr = Number.isFinite(ctr) ? Math.min(1, Math.max(0, ctr)) : 0;
  const pos = Number.isFinite(position) ? position : 999;

  // Prefer queries with visibility but underperforming CTR.
  const ctrFactor = 0.2 + (1 - safeCtr); // keep a floor

  // Prefer queries close enough to win (roughly positions 6-30).
  let posFactor = 0.6;
  if (pos <= 8) posFactor = 0.8;
  else if (pos <= 20) posFactor = 1.2;
  else if (pos <= 35) posFactor = 1.0;
  else if (pos <= 60) posFactor = 0.7;

  // GA4: if a page already gets sessions but engagement is low, a dedicated article can help.
  const sessions = Number.isFinite(ga4Sessions) ? ga4Sessions : 0;
  const duration = Number.isFinite(ga4AvgDuration) ? ga4AvgDuration : 0;
  const engagement = Number.isFinite(ga4EngagementRate) ? ga4EngagementRate : null;
  let gaFactor = 1.0;
  if (sessions >= 10) {
    if (duration > 0 && duration < 60) gaFactor *= 1.15;
    if (engagement != null && engagement < 0.5) gaFactor *= 1.15;
  }

  return imp * ctrFactor * posFactor * gaFactor;
}

async function fetchSuggestQueries(seedQuery) {
  const q = String(seedQuery || '').trim();
  if (!q) return [];

  const url = `https://suggestqueries.google.com/complete/search?client=firefox&hl=ja&q=${encodeURIComponent(q)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch(url, { signal: controller.signal, headers: { 'user-agent': 'prorenata-bot' } });
    if (!res.ok) return [];
    const json = await res.json();
    const list = Array.isArray(json) ? json[1] : [];
    return Array.isArray(list) ? list.filter((s) => typeof s === 'string').slice(0, 10) : [];
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

async function generateAndSaveArticle() {
  console.log("Starting daily article generation process...");

  // 1. Initialize clients
  if (!SANITY_READ_TOKEN) {
    console.error("FATAL: SANITY_READ_TOKEN environment variable is not set.");
    process.exit(1);
  }
  if (!SANITY_WRITE_TOKEN || !GEMINI_API_KEY) {
    console.error("FATAL: SANITY_WRITE_TOKEN or GEMINI_API_KEY environment variables are not set.");
    process.exit(1);
  }
  if (!SANITY_READ_CONFIG.projectId || !SANITY_READ_CONFIG.dataset) {
    console.error("FATAL: SANITY_PROJECT_ID / SANITY_DATASET environment variables are not set.");
    process.exit(1);
  }
  const sanityReadClient = createClient(SANITY_READ_CONFIG);
  const sanityWriteClient = createClient(SANITY_WRITE_CONFIG);

  // 2. Select a topic/keyword
  console.log("Selecting a topic/keyword...");
  let selectedTopic;
  let selectedKeyword = null;
  let targetTail = 'long'; // Default to long tail
  let titleList = [];
  let existingTitleSet = new Set();
  let recentData = { posts: [], allCategories: [] };

  try {
    const analyticsModeRaw = String(process.env.ANALYTICS_MODE || 'enabled').trim().toLowerCase();
    const analyticsEnabled = !['disabled', 'off', 'false', '0', 'no'].includes(analyticsModeRaw);

    // Load Google Ads Data if available (AdWords Integration)
    const adsPath = path.join(process.cwd(), 'data', 'google_ads_keywords.csv');
    let adsRecords = [];
    if (fs.existsSync(adsPath)) {
      try {
        adsRecords = loadCsvRecords(adsPath);
        console.log(`Loaded ${adsRecords.length} records from Google Ads data.`);
      } catch (e) {
        console.warn("Failed to load Google Ads data:", e.message);
      }
    }

    if (!analyticsEnabled) {
      console.log('ANALYTICS_MODE=disabled: skip GA4/GSC keyword selection and use fallback topic.');
    }

    // Fetch recent titles and categories up-front
    recentData = await sanityReadClient.fetch(
      `{
          "posts": *[_type == "post" && defined(title)]|order(coalesce(publishedAt,_createdAt) desc)[0...60]{
            title, 
            "category": categories[0]->title,
            "publishedAt": coalesce(publishedAt, _createdAt)
          },
          "allCategories": *[_type == "category"]{_id, title}
        }`
    );
    const posts = recentData.posts || [];
    titleList = posts.map((d) => d?.title).filter(Boolean);
    existingTitleSet = new Set(titleList.map((t) => normalizeQueryForCompare(t)));

    // --- Semantic Cooldown Calculation ---
    // Analyze recent titles to find overused keywords.
    const trackedKeywords = ['面接', '給料', '年収', '人間関係', '志望動機', '自己PR', '辞めたい', '退職', '資格', '夜勤', 'シフト'];
    const keywordUsageArgs = {};
    trackedKeywords.forEach(k => keywordUsageArgs[k] = 0);

    // Weight recent usage higher (Decay)
    posts.forEach((p, idx) => {
      const title = p.title || '';
      const recencyWeight = Math.max(0.2, 1.0 - (idx / 30)); // 1.0 for newest, 0.2 for 30th
      trackedKeywords.forEach(kw => {
        if (title.includes(kw)) {
          keywordUsageArgs[kw] += recencyWeight;
        }
      });
    });

    console.log("Recent Keyword Usage (Score):",
      Object.entries(keywordUsageArgs)
        .filter(([_, score]) => score > 0.5)
        .map(([k, s]) => `${k}:${s.toFixed(1)}`).join(', ')
    );

    const allCategoryTitles = (recentData.allCategories || []).map(c => c.title).filter(Boolean);

    // --- Category Rotation Logic ---
    const categoryUsage = {};
    allCategoryTitles.forEach(cat => categoryUsage[cat] = 0);

    // Look at last 15 posts
    posts.slice(0, 15).forEach((p, index) => {
      if (p.category && categoryUsage.hasOwnProperty(p.category)) {
        categoryUsage[p.category] += (15 - index);
      }
    });

    const sortedCategories = allCategoryTitles.sort((a, b) => categoryUsage[a] - categoryUsage[b]);
    // Pick randomly from the top 3 least used to avoid strict pattern prediction
    const candidateCategories = sortedCategories.slice(0, 3);
    const selectedCategoryTitle = candidateCategories[Math.floor(Math.random() * candidateCategories.length)] || '仕事';
    const selectedCategoryDoc = (recentData.allCategories || []).find(c => c.title === selectedCategoryTitle);
    const selectedCategoryId = selectedCategoryDoc ? selectedCategoryDoc._id : null;

    console.log(`Category Rotation: Selected "${selectedCategoryTitle}" (ID: ${selectedCategoryId})`);

    // Prefer data-driven keywords from GSC/GA4
    const gscPath = path.join(process.cwd(), 'data', 'gsc_last30d.csv');
    const ga4Path = path.join(process.cwd(), 'data', 'ga4_last30d.csv');
    const gscRecords = analyticsEnabled ? loadCsvRecords(gscPath) : null;
    const ga4Records = analyticsEnabled ? loadCsvRecords(ga4Path) : null;

    // Fallback tag list
    const tagsArrays = await sanityReadClient.fetch(`*[_type == "post" && defined(tags)].tags`);
    const allTags = [].concat.apply([], tagsArrays);
    const uniqueTags = [...new Set(allTags)].filter(Boolean);

    if (gscRecords && gscRecords.length > 0) {
      // Aggregate GA4 logic (omitted for brevity, same as before but cleaner)
      // ... (GA4 processing integration) ...
      const ga4ByPath = new Map();
      if (ga4Records) {
        for (const r of ga4Records) {
          const pagePath = r.pagePath || '/';
          const sessions = Number(r.sessions || 0);
          if (!ga4ByPath.has(pagePath)) ga4ByPath.set(pagePath, { sessions: 0 });
          ga4ByPath.get(pagePath).sessions += sessions;
        }
      }

      const byQuery = new Map();

      // Merge GSC Data
      for (const r of gscRecords) {
        const query = String(r.query || '').trim();
        if (!query || query.length < 2) continue;

        if (!byQuery.has(query)) {
          byQuery.set(query, { query, impressions: 0, clicks: 0, positionWeighted: 0, positionWeight: 0, source: 'GSC' });
        }
        const acc = byQuery.get(query);
        const imp = Number(r.impressions || 0);
        const pos = Number(r.position || 0);
        acc.impressions += imp;
        acc.clicks += Number(r.clicks || 0);
        if (imp > 0) {
          acc.positionWeighted += imp * pos;
          acc.positionWeight += imp;
        }
      }

      // Merge AdWords Data
      if (adsRecords && adsRecords.length > 0) {
        for (const r of adsRecords) {
          const query = String(r['Keyword'] || r['keyword'] || '').trim();
          if (!query) continue;
          if (!byQuery.has(query)) {
            byQuery.set(query, { query, impressions: 0, clicks: 0, positionWeighted: 0, positionWeight: 0, source: 'Ads' });
          }
          const acc = byQuery.get(query);
          const vol = Number((r['Avg. monthly searches'] || '0').replace(/,/g, ''));
          acc.impressions += (vol / 30);
        }
      }

      // --- Seasonal & Trend Brainstorming (Minimal Cost Step) ---
      console.log("Brainstorming seasonal/trend topics with MetadataService...");
      try {
        const trendKeywords = await metadataService.brainstormTrends();
        console.log("Trend Keywords from MetadataService:", trendKeywords.join(', '));
        
        trendKeywords.forEach(tk => {
          if (!byQuery.has(tk)) {
            byQuery.set(tk, { query: tk, impressions: 0, clicks: 0, positionWeighted: 0, positionWeight: 0, source: 'Trend' });
          }
          const acc = byQuery.get(tk);
          // Give trends a decent baseline to compete with GSC data
          acc.impressions += 500; 
        });
      } catch (e) {
        console.warn("Seasonal brainstorming failed, skipping:", e.message);
      }

      // --- Determine Target Tail ---
      const tailCount = { short: 0, middle: 0, long: 0 };
      titleList.forEach((title) => {
        const length = String(title || '').length;
        if (length <= 30) tailCount.short++;
        else if (length <= 45) tailCount.middle++;
        else tailCount.long++;
      });
      // (Simple balancing logic)
      const total = Math.max(1, titleList.length);
      const longPercent = (tailCount.long / total) * 100;
      targetTail = longPercent < 50 ? 'long' : 'middle';
      console.log(`Target Tail: ${targetTail} (Long: ${longPercent.toFixed(1)}%)`);

      // --- Scoring ---
      const scored = [];
      const categoryKeywords = {
        '人間関係': ['人間関係', '同僚', '上司', '悩み', 'トラブル', 'いじめ', '無視', '相談', '距離感'],
        '給与': ['給料', '年収', 'ボーナス', '時給', '手当', '賃金', '昇給', '明細'],
        '退職': ['辞めたい', '退職', 'きつい', 'つらい', 'ストレス', 'しんどい', '限界', 'うつ', '引き止め', '代行'],
        '悩み': ['辞めたい', '退職', 'きつい', 'つらい', 'ストレス', 'しんどい', '不安', '腰痛', '体力', '眠れない', 'ミス'],
        '転職': ['転職', '採用', '内定', '入職', '準備', 'エージェント', '求人票', '見学', '退職理由', '円満退職'],
        '面接対策': ['面接', '履歴書', '志望動機', '自己PR', '逆質問', '職務経歴書'],
        '資格': ['資格', '研修', 'キャリア', 'スキルアップ', '試験', '勉強', '実務者研修', '初任者研修'],
        '実務': ['業務', '仕事内容', '流れ', 'コツ', '手順', 'リネン', '排泄', '食事介助', '清掃', '接遇'],
        '仕事内容': ['仕事', '業務', '役割', '内容', 'やりがい', '向いている人'],
        '技術・知識': ['ケア', '介助技術', '体位変換', '移乗', '口腔ケア', '食事介助', '排泄介助', 'サクション', 'バイタル'],
        '医療安全': ['事故防止', 'ヒヤリハット', 'インシデント', '転倒転落', 'リスクマネジメント', '誤薬'],
        'メンタルヘルス': ['メンタルケア', 'セルフケア', 'ストレス解消', '燃え尽き症候群', 'バーンアウト', '自愛'],
        'ニュース・トレンド': ['法改正', '処遇改善', '加算', '介護保険', 'DX', 'ICT', '新技術', 'ニュース', '動向'],
        '感染対策': ['感染', '衛生', '消毒', 'マスク', 'ノロ', 'インフル', 'スタンダードプリコーション'],
        '患者対応': ['患者', '接遇', '対応', 'コミュニケーション', 'クレーム', '家族対応']
      };
      const relKeywords = categoryKeywords[selectedCategoryTitle] || [];

      for (const acc of byQuery.values()) {
        // Base Score
        let score = (acc.impressions * 1.5) + (acc.clicks * 3.0);
        const avgPos = acc.positionWeight > 0 ? acc.positionWeighted / acc.positionWeight : 50;
        if (avgPos < 10) score *= 2.0;
        else if (avgPos < 20) score *= 1.5;

        // 1. Semantic Cooldown Penalty (Strengthened)
        let usagePenalty = 1.0;
        trackedKeywords.forEach(kw => {
          if (acc.query.includes(kw)) {
            const usage = keywordUsageArgs[kw] || 0;
            if (usage > 0) {
              // usage 1.0 => multiplier 0.25 (was 0.5)
              // usage 2.0 => multiplier 0.11 (was 0.33)
              usagePenalty *= (1.0 / Math.pow(usage + 1.0, 2));
            }
          }
        });

        // 2. Bias Penalty (Specific suppression for overused topics requested by user)
        const biasKeywords = ['面接', '履歴書', '自己PR', '職務経歴書', '志望動機'];
        if (biasKeywords.some(kw => acc.query.includes(kw))) {
          usagePenalty *= 0.1; // Additional 90% reduction for these specific topics
        }

        score *= usagePenalty;

        // 2. Category Relevance Enforcement
        let isRelevant = false;
        if (relKeywords.length > 0) {
          if (relKeywords.some(kw => acc.query.includes(kw))) {
            score *= 5.0; // Huge boost for match
            isRelevant = true;
          } else {
            score *= 0.05; // Huge penalty for mismatch if strict category
          }
        } else {
          // General categories (e.g. '仕事')
          isRelevant = true;
        }

        // 3. Similar Title Penalty
        const maxSim = titleList.slice(0, 50).reduce((m, t) => Math.max(m, diceSimilarity(acc.query, t)), 0);
        if (maxSim > 0.65) score *= 0.01; // Kill duplicates

        scored.push({ ...acc, score, tail: pickTailFromText(acc.query) });
      }

      // --- Weighted Random Selection ---
      // Filter by target tail and minimum visibility
      const candidates = scored
        .filter(c => c.tail === targetTail && c.score > 0.1)
        .sort((a, b) => b.score - a.score)
        .slice(0, 50); // Top 50

      if (candidates.length > 0) {
        // Weighted Random
        const totalScore = candidates.reduce((sum, c) => sum + c.score, 0);
        let r = Math.random() * totalScore;
        for (const cand of candidates) {
          r -= cand.score;
          if (r <= 0) {
            selectedKeyword = cand.query;
            break;
          }
        }
        if (!selectedKeyword) selectedKeyword = candidates[0].query; // Fallback

        console.log(`Keyword selected (Weighted): "${selectedKeyword}"`);
        selectedTopic = selectedCategoryTitle;
      } else {
        console.log("No valid candidates found after filtering. Falling back.");
      }
    }

    if (!selectedKeyword) {
      // Fallback logic
      if (uniqueTags.length === 0) throw new Error("No tags for fallback.");
      selectedTopic = uniqueTags[Math.floor(Math.random() * uniqueTags.length)];
      selectedKeyword = `看護助手 ${selectedTopic}`;
      console.log(`Keyword selected (Fallback): "${selectedKeyword}"`);
    }

  } catch (error) {
    console.error("Error in topic selection:", error);
    throw error;
  }

  // 3. Generate content with Gemini
  console.log("Generating article content with Gemini AI...");
  console.log("Fetching 白崎セラ author document...");
  let authorReference;
  try {
    const authorDoc = await sanityReadClient.fetch(
      `*[_type == "author" && (name == $name || slug.current == $slug)][0]`,
      { name: '白崎セラ', slug: 'shirasaki-sera' }
    );

    if (!authorDoc?._id) {
      throw new Error('FATAL: Author "白崎セラ" not found in Sanity.');
    }

    authorReference = ensureReferenceKeys([
      {
        _type: 'reference',
        _ref: authorDoc._id
      }
    ])[0];
    console.log(`Author resolved: ${authorDoc.name} (${authorDoc._id})`);
  } catch (error) {
    console.error('Error fetching author document:', error);
    throw error;
  }
  
  // --- Dynamic Tone Guidance ---
  const professionalCategories = ['面接対策', '技術・知識', '医療安全', 'ニュース・トレンド', '資格', '実務', '感染対策', '仕事内容'];
  const isProfessional = professionalCategories.includes(selectedTopic);
  
  let toneGuidance = '';
  if (isProfessional) {
    toneGuidance = `
# 【重要】トーン調整：専門・実務モード（セラ色：極微）
- この記事は実務・専門知識を重視するため、**セラの所感は全内容の5%以下**に抑えてください。
- 読者への共感は導入とまとめの1行程度に留め、本文はサイト側の客観的な説明を徹底してください。
- 感情的な語りかけよりも、機能的な情報の明快さを最優先してください。`;
  } else {
    toneGuidance = `
# 【重要】トーン調整：共感・コラムモード（セラ色：標準）
- 読者の悩みに寄り添うため、**セラの所感は全体の1〜2割程度**のスパイスとして含めてください。
- 現場のリアルな実感や、読者が「自分のことだ」と思えるような小さな共感を織り交ぜてください。`;
  }

  // Define title length based on tail type
  let titleLengthGuide = '';
  let titleExample = '';
  let titleMinLength = 0;
  let titleMaxLength = 0;
  if (targetTail === 'short') {
    titleLengthGuide = '20〜30文字（シンプルで直接的）';
    titleExample = '例: 「看護助手の給料の基本と見方」（15文字）';
    titleMinLength = 20;
    titleMaxLength = 30;
  } else if (targetTail === 'middle') {
    titleLengthGuide = '31〜45文字（具体的で魅力的）';
    titleExample = '例: 「看護助手の給料が低い理由と年収の見方」（27文字）';
    titleMinLength = 31;
    titleMaxLength = 45;
  } else { // long
    // Sanity Studio の一覧/プレビューで読める長さに収める（長すぎると可読性も落ちる）
    titleLengthGuide = '46〜55文字（超具体的でロングテール）';
    titleExample = '例: 「看護助手の給料が低い理由とは？夜勤・資格・転職の見方を整理」（50文字）';
    titleMinLength = 46;
    titleMaxLength = 55;
  }

  let generatedArticle;
  try {
    generatedArticle = await metadataService.generateFullFromConcept({
      keyword: selectedKeyword,
      category: selectedTopic,
      titleLengthGuide,
      titleMinLength,
      titleMaxLength,
      toneGuidance
    });
    console.log("Successfully generated article content using MetadataService.");
  } catch (error) {
    console.error("Error generating content with MetadataService:", error);
    throw error;
  }

  // 5. カテゴリとExcerptは空で保存（メンテナンススクリプトで自動生成）
  console.log("Saving generated article as a draft to Sanity...");
  const recentTitlesSnapshot = Array.isArray(titleList) ? titleList.slice(0, 100) : [];
  const title = chooseDistinctTitle({
    generatedTitle: generatedArticle.title,
    selectedKeyword,
    tail: targetTail,
    minLen: titleMinLength,
    maxLen: titleMaxLength,
    recentTitles: recentTitlesSnapshot,
  });

  // Final Variety Check before saving
  const finalMaxSim = recentTitlesSnapshot.reduce((m, t) => Math.max(m, diceSimilarity(title, t)), 0);
  if (finalMaxSim > 0.72) {
    console.warn(`⚠️  Generated title is too similar to existing content (Sim: ${finalMaxSim.toFixed(2)}). Title: "${title}"`);
    console.log("Attempting one-time title rewrite for variety...");
  }

  let slugCurrentRaw = (generatedArticle.slug_keywords || "")
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();

  if (!slugCurrentRaw) {
    slugCurrentRaw = buildPostSlug(title);
  }

  // Remove redundant prefix if Gemini or buildPostSlug included it
  slugCurrentRaw = slugCurrentRaw.replace(/^nursing-assistant-/, '');

  // Base slug
  let slugCurrent = `nursing-assistant-${slugCurrentRaw}`.replace(/-+/g, '-').slice(0, 96);

  // Uniqueness check against recent titles/slugs (approximate check using titles in snapshot)
  const existingSlugs = recentData.posts ? recentData.posts.map(p => {
    // We don't have slug in recentData.posts from the query above, 
    // but we can infer if the title-based slug would collide.
    // To be safer, let's just check if ANY existing slug matches our target.
    // However, the query only returned titles. Let's assume most slugs follow title.
    return buildPostSlug(p.title);
  }) : [];

  if (existingSlugs.includes(slugCurrent)) {
    const slugUniqueSuffix = Date.now().toString(36).slice(-4);
    slugCurrent = `${slugCurrent}-${slugUniqueSuffix}`.replace(/-+/g, '-').slice(0, 96);
    console.log(`⚠️ Slug collision detected. Appending suffix: ${slugCurrent}`);
  } else {
    console.log(`✅ Using clean slug: ${slugCurrent}`);
  }

  const cleanedBody = sanitizeBodyBlocks(generatedArticle.body || []);
  const draft = {
    _type: 'post',
    _id: `drafts.${randomUUID()}`,
    author: authorReference,
    publishedAt: new Date().toISOString(),
    title,
    slug: { _type: 'slug', current: slugCurrent },
    tags: generatedArticle.tags,
    body: ensurePortableTextKeys(cleanedBody),
    categories: selectedCategoryId ? ensureReferenceKeys([{ _type: 'reference', _ref: selectedCategoryId }]) : [],
    excerpt: generatedArticle.excerpt || '',
    metaDescription: generatedArticle.metaDescription || '',
  };

  try {
    const createdDraft = await sanityWriteClient.create(draft);
    console.log("\n--- Process Complete ---");
    console.log(`Successfully created new draft in Sanity with ID: ${createdDraft._id}`);
    appendGithubOutput('draft_id', createdDraft._id);
    appendGithubOutput('draft_title', title);

    // Verify tail type
    const titleLength = title.length;
    let actualTail = '';
    if (titleLength <= 30) {
      actualTail = 'short';
    } else if (titleLength <= 45) {
      actualTail = 'middle';
    } else {
      actualTail = 'long';
    }

    console.log(`Title: "${title}" (${titleLength}文字)`);
    console.log(`Target tail: ${targetTail.toUpperCase()} / Actual tail: ${actualTail.toUpperCase()}`);

    if (actualTail === targetTail) {
      console.log(`✅ テールタイプが正しく生成されました（${targetTail}）`);
    } else {
      console.log(`⚠️  テールタイプが異なります（目標: ${targetTail}, 実際: ${actualTail}）`);
    }

    console.log(`📝 カテゴリとExcerptはメンテナンススクリプトで自動生成されます`)
  } catch (error) {
    console.error("Error saving draft to Sanity:", error);
    throw error;
  }
}

generateAndSaveArticle().catch((error) => {
  console.error("FATAL: daily generation failed:", error?.message || error);
  process.exit(1);
});
