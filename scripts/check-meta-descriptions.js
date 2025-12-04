const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

async function checkMetaDescriptions() {
  const slugs = [
    'nursing-assistant-resume-writing',
    'nursing-assistant-interview-prep',
    'nursing-assistant-patient-transfer-safety',
    'nursing-assistant-stressful-relationships-solutions',
    'nursing-assistant-become-nurse-guide',
    'nursing-assistant-essentials-checklist',
    'nursing-assistant-career-vision',
    'nursing-assistant-aptitude-test',
    'nursing-assistant-daily-schedule',
    'nursing-assistant-interview-tips'
  ];

  const query = `*[_type == "post" && slug.current in $slugs] {
        title,
        "slug": slug.current,
        description
    }`;

  const posts = await client.fetch(query, { slugs });

  console.log('=== Current Meta Descriptions ===\n');
  posts.forEach(post => {
    console.log(`Title: ${post.title}`);
    console.log(`Slug: ${post.slug}`);
    console.log(`Description: ${post.description || '(No description)'}`);
    console.log(`Length: ${post.description ? post.description.length : 0}`);
    console.log('---\n');
  });
}

checkMetaDescriptions();
