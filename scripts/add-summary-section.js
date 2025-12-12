const fs = require('fs');
const { createClient } = require('@sanity/client');
const { v4: uuidv4 } = require('uuid');

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
});

async function addSummarySection(slug, summaryBody) {
  if (!slug) {
    console.error('Error: Please provide a slug.');
    return;
  }

  try {
    const article = await client.fetch(
      `*[_type == "post" && slug.current == $slug][0] { _id, body }`,
      { slug }
    );

    if (article && article.body) {
      const affiliateEmbedIndex = article.body.findIndex(
        block => block._type === 'affiliateEmbed'
      );
      
      const summarySection = summaryBody;

      if (affiliateEmbedIndex === -1) {
        console.log('No affiliateEmbed found, appending to the end.');
        article.body.push(...summarySection);
      } else {
        article.body.splice(affiliateEmbedIndex, 0, ...summarySection);
      }

      await client
        .patch(article._id)
        .set({ body: article.body })
        .commit();
      console.log('Article updated successfully with summary section.');
    } else {
      console.log('No article found with that slug or body is empty.');
    }
  } catch (error) {
    console.error('Error updating article:', error);
  }
}

const slug = process.argv[2];
const summaryFilePath = process.argv[3];
const summaryBodyString = fs.readFileSync(summaryFilePath, 'utf-8');
const summaryBody = JSON.parse(summaryBodyString);

addSummarySection(slug, summaryBody);
