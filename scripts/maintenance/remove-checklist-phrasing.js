#!/usr/bin/env node
/**
 * Detect and optionally remove checklist phrasing from existing posts.
 *
 * Usage:
 *   node scripts/maintenance/remove-checklist-phrasing.js --dry-run --limit 20
 *   SANITY_API_TOKEN=... node scripts/maintenance/remove-checklist-phrasing.js --apply --limit 20
 */

const path = require('node:path');
const { createClient } = require('@sanity/client');

try {
  require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });
} catch {
  // noop
}

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const dryRun = args.includes('--dry-run') || !apply;

function getArgValue(flag, fallback) {
  const idx = args.indexOf(flag);
  if (idx >= 0 && args[idx + 1]) return args[idx + 1];
  const prefix = `${flag}=`;
  const hit = args.find((a) => a.startsWith(prefix));
  if (hit) return hit.slice(prefix.length);
  return fallback;
}

const limit = Number.parseInt(getArgValue('--limit', '20'), 10);
const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 20;

const token =
  process.env.SANITY_API_TOKEN ||
  process.env.SANITY_WRITE_TOKEN ||
  process.env.SANITY_TOKEN ||
  '';

if (apply && !token) {
  console.error('FATAL: SANITY_API_TOKEN (or SANITY_WRITE_TOKEN) is required for --apply.');
  process.exit(1);
}

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: process.env.SANITY_API_VERSION || '2024-01-01',
  token: token || undefined,
  useCdn: false
});

const TITLE_PHRASE = '（チェックリスト付き）';
const BODY_TERMS = [
  { label: 'チェックリスト', regex: /チェックリスト/g },
  { label: 'ToDo', regex: /\bToDo\b/gi },
  { label: '次にやること', regex: /次にやること/g },
  { label: '最後に確認', regex: /最後に確認/g },
  { label: 'STEP', regex: /\bSTEP\b/gi }
];

const REPLACEMENTS = [
  { regex: /チェックリスト/g, replacement: '整理ポイント' },
  { regex: /\bToDo\b/gi, replacement: '整理事項' },
  { regex: /次にやること/g, replacement: '次の整理' },
  { regex: /最後に確認/g, replacement: '最後に整理' },
  { regex: /\bSTEP\b/gi, replacement: '流れ' }
];

function stripChecklistSuffix(value) {
  const text = String(value || '');
  if (!text.includes(TITLE_PHRASE)) return text;
  return text.replace(new RegExp(TITLE_PHRASE, 'g'), '').replace(/\s{2,}/g, ' ').trim();
}

function extractBlockText(block) {
  if (!block || block._type !== 'block' || !Array.isArray(block.children)) return '';
  return block.children.map((child) => child?.text || '').join('');
}

function suggestRewrite(text) {
  let out = String(text || '');
  for (const { regex, replacement } of REPLACEMENTS) {
    out = out.replace(regex, replacement);
  }
  return out;
}

function findBodyIssues(body = []) {
  const issues = [];
  if (!Array.isArray(body)) return issues;

  body.forEach((block, index) => {
    const text = extractBlockText(block);
    if (!text) return;
    const matched = BODY_TERMS.filter(({ regex }) => regex.test(text));
    if (matched.length === 0) return;

    issues.push({
      index,
      style: block.style || 'normal',
      text,
      matched: matched.map((m) => m.label),
      suggestion: suggestRewrite(text)
    });
  });
  return issues;
}

function truncate(value, max = 140) {
  const text = String(value || '');
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

async function main() {
  const posts = await client.fetch(
    '*[_type == "post"] | order(_updatedAt desc)[0...$limit]{_id, title, "slug": slug.current, excerpt, metaDescription, body}',
    { limit: safeLimit }
  );

  let scanned = 0;
  let updated = 0;
  let flagged = 0;

  for (const post of Array.isArray(posts) ? posts : []) {
    scanned += 1;
    const slug = post.slug || post._id;
    const updates = {};

    const nextTitle = stripChecklistSuffix(post.title);
    if (nextTitle !== (post.title || '')) updates.title = nextTitle;

    const nextExcerpt = stripChecklistSuffix(post.excerpt);
    if (nextExcerpt !== (post.excerpt || '')) updates.excerpt = nextExcerpt;

    const nextMeta = stripChecklistSuffix(post.metaDescription);
    if (nextMeta !== (post.metaDescription || '')) updates.metaDescription = nextMeta;

    const bodyIssues = findBodyIssues(post.body);
    const hasChanges = Object.keys(updates).length > 0;

    if (!hasChanges && bodyIssues.length === 0) continue;

    if (bodyIssues.length > 0) flagged += 1;
    if (hasChanges) updated += 1;

    console.log(`\n[checklist-cleanup] ${slug}`);
    if (hasChanges) {
      if (updates.title) {
        console.log(`- title: "${post.title || ''}" -> "${updates.title}"`);
      }
      if (updates.excerpt) {
        console.log(`- excerpt: "${truncate(post.excerpt)}" -> "${truncate(updates.excerpt)}"`);
      }
      if (updates.metaDescription) {
        console.log(`- metaDescription: "${truncate(post.metaDescription)}" -> "${truncate(updates.metaDescription)}"`);
      }
    }

    if (bodyIssues.length > 0) {
      console.log('- body: detected checklist-style phrasing (no auto-delete)');
      bodyIssues.forEach((issue) => {
        console.log(
          `  - [${issue.style}#${issue.index}] ${truncate(issue.text, 200)}`
        );
        console.log(
          `    suggestion: ${truncate(issue.suggestion, 200)}`
        );
        console.log(`    matched: ${issue.matched.join(', ')}`);
      });
    }

    if (hasChanges && apply) {
      await client.patch(post._id).set(updates).commit();
    }
  }

  console.log(
    `\n[checklist-cleanup] mode=${dryRun ? 'dry-run' : 'apply'} scanned=${scanned} updated=${updated} flagged=${flagged} limit=${safeLimit}`
  );
  if (dryRun) {
    console.log('ℹ️  Apply changes with --apply (token required).');
  }
}

main().catch((err) => {
  console.error('[checklist-cleanup] FATAL:', err?.message || err);
  process.exit(1);
});
