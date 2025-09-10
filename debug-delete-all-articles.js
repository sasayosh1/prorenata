const fs = require('fs');
const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});

const articlesToDelete = JSON.parse(fs.readFileSync('all-articles.json', 'utf-8'));

async function deleteAllArticles() {
  try {
    for (const article of articlesToDelete) {
      await client.delete(article._id);
      console.log(`Deleted article: ${article._id} ("${article.title}")`);
    }
    console.log(`\nSuccessfully deleted ${articlesToDelete.length} articles.`);
  } catch (error) {
    console.error('Error deleting articles:', error);
  }
}

deleteAllArticles();
