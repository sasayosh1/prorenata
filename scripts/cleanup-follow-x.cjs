#!/usr/bin/env node

/**
 * Cleanup "Follow X" sentence from article summaries
 * 
 * Usage:
 *   node scripts/cleanup-follow-x.cjs --dry-run
 *   node scripts/cleanup-follow-x.cjs --apply
 */

const { createClient } = require('@sanity/client');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN,
  useCdn: false,
});

const TARGET_PATTERNS = [
  /公式X（@prorenata_jp）/i,
  /公式X \(@prorenata_jp\)/i,
  /@prorenata_jp/i,
];

async function cleanup() {
  const args = process.argv.slice(2);
  const isApply = args.includes('--apply');
  const isDryRun = args.includes('--dry-run') || !isApply;

  console.log(`🧹 Cleanup started (${isApply ? 'APPLY' : 'DRY-RUN'} mode)`);

  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2';
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
  const token = process.env.SANITY_API_TOKEN || process.env.SANITY_WRITE_TOKEN;

  console.log(`  Project ID: ${projectId}`);
  console.log(`  Dataset: ${dataset}`);
  console.log(`  Token: ${token ? `${token.substring(0, 10)}... (length: ${token.length})` : 'MISSING'}`);

  if (!token) {
    console.error('❌ Error: SANITY_API_TOKEN or SANITY_WRITE_TOKEN is required.');
    process.exit(1);
  }

  const client = createClient({
    projectId,
    dataset,
    apiVersion: '2024-01-01',
    token,
    useCdn: false,
  });

  const query = `*[_type == "post"] { _id, title, "slug": slug.current, body }`;
  const posts = await client.fetch(query);

  let totalAffected = 0;

  for (const post of posts) {
    if (!post.body || !Array.isArray(post.body)) continue;

    let modified = false;
    const newBody = post.body.filter(block => {
      if (block._type === 'block' && block.children) {
        const text = block.children.map(c => c.text || '').join('').trim();
        const isMatch = TARGET_PATTERNS.some(pattern => pattern.test(text));
        
        // Only remove if it's a short block (likely a follow prompt)
        // or specifically mentions 公式X
        if (isMatch && text.length < 200) {
          modified = true;
          return false; // Remove this block
        }
      }
      return true;
    });

    if (modified) {
      totalAffected++;
      console.log(`[${post.slug}] Found target sentence. Removing...`);
      
      if (isApply) {
        try {
          await client.patch(post._id).set({ body: newBody }).commit();
          console.log(`  ✅ Updated ${post.slug}`);
          
          // Also try to update draft if it exists
          const draftId = `drafts.${post._id}`;
          await client.patch(draftId).set({ body: newBody }).commit().catch(() => {
            // Draft might not exist, that's fine
          });
        } catch (err) {
          console.error(`  ❌ Failed to update ${post.slug}:`, err.message);
        }
      }
    }
  }

  console.log(`\nSummary:`);
  console.log(`Total posts checked: ${posts.length}`);
  console.log(`Total affected posts: ${totalAffected}`);
  
  if (isDryRun && totalAffected > 0) {
    console.log(`\nRun with --apply to commit these changes.`);
  }
}

cleanup().catch(console.error);
