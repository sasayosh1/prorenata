const { createClient } = require('@sanity/client');

const client = createClient({
    projectId: '72m8vhy2',
    dataset: 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
});

async function testSpeechBubble() {
    console.log('Testing Speech Bubble Schema...');

    const doc = {
        _type: 'post',
        title: 'Speech Bubble Test',
        slug: { current: 'speech-bubble-test-' + Date.now() },
        body: [
            {
                _type: 'block',
                children: [{ _type: 'span', text: 'This is a test post.' }],
                markDefs: [],
                style: 'normal'
            },
            {
                _type: 'speechBubble',
                speaker: 'sera',
                emotion: 'happy',
                position: 'left',
                text: 'こんにちは！これはテスト用の吹き出しです。'
            },
            {
                _type: 'speechBubble',
                speaker: 'patient',
                emotion: 'normal',
                position: 'right',
                text: '右側にも表示できますか？'
            }
        ],
        internalOnly: true // Don't show in lists
    };

    try {
        const res = await client.create(doc);
        console.log('✅ Created test document:', res._id);

        // Clean up
        await client.delete(res._id);
        console.log('✅ Deleted test document');

    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

testSpeechBubble();
