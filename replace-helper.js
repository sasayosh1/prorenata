
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

// --- Main Replace and Update Function ---
async function replaceTextInArticles(oldString, newString) {
  if (!oldString || !newString) {
    console.error('Error: Old string and new string are required.');
    process.exit(1);
  }
  if (!process.env.SANITY_API_TOKEN) {
    console.error('Error: SANITY_API_TOKEN environment variable is not set.');
    process.exit(1);
  }

  console.log(`Searching for articles containing "${oldString}" to replace with "${newString}"...`);

  try {
    // 1. Find all articles containing the old string in title or body
    const query = `*[_type == "post" && (title match $oldString || pt::text(body) match $oldString)]`;
    const articlesToUpdate = await client.fetch(query, { oldString });

    if (articlesToUpdate.length === 0) {
      console.log('No articles found that need updating.');
      return;
    }

    console.log(`Found ${articlesToUpdate.length} article(s) to update.`);

    // 2. Loop through each article and update it
    for (const article of articlesToUpdate) {
      console.log(`---
Updating article: ${article.title} (ID: ${article._id})`);
      
      const newTitle = article.title.replace(new RegExp(oldString, 'g'), newString);
      const newBody = JSON.parse(JSON.stringify(article.body || []));

      newBody.forEach(block => {
        if (block._type === 'block' && block.children) {
          block.children.forEach(child => {
            if (child._type === 'span' && child.text && child.text.includes(oldString)) {
              child.text = child.text.replace(new RegExp(oldString, 'g'), newString);
            }
          });
        }
      });

      await client
        .patch(article._id)
        .set({ title: newTitle, body: newBody })
        .commit();
      
      console.log(`Successfully updated.`);
    }

    console.log('---
All articles have been updated successfully!');

  } catch (error) {
    console.error('An error occurred during the update process:', error);
    process.exit(1);
  }
}

// --- Script Execution ---
const [,, oldString, newString] = process.argv;
replaceTextInArticles(oldString, newString);
