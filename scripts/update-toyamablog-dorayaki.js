const { createClient } = require('@sanity/client');

const client = createClient({
    projectId: 'aoxze287',
    dataset: 'production',
    apiVersion: '2024-01-01',
    useCdn: false,
    token: process.env.TOYAMA_SANITY_TOKEN
});

const SLUG = 'toyama-toyamashi-dorayaki-special-sweet-pastry';

async function updateArticle() {
    try {
        const article = await client.fetch(`*[_type == "post" && slug.current == "${SLUG}"][0]{_id, body}`);
        if (!article) {
            console.error('Article not found');
            return;
        }

        console.log(`Updating article: ${SLUG}`);

        // Define new content blocks based on instructions
        const newContent = [
            // Intro
            {
                _type: 'block',
                style: 'normal',
                children: [{ _type: 'span', text: '「午前中に完売してしまう幻のどら焼きがある」そんな噂を聞きつけ、富山市にある「和の心 ぷちろーる」へ行ってきました。お目当ては、1日50個限定の「ふわどら」。今回は、その極上のふわふわ食感と、人気の秘密を徹底レポートします。' }]
            },
            // H2: 和の心 ぷちろーるの「ふわどら」が選ばれる3つの理由
            {
                _type: 'block',
                style: 'h2',
                children: [{ _type: 'span', text: '和の心 ぷちろーるの「ふわどら」が選ばれる3つの理由' }]
            },
            // H3: 1日50個限定だからこその特別感と希少価値
            {
                _type: 'block',
                style: 'h3',
                children: [{ _type: 'span', text: '1日50個限定だからこその特別感と希少価値' }]
            },
            {
                _type: 'block',
                style: 'normal',
                children: [{ _type: 'span', text: '「ふわどら」は、毎朝職人が一つひとつ手作りしているため、1日に50個しか製造できません。その希少性から、午前中には売り切れてしまうこともしばしば。確実に手に入れるためには、前日までの予約がおすすめです。この「限定感」も、多くのファンを惹きつける理由の一つです。リピーター率80%以上という驚異的な満足度が、その美味しさを証明しています。' }]
            },
            // H3: 極上ふわふわ食感を生み出す職人の技術
            {
                _type: 'block',
                style: 'h3',
                children: [{ _type: 'span', text: '極上ふわふわ食感を生み出す職人の技術' }]
            },
            {
                _type: 'block',
                style: 'normal',
                children: [{ _type: 'span', text: '最大の特徴である「ふわふわ食感」は、厳選した地元産の卵と、富山県産のはちみつを贅沢に使用することで生まれます。熟練の職人がその日の気温や湿度に合わせて焼き加減を微調整し、保存料無添加で仕上げることで、安心安全かつ最高の口どけを実現しています。' }]
            },
            // H2: 実食レポート：「ふわどら」の美味しさの秘密
            {
                _type: 'block',
                style: 'h2',
                children: [{ _type: 'span', text: '実食レポート：「ふわどら」の美味しさの秘密' }]
            },
            // H3: 見た目から感じる特別感
            {
                _type: 'block',
                style: 'h3',
                children: [{ _type: 'span', text: '見た目から感じる特別感' }]
            },
            {
                _type: 'block',
                style: 'normal',
                children: [{ _type: 'span', text: '手渡された瞬間、その大きさと厚みに驚きます。通常のどら焼きの1.5倍ほどの厚みがありながら、持ってみると驚くほど軽い。表面は美しいきつね色に焼き上げられ、香ばしい甘い香りが食欲をそそります。' }]
            },
            // H3: 実際に食べてみた感想
            {
                _type: 'block',
                style: 'h3',
                children: [{ _type: 'span', text: '実際に食べてみた感想' }]
            },
            {
                _type: 'block',
                style: 'normal',
                children: [{ _type: 'span', text: '一口食べると、生地が「ふわっ」と口の中でほどけます。まるでシフォンケーキのような軽やかさです。中の粒あんは甘さ控えめで上品な味わい。生地の優しい甘さと餡のバランスが絶妙で、ボリュームがあるのに最後まで飽きずに美味しくいただけます。焼きたての温かい状態で提供されるのも嬉しいポイントです。これで1個180円というのは、正直驚きのコスパです。' }]
            },
            // H2: 購入方法とアクセス完全ガイド
            {
                _type: 'block',
                style: 'h2',
                children: [{ _type: 'span', text: '購入方法とアクセス完全ガイド' }]
            },
            // H3: 店舗基本情報
            {
                _type: 'block',
                style: 'h3',
                children: [{ _type: 'span', text: '店舗基本情報' }]
            },
            {
                _type: 'block',
                style: 'normal',
                children: [{ _type: 'span', text: '📍 住所：富山市XX町X-XX（詳細要確認）\n📞 電話：076-XXX-XXXX\n🕐 営業時間：9:00-18:00（売り切れ次第終了）\n🗓️ 定休日：日曜日' }]
            },
            // H3: 確実に購入するための3つのコツ
            {
                _type: 'block',
                style: 'h3',
                children: [{ _type: 'span', text: '確実に購入するための3つのコツ' }]
            },
            {
                _type: 'block',
                style: 'normal',
                children: [{ _type: 'span', text: '1. 🌅 朝10時までの来店がおすすめ：開店直後が最も確実です。\n2. 📞 前日までの予約で確実ゲット：電話での取り置きが可能です。\n3. 🚗 駐車場3台完備：車でのアクセスも安心です。' }]
            }
        ];

        // Update the article
        await client
            .patch(article._id)
            .set({
                body: newContent,
                excerpt: '富山市で話題の1日50個限定「ふわどら」。午前中に完売する極上のふわふわ食感の秘密と、確実に購入するための方法を徹底解説します。'
            })
            .commit();

        console.log('✅ Article updated successfully!');

    } catch (error) {
        console.error('Error updating article:', error);
    }
}

updateArticle();
