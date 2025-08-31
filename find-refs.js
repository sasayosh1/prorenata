

const { createClient } = require('next-sanity')

const projectId = '72m8vhy2'
const dataset = 'production'
const apiVersion = '2024-01-01'

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
})

async function findReferences() {
  try {
    console.log('Fetching authors and categories from Sanity...')
    
    const authorsQuery = `*[_type == "author"]{_id, name}`
    const categoriesQuery = `*[_type == "category"]{_id, title}`
    
    const [authors, categories] = await Promise.all([
      client.fetch(authorsQuery),
      client.fetch(categoriesQuery)
    ]);

    console.log('\n--- Available Authors ---');
    if (authors.length > 0) {
      console.table(authors);
    } else {
      console.log('No authors found.');
    }

    console.log('\n--- Available Categories ---');
    if (categories.length > 0) {
      console.table(categories);
    }
    else {
      console.log('No categories found.');
    }

    if (authors.length === 0 || categories.length === 0) {
        console.error('\nError: Please create at least one author and one category in your Sanity Studio before creating posts.');
    } else {
        console.log('\n\nTo fix the script, please replace the _ref values in `create-nursing-assistant-posts.js` with the IDs from the tables above.');
    }
    
  } catch (error) {
    console.error('Failed to fetch references:', error)
  }
}

findReferences()

