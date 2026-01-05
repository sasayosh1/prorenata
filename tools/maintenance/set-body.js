

require('dotenv').config();

const { createClient } = require('@sanity/client');
const { v4: uuidv4 } = require('uuid');

// --- Sanity Client Initialization ---
const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});

// --- Markdown to Portable Text Conversion ---
function markdownToPortableText(markdown) {
  const blocks = [];
  const lines = markdown.split('\n');

  lines.forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('## ')) {
      blocks.push({
        _type: 'block',
        _key: uuidv4(),
        style: 'h2',
        children: [{ _type: 'span', _key: uuidv4(), text: trimmedLine.substring(3).trim() }]
      });
    } else if (trimmedLine.startsWith('### ')) {
      blocks.push({
        _type: 'block',
        _key: uuidv4(),
        style: 'h3',
        children: [{ _type: 'span', _key: uuidv4(), text: trimmedLine.substring(4).trim() }]
      });
    } else if (trimmedLine.startsWith('- ')) {
       blocks.push({
        _type: 'block',
        _key: uuidv4(),
        listItem: 'bullet',
        level: 1,
        children: [{ _type: 'span', _key: uuidv4(), text: trimmedLine.substring(2).trim() }]
      });
    } else if (trimmedLine.length > 0) {
      blocks.push({
        _type: 'block',
        _key: uuidv4(),
        style: 'normal',
        children: [{ _type: 'span', _key: uuidv4(), text: trimmedLine }]
      });
    }
  });
  return blocks;
}

// --- Main Update Function ---
async function setArticleBody(articleId, markdownContent) {
  if (!articleId || !markdownContent) {
    console.error('Error: Article ID and Markdown content are required.');
    process.exit(1);
  }
  if (!process.env.SANITY_API_TOKEN) {
    console.error('Error: SANITY_API_TOKEN environment variable is not set.');
    process.exit(1);
  }

  console.log(`Starting update for article ID: ${articleId}...`);

  try {
    const portableTextBody = markdownToPortableText(markdownContent);

    await client
      .patch(articleId)
      .set({ body: portableTextBody })
      .commit();

    console.log(`Successfully set new body for article ID: ${articleId}`);

  } catch (error) {
    console.error(`Error updating article ID ${articleId}:`, error);
    process.exit(1);
  }
}

// --- Script Execution ---
const [,, articleId, markdownContent] = process.argv;
setArticleBody(articleId, markdownContent);

