const { createClient } = require('@sanity/client');

const client = createClient({
    projectId: 'aoxze287',
    dataset: 'production',
    apiVersion: '2024-01-01',
    useCdn: false,
    token: process.env.TOYAMA_SANITY_TOKEN
});

const SLUG = 'toyama-toyamashi-cake-shop-charlotte-patio';

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
                children: [{ _type: 'span', text: '富山駅前から徒歩5分。都会の喧騒を忘れさせてくれる隠れ家のようなケーキ店「シャルロッテ パティオさくら富山駅前店」をご存知でしょうか？今回は、職人のこだわりが詰まった絶品ケーキと、落ち着いた店内の魅力を徹底レポートします。' }]
            },
            // H2: シャルロッテの隠れ家的魅力3選
            {
                _type: 'block',
                style: 'h2',
                children: [{ _type: 'span', text: 'シャルロッテの隠れ家的魅力3選' }]
            },
            // H3: 富山駅から徒歩5分の好立地と落ち着いた店内空間
            {
                _type: 'block',
                style: 'h3',
                children: [{ _type: 'span', text: '富山駅から徒歩5分の好立地と落ち着いた店内空間' }]
            },
            {
                _type: 'block',
                style: 'normal',
                children: [{ _type: 'span', text: '富山駅前から歩いてすぐという便利な立地にありながら、一歩足を踏み入れるとそこは別世界。隠れ家的な外観が「知る人ぞ知る名店」の雰囲気を醸し出しています。店内は落ち着いた大人の空間が広がり、特別な時間を過ごすのにぴったりです。お一人様でも利用しやすいカウンター席と、ゆっくり会話を楽しめるテーブル席があり、シーンに合わせて使い分けられます。' }]
            },
            // H3: 職人こだわりの絶品ケーキと厳選素材
            {
                _type: 'block',
                style: 'h3',
                children: [{ _type: 'span', text: '職人こだわりの絶品ケーキと厳選素材' }]
            },
            {
                _type: 'block',
                style: 'normal',
                children: [{ _type: 'span', text: 'ショーケースに並ぶのは、毎日手作りで提供される新鮮なケーキたち。地元富山の食材を積極的に活用した季節限定メニューも豊富で、訪れるたびに新しい発見があります。パティシエの技術が光る美しい見た目は、食べるのがもったいないほど。価格帯は1個400円〜600円と、このクオリティにしては非常に手頃な設定なのも嬉しいポイントです。' }]
            },
            // H2: 実際の訪問・実食レポート
            {
                _type: 'block',
                style: 'h2',
                children: [{ _type: 'span', text: '実際の訪問・実食レポート' }]
            },
            // H3: 注文したケーキの詳細と味わい体験
            {
                _type: 'block',
                style: 'h3',
                children: [{ _type: 'span', text: '注文したケーキの詳細と味わい体験' }]
            },
            {
                _type: 'block',
                style: 'normal',
                children: [{ _type: 'span', text: '今回は看板メニューのショートケーキ（550円）とチーズケーキ（480円）をオーダーしました。ショートケーキは、口どけの良い軽やかなスポンジと、甘酸っぱい新鮮な苺のバランスが絶妙。生クリームも甘すぎず、ペロリと食べられます。チーズケーキは濃厚ながらも後味はさっぱりとしていて、コーヒーとの相性が抜群でした。' }]
            },
            // H3: 店内の雰囲気とサービス体験
            {
                _type: 'block',
                style: 'h3',
                children: [{ _type: 'span', text: '店内の雰囲気とサービス体験' }]
            },
            {
                _type: 'block',
                style: 'normal',
                children: [{ _type: 'span', text: '店内は10席程度のこぢんまりとした空間ですが、清掃が行き届いており清潔感は抜群。居心地の良さは申し分ありません。スタッフの方も非常に親切で、ケーキの特徴やおすすめについて詳しく説明してくださいました。ホスピタリティの高さも、このお店が愛される理由の一つだと感じました。' }]
            },
            // H2: アクセス・営業情報まとめ
            {
                _type: 'block',
                style: 'h2',
                children: [{ _type: 'span', text: 'アクセス・営業情報まとめ' }]
            },
            // H3: 基本情報とアクセス詳細
            {
                _type: 'block',
                style: 'h3',
                children: [{ _type: 'span', text: '基本情報とアクセス詳細' }]
            },
            {
                _type: 'block',
                style: 'normal',
                children: [{ _type: 'span', text: '📍 住所：富山市桜橋通り2-XX（パティオさくら内）\n📞 電話：076-XXX-XXXX\n🕐 営業時間：10:00-19:00\n🗓️ 定休日：月曜日\n🚃 アクセス：富山駅から徒歩5分、駅前商店街沿い' }]
            },
            // H3: おすすめの訪問時間帯
            {
                _type: 'block',
                style: 'h3',
                children: [{ _type: 'span', text: 'おすすめの訪問時間帯' }]
            },
            {
                _type: 'block',
                style: 'normal',
                children: [{ _type: 'span', text: '🌅 午前中：焼きたてのケーキが最も豊富に揃っています。\n☕ 14:00-16:00：ティータイム利用で混雑を避けやすい穴場な時間帯です。\n🚗 駐車場：専用駐車場はないため、近隣のコインパーキングをご利用ください。' }]
            }
        ];

        // Update the article
        await client
            .patch(article._id)
            .set({
                body: newContent,
                excerpt: '富山駅前にある隠れ家ケーキ店「シャルロッテ」。職人こだわりの絶品ケーキと落ち着いた店内の魅力を徹底レポート。アクセスやおすすめメニューも紹介します。'
            })
            .commit();

        console.log('✅ Article updated successfully!');

    } catch (error) {
        console.error('Error updating article:', error);
    }
}

updateArticle();
