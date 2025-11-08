const { createClient } = require('@sanity/client');
require('dotenv').config({ path: '../.env.local' });

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN
});

async function verify() {
  const post = await client.fetch(`*[_type == "post" && slug.current == "nursing-assistant-medical-terms"][0] { _id, _rev, title, body }`);

  console.log('Article ID:', post._id);
  console.log('Revision:', post._rev);
  console.log('Total blocks:', post.body.length);
  console.log('\nH2 and H3 headings:');

  post.body.forEach((block, i) => {
    if (block.style === 'h2' || block.style === 'h3') {
      const text = block.children?.[0]?.text || '(no text)';
      console.log(`  [${i}] ${block.style}: ${text}`);
    }
  });

  console.log('\nバイタルサインセクション:');
  let inVital = false;
  let vitalCount = 0;
  post.body.forEach((block, i) => {
    if (block.style === 'h3' && block.children?.[0]?.text?.includes('バイタルサイン')) {
      inVital = true;
      console.log('  Start at index', i);
    } else if (inVital && (block.style === 'h3' || block.style === 'h2')) {
      inVital = false;
      console.log('  End at index', i, '- Total blocks:', vitalCount);
    } else if (inVital) {
      vitalCount++;
    }
  });

  console.log('\n身体・解剖セクション:');
  let inAnatomy = false;
  let anatomyCount = 0;
  post.body.forEach((block, i) => {
    if (block.style === 'h3' && block.children?.[0]?.text?.includes('身体・解剖')) {
      inAnatomy = true;
      console.log('  Start at index', i);
    } else if (inAnatomy && (block.style === 'h3' || block.style === 'h2')) {
      inAnatomy = false;
      console.log('  End at index', i, '- Total blocks:', anatomyCount);
    } else if (inAnatomy) {
      anatomyCount++;
    }
  });

  console.log('\n症状・病態セクション:');
  let inSymptoms = false;
  let symptomsCount = 0;
  post.body.forEach((block, i) => {
    if (block.style === 'h3' && block.children?.[0]?.text?.includes('症状・病態')) {
      inSymptoms = true;
      console.log('  Start at index', i);
    } else if (inSymptoms && (block.style === 'h3' || block.style === 'h2')) {
      inSymptoms = false;
      console.log('  End at index', i, '- Total blocks:', symptomsCount);
    } else if (inSymptoms) {
      symptomsCount++;
    }
  });
}

verify().catch(console.error);
