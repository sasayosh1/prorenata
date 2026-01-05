// testWrite.js
import { getCliClient } from 'sanity/cli'

const client = getCliClient()

async function testWrite() {
  try {
    const testDoc = {
      _type: 'post',
      title: 'Sanity CLI Write Test',
    }
    
    console.log('Attempting to create a test document...')
    const result = await client.create(testDoc, {
      // Use a temporary document ID to avoid conflicts
      // The document will be deleted immediately after creation
      documentId: 'test.cli.write',
    })
    console.log('Test document created successfully:', result)

    console.log('Attempting to delete the test document...')
    await client.delete('test.cli.write')
    console.log('Test document deleted successfully.')
    
    console.log('\n✅ Write permissions are configured correctly.')

  } catch (error) {
    console.error('\n❌ An error occurred during the write test:')
    console.error(error.message)
    if (error.statusCode === 403) {
      console.error('\nThis is a permission error. Please double-check the token in your .env.local file and its permissions in the Sanity management console.')
    }
  }
}

testWrite()
