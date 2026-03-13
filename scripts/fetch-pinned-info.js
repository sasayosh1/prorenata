const { createClient } = require('next-sanity');

const client = createClient({
    projectId: '72m8vhy2',
    dataset: 'production',
    apiVersion: '2024-01-01',
    useCdn: false,
});

const PINNED_SLUGS = [
  'nursing-assistant-resignation-advice-insights',
  'nursing-assistant-market-info',
  'nursing-assistant-latest-salary-comparison',
  'nursing-assistant-nightshift-fatigue',
  'nursing-assistant-care-guide-compassa',
  'nursing-assistant-job-role-compass',
  'nursing-assistant-medical-terms',
  'nursing-assistant-infection-control-manual',
  'nursing-assistant-patient-transfer-safety',
  'nursing-assistant-care-guide-compass'
]

async function main() {
    const query = `*[_type == "post" && slug.current in $slugs] {
        title,
        "slug": slug.current
    }`

    try {
        const posts = await client.fetch(query, { slugs: PINNED_SLUGS });
        console.log(JSON.stringify(posts, null, 2));
    } catch (error) {
        console.error('Error fetching posts:', error);
    }
}

main();
