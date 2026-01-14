#!/usr/bin/env node
/**
 * Ingest a Markdown file as a robust Post in Sanity.
 * Ensures slug uniqueness and prevents duplicate Drafts/Published collisions.
 *
 * Deterministic ID Strategy: post-${slug}
 *
 * Usage:
 *   node scripts/publish/ingest-markdown-to-sanity.js --file drafts/foo.md --title "..." --slug "..." --dry-run
 *   node scripts/publish/ingest-markdown-to-sanity.js --file drafts/foo.md --title "..." --slug "..." --apply
 *   node scripts/publish/ingest-markdown-to-sanity.js --file drafts/foo.md --title "..." --slug "..." --apply --use-cli
 */

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');
const { createClient } = require('@sanity/client');
const { getCliClient } = require('sanity/cli');
const dotenv = require('dotenv');

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: true });
}

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const dryRun = args.includes('--dry-run') || (!apply && !args.includes('--json-only'));
const useCli = args.includes('--use-cli');
const jsonOnly = args.includes('--json-only');
const forceCleanup = args.includes('--force-cleanup');
const printIds = args.includes('--print-ids');

function getArgValue(flag) {
  const idx = args.indexOf(flag);
  if (idx >= 0 && args[idx + 1] && !args[idx + 1].startsWith('--')) return args[idx + 1];
  const prefix = `${flag}=`;
  const hit = args.find((v) => v.startsWith(prefix));
  if (hit) return hit.slice(prefix.length);
  return '';
}

const filePath = getArgValue('--file');
const title = getArgValue('--title');
const slug = getArgValue('--slug');

if (!filePath || !title || !slug) {
  console.error('FATAL: --file, --title, and --slug are required.');
  process.exit(1);
}

const token =
  process.env.SANITY_WRITE_TOKEN ||
  process.env.SANITY_API_TOKEN ||
  process.env.SANITY_TOKEN ||
  '';

// Configuration
const PROJECT_ID = process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2';
const DATASET = process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const API_VERSION = process.env.SANITY_API_VERSION || '2024-01-01';

const client = useCli
  ? getCliClient({ useCdn: false })
  : createClient({
    projectId: PROJECT_ID,
    dataset: DATASET,
    apiVersion: API_VERSION,
    token: token || undefined,
    useCdn: false
  });

/**
 * Clean slug for use in ID
 */
function cleanSlug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

/**
 * Deterministic ID
 */
function getDeterministicId(s) {
  return `post-${cleanSlug(s)}`;
}

/**
 * Markdown to Portable Text (Simplified)
 */
function markdownToPortableText(markdown) {
  const blocks = [];
  const lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n');

  let paragraphLines = [];
  let listBuffer = [];

  const makeKey = () => Math.random().toString(36).substring(2, 10);

  const toBlock = (text, style = 'normal', extra = {}) => ({
    _type: 'block',
    _key: makeKey(),
    style,
    children: [{ _type: 'span', _key: makeKey(), text }],
    ...extra
  });

  const flushParagraph = () => {
    if (paragraphLines.length === 0) return;
    const text = paragraphLines.join(' ').replace(/\s+/g, ' ').trim();
    if (text) blocks.push(toBlock(text, 'normal'));
    paragraphLines = [];
  };

  const flushList = () => {
    if (listBuffer.length === 0) return;
    for (const item of listBuffer) {
      blocks.push(toBlock(item, 'normal', { listItem: 'bullet', level: 1 }));
    }
    listBuffer = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }
    if (line.startsWith('# ')) {
      flushParagraph(); flushList();
      blocks.push(toBlock(line.replace(/^#\s+/, ''), 'h1'));
      continue;
    }
    if (line.startsWith('## ')) {
      flushParagraph(); flushList();
      blocks.push(toBlock(line.replace(/^##\s+/, ''), 'h2'));
      continue;
    }
    if (line.startsWith('- ')) {
      flushParagraph();
      listBuffer.push(line.replace(/^-+\s+/, '').trim());
      continue;
    }
    flushList();
    paragraphLines.push(line);
  }
  flushParagraph(); flushList();
  return blocks;
}

/**
 * Pre-flight conflict check via GROQ
 */
async function getSlugConflicts(targetSlug) {
  const query = `*[_type == "post" && slug.current == $slug]{ _id, _updatedAt, title }`;
  let hits = [];

  if (useCli) {
    // If using CLI, we might not have API access for fetch if token is missing
    // Try CLI query. CLI query doesn't easily support --params, so we embed it.
    try {
      const cliQuery = `*[_type == "post" && slug.current == "${targetSlug}"]{ _id, _updatedAt, title }`;
      const output = execSync(`npx sanity documents query '${cliQuery}' --api-version ${API_VERSION}`, { encoding: 'utf8' });
      // Sanity CLI might output warnings, we need to find the JSON array
      const jsonMatch = output.match(/\[[\s\S]*\]/);
      hits = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch (e) {
      console.warn('[check] CLI query failed, assuming no conflicts.', e.message);
    }
  } else {
    hits = await client.fetch(query, { slug: targetSlug });
  }

  const published = hits.filter(h => !h._id.startsWith('drafts.'));
  const drafts = hits.filter(h => h._id.startsWith('drafts.'));

  return { published, drafts };
}

async function main() {
  const markdown = fs.readFileSync(path.resolve(process.cwd(), filePath), 'utf8');
  const body = markdownToPortableText(markdown);
  const targetId = getDeterministicId(slug);

  console.log(`[ingest] Target Slug: ${slug}`);
  console.log(`[ingest] Base ID: ${targetId}`);

  // 1. Conflict Check
  const { published, drafts } = await getSlugConflicts(slug);

  if (printIds) {
    console.log('[check] Found IDs:', {
      published: published.map(p => p._id),
      drafts: drafts.map(d => d._id)
    });
  }

  let finalId = targetId;
  let action = 'create';
  const cleanupIds = [];

  if (published.length > 1) {
    console.error(`\n[FATAL] Multiple Published documents found for slug "${slug}":`);
    published.forEach(p => console.error(`  - ${p._id} (${p.title}, updated: ${p._updatedAt})`));
    if (!forceCleanup) {
      console.error('\nCollision detected. Please resolve manually or use --force-cleanup to keep the newest.');
      process.exit(1);
    }
    // Keep newest
    published.sort((a, b) => new Date(b._updatedAt) - new Date(a._updatedAt));
    finalId = published[0]._id;
    published.slice(1).forEach(p => cleanupIds.push(p._id));
    action = 'update';
  } else if (published.length === 1) {
    finalId = published[0]._id;
    action = 'update';
  } else if (drafts.length > 0) {
    // published=0, draft>=1. Take base of first draft or use targetId
    const baseFromDraft = drafts[0]._id.replace(/^drafts\./, '');
    finalId = baseFromDraft;
    action = 'upsert';
  }

  // All drafts found should be deleted if we are going to Published
  drafts.forEach(d => cleanupIds.push(d._id));

  const doc = {
    _id: finalId,
    _type: 'post',
    title,
    slug: { _type: 'slug', current: slug },
    body,
    _updatedAt: new Date().toISOString()
  };

  if (jsonOnly) {
    console.log(JSON.stringify(doc, null, 2));
    return;
  }

  console.log(`[plan] Action: ${action} ${finalId}`);
  if (cleanupIds.length > 0) {
    console.log(`[plan] Cleanup (Delete): ${cleanupIds.join(', ')}`);
  }

  if (dryRun) {
    console.log('\n[dry-run] Content preview (first 100 chars of body):');
    const firstText = body[0]?.children?.[0]?.text || '';
    console.log(`  "${firstText.substring(0, 100)}..."`);
    console.log('\nDry-run complete. No changes made.');
    return;
  }

  // 2. Execution
  if (useCli) {
    const tempFile = `.temp_ingest_${slug}.json`;
    fs.writeFileSync(tempFile, JSON.stringify(doc, null, 2));
    try {
      console.log(`[exec] CLI upsert for ${finalId}...`);
      execSync(`SANITY_CLI_SKIP_UPDATE_CHECK=1 npx sanity documents create --replace ${tempFile} --project ${PROJECT_ID} --dataset ${DATASET} --api-version ${API_VERSION}`, { stdio: 'inherit' });

      for (const id of cleanupIds) {
        console.log(`[exec] CLI cleaning up ${id}...`);
        execSync(`SANITY_CLI_SKIP_UPDATE_CHECK=1 npx sanity documents delete ${id} --project ${PROJECT_ID} --dataset ${DATASET}`, { stdio: 'inherit' });
      }
    } finally {
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    }
  } else {
    console.log(`[exec] API upsert for ${finalId}...`);
    await client.createOrReplace(doc);

    for (const id of cleanupIds) {
      console.log(`[exec] API cleaning up ${id}...`);
      await client.delete(id);
    }
  }

  console.log(`[done] Successfully ${action === 'create' ? 'created' : 'updated'} article.`);
}

main().catch(err => {
  console.error('[FATAL]', err.message || err);
  process.exit(1);
});
