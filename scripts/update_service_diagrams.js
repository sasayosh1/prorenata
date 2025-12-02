const { createClient } = require('next-sanity');
const fs = require('fs');
const path = require('path');

// Hardcoded token from user rules as fallback
const token = process.env.SANITY_API_TOKEN || 'skCHyaNwM7IJU5RSAkrE3ZGFEYVcXx3lJzbKIz0a8HNUJmTwHRn1phhfsAYXZSeAVeWo2ogJj0COIwousCyb2MLGPwyxe4FuDbDETY2xz5hkjuUIcdz6YcubOZ5SfRywxB2Js8r4vKtbOmlbLm1pXJyHl0Kgajis2MgxilYSTpkEYe6GGWEu';
const projectId = '72m8vhy2';
const dataset = 'production';
const apiVersion = '2024-01-01';

const client = createClient({
    projectId,
    dataset,
    apiVersion,
    token,
    useCdn: false,
});

const TARGET_SLUG = 'nursing-assistant-compare-services-perspective';
const COMPARISON_CHART_PATH = '/Users/sasakiyoshimasa/prorenata/AI画像生成/service_comparison_chart.png';
const FLOW_CHART_PATH = '/Users/sasakiyoshimasa/prorenata/AI画像生成/service_flow_chart.png';

async function uploadImage(imagePath) {
    if (!fs.existsSync(imagePath)) {
        throw new Error(`Image not found: ${imagePath}`);
    }
    const fileStream = fs.createReadStream(imagePath);
    const asset = await client.assets.upload('image', fileStream, {
        filename: path.basename(imagePath)
    });
    console.log(`Uploaded ${path.basename(imagePath)}: ${asset._id}`);
    return asset._id;
}

async function main() {
    try {
        console.log(`Fetching article: ${TARGET_SLUG}...`);
        const query = `*[_type == "post" && slug.current == $slug][0]`;
        const post = await client.fetch(query, { slug: TARGET_SLUG });

        if (!post) {
            console.error('Post not found!');
            process.exit(1);
        }

        console.log('Uploading images...');
        const comparisonAssetId = await uploadImage(COMPARISON_CHART_PATH);
        const flowAssetId = await uploadImage(FLOW_CHART_PATH);

        let newBody = [...post.body];

        // Helper to create image block
        const createImageBlock = (assetId, alt) => ({
            _type: 'image',
            asset: {
                _type: 'reference',
                _ref: assetId
            },
            alt: alt
        });

        // Insert Comparison Chart after "費用負担と契約タイプを比較"
        const comparisonIndex = newBody.findIndex(block =>
            block.children && block.children.some(child => child.text && child.text.includes('費用負担と契約タイプを比較'))
        );

        if (comparisonIndex !== -1) {
            console.log(`Inserting comparison chart after block ${comparisonIndex}`);
            newBody.splice(comparisonIndex + 1, 0, createImageBlock(comparisonAssetId, '転職サービス3社比較チャート'));
        } else {
            console.warn('Could not find insertion point for comparison chart');
        }

        // Insert Flow Chart after "３．登録から入職までの流れ"
        // Re-calculate index as array length changed
        const flowIndex = newBody.findIndex(block =>
            block.children && block.children.some(child => child.text && child.text.includes('３．登録から入職までの流れ'))
        );

        if (flowIndex !== -1) {
            console.log(`Inserting flow chart after block ${flowIndex}`);
            newBody.splice(flowIndex + 1, 0, createImageBlock(flowAssetId, '登録から入職までの流れ'));
        } else {
            console.warn('Could not find insertion point for flow chart');
        }

        console.log('Updating post...');
        await client.patch(post._id).set({ body: newBody }).commit();
        console.log('Successfully updated post with diagrams!');

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main();
