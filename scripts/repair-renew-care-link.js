require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false
})

const SLUG = 'nursing-assistant-compare-services-perspective';

// Reconstruct Moshimo link for Renew Care based on Block 13 IDs
const RENEW_CARE_LINK = `<a href="//af.moshimo.com/af/c/click?a_id=5207862&p_id=6826&pc_id=19536&pl_id=86880" target="_blank" rel="nofollow">リニューケア</a><img src="//i.moshimo.com/af/i/impression?a_id=5207862&p_id=6826&pc_id=19536&pl_id=86880" width="1" height="1" style="border:none;" loading="lazy">`;

async function main() {
    console.log(`🔍 Repairing Renew Care link in: ${SLUG}\n`);

    const post = await client.fetch(`*[_type == "post" && slug.current == $slug][0]`, { slug: SLUG });

    if (!post || !post.body) return;

    let updated = false;
    const newBody = post.body.map((block, index) => {
        // Target Block 72 specifically, or check content
        if (block._type === 'affiliateEmbed' && block.html.includes('リニューケア') && block.html.includes('rentracks')) {
            console.log(`Found broken Renew Care block at index ${index}`);

            // Replace the Rentracks link (which was wrongly added) with the Moshimo link
            // Regex to match the Rentracks link we just added
            const regex = /<img src="https:\/\/www\.rentracks\.jp.*?<\/a>/;

            if (regex.test(block.html)) {
                console.log('Restoring Moshimo link...');
                const newHtml = block.html.replace(regex, RENEW_CARE_LINK);
                updated = true;
                return { ...block, html: newHtml };
            }
        }
        return block;
    });

    if (updated) {
        await client.patch(post._id)
            .set({ body: newBody })
            .commit();
        console.log('✅ Article repaired successfully!');
    } else {
        console.log('⚠️ No repairs needed.');
    }
}

main().catch(console.error);
