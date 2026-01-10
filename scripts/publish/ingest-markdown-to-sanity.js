#!/usr/bin/env node
/**
 * Ingest a Markdown file as a draft Post in Sanity.
 *
 * Usage:
 *   node scripts/publish/ingest-markdown-to-sanity.js --file drafts/foo.md --title "..." --slug "..." --dry-run
 *   SANITY_API_TOKEN=... node scripts/publish/ingest-markdown-to-sanity.js --file drafts/foo.md --title "..." --slug "..." --apply
 */

const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { createClient } = require('@sanity/client');

const dotenv = require('dotenv');
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: true });
}

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const dryRun = args.includes('--dry-run') || (!apply && !args.includes('--json-only'));
const publish = args.includes('--publish');
const jsonOnly = args.includes('--json-only');

function getArgValue(flag) {
  const idx = args.indexOf(flag);
  if (idx >= 0 && args[idx + 1]) return args[idx + 1];
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

if (apply && !token && !jsonOnly) {
  console.error('FATAL: Authentication token is missing for --apply.');
  console.error('Please define one of the following in .env.local or your environment:');
  console.error('  - SANITY_WRITE_TOKEN (Highest priority)');
  console.error('  - SANITY_API_TOKEN');
  console.error('  - SANITY_TOKEN');
  process.exit(1);
}

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: process.env.SANITY_API_VERSION || '2024-01-01',
  token: token || undefined,
  useCdn: false
});

function readMarkdown(file) {
  const abs = path.resolve(process.cwd(), file);
  if (!fs.existsSync(abs)) {
    console.error(`FATAL: file not found: ${abs}`);
    process.exit(1);
  }
  return fs.readFileSync(abs, 'utf8');
}

function makeKey() {
  return randomUUID().replace(/-/g, '').slice(0, 12);
}

function toBlock(text, style = 'normal', extra = {}) {
  return {
    _type: 'block',
    _key: makeKey(),
    style,
    children: [
      {
        _type: 'span',
        _key: makeKey(),
        text
      }
    ],
    ...extra
  };
}

function markdownToPortableText(markdown) {
  const blocks = [];
  const lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n');

  let paragraphLines = [];
  let listBuffer = [];

  const flushParagraph = () => {
    if (paragraphLines.length === 0) return;
    const text = paragraphLines.join(' ').replace(/\s+/g, ' ').trim();
    if (text) blocks.push(toBlock(text, 'normal'));
    paragraphLines = [];
  };

  const flushList = () => {
    if (listBuffer.length === 0) return;
    for (const item of listBuffer) {
      blocks.push(
        toBlock(item, 'normal', {
          listItem: 'bullet',
          level: 1
        })
      );
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
      flushParagraph();
      flushList();
      const text = line.replace(/^#\s+/, '').trim();
      if (text) blocks.push(toBlock(text, 'h1'));
      continue;
    }

    if (line.startsWith('## ')) {
      flushParagraph();
      flushList();
      const text = line.replace(/^##\s+/, '').trim();
      if (text) blocks.push(toBlock(text, 'h2'));
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

  flushParagraph();
  flushList();

  return blocks;
}

async function resolveTargetIds(targetSlug, allowFallback) {
  try {
    const hits = await client.fetch(
      '*[_type == "post" && slug.current == $slug]{_id, _createdAt, _updatedAt}',
      { slug: targetSlug }
    );
    const list = Array.isArray(hits) ? hits : [];
    const draftHit = list.find((doc) => doc._id.startsWith('drafts.'));
    const publishedHit = list.find((doc) => !doc._id.startsWith('drafts.'));

    if (draftHit) {
      const baseId = draftHit._id.replace(/^drafts\./, '');
      return { draftId: draftHit._id, publishedId: baseId, source: 'draft' };
    }
    if (publishedHit) {
      return { draftId: `drafts.${publishedHit._id}`, publishedId: publishedHit._id, source: 'published' };
    }
  } catch (err) {
    if (!allowFallback) throw err;
  }

  const baseId = randomUUID();
  return { draftId: `drafts.${baseId}`, publishedId: baseId, source: 'new' };
}

async function main() {
  const markdown = readMarkdown(filePath);
  const body = markdownToPortableText(markdown);

  const { draftId, publishedId, source } = await resolveTargetIds(slug, dryRun || jsonOnly);
  const isUpdate = source !== 'new';

  const doc = {
    _id: draftId,
    _type: 'post',
    title,
    slug: { _type: 'slug', current: slug },
    body
  };

  if (jsonOnly) {
    console.log(JSON.stringify(doc, null, 2));
    return;
  }

  console.log('\n[ingest] Preview');
  console.log(`- mode: ${dryRun ? 'dry-run' : 'apply'}`);
  console.log(`- target: ${isUpdate ? 'update' : 'create'} (${source})`);
  console.log(`- draftId: ${draftId}`);
  console.log(`- title: ${title}`);
  console.log(`- slug: ${slug}`);
  console.log(`- body blocks: ${body.length}`);
  if (body[0]) {
    console.log(`- first block: ${body[0].style} "${body[0].children?.[0]?.text || ''}"`);
  }

  if (dryRun) {
    console.log('\n[ingest] Dry-run only. No changes applied.');
    return;
  }

  await client.createOrReplace(doc);
  console.log('[ingest] Draft saved.');

  if (publish) {
    const publishedDoc = { ...doc, _id: publishedId };
    await client.createOrReplace(publishedDoc);
    console.log('[ingest] Published copy saved.');
  }
}

main().catch((err) => {
  console.error('[ingest] FATAL:', err?.message || err);
  process.exit(1);
});
