
require('dotenv').config();

const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});

async function getRelatedArticlesCount(currentPostId, categoryName) {
  if (!currentPostId || !categoryName) {
    console.error('Error: Current Post ID and Category Name are required.');
    process.exit(1);
  }
  if (!process.env.SANITY_API_TOKEN) {
    console.error('Error: SANITY_API_TOKEN environment variable is not set.');
    process.exit(1);
  }

  console.log(`Counting related articles for category "${categoryName}" (excluding ID: ${currentPostId})...`);

  try {
    // GROQ query to count posts in the given category, excluding the current post
    const query = `count(*[_type == "post" && _id != $currentPostId && $categoryName in categories[]->title])`;
    const count = await client.fetch(query, { currentPostId, categoryName });

    console.log(`Found ${count} other article(s) in category "${categoryName}".`);

  } catch (error) {
    console.error(`Error counting related articles for category ${categoryName}:`, error);
    process.exit(1);
  }
}

const [,, currentPostId, categoryName] = process.argv;
getRelatedArticlesCount(currentPostId, categoryName);
