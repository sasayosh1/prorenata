
require('dotenv').config();

const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});

async function getArticleCategories(slug) {
  if (!slug) {
    console.error('Error: Article slug is required.');
    process.exit(1);
  }
  if (!process.env.SANITY_API_TOKEN) {
    console.error('Error: SANITY_API_TOKEN environment variable is not set.');
    process.exit(1);
  }

  console.log(`Fetching categories for article with slug: ${slug}...`);

  try {
    const query = `*[_type == "post" && slug.current == $slug][0]{"categories": categories[]->title}`;
    const article = await client.fetch(query, { slug });

    if (article && article.categories) {
      console.log(`Categories for "${slug}": ${JSON.stringify(article.categories, null, 2)}`);
    } else {
      console.log(`Article with slug "${slug}" not found or has no categories.`);
    }

  } catch (error) {
    console.error(`Error fetching categories for article ${slug}:`, error);
    process.exit(1);
  }
}

const [,, slug] = process.argv;
getArticleCategories(slug);
