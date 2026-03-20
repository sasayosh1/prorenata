const { createClient } = require('@sanity/client');
const fs = require('fs');
const path = require('path');

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN || process.env.SANITY_WRITE_TOKEN,
});

async function updateSearchIndex() {
  console.log('Fetching all articles from Sanity...');
  const query = `*[_type == "post" && defined(slug)] | order(publishedAt desc) {
    title,
    "slug": slug.current,
    "categories": categories[]->title,
    "bodyPlainText": pt::text(body)
  }`;

  try {
    const posts = await client.fetch(query);
    console.log(`Fetched ${posts.length} articles.`);

    const filePath = path.join(process.cwd(), 'all-articles.json');
    fs.writeFileSync(filePath, JSON.stringify(posts, null, 2), 'utf8');
    console.log('Successfully updated all-articles.json');
  } catch (error) {
    console.error('Error updating search index:', error);
    process.exit(1);
  }
}

updateSearchIndex();
