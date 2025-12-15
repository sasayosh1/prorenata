#!/usr/bin/env node

/**
 * Sera Tone Rewrite (Gemini)
 *
 * - Reads `.analytics/sera-tone-report.json`
 * - Targets posts with score < threshold
 * - Rewrites only plain paragraph blocks between hidden markers:
 *   <!-- sera-tone:start --> and <!-- sera-tone:end -->
 * - Preserves structure/links/CTA/code blocks by skipping risky blocks
 * - Uses budget-guard before Gemini calls (hard gate)
 *
 * Usage:
 *   node scripts/sera-tone-rewrite.cjs --threshold 55 --limit 10 --apply
 *   node scripts/sera-tone-rewrite.cjs --threshold 55 --limit 10          # dry-run
 *
 * Env:
 *   SANITY_WRITE_TOKEN=... (or SANITY_API_TOKEN)
 *   GEMINI_API_KEY=...
 *   GEMINI_MODEL=gemini-2.5-flash-lite
 *   SERA_TONE_REWRITE_MAX_BLOCKS_PER_ARTICLE=6
 *   SERA_TONE_REWRITE_ESTIMATED_JPY_PER_BLOCK=0.03
 *   GEMINI_BUDGET_JPY=100
 */

const { createClient } = require('@sanity/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env.private' });
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const SANITY_PROJECT_ID = '72m8vhy2';
const SANITY_DATASET = 'production';
const SANITY_API_VERSION = '2024-01-01';

const MARKER_START = '<!-- sera-tone:start -->';
const MARKER_END = '<!-- sera-tone:end -->';

const PROTECTED_REVENUE_SLUGS = new Set([
  'nursing-assistant-compare-services-perspective',
  'comparison-of-three-resignation-agencies',
]);

function parseArgs(argv) {
  const args = {
    report: '.analytics/sera-tone-report.json',
    threshold: 55,
    limit: 10,
    apply: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const value = argv[i];
    if (value === '--report') {
      args.report = argv[i + 1] || args.report;
      i++;
      continue;
    }
    if (value === '--threshold') {
      args.threshold = Number(argv[i + 1]);
      i++;
      continue;
    }
    if (value === '--limit') {
      args.limit = Number(argv[i + 1]);
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

  if (!Number.isFinite(args.threshold)) args.threshold = 55;
  if (!Number.isFinite(args.limit) || args.limit <= 0) args.limit = 10;
  return args;
}

function clamp(min, value, max) {
  return Math.max(min, Math.min(max, value));
}

function randomKey() {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
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

function findMarkerIndex(blocks, marker) {
  return blocks.findIndex(
    (b) => b?._type === 'affiliateEmbed' && typeof b.html === 'string' && b.html.includes(marker)
  );
}

function createMarkerBlock(marker) {
  return {
    _type: 'affiliateEmbed',
    _key: `sera-tone-marker-${randomKey()}`,
    provider: 'sera-tone',
    label: 'sera-tone-marker',
    html: marker,
  };
}

function ensureMarkerRange(body) {
  const blocks = Array.isArray(body) ? body : [];
  const startIdx = findMarkerIndex(blocks, MARKER_START);
  const endIdx = findMarkerIndex(blocks, MARKER_END);

  if (startIdx !== -1 && endIdx !== -1 && startIdx < endIdx) {
    return { body: blocks, startIdx, endIdx, changed: false };
  }

  // Remove broken/duplicates defensively (keep first)
  const filtered = [];
  let hasStart = false;
  let hasEnd = false;
  for (const b of blocks) {
    if (b?._type === 'affiliateEmbed' && typeof b.html === 'string') {
      if (b.html.includes(MARKER_START)) {
        if (hasStart) continue;
        hasStart = true;
      }
      if (b.html.includes(MARKER_END)) {
        if (hasEnd) continue;
        hasEnd = true;
      }
    }
    filtered.push(b);
  }

  let next = filtered.slice();

  // Place start after first normal paragraph
  let insertStartAt = 0;
  for (let i = 0; i < next.length; i++) {
    const b = next[i];
    if (b?._type === 'block' && (b.style === 'normal' || !b.style)) {
      insertStartAt = i + 1;
      break;
    }
  }

  if (!hasStart) {
    next.splice(insertStartAt, 0, createMarkerBlock(MARKER_START));
  }

  // Place end before disclaimer if exists, else at end
  const disclaimerIndex = next.findIndex((b) => isDisclaimerBlock(b));
  const insertEndAt = disclaimerIndex !== -1 ? disclaimerIndex : next.length;
  if (!hasEnd) {
    next.splice(insertEndAt, 0, createMarkerBlock(MARKER_END));
  }

  const newStartIdx = findMarkerIndex(next, MARKER_START);
  const newEndIdx = findMarkerIndex(next, MARKER_END);
  return { body: next, startIdx: newStartIdx, endIdx: newEndIdx, changed: true };
}

function isPlainParagraphBlock(block) {
  if (!block || block._type !== 'block') return false;
  if (block.style && block.style !== 'normal') return false;
  if (block.markDefs && Array.isArray(block.markDefs) && block.markDefs.length > 0) return false;
  const children = Array.isArray(block.children) ? block.children : [];
  if (children.length === 0) return false;
  for (const c of children) {
    if (c?._type && c._type !== 'span') return false;
    if (c?._type === 'span') {
      if (Array.isArray(c.marks) && c.marks.length > 0) return false;
    }
  }
  return true;
}

function looksRiskyText(text) {
  if (!text) return true;
  if (text.includes('http://') || text.includes('https://') || text.includes('www.')) return true;
  if (text.includes('```')) return true;
  if (text.includes('<!--')) return true;
  if (text.includes('【') && text.includes('】') && text.length < 40) return true;
  return false;
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
  return text
    .split(/(?<=[。！？!?\n])/u)
    .map((s) => s.replace(/\s+/gu, ' ').trim())
    .filter(Boolean);
}

function blockTonePenalty(text) {
  const commandHits =
    countOccurrences(text, '必ず') +
    countOccurrences(text, '絶対') +
    countOccurrences(text, 'すべき') +
    countOccurrences(text, 'してください') +
    countOccurrences(text, 'しなければ');
  const redundantHits =
    countOccurrences(text, 'という') +
    countOccurrences(text, 'することができる') +
    countOccurrences(text, 'することができます') +
    countOccurrences(text, 'となります');
  const sentences = splitSentences(text);
  const longRatio = sentences.length ? sentences.filter((s) => s.length >= 60).length / sentences.length : 0;
  const penalty = commandHits * 3 + redundantHits * 1 + Math.round(longRatio * 10);
  return penalty;
}

async function githubRequest(method, url, body) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN is required');

  const response = await fetch(url, {
    method,
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${token}`,
      'x-github-api-version': '2022-11-28',
      'content-type': 'application/json',
      'user-agent': 'prorenata-sera-tone-rewrite',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  const json = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = json?.message || text || `HTTP ${response.status}`;
    throw new Error(`GitHub API error: ${message}`);
  }
  return json;
}

async function ensureIssue({ title, body, labels }) {
  const repo = process.env.GITHUB_REPOSITORY;
  if (!repo) throw new Error('GITHUB_REPOSITORY is required');
  const [owner, name] = repo.split('/');
  if (!owner || !name) throw new Error(`Invalid GITHUB_REPOSITORY: ${repo}`);

  const listUrl = `https://api.github.com/repos/${owner}/${name}/issues?state=open&per_page=100`;
  const issues = await githubRequest('GET', listUrl);
  if (issues.some((issue) => issue?.title === title)) return;

  const createUrl = `https://api.github.com/repos/${owner}/${name}/issues`;
  await githubRequest('POST', createUrl, { title, body, labels });
}

function runBudgetGuard(reserveJpy) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sera-budget-'));
  const outputPath = path.join(tmp, 'out.txt');
  fs.writeFileSync(outputPath, '', 'utf8');

  const result = spawnSync(process.execPath, ['scripts/budget-guard.cjs', '--reserve-jpy', String(reserveJpy)], {
    env: { ...process.env, GITHUB_OUTPUT: outputPath },
    encoding: 'utf8',
  });

  const out = fs.readFileSync(outputPath, 'utf8');
  const allowedMatch = out.match(/^allowed=(true|false)$/m);
  const allowed = allowedMatch ? allowedMatch[1] === 'true' : true;

  return { allowed, raw: { status: result.status, stdout: result.stdout, stderr: result.stderr }, output: out };
}

async function rewriteParagraph(model, paragraph) {
  const prompt = [
    'あなたは「白崎セラ」です。以下の日本語の段落だけを、口調だけ整えて書き換えてください。',
    '',
    '制約:',
    '- 事実・意味は変えない（言い切りを避け、断定しない）',
    '- 命令/強い誘導を避ける（急かさない）',
    '- 共感 → 選択肢提示 → 安心 の順で、自然な文に整える',
    '- 短文で「です。」「ます。」が続いて幼くならないよう、文を自然につなげたり語尾をやわらかく変化させる（丁寧さは維持）',
    '- リンク/URL/固有名詞/数字/コードは追加・削除・変更しない（段落内にある場合はそのまま）',
    '- 句読点や言い回しだけを整えるイメージ',
    '- 出力は書き換え後の段落本文のみ（前置き不要）',
    '',
    '入力段落:',
    paragraph,
  ].join('\n');

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text().trim();
  return text.replace(/\s+$/u, '');
}

async function main() {
  const args = parseArgs(process.argv);

  const reportPath = path.resolve(process.cwd(), args.report);
  if (!fs.existsSync(reportPath)) {
    console.error('❌ Report not found:', args.report);
    process.exit(0);
  }

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  const items = Array.isArray(report.items) ? report.items : [];

  const candidates = items
    .filter((i) => typeof i?.score === 'number' && i.score < args.threshold)
    .filter((i) => !i.internalOnly)
    .filter((i) => !PROTECTED_REVENUE_SLUGS.has(i.slug))
    .sort((a, b) => a.score - b.score)
    .slice(0, args.limit);

  const maxBlocksPerArticle = Math.max(
    1,
    Math.floor(Number(process.env.SERA_TONE_REWRITE_MAX_BLOCKS_PER_ARTICLE || '6'))
  );
  const estimatedJpyPerBlock = clamp(
    0.001,
    Number(process.env.SERA_TONE_REWRITE_ESTIMATED_JPY_PER_BLOCK || '0.03'),
    10
  );

  console.log('🧠 Sera tone rewrite');
  console.log(`- Threshold: <${args.threshold}`);
  console.log(`- Limit: ${args.limit}`);
  console.log(`- Apply: ${args.apply}`);
  console.log(`- Candidates: ${candidates.length}`);

  if (candidates.length === 0) {
    return;
  }

  // Budget guard (hard gate)
  const estimatedBlocks = candidates.length * maxBlocksPerArticle;
  const reserveJpy = Math.round(estimatedBlocks * estimatedJpyPerBlock * 100) / 100;
  const budget = runBudgetGuard(reserveJpy);
  if (!budget.allowed) {
    const title = '💸 Sera tone rewrite skipped (budget exceeded)';
    const body = [
      '## Sera Tone Rewrite',
      '',
      'Gemini 口調補正は予算上限のためスキップしました。',
      '',
      `- Threshold: <${args.threshold}`,
      `- Candidates: ${candidates.length}`,
      `- Estimated blocks: ${estimatedBlocks}`,
      `- Reserve (JPY): ${reserveJpy}`,
      '',
      '### Target (up to limit)',
      ...candidates.map((c) => `- ${c.slug} (${c.score})`),
      '',
      '### Budget guard output',
      '```',
      budget.output.trim(),
      '```',
    ].join('\n');

    try {
      await ensureIssue({ title, body, labels: ['automated', 'sera-tone', 'budget'] });
    } catch (e) {
      console.warn('⚠️ Failed to create issue:', e?.message || e);
    }
    return;
  }

  if (args.apply) {
    const sanityToken = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!sanityToken) {
      const title = '⚠️ Sera tone rewrite skipped (missing SANITY_WRITE_TOKEN)';
      const body = [
        '## Sera Tone Rewrite',
        '',
        'SANITY_WRITE_TOKEN がないため、口調補正をスキップしました。',
        '',
        ...candidates.map((c) => `- ${c.slug} (${c.score})`),
      ].join('\n');
      try {
        await ensureIssue({ title, body, labels: ['automated', 'sera-tone'] });
      } catch {}
      return;
    }

    if (!geminiKey) {
      const title = '⚠️ Sera tone rewrite skipped (missing GEMINI_API_KEY)';
      const body = [
        '## Sera Tone Rewrite',
        '',
        'GEMINI_API_KEY がないため、口調補正をスキップしました。',
        '',
        ...candidates.map((c) => `- ${c.slug} (${c.score})`),
      ].join('\n');
      try {
        await ensureIssue({ title, body, labels: ['automated', 'sera-tone'] });
      } catch {}
      return;
    }
  }

  const sanityToken = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN;
  const client = createClient({
    projectId: SANITY_PROJECT_ID,
    dataset: SANITY_DATASET,
    apiVersion: SANITY_API_VERSION,
    useCdn: false,
    token: sanityToken || undefined,
  });

  const geminiModelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
  const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
  const model = genAI ? genAI.getGenerativeModel({ model: geminiModelName }) : null;

  const results = [];
  const errors = [];

  for (const candidate of candidates) {
    const slug = candidate.slug;
    try {
      const doc = await client.fetch(
        `*[_type == "post" && slug.current == $slug][0]{ _id, title, maintenanceLocked, internalOnly, body }`,
        { slug }
      );

      if (!doc?._id || !Array.isArray(doc.body)) {
        results.push({ slug, status: 'skip_not_found' });
        continue;
      }
      if (doc.internalOnly) {
        results.push({ slug, status: 'skip_internal' });
        continue;
      }
      if (doc.maintenanceLocked) {
        results.push({ slug, status: 'skip_locked' });
        continue;
      }

      const markerEnsured = ensureMarkerRange(doc.body);
      let body = markerEnsured.body;
      const startIdx = markerEnsured.startIdx;
      const endIdx = markerEnsured.endIdx;

      if (startIdx === -1 || endIdx === -1 || startIdx >= endIdx) {
        results.push({ slug, status: 'skip_marker_invalid' });
        continue;
      }

      const rangeStart = startIdx + 1;
      const rangeEnd = endIdx;

      const candidatesInArticle = [];
      for (let i = rangeStart; i < rangeEnd; i++) {
        const b = body[i];
        if (!isPlainParagraphBlock(b)) continue;
        const text = extractBlockText(b).trim();
        if (text.length < 25) continue;
        if (looksRiskyText(text)) continue;
        const penalty = blockTonePenalty(text);
        if (penalty < 4) continue;
        candidatesInArticle.push({ index: i, text, penalty });
      }

      candidatesInArticle.sort((a, b) => b.penalty - a.penalty);
      const selectedBlocks = candidatesInArticle.slice(0, maxBlocksPerArticle);

      if (selectedBlocks.length === 0) {
        // still add markers if missing (safe and invisible), but avoid unnecessary commits
        if (markerEnsured.changed && args.apply) {
          await client.patch(doc._id).set({ body }).commit({ autoGenerateArrayKeys: false });
          results.push({ slug, status: 'markers_added' });
        } else {
          results.push({ slug, status: 'skip_no_blocks' });
        }
        continue;
      }

      if (!args.apply) {
        results.push({
          slug,
          status: 'dry_run',
          markersAdded: markerEnsured.changed,
          blocksPlanned: selectedBlocks.map((b) => ({ index: b.index, penalty: b.penalty })),
        });
        continue;
      }

      if (!model) {
        results.push({ slug, status: 'skip_no_gemini' });
        continue;
      }

      const updatedIndexes = [];
      for (const b of selectedBlocks) {
        const rewritten = await rewriteParagraph(model, b.text);
        const nextText = rewritten.trim();
        if (!nextText) continue;

        // keep similar length; if huge divergence, skip
        const ratio = nextText.length / Math.max(1, b.text.length);
        if (ratio < 0.7 || ratio > 1.3) continue;

        // apply: keep child structure, replace text only
        const original = body[b.index];
        const children = Array.isArray(original.children) ? original.children : [];
        if (children.length !== 1 || children[0]._type !== 'span') continue;
        body[b.index] = {
          ...original,
          children: [{ ...children[0], text: nextText }],
        };
        updatedIndexes.push(b.index);
      }

      if (markerEnsured.changed || updatedIndexes.length > 0) {
        await client
          .patch(doc._id)
          .set({ body, seraToneRewrittenAt: new Date().toISOString() })
          .commit({ autoGenerateArrayKeys: false });
        results.push({
          slug,
          status: 'updated',
          markersAdded: markerEnsured.changed,
          updatedBlocks: updatedIndexes,
        });
      } else {
        results.push({ slug, status: 'skip_no_effect' });
      }
    } catch (e) {
      errors.push({ slug, error: String(e?.message || e) });
      results.push({ slug, status: 'error' });
    }
  }

  const progressPath = path.join(process.cwd(), '.analytics', 'sera-tone-rewrite-last-run.json');
  fs.mkdirSync(path.dirname(progressPath), { recursive: true });
  fs.writeFileSync(
    progressPath,
    JSON.stringify(
      {
        ranAt: new Date().toISOString(),
        apply: args.apply,
        threshold: args.threshold,
        limit: args.limit,
        maxBlocksPerArticle,
        reserveJpy,
        candidates: candidates.map((c) => ({ slug: c.slug, score: c.score, reasons: c.reasons })),
        results,
        errors,
      },
      null,
      2
    ) + '\n',
    'utf8'
  );

  console.log('📄 Wrote .analytics/sera-tone-rewrite-last-run.json');

  if (errors.length > 0) {
    const title = '⚠️ Sera tone rewrite completed with errors';
    const body = [
      '## Sera Tone Rewrite',
      '',
      `Errors: ${errors.length}`,
      '',
      ...errors.map((x) => `- ${x.slug}: ${x.error}`),
    ].join('\n');
    try {
      await ensureIssue({ title, body, labels: ['automated', 'sera-tone'] });
    } catch (e) {
      console.warn('⚠️ Failed to create issue:', e?.message || e);
    }
  }
}

main().catch(async (error) => {
  console.error('❌ sera-tone-rewrite failed:', error?.message || error);
  try {
    const title = '⚠️ Sera tone rewrite failed (script error)';
    const body = [
      '## Sera Tone Rewrite',
      '',
      'Script failed before completing.',
      '',
      '```',
      String(error?.message || error),
      '```',
    ].join('\n');
    await ensureIssue({ title, body, labels: ['automated', 'sera-tone'] });
  } catch {}
  process.exit(0);
});
