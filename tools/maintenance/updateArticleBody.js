const fs = require('fs');
const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
});

async function updateArticleBody(slug, newBody) {
  if (!slug) {
    console.error('Error: Please provide a slug.');
    return;
  }

  try {
    const article = await client.fetch(
      `*[_type == "post" && slug.current == $slug][0]`,
      { slug }
    );

    if (article) {
      await client
        .patch(article._id)
        .set({ body: newBody })
        .commit();
      console.log('Article updated successfully.');
    } else {
      console.log('No article found with that slug.');
    }
  } catch (error) {
    console.error('Error updating article:', error);
  }
}

const slug = process.argv[2];
const bodyFilePath = process.argv[3];
const newBodyString = fs.readFileSync(bodyFilePath, 'utf-8');
const newBody = JSON.parse(newBodyString);

updateArticleBody(slug, newBody);
