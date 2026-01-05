const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});

async function fetchNullContentArticles() {
  try {
    const query = '*[_type == "post" && content == null]{_id, title, slug, excerpt}';
    const articles = await client.fetch(query);
    console.log(JSON.stringify(articles, null, 2));
  } catch (error) {
    console.error('Error fetching articles:', error);
  }
}

fetchNullContentArticles();