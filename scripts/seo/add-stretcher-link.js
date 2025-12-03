const { createClient } = require('@sanity/client');
const { v4: uuidv4 } = require('uuid');

const client = createClient({
    projectId: '72m8vhy2',
    dataset: 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
});

const randomKey = () => Math.random().toString(36).substring(2, 15);

const TARGET_SLUG = 'nursing-assistant-operating-room-duties';

const ADDITIONS = [
    {
        _type: 'block',
        _key: randomKey(),
        style: 'normal',
        level: 1,
        listItem: 'bullet',
        children: [
            {
                _type: 'span',
                _key: randomKey(),
                text: '安全な患者移送のコツ',
                marks: ['link-stretcher']
            }
        ],
        markDefs: [
            {
                _key: 'link-stretcher',
                _type: 'link',
                href: '/posts/nursing-assistant-patient-transfer-safety'
            }
        ]
    }
];

async function main() {
    console.log(`Fetching post: ${TARGET_SLUG}...`);
    const query = `*[_type == "post" && slug.current == "${TARGET_SLUG}"][0] { _id, body }`;
    const post = await client.fetch(query);

    if (!post) {
        console.error(`Post not found: ${TARGET_SLUG}`);
        return;
    }

    console.log('Appending new link...');
    // Note: We are appending to the existing body. 
    // Since we already added a "Career Up" section in Priority A, 
    // this link might be better placed in a "Related Skills" context or just appended.
    // For simplicity and safety, we append it. 
    // Ideally, we would insert it into a specific section, but without parsing the whole structure, appending is safest.
    // However, to make it look good, let's add a small header if needed, or just append as a bullet point if there's a list.
    // The previous script added a H2 "キャリアアップを目指すなら". 
    // Let's add a new H2 "実務に役立つスキル" before this link to separate it.

    const header = {
        _type: 'block',
        _key: randomKey(),
        style: 'h2',
        children: [{ _type: 'span', _key: randomKey(), text: '実務に役立つスキル' }]
    };

    const newBody = [...(post.body || []), header, ...ADDITIONS];

    try {
        await client.patch(post._id)
            .set({ body: newBody })
            .commit();
        console.log('✅ Success: Link added.');
    } catch (err) {
        console.error(`❌ Failed: ${err.message}`);
    }
}

main();
