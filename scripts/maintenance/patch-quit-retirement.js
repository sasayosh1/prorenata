
import { randomUUID } from 'crypto';

const PROJECT_ID = '72m8vhy2';
const DATASET = 'production';
const TOKEN = 'skvhUA9WNYFdx3yTa1f462Z94kUyzLnBpWab0kTY1NA5e8ahqhe6pZfCDeftW6mWAnB7dPazt1bd2bZd8';
const DOCUMENT_ID = 'a6a2d243-1cb5-4271-898c-658064bc540e';
const DRAFT_ID = `drafts.${DOCUMENT_ID}`;

function createSpan(text, marks = []) {
    return {
        _key: randomUUID(),
        _type: 'span',
        marks: marks,
        text: text
    };
}

function createBlock(textOrSpans, style = 'normal', listItem = null) {
    const spans = Array.isArray(textOrSpans)
        ? textOrSpans
        : [createSpan(textOrSpans)];

    const block = {
        _key: randomUUID(),
        _type: 'block',
        children: spans,
        markDefs: [],
        style: style
    };

    if (listItem) {
        block.listItem = listItem;
        block.level = 1;
    }

    return block;
}

function createLinkBlock(leadText, linkText, href, style = 'normal') {
    const linkKey = 'link-' + randomUUID().slice(0, 8);
    return {
        _key: randomUUID(),
        _type: 'block',
        children: [
            { _key: randomUUID(), _type: 'span', text: leadText, marks: [] },
            { _key: randomUUID(), _type: 'span', text: linkText, marks: [linkKey] }
        ],
        markDefs: [
            { _key: linkKey, _type: 'link', href: href }
        ],
        style: style
    };
}

const bodyBlocks = [
    // PR
    createBlock('PR', 'normal'),
    createBlock('当記事はアフィリエイト広告を利用しています。選定基準については運営方針をご覧ください。', 'normal'),

    // Intro
    createBlock('イントロダクション', 'normal'),
    createBlock('看護助手として「もう限界かも」と感じるのは珍しくありません。人手不足、夜勤続き、理不尽なやり取り。わたし自身も現場で同じ壁にぶつかり、体も心もすり減った経験があります。', 'normal'),
    createBlock('こうしたしんどさは、あなた一人のせいではありません。現場の構造的な負荷が重なっているだけです。まずは自分を責めず、「どう動けば安全で後悔の少ない道を選べるか」を一緒に整理しましょう。', 'normal'),

    // Section 1
    createBlock('看護助手が辞めたいと感じるリアルな理由', 'h2'),
    createBlock('給料が上がりにくく、責任や業務量に見合わないと感じること。人手不足で休憩も削られ、感謝より「もっとやって」が多い現場。コミュニケーションのすれ違いで心が削られ、腰や膝の痛みが蓄積し、夜勤で生活リズムが壊れていく。', 'normal'),
    createBlock('どれもよくある悩みで、あなたが弱いわけではありません。まずは「つらい」と口に出していい。そう受け止めてください。', 'normal'),
    createBlock('参考: 厚生労働省 職業情報提供サイト（看護助手）', 'normal'),

    // Section 2
    createBlock('退職を考えたらまずやるべき準備', 'h2'),
    createBlock('退職理由の整理：本音（負担、賃金、人間関係）と、伝える建前（家庭都合、キャリア見直し）を切り分けておくと話しやすくなります。', 'normal', 'bullet'),
    createBlock('有給残日数の確認と消化計画：退職日から逆算して、早めに申請するスケジュールをメモに。', 'normal', 'bullet'),
    createBlock('給与締め日、保険、離職票の確認：月末締めか、社保切替・雇用保険手続きのスケジュールを把握しておくと安心です。', 'normal', 'bullet'),
    createBlock('トラブル防止メモ：上司とのやり取り、引き継ぎ内容、シフト調整を簡単に記録しておくと交渉の根拠になります。', 'normal', 'bullet'),
    createBlock('信頼できる人に相談：同僚、家族、労組、専門窓口。感情の整理と第三者の視点があるだけで、決断の重さが少し軽くなるはずです。', 'normal', 'bullet'),
    createBlock('参考: NsPace Career 看護助手の転職・年収コラム', 'normal'),

    // Section 3
    createBlock('看護助手が取れる3つの退職方法', 'h2'),
    createBlock('自分で退職を伝える', 'h3'),
    createBlock('費用ゼロで進められます。職場との関係が極端に悪くなく、交渉に慣れている人向け。引き継ぎを自分で段取りできる余力があるなら、もっともシンプルです。', 'normal'),

    createBlock('退職代行サービスを利用する', 'h3'),
    createBlock('連絡や交渉を任せられます。上司と話すのが怖い、ハラスメントがある、即日で職場を離れたい場合に有効。弁護士・労組運営を選べば法的にも安心度が高くなります。', 'normal'),

    createBlock('サポートを受けながら自分で伝える（セルフ退職）', 'h3'),
    createBlock('テンプレや相談を受けつつ、自分名義で進める方法。コストを抑えたいが手順に不安がある人向けです。メッセージ文例が欲しいときにも有効。', 'normal'),

    createBlock('比較の目安', 'h4'),
    createBlock('・自分で伝える: 0円 / 即日性△ / 法的安心度△', 'normal'),
    createBlock('・退職代行: 数万円 / 即日性◎ / 法的安心度○〜◎（弁護士・労組なら◎）', 'normal'),
    createBlock('・セルフ退職: 低〜中コスト / 即日性○（テンプレ依存） / 安心度△〜○', 'normal'),
    createBlock('それぞれの方法で「いまの自分にとって何が一番ラクか」を基準に選んで大丈夫です。', 'normal'),

    // Section 4
    createBlock('退職代行を使う場合・使わない場合の差分', 'h2'),
    createBlock('使わない場合：上司との面談や引き継ぎの段取りを自分で行う必要があります。日程調整のストレスはあるものの、費用を抑えられます。関係が悪くない職場なら、円満退職しやすいメリットもあります。', 'normal'),
    createBlock('使う場合：連絡や交渉を任せられるので、心理的・時間的な負担が大きく減ります。特にハラスメントや強い引き止めがある場合、第三者が間に入ることで安全に進められます。', 'normal'),
    createBlock('選び方のポイント：弁護士・労組など合法運営か、医療介護の相談実績があるか、24時間相談できるか、即日対応の可否。', 'normal'),

    // Section 5
    createBlock('自分で退職を伝える場合のポイント', 'h2'),
    createBlock('伝え方テンプレ：「家庭の事情で○月末に退職を希望します。引き継ぎは文書で準備しますので、日程をご相談させてください。」', 'normal', 'bullet'),
    createBlock('本音を建前に変える：人手不足→家庭都合・キャリア見直し、賃金不満→別分野で経験を積みたい。', 'normal', 'bullet'),
    createBlock('引き止め回避：退職日は確定ベースで伝え、延長は難しいと先に言う。引き継ぎ内容と期限をセットで提示し、感情論ではなくスケジュールで会話する。', 'normal', 'bullet'),
    createBlock('スケジュール：意思表明→退職日確定→引き継ぎ→有給消化→離職票・証明書の受領。無理せず少しずつ進める。', 'normal', 'bullet'),

    // Section 6
    createBlock('退職代行サービスの安全性と選び方', 'h2'),
    createBlock('弁護士／労働組合を推奨：法的交渉や書類対応を適法に行えるため、未払賃金や有休消化の交渉も安心度が上がります。', 'normal', 'bullet'),
    createBlock('非弁業者のリスク：不当請求、手続き不備、トラブル時に対応できない可能性があります。合法運営か、実績と口コミをできるだけ確認。', 'normal', 'bullet'),
    createBlock('医療現場で起こりがちなトラブル：有休消化の交渉がうまくいかない、退職書類が遅れる、引き継ぎ拒否を理由に退職を渋られるなど。', 'normal', 'bullet'),
    createBlock('進行イメージ：無料相談→申込・支払い→会社連絡（代行）→退職意思伝達→書類・精算確認→完了。流れを知るだけでも不安は軽くなります。', 'normal', 'bullet'),

    // Section 7
    createBlock('安心して利用できる退職代行サービス比較（3社）', 'h2'),
    createBlock('弁護士法人みやび（法的安心・全国対応）', 'h3'),
    createBlock('弁護士が直接対応し、未払賃金やハラスメント交渉も相談可。医療・介護の実績が多く、書類や有休消化にも配慮。非弁リスクを避けたい人に向きます。', 'normal'),

    createBlock('退職代行 即ヤメ（スピード・24時間相談）', 'h3'),
    createBlock('LINEで24時間相談でき、即日退職を目指しやすい。連絡を自分で取りたくない人、夜間相談したい人向け。スピード優先で動きたいときに。', 'normal'),

    createBlock('弁護士法人ガイア法律事務所（医療介護の相談実績）', 'h3'),
    createBlock('医療・介護案件の経験が多く、就業規則や引き継ぎ手順にも配慮。LINE/メール相談で進めやすく、現場事情を理解してほしい人向け。', 'normal'),

    createBlock('推奨理由（公平・中立）', 'h4'),
    createBlock('非弁リスクを避け、医療介護の相談実績と即日性・安心度を基準に3社を掲載。どれが自分に合うか、特徴から選びましょう。', 'normal'),

    // FAQ
    createBlock('よくある質問（FAQ）', 'h2'),
    createBlock('Q: 即日退職はできる？', 'normal', 'bullet'),
    createBlock('A: 代行を使えば可能性が高い。弁護士・労組系が安心。', 'normal'),
    createBlock('Q: 夜勤中でも辞められる？', 'normal', 'bullet'),
    createBlock('A: 原則シフト調整後が望ましいが、体調や安全次第では早めに相談を。', 'normal'),
    createBlock('Q: 有給は使える？', 'normal', 'bullet'),
    createBlock('A: 未消化分は取得を主張できる。退職日から逆算して計画的に申請を。', 'normal'),
    createBlock('Q: 退職後の職場の反応は？', 'normal', 'bullet'),
    createBlock('A: 手続きが適法に済めば過度に気にしなくてOK。', 'normal'),
    createBlock('Q: トラブルが起きたら？', 'normal', 'bullet'),
    createBlock('A: 記録を残し、弁護士・労組・信頼できる代行へ相談。非弁業者は避ける。', 'normal'),

    createBlock('「辞めてもいい」「限界なら逃げてもいい」。あなたの健康と人生が最優先です。無料相談も活用し、無理をせず次の一歩へ進んでください。安心して退職するための選択肢は、できるだけあります。', 'normal'),

    // Summary (NEW VERSION)
    createBlock('まとめ', 'h2'),
    createBlock('「自分で退職を伝える」「退職代行サービスを利用する」「サポートを受けながら自分で伝える（セルフ退職）」の3つの視点で整理しました。', 'normal'),
    createBlock('忙しい日でも取り入れやすいヒントは、次の通りです。', 'normal'),
    createBlock('自分で伝える方法に目を向ける', 'normal', 'bullet'),
    createBlock('退職代行サービスに目を向ける', 'normal', 'bullet'),
    createBlock('セルフ退職という選択肢に目を向ける', 'normal', 'bullet'),
    createBlock('退職の段取りを進める前に、退職と転職の比較記事でチェックポイントを整理しておきましょう。', 'normal'),

    createLinkBlock('・退職：', 'おすすめ退職代行3社比較', '/posts/comparison-of-three-resignation-agencies'),
    createLinkBlock('・転職：', '看護助手向け転職サービス3社比較', '/posts/nursing-assistant-compare-services-perspective'),

    // Disclaimer
    createBlock('免責事項と情報の取り扱いについて', 'normal'),
    createBlock('当サイトの記事は、厚生労働省の資料や一般的な業界慣習、複数の求人データに基づき作成していますが、すべてのケースに当てはまることを保証するものではありません。', 'normal'),
    createBlock('医療行為、労務トラブル、税務、給与計算など個別の判断が必要な場合は、必ず医師・弁護士・税理士・社会保険労務士等の専門家にご相談ください。', 'normal'),
    createBlock('※紹介しているサービスや求人条件は、記事公開/更新時点の情報です。最新の詳細は各公式サイトにて必ずご確認ください。', 'normal')
];

async function updateArticle() {
    const url = `https://${PROJECT_ID}.api.sanity.io/v2024-01-01/data/mutate/${DATASET}`;
    const mutations = [
        {
            patch: {
                id: DOCUMENT_ID,
                set: {
                    body: bodyBlocks
                }
            }
        },
        {
            patch: {
                id: DRAFT_ID,
                set: {
                    body: bodyBlocks
                }
            }
        },
        {
            delete: {
                id: DRAFT_ID
            }
        }
    ];

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${TOKEN}`
        },
        body: JSON.stringify({ mutations })
    });

    const json = await res.json();
    if (res.ok) {
        console.log('Successfully updated article:', json);
    } else {
        console.error('Failed to update article:', json);
        process.exit(1);
    }
}

updateArticle();
