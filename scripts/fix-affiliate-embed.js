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

const NEW_LINK_CODE = `<img src="https://www.rentracks.jp/adx/p.gifx?idx=0.71551.371865.8943.12704&dna=148900" border="0" height="1" width="1"><a href="https://www.rentracks.jp/adx/r.html?idx=0.71551.371865.8943.12704&dna=148900" rel="nofollow noopener" target="_blank">ヒューマンライフケア</a>`;

async function main() {
    console.log(`🔍 Fixing affiliateEmbed in: ${SLUG}\n`);

    const post = await client.fetch(`*[_type == "post" && slug.current == $slug][0]`, { slug: SLUG });

    if (!post || !post.body) return;

    let updated = false;
    const newBody = post.body.map(block => {
        if (block._type === 'affiliateEmbed') {
            // Check if it's the target block (contains old Moshimo link or Human Life Care text)
            if (block.html.includes('ヒューマン') || block.html.includes('moshimo')) {
                console.log('Found target affiliateEmbed block.');

                // Replace the old link/img with the new code
                // We'll replace the entire <a>...</a><img...> sequence
                // Regex to match the old link pattern roughly
                const regex = /<a href="[^"]*moshimo[^"]*"[^>]*>.*?<\/a><img[^>]*>/;

                if (regex.test(block.html)) {
                    console.log('Replacing Moshimo link...');
                    const newHtml = block.html.replace(regex, NEW_LINK_CODE);
                    updated = true;
                    return { ...block, html: newHtml };
                } else {
                    // Fallback: if regex doesn't match, maybe just append or replace known string?
                    // Let's print it to be safe, but for now assuming regex works based on previous output
                    console.log('Regex did not match. Manual check needed?');
                    console.log(block.html);
                }
            }
        }
        return block;
    });

    if (updated) {
        await client.patch(post._id)
            .set({ body: newBody })
            .commit();
        console.log('✅ Article updated successfully!');
    } else {
        console.log('⚠️ No changes made.');
    }
}

main().catch(console.error);
