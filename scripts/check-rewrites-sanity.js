const { createClient } = require('@sanity/client');
require('dotenv').config({ path: '.env.local' });

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false
});

async function checkPosts() {
    const slugs = [
        'nursing-assistant-resume-writing',
        'nursing-assistant-patient-transfer-safety',
        'nursing-assistant-top5-reasons-quitting',
        'nursing-assistant-part-time-day',
        'nursing-assistant-interview-prep',
        'nursing-assistant-latest-salary-comparison',
        'nursing-assistant-job-description-beginners',
        'nursing-assistant-medical-terms',
        'nursing-assistant-motivation-letter-examples',
        'nursing-assistant-quit-experiences'
    ];

    console.log("Fetching posts from Sanity...");
    const posts = await client.fetch(`*[_type == "post" && slug.current in $slugs]{ _id, title, "slug": slug.current, body }`, { slugs });
    
    posts.forEach(p => {
        console.log(`- [${p.slug}] ${p.title} (${p.body ? p.body.length : 0} blocks)`);
        const affiliateBlocks = p.body ? p.body.filter(b => b._type === 'affiliateEmbed') : [];
        if (affiliateBlocks.length > 0) {
            console.log(`  Found ${affiliateBlocks.length} affiliate blocks.`);
        }
    });
}

checkPosts().catch(console.error);
