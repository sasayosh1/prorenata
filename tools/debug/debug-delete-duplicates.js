const fs = require('fs');
const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});

const articlesToDelete = JSON.parse(fs.readFileSync('duplicate-ids-to-delete.json', 'utf-8'));

async function deleteDuplicates() {
  try {
    for (const articleId of articlesToDelete) {
      await client.delete(articleId);
      console.log(`Deleted article: ${articleId}`);
    }
    console.log(`\nSuccessfully deleted ${articlesToDelete.length} duplicate articles.`);
  } catch (error) {
    console.error('Error deleting articles:', error);
  }
}

deleteDuplicates();
