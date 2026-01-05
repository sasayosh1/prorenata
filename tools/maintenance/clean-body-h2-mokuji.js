
require('dotenv').config();

const { createClient } = require('@sanity/client');

// --- Sanity Client Initialization ---
const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});

// --- Main Cleaning Function ---
async function cleanBodyH2Mokuji() {
  if (!process.env.SANITY_API_TOKEN) {
    console.error('Error: SANITY_API_TOKEN environment variable is not set.');
    process.exit(1);
  }

  console.log('Searching for and cleaning up H2 "もくじ" blocks in all articles...');

  try {
    // Fetch all posts with their body content
    const allPosts = await client.fetch(`*[_type == "post"]{_id, title, body}`);

    if (allPosts.length === 0) {
      console.log('No articles found.');
      return;
    }

    let cleanedCount = 0;

    for (const post of allPosts) {
      if (!post.body || !Array.isArray(post.body)) {
        continue; // Skip if body is missing or not an array
      }

      let bodyChanged = false;
      const newBody = [];

      for (const block of post.body) {
        // Check if it's an H2 block and its text is "もくじ"
        const isMokujiH2 = (
          block._type === 'block' &&
          block.style === 'h2' &&
          block.children &&
          Array.isArray(block.children) &&
          block.children.length === 1 &&
          block.children[0]._type === 'span' &&
          block.children[0].text === 'もくじ'
        );

        if (isMokujiH2) {
          console.log(`Found H2 "もくじ" in article: ${post.title} (ID: ${post._id}). Removing.`);
          bodyChanged = true;
        } else {
          newBody.push(block);
        }
      }

      if (bodyChanged) {
        await client
          .patch(post._id)
          .set({ body: newBody })
          .commit();
        cleanedCount++;
        console.log(`Successfully cleaned body for article: ${post.title}`);
      }
    }

    if (cleanedCount > 0) {
      console.log(`---
Cleaned H2 "もくじ" from ${cleanedCount} article(s).`);
    } else {
      console.log('No H2 "もくじ" blocks found in any article. No cleanup needed.');
    }

  } catch (error) {
    console.error('An error occurred during the cleanup process:', error);
    process.exit(1);
  }
}

// Execute the function
cleanBodyH2Mokuji();
