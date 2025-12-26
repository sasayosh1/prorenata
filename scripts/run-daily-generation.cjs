const { createClient } = require('@sanity/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { randomUUID } = require('crypto');
const fs = require('fs');
const path = require('path');
const { SERA_FULL_PERSONA } = require('./utils/seraPersona');
const {
  ensurePortableTextKeys,
  ensureReferenceKeys
} = require('./utils/keyHelpers');
require('dotenv').config({ path: '../.env.local' }); // For local testing

function appendGithubOutput(key, value) {
  const outputPath = process.env.GITHUB_OUTPUT;
  if (!outputPath) return;
  const safe = String(value ?? '').replace(/\r?\n/g, ' ').trim();
  fs.appendFileSync(outputPath, `${key}=${safe}\n`, 'utf8');
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
const SANITY_CONFIG = {
  projectId: '72m8vhy2',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN 
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
  if (!SANITY_CONFIG.token || !GEMINI_API_KEY) {
    console.error("FATAL: SANITY_WRITE_TOKEN or GEMINI_API_KEY environment variables are not set.");
    process.exit(1);
  }
  const sanityClient = createClient(SANITY_CONFIG);
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite-001" }); // バージョン固定、Proフォールバック防止、Vertex AI禁止

  // 2. Select a topic/keyword
  console.log("Selecting a topic/keyword...");
  let selectedTopic;
  let selectedKeyword = null;
  let targetTail = 'long'; // Default to long tail
  try {
    const analyticsModeRaw = String(process.env.ANALYTICS_MODE || 'enabled').trim().toLowerCase();
    const analyticsEnabled = !['disabled', 'off', 'false', '0', 'no'].includes(analyticsModeRaw);
    if (!analyticsEnabled) {
      console.log('ANALYTICS_MODE=disabled: skip GA4/GSC keyword selection and use fallback topic.');
    }

    // Prefer data-driven keywords from GSC/GA4 exports (committed by daily analytics workflow).
    const gscPath = path.join(process.cwd(), 'data', 'gsc_last30d.csv');
    const ga4Path = path.join(process.cwd(), 'data', 'ga4_last30d.csv');
    const gscRecords = analyticsEnabled ? loadCsvRecords(gscPath) : null;
    const ga4Records = analyticsEnabled ? loadCsvRecords(ga4Path) : null;

    // Fallback tag list (used when analytics files are missing).
    const tagsArrays = await sanityClient.fetch(`*[_type == "post" && defined(tags)].tags`);
    const allTags = [].concat.apply([], tagsArrays);
    const uniqueTags = [...new Set(allTags)].filter(Boolean);

    if (gscRecords && gscRecords.length > 0 && ga4Records && ga4Records.length > 0) {
      // Aggregate GA4 by pagePath
      const ga4ByPath = new Map();
      for (const r of ga4Records) {
        const pagePath = r.pagePath || '/';
        const sessions = Number(r.sessions || 0);
        const avgDur = Number(r.averageSessionDuration || 0);
        const engagement = Number(r.engagementRate || 0);
        if (!ga4ByPath.has(pagePath)) {
          ga4ByPath.set(pagePath, { sessions: 0, durationWeighted: 0, engagementWeighted: 0 });
        }
        const acc = ga4ByPath.get(pagePath);
        acc.sessions += Number.isFinite(sessions) ? sessions : 0;
        acc.durationWeighted += (Number.isFinite(sessions) ? sessions : 0) * (Number.isFinite(avgDur) ? avgDur : 0);
        acc.engagementWeighted += (Number.isFinite(sessions) ? sessions : 0) * (Number.isFinite(engagement) ? engagement : 0);
      }
      for (const [p, acc] of ga4ByPath.entries()) {
        const s = acc.sessions || 0;
        ga4ByPath.set(p, {
          sessions: s,
          avgDuration: s > 0 ? acc.durationWeighted / s : 0,
          engagementRate: s > 0 ? acc.engagementWeighted / s : 0,
        });
      }

      // Aggregate GSC by query
      const byQuery = new Map();
      for (const r of gscRecords) {
        const query = String(r.query || '').trim();
        if (!query) continue;
        if (/^https?:\/\//i.test(query)) continue;
        if (query.length < 2) continue;

        const impressions = Number(r.impressions || 0);
        const clicks = Number(r.clicks || 0);
        const position = Number(r.position || 0);

        const pagePath = toPathFromUrl(r.page);
        const ga = pagePath ? ga4ByPath.get(pagePath) : null;

        if (!byQuery.has(query)) {
          byQuery.set(query, {
            query,
            impressions: 0,
            clicks: 0,
            positionWeighted: 0,
            positionWeight: 0,
            ga4Sessions: 0,
            ga4AvgDuration: null,
            ga4EngagementRate: null,
          });
        }
        const acc = byQuery.get(query);
        acc.impressions += Number.isFinite(impressions) ? impressions : 0;
        acc.clicks += Number.isFinite(clicks) ? clicks : 0;

        if (Number.isFinite(impressions) && impressions > 0 && Number.isFinite(position) && position > 0) {
          acc.positionWeighted += impressions * position;
          acc.positionWeight += impressions;
        }

        if (ga && Number.isFinite(ga.sessions)) {
          acc.ga4Sessions = Math.max(acc.ga4Sessions, ga.sessions);
          acc.ga4AvgDuration = acc.ga4AvgDuration == null ? ga.avgDuration : Math.min(acc.ga4AvgDuration, ga.avgDuration);
          acc.ga4EngagementRate =
            acc.ga4EngagementRate == null ? ga.engagementRate : Math.min(acc.ga4EngagementRate, ga.engagementRate);
        }
      }

      const existingTitles = await sanityClient.fetch(`*[_type == "post" && defined(title)].title`);
      const titleList = Array.isArray(existingTitles) ? existingTitles : [];
      const existingTitleSet = new Set(titleList.map((t) => normalizeQueryForCompare(t)));

      // Determine keyword tail type (Short/Middle/Long) based on existing title distribution.
      const tailCount = { short: 0, middle: 0, long: 0 };
      titleList.forEach((title) => {
        const length = String(title || '').length;
        if (length <= 30) tailCount.short++;
        else if (length <= 45) tailCount.middle++;
        else tailCount.long++;
      });

      const total = Math.max(1, titleList.length);
      const shortPercent = (tailCount.short / total) * 100;
      const middlePercent = (tailCount.middle / total) * 100;
      const longPercent = (tailCount.long / total) * 100;

      // Target ratios from CLAUDE.md (Short 1 : Middle 3 : Long 5)
      const targetShort = 12.5; // 10-15%
      const targetMiddle = 37.5; // 35-40%
      const targetLong = 50; // 45-55%

      const shortDiff = targetShort - shortPercent;
      const middleDiff = targetMiddle - middlePercent;
      const longDiff = targetLong - longPercent;

      console.log(
        `現在のテール分布: ショート${shortPercent.toFixed(1)}%, ミドル${middlePercent.toFixed(1)}%, ロング${longPercent.toFixed(1)}%`
      );
      console.log(`目標比率: ショート${targetShort}%, ミドル${targetMiddle}%, ロング${targetLong}%`);

      if (longDiff > 0 && longDiff >= middleDiff && longDiff >= shortDiff) {
        targetTail = 'long';
        console.log(`テールバランス調整: ロングテール優先（${longDiff.toFixed(1)}%不足）`);
      } else if (middleDiff > 0 && middleDiff >= shortDiff) {
        targetTail = 'middle';
        console.log(`テールバランス調整: ミドルテール優先（${middleDiff.toFixed(1)}%不足）`);
      } else if (shortDiff > 0) {
        targetTail = 'short';
        console.log(`テールバランス調整: ショートテール優先（${shortDiff.toFixed(1)}%不足）`);
      } else {
        targetTail = 'long';
        console.log(`テールバランス調整: すべて適正範囲、ロングテール生成（SEO最優先）`);
      }

      const scored = [];
      for (const acc of byQuery.values()) {
        const ctr = acc.impressions > 0 ? acc.clicks / acc.impressions : 0;
        const position = acc.positionWeight > 0 ? acc.positionWeighted / acc.positionWeight : 999;
        const score = computeQueryScore({
          impressions: acc.impressions,
          ctr,
          position,
          ga4Sessions: acc.ga4Sessions,
          ga4AvgDuration: acc.ga4AvgDuration ?? 0,
          ga4EngagementRate: acc.ga4EngagementRate ?? 0,
        });

        scored.push({ ...acc, ctr, position, score, tail: pickTailFromText(acc.query) });
      }
      scored.sort((a, b) => b.score - a.score);

      // Try to pick a keyword that hasn't been used in a title yet.
      const pickNew = (candidates) =>
        candidates.find((c) => !existingTitleSet.has(normalizeQueryForCompare(c.query))) || candidates[0] || null;
      const topCandidates = scored.filter((c) => c.tail === targetTail).slice(0, 50);
      const picked = pickNew(topCandidates);
      selectedKeyword = picked ? picked.query : (scored[0]?.query || null);

      // Optional: expand via suggest, then re-pick by tail match later.
      const suggestions = await fetchSuggestQueries(selectedKeyword);
      if (suggestions.length > 0) {
        const suggestCandidates = suggestions
          .map((s) => ({ query: s, tail: pickTailFromText(s) }))
          .filter((s) => s.tail === targetTail)
          .filter((s) => !existingTitleSet.has(normalizeQueryForCompare(s.query)));

        // Prefer suggestions that include "看護助手" or are clearly nursing related if possible.
        const nursingFirst =
          suggestCandidates.find((s) => /看護助手|看護|患者|病棟|介護|医療|病院/.test(s.query)) || suggestCandidates[0];
        if (nursingFirst?.query) selectedKeyword = nursingFirst.query;
      }

      // Keep topic tags simple and stable: pick from existing tags if possible.
      if (uniqueTags.length > 0) {
        selectedTopic = uniqueTags[Math.floor(Math.random() * uniqueTags.length)];
      } else {
        selectedTopic = '仕事';
      }
      console.log(`Keyword selected (GSC/GA4): "${selectedKeyword}"`);
      console.log(`Topic tag selected: "${selectedTopic}"`);
    } else {
      if (uniqueTags.length === 0) {
        throw new Error("No tags found to select a topic from.");
      }
      const randomIndex = Math.floor(Math.random() * uniqueTags.length);
      selectedTopic = uniqueTags[randomIndex];
      selectedKeyword = `看護助手 ${selectedTopic}`;
      console.log(`Topic selected (fallback): "${selectedTopic}"`);
      console.log(`Keyword selected (fallback): "${selectedKeyword}"`);
    }
  } catch (error) {
    console.error("Error selecting topic from Sanity:", error);
    throw error;
  }

  // 3. Generate content with Gemini
  console.log("Generating article content with Gemini AI...");
  console.log("Fetching 白崎セラ author document...");
  let authorReference;
  try {
    const authorDoc = await sanityClient.fetch(
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

  // Define title length based on tail type
  let titleLengthGuide = '';
  let titleExample = '';
  let titleMinLength = 0;
  let titleMaxLength = 0;
  if (targetTail === 'short') {
    titleLengthGuide = '20〜30文字（シンプルで直接的）';
    titleExample = '例: 「看護助手の給料を徹底解説」（15文字）';
    titleMinLength = 20;
    titleMaxLength = 30;
  } else if (targetTail === 'middle') {
    titleLengthGuide = '31〜45文字（具体的で魅力的）';
    titleExample = '例: 「看護助手の給料が低い理由と年収アップの3つの方法」（27文字）';
    titleMinLength = 31;
    titleMaxLength = 45;
  } else { // long
    titleLengthGuide = '46〜65文字（超具体的でロングテール）';
    titleExample = '例: 「【2025年最新】看護助手の給料が低い理由とは？夜勤・資格・転職で年収アップする完全ガイド」（50文字）';
    titleMinLength = 46;
    titleMaxLength = 65;
  }

  const prompt = `
${SERA_FULL_PERSONA}

# 記事要件
- テーマ: 「${selectedKeyword}」（看護助手向け）
- 文字数: 制限なし（読みやすさ最優先。冗長に伸ばさず、必要な情報を優先）
- 構成: 導入 → H2見出し3〜4個 → まとめ
- **重要**: まとめでは「次回〜」「お楽しみに」など次回への言及は不要
- 実務的なアドバイス、断定回避（「〜とされています」等）。曖昧な情報は「わからない」と明記。
- 挨拶や自己紹介（「白崎セラです」等）は入れず、本題から開始する。
- タイトル/本文で「看護助手の私が教える、」のような肩書き主張は入れない。
- 文章内で自分の名前を出さない（例: 「セラが」「セラの」などは禁止）。必要なら「わたし」で表現する。
- **タイトル文字数（SEO戦略・絶対厳守）**:
  **${titleLengthGuide}**
  **最低${titleMinLength}文字、最大${titleMaxLength}文字**
  ${titleExample}

# 出力形式（JSON、コードブロックなし）
{
  "title": "（${titleLengthGuide}で読者メリットが伝わるタイトル）",
  "tags": ["${selectedTopic}", "看護助手"],
  "body": [
    {"_type": "block", "style": "normal", "children": [{"_type": "span", "text": "(導入文)"}]},
    {"_type": "block", "style": "h2", "children": [{"_type": "span", "text": "(H2見出し1)"}]},
    {"_type": "block", "style": "normal", "children": [{"_type": "span", "text": "(本文)"}]},
    {"_type": "block", "style": "h2", "children": [{"_type": "span", "text": "まとめ"}]},
    {"_type": "block", "style": "normal", "children": [{"_type": "span", "text": "(まとめ本文。挨拶不要。励ましと現実的アドバイスを両立)"}]}
  ]
}
  `;

  let generatedArticle;
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Extract JSON part using regex
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch && jsonMatch[1]) {
      text = jsonMatch[1];
    } else {
      // Fallback if not wrapped in ```json
      const genericJsonMatch = text.match(/```\n([\s\S]*?)\n```/);
      if (genericJsonMatch && genericJsonMatch[1]) {
        text = genericJsonMatch[1];
      }
    }

    generatedArticle = JSON.parse(text);
    console.log("Successfully generated article content.");
  } catch (error) {
    console.error("Error generating content with Gemini AI:", error);
    throw error;
  }

  // 5. カテゴリとExcerptは空で保存（メンテナンススクリプトで自動生成）
  console.log("Saving generated article as a draft to Sanity...");
  const title = generatedArticle.title;
  const slugCurrent = buildPostSlug(title);
  const draft = {
    _type: 'post',
    _id: `drafts.${randomUUID()}`,
    author: authorReference,
    publishedAt: new Date().toISOString(),
    title,
    slug: { _type: 'slug', current: slugCurrent },
    tags: generatedArticle.tags,
    body: ensurePortableTextKeys(generatedArticle.body || []),
    categories: [], // メンテナンスで自動選択
    excerpt: '',    // メンテナンスで自動生成
  };

  try {
    const createdDraft = await sanityClient.create(draft);
    console.log("\n--- Process Complete ---");
    console.log(`Successfully created new draft in Sanity with ID: ${createdDraft._id}`);
    appendGithubOutput('draft_id', createdDraft._id);
    appendGithubOutput('draft_title', generatedArticle.title);

    // Verify tail type
    const titleLength = generatedArticle.title.length;
    let actualTail = '';
    if (titleLength <= 30) {
      actualTail = 'short';
    } else if (titleLength <= 45) {
      actualTail = 'middle';
    } else {
      actualTail = 'long';
    }

    console.log(`Title: "${generatedArticle.title}" (${titleLength}文字)`);
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
