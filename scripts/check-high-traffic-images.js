const { createClient } = require('@sanity/client');

const client = createClient({
    projectId: '72m8vhy2',
    dataset: 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
});

// High-traffic articles from GSC/GA4 data (2025-12-03)
const HIGH_TRAFFIC_SLUGS = [
    'nursing-assistant-bottom-myth',
    'nursing-assistant-operating-room-duties',
    'nursing-assistant-patient-transfer-safety',
    'nursing-assistant-resume-writing',
    'nursing-assistant-become-nurse-guide', // From SEO improvements
];

async function checkImagesForArticles() {
    console.log('=== Checking Images for High-Traffic Articles ===\n');

    const query = `*[_type == "post" && slug.current in $slugs] {
        _id,
        title,
        "slug": slug.current,
        mainImage {
            asset-> {
                _id,
                url
            }
        }
    }`;

    const articles = await client.fetch(query, { slugs: HIGH_TRAFFIC_SLUGS });

    const withImages = [];
    const withoutImages = [];

    articles.forEach(article => {
        if (article.mainImage?.asset?._id) {
            withImages.push(article);
        } else {
            withoutImages.push(article);
        }
    });

    console.log(`Total articles checked: ${articles.length}`);
    console.log(`With images: ${withImages.length}`);
    console.log(`Without images: ${withoutImages.length}\n`);

    if (withImages.length > 0) {
        console.log('✅ Articles WITH images:');
        withImages.forEach(article => {
            console.log(`  - ${article.slug}`);
            console.log(`    Title: ${article.title}`);
            console.log(`    Image: ${article.mainImage.asset.url}\n`);
        });
    }

    if (withoutImages.length > 0) {
        console.log('❌ Articles WITHOUT images (need generation):');
        withoutImages.forEach(article => {
            console.log(`  - ${article.slug}`);
            console.log(`    Title: ${article.title}\n`);
        });
    }

    return { withImages, withoutImages };
}

checkImagesForArticles();
