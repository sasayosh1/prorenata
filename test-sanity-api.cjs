const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '.env.local'),
  override: true,
});

const { createClient } = require('@sanity/client');

const token = process.env.SANITY_WRITE_TOKEN;
console.log('Creating Sanity client...');
console.log('Project ID:', process.env.NEXT_PUBLIC_SANITY_PROJECT_ID);
console.log('Dataset:', process.env.NEXT_PUBLIC_SANITY_DATASET);
console.log('Token present:', !!token);
console.log('Token length:', token?.length);

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: token,
  useCdn: false,
});

console.log('Client created. Testing API call...');

client.fetch('*[_type == "newsletter"][0] { _id, subject }')
  .then(result => {
    console.log('✅ API call successful!');
    console.log('Result:', result);
  })
  .catch(error => {
    console.log('❌ API call failed');
    console.log('Error message:', error.message);
    console.log('Error response:', error.response);
    console.log('Full error:', error);
  });
