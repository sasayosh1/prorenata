const { createClient } = require('@sanity/client');
const { v4: uuidv4 } = require('uuid');

const client = createClient({
    projectId: '72m8vhy2',
    dataset: 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
});

// Helper to create a random key
const randomKey = () => Math.random().toString(36).substring(2, 15);

const UPDATES = [
    {
        slug: 'nursing-assistant-operating-room-duties',
        additions: [
            {
                _type: 'block',
                _key: randomKey(),
                style: 'h2',
                children: [{ _type: 'span', _key: randomKey(), text: 'キャリアアップを目指すなら' }]
            },
            {
                _type: 'block',
                _key: randomKey(),
                style: 'normal',
                children: [
                    { _type: 'span', _key: randomKey(), text: '👉 ' },
                    {
                        _type: 'span',
                        _key: randomKey(),
                        text: '看護師へのステップアップを目指すなら',
                        marks: ['link-become-nurse']
                    }
                ],
                markDefs: [
                    {
                        _key: 'link-become-nurse',
                        _type: 'link',
                        href: '/posts/nursing-assistant-become-nurse-guide'
                    }
                ]
            }
        ]
    },
    {
        slug: 'nursing-assistant-bottom-myth',
        additions: [
            {
                _type: 'block',
                _key: randomKey(),
                style: 'h2',
                children: [{ _type: 'span', _key: randomKey(), text: '現状を変えたいあなたへ' }]
            },
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
                        text: '資格取得で給与アップを目指す',
                        marks: ['link-become-nurse']
                    }
                ],
                markDefs: [
                    {
                        _key: 'link-become-nurse',
                        _type: 'link',
                        href: '/posts/nursing-assistant-become-nurse-guide'
                    }
                ]
            },
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
                        text: 'より良い条件の職場へ転職する',
                        marks: ['link-resume']
                    }
                ],
                markDefs: [
                    {
                        _key: 'link-resume',
                        _type: 'link',
                        href: '/posts/nursing-assistant-resume-writing'
                    }
                ]
            }
        ]
    }
];

async function main() {
    console.log('Starting internal link additions...');

    for (const update of UPDATES) {
        const query = `*[_type == "post" && slug.current == "${update.slug}"][0] { _id, body }`;
        const post = await client.fetch(query);

        if (!post) {
            console.error(`Post not found: ${update.slug}`);
            continue;
        }

        console.log(`Updating ${update.slug}...`);

        // Append new blocks to the body
        const newBody = [...(post.body || []), ...update.additions];

        try {
            await client.patch(post._id)
                .set({ body: newBody })
                .commit();
            console.log('  ✅ Success');
        } catch (err) {
            console.error(`  ❌ Failed: ${err.message}`);
        }
    }
    console.log('Done.');
}

main();
