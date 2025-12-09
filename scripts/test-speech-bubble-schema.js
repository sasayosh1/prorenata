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
        title: 'Speech Bubble Feature Test',
        slug: { current: 'speech-bubble-test-' + Date.now() },
        body: [
            {
                _type: 'block',
                children: [{ _type: 'span', text: '吹き出し機能の表示テストです。' }],
                markDefs: [],
                style: 'normal'
            },
            {
                _type: 'speechBubble',
                speaker: 'sera',
                emotion: 'normal',
                position: 'left',
                text: 'こんにちは！（通常・左）'
            },
            {
                _type: 'speechBubble',
                speaker: 'sera',
                emotion: 'happy',
                position: 'left',
                text: '笑顔のアイコンです！（笑顔・左）'
            },
            {
                _type: 'speechBubble',
                speaker: 'sera',
                emotion: 'sad',
                position: 'left',
                text: '悲しみのアイコンです...（悲しみ・左）'
            },
            {
                _type: 'speechBubble',
                speaker: 'patient',
                emotion: 'normal',
                position: 'right',
                text: '患者さんのアイコンです。（通常・右）'
            },
            {
                _type: 'speechBubble',
                speaker: 'nurse',
                emotion: 'angry',
                position: 'right',
                text: '先輩ナースのアイコンです。（怒り・右）'
            }
        ],
        internalOnly: true // Don't show in lists
    };

    try {
        const res = await client.create(doc);
        console.log('✅ Created test document:', res._id);
        console.log(`👉 View at: http://localhost:3000/posts/${doc.slug.current}`);

    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

testSpeechBubble();
