require('dotenv').config({ path: './.env.local', debug: false });

const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
});

async function getArticleBySlug(slug) {
  try {
    const article = await client.fetch(
      `*[_type == "post" && slug.current == $slug][0]`,
      { slug }
    );

    if (article) {
      console.log(JSON.stringify(article, null, 2));
    }
  } catch (error) {
    // No error logging to keep output clean
  }
}

const slug = process.argv[2];
getArticleBySlug(slug);
