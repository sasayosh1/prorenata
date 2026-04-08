const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '.env.local'),
  override: true,
});

console.log('Token loaded:', process.env.SANITY_WRITE_TOKEN ? '✅ Token exists' : '❌ Token missing');
console.log('Token length:', process.env.SANITY_WRITE_TOKEN?.length || 0);
console.log('First 20 chars:', process.env.SANITY_WRITE_TOKEN?.substring(0, 20) || 'N/A');
console.log('Project ID:', process.env.NEXT_PUBLIC_SANITY_PROJECT_ID);
console.log('Dataset:', process.env.NEXT_PUBLIC_SANITY_DATASET);
