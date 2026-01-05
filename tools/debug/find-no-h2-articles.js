
require('dotenv').config();

const { createClient } = require('@sanity/client');

// Sanity client configuration
const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});

// Function to find articles without H2 headings
async function findArticlesWithoutH2() {
  console.log('Searching for articles without any H2 headings...');
  try {
    // Fetch all posts with their body content
    const allPosts = await client.fetch(`*[_type == "post"]{_id, title, body}`);

    const articlesWithoutH2 = [];

    for (const post of allPosts) {
      // Check if the body contains at least one block with style 'h2'
      const hasH2 = post.body?.some(block => block._type === 'block' && block.style === 'h2');
      
      if (!hasH2) {
        articlesWithoutH2.push({
          _id: post._id,
          title: post.title,
        });
      }
    }

    if (articlesWithoutH2.length > 0) {
      console.log(`Found ${articlesWithoutH2.length} article(s) without H2 headings:`);
      console.log(JSON.stringify(articlesWithoutH2, null, 2));
    } else {
      console.log('All articles have at least one H2 heading. No issues found.');
    }

  } catch (error) {
    console.error('Error fetching or processing articles:', error);
    process.exit(1);
  }
}

// Execute the function
findArticlesWithoutH2();
