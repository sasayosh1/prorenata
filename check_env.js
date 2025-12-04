require('dotenv').config({ path: '.env.local' });
console.log('GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS);
console.log('SANITY_API_TOKEN:', process.env.SANITY_API_TOKEN ? 'Set' : 'Not Set');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Set' : 'Not Set');
