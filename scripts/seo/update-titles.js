const { createClient } = require('@sanity/client');

const client = createClient({
    projectId: '72m8vhy2',
    dataset: 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
});

const UPDATES = [
    {
        slug: 'nursing-assistant-become-nurse-guide',
        newTitle: '働きながら看護師になるには？最短ルートと奨学金活用法'
    },
    {
        slug: 'nursing-assistant-resume-writing',
        newTitle: '【例文10選】看護助手の履歴書・志望動機の書き方｜そのまま使えるテンプレート'
    }
];

async function main() {
    console.log('Starting title updates...');

    for (const update of UPDATES) {
        const query = `*[_type == "post" && slug.current == "${update.slug}"][0] { _id, title }`;
        const post = await client.fetch(query);

        if (!post) {
            console.error(`Post not found: ${update.slug}`);
            continue;
        }

        console.log(`Updating ${update.slug}...`);
        console.log(`  Old Title: ${post.title}`);
        console.log(`  New Title: ${update.newTitle}`);

        try {
            await client.patch(post._id)
                .set({ title: update.newTitle })
                .commit();
            console.log('  ✅ Success');
        } catch (err) {
            console.error(`  ❌ Failed: ${err.message}`);
        }
    }
    console.log('Done.');
}

main();
