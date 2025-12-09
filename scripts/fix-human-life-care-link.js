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
const NEW_URL = 'https://www.rentracks.jp/adx/r.html?idx=0.71551.371865.8943.12704&dna=148900';

async function main() {
    console.log(`🔍 Fixing Human Life Care link in: ${SLUG}\n`);

    const post = await client.fetch(`*[_type == "post" && slug.current == $slug][0]`, { slug: SLUG });

    if (!post) {
        console.error('❌ Article not found!');
        return;
    }

    let updated = false;
    const newBody = post.body.map(block => {
        if (block.markDefs && Array.isArray(block.markDefs)) {
            const newMarkDefs = block.markDefs.map(def => {
                if (def._type === 'link' && def.href) {
                    // Find the text for this link to be sure
                    const linkChild = block.children.find(c => c.marks && c.marks.includes(def._key));
                    const text = linkChild ? linkChild.text : '';

                    // Update if text is "ヒューマンライフケア" OR if it's the broken link
                    if (text === 'ヒューマンライフケア' || def.href.includes('<a href') || def.href.includes('valuecommerce')) {
                        console.log(`Found target link in block ${block._key || 'unknown'}`);
                        console.log(`   Text: ${text}`);
                        console.log(`   Old URL: ${def.href}`);
                        console.log(`   New URL: ${NEW_URL}`);
                        updated = true;
                        return { ...def, href: NEW_URL };
                    }
                }
                return def;
            });
            return { ...block, markDefs: newMarkDefs };
        }
        return block;
    });

    if (updated) {
        await client.patch(post._id)
            .set({ body: newBody })
            .commit();
        console.log('✅ Article updated successfully!');
    } else {
        console.log('⚠️ No broken links found to update.');
    }
}

main().catch(console.error);
