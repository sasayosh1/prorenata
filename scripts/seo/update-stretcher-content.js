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

const SLUG = 'nursing-assistant-patient-transfer-safety';

const NEW_CONTENT = [
    {
        _type: 'block',
        _key: randomKey(),
        style: 'h2',
        children: [{ _type: 'span', _key: randomKey(), text: 'シーン別ストレッチャー操作のコツ' }]
    },
    {
        _type: 'block',
        _key: randomKey(),
        style: 'normal',
        children: [{ _type: 'span', _key: randomKey(), text: 'ストレッチャーでの移動は、平坦な道ばかりではありません。坂道やエレベーターなど、注意が必要なシーンでの正しい操作方法を解説します。' }]
    },
    {
        _type: 'block',
        _key: randomKey(),
        style: 'h3',
        children: [{ _type: 'span', _key: randomKey(), text: '坂道（上り・下り）での注意点' }]
    },
    {
        _type: 'block',
        _key: randomKey(),
        style: 'normal',
        children: [{ _type: 'span', _key: randomKey(), text: '坂道では、患者さんの頭の位置が常に高くなるように操作するのが基本です。これにより、患者さんの不安感を軽減し、転落のリスクを下げることができます。' }]
    },
    {
        _type: 'block',
        _key: randomKey(),
        style: 'normal',
        level: 1,
        listItem: 'bullet',
        children: [
            { _type: 'span', _key: randomKey(), text: '上り坂：患者さんの頭側（頭部）を先頭にして進みます。スタッフは後方から押すか、前方から引きますが、患者さんの顔が見える位置にいると安心感を与えられます。' }
        ]
    },
    {
        _type: 'block',
        _key: randomKey(),
        style: 'normal',
        level: 1,
        listItem: 'bullet',
        children: [
            { _type: 'span', _key: randomKey(), text: '下り坂：患者さんの足側（足部）を先頭にして進みます。スタッフは頭側でストレッチャーを支えながら、スピードが出過ぎないようにゆっくりと下ります。' }
        ]
    },
    {
        _type: 'block',
        _key: randomKey(),
        style: 'h3',
        children: [{ _type: 'span', _key: randomKey(), text: 'エレベーターの乗り降り' }]
    },
    {
        _type: 'block',
        _key: randomKey(),
        style: 'normal',
        children: [{ _type: 'span', _key: randomKey(), text: 'エレベーターの乗り降りは、扉に挟まれる事故を防ぐため、スタッフの位置取りが重要です。' }]
    },
    {
        _type: 'block',
        _key: randomKey(),
        style: 'normal',
        level: 1,
        listItem: 'bullet',
        children: [
            { _type: 'span', _key: randomKey(), text: '乗るとき：スタッフが先にエレベーター内に入り、ストレッチャーの頭側を引いて乗り込みます。これにより、スタッフが扉の開閉操作を確実に行えます。' }
        ]
    },
    {
        _type: 'block',
        _key: randomKey(),
        style: 'normal',
        level: 1,
        listItem: 'bullet',
        children: [
            { _type: 'span', _key: randomKey(), text: '降りるとき：足側から先に降ろします。スタッフは後方から押し出す形になりますが、扉が閉まらないよう注意しながら進みます。' }
        ]
    }
];

async function main() {
    console.log(`Fetching post: ${SLUG}...`);
    const query = `*[_type == "post" && slug.current == "${SLUG}"][0] { _id, body }`;
    const post = await client.fetch(query);

    if (!post) {
        console.error(`Post not found: ${SLUG}`);
        return;
    }

    console.log('Appending new content...');
    const newBody = [...(post.body || []), ...NEW_CONTENT];

    try {
        await client.patch(post._id)
            .set({ body: newBody })
            .commit();
        console.log('✅ Success: Content added.');
    } catch (err) {
        console.error(`❌ Failed: ${err.message}`);
    }
}

main();
