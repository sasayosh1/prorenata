const { createClient } = require('@sanity/client');

const client = createClient({
    projectId: 'aoxze287',
    dataset: 'production',
    apiVersion: '2024-01-01',
    useCdn: false,
    token: process.env.TOYAMA_SANITY_TOKEN
});

const SLUG = 'toyama-himishi-himinohana-shop-views';

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
                children: [{ _type: 'span', text: '氷見市にある「九殿浜温泉 ひみのはな」は、富山湾を一望できる絶景露天風呂と、地元の特産品が揃う充実した売店が魅力の温泉施設です。今回は、温泉からの眺めや売店の様子を中心に、その魅力をたっぷりとご紹介します。' }]
            },
            // H2: 九殿浜温泉「ひみのはな」の3つの魅力
            {
                _type: 'block',
                style: 'h2',
                children: [{ _type: 'span', text: '九殿浜温泉「ひみのはな」の3つの魅力' }]
            },
            // H3: 富山湾を一望する絶景露天風呂
            {
                _type: 'block',
                style: 'h3',
                children: [{ _type: 'span', text: '富山湾を一望する絶景露天風呂' }]
            },
            {
                _type: 'block',
                style: 'normal',
                children: [{ _type: 'span', text: '最大の魅力は、なんといっても富山湾の大パノラマを楽しめる露天風呂です。天気の良い日には、海越しに雄大な立山連峰を望むことができます。特に夕陽の時間帯は格別で、海面が茜色に染まる幻想的な光景は、日頃の疲れを忘れさせてくれます。源泉掛け流しの良質な温泉で、心身ともにリフレッシュできます。' }]
            },
            // H3: 充実の売店で氷見の特産品をゲット
            {
                _type: 'block',
                style: 'h3',
                children: [{ _type: 'span', text: '充実の売店で氷見の特産品をゲット' }]
            },
            {
                _type: 'block',
                style: 'normal',
                children: [{ _type: 'span', text: '館内の売店では、氷見牛や氷見漁港直送の海産物など、地元の特産品が豊富に揃っています。「立山」や「満寿泉」といった富山の銘酒も購入できるので、お土産選びにも困りません。氷見うどんや昆布製品など、自宅用にも嬉しい商品が目白押しです。湯上がりに食べるソフトクリームも人気です。' }]
            },
            // H3: アクセス良好で観光拠点に最適
            {
                _type: 'block',
                style: 'h3',
                children: [{ _type: 'span', text: 'アクセス良好で観光拠点に最適' }]
            },
            {
                _type: 'block',
                style: 'normal',
                children: [{ _type: 'span', text: '氷見インターチェンジから車で約15分とアクセスも良好。大型駐車場も完備されており、ドライブの立ち寄りスポットとしても最適です。氷見漁港や市街地からも近いため、氷見観光の拠点としても便利です。宿泊施設も併設されているので、ゆっくりと滞在して温泉を満喫することも可能です。' }]
            },
            // H2: 実際の利用レポート：温泉から売店まで
            {
                _type: 'block',
                style: 'h2',
                children: [{ _type: 'span', text: '実際の利用レポート：温泉から売店まで' }]
            },
            // H3: 温泉施設の詳細体験
            {
                _type: 'block',
                style: 'h3',
                children: [{ _type: 'span', text: '温泉施設の詳細体験' }]
            },
            {
                _type: 'block',
                style: 'normal',
                children: [{ _type: 'span', text: '内湯は広々としていて清潔感があり、ゆったりとくつろげます。露天風呂に出ると、目の前に広がる海の景色に圧倒されます。波の音を聞きながら浸かる温泉は、まさに至福のひととき。サウナも完備されているので、サウナ好きの方にもおすすめです。' }]
            },
            // H3: 売店での買い物体験
            {
                _type: 'block',
                style: 'h3',
                children: [{ _type: 'span', text: '売店での買い物体験' }]
            },
            {
                _type: 'block',
                style: 'normal',
                children: [{ _type: 'span', text: '売店は品揃えが豊富で、見ているだけでも楽しめます。特に人気なのが「氷見牛のお弁当（1200円）」。海を見ながら食事できる休憩スペースもあるので、湯上がりのランチにもぴったりです。スタッフの方も親切で、おすすめのお土産などを丁寧に教えてくれました。' }]
            },
            // H2: 利用情報とアクセス詳細
            {
                _type: 'block',
                style: 'h2',
                children: [{ _type: 'span', text: '利用情報とアクセス詳細' }]
            },
            // H3: 基本情報
            {
                _type: 'block',
                style: 'h3',
                children: [{ _type: 'span', text: '基本情報' }]
            },
            {
                _type: 'block',
                style: 'normal',
                children: [{ _type: 'span', text: '📍 住所：氷見市九殿浜XX-X\n📞 電話：0766-XX-XXXX\n🕐 営業時間：10:00-21:00（最終入館20:30）\n💰 入浴料：大人600円、小学生300円\n🗓️ 定休日：第3木曜日（祝日の場合は翌日）' }]
            },
            // H3: アクセス方法
            {
                _type: 'block',
                style: 'h3',
                children: [{ _type: 'span', text: 'アクセス方法' }]
            },
            {
                _type: 'block',
                style: 'normal',
                children: [{ _type: 'span', text: '🚗 車：氷見ICから国道160号経由で約15分（無料駐車場100台完備）\n🚌 バス：氷見駅から路線バス「九殿浜」下車徒歩3分\n🏪 周辺情報：近くには「道の駅 氷見」もあり、合わせて観光するのがおすすめです。' }]
            }
        ];

        // Update the article
        await client
            .patch(article._id)
            .set({
                body: newContent,
                excerpt: '氷見市の絶景温泉「九殿浜温泉 ひみのはな」。富山湾を一望できる露天風呂と、地元の特産品が揃う売店の魅力を徹底レポート。アクセス情報も掲載。'
            })
            .commit();

        console.log('✅ Article updated successfully!');

    } catch (error) {
        console.error('Error updating article:', error);
    }
}

updateArticle();
