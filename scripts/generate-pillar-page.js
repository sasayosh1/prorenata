require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')
const { GoogleGenerativeAI } = require("@google/generative-ai")
const fs = require('fs')

const client = createClient({
    projectId: process.env.SANITY_PROJECT_ID || '72m8vhy2',
    dataset: process.env.SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false
})

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const PROMPT = `あなたは「白崎セラ（Sera Shirasaki）」というペルソナを持つ、現役の精神科看護助手（20歳）でありブロガーです。
以下のルールと構成案に従って、読者の「面接への恐怖・不安」に寄り添いつつ具体的な行動に導く、最高品質のまとめ記事（ピラーページ）をMarkdown形式（見出し、本文のみ）で執筆してください。

【ペルソナ・トーン＆マナー】
- 文体：冷静、分析的、親切だが迎合しない。（〜です、〜ます調）
- 役割：静かな自信を持つ「実用的な案内人（杖）」。
- 感情に寄り添うが、結論は常に「具体的で再現性のある構造化された行動」を提示する。
- 読者を無駄に煽ったり、過剰にポジティブな言葉（「絶対頑張りましょう！」「あなたならできます！」等）は使わない。
- 「肯定的な諦念（無理なものは無理、できる範囲でやる）」のスタンス。

【記事のテーマ】
看護助手の面接・履歴書ロードマップ｜採用されるための5つのステップ

【構成案】
■ 導入（Introduction）
- 面接、嫌ですよね。私も履歴書の真っ白な枠を見るだけでため息が出ていました。
- でも大丈夫です。この記事は、ゼロから面接当日までの見取り図です。上から順番に読んでいけば、自然と準備が整うように整理しました。

■ STEP1：まずは「一番しんどい作業」を終わらせる（履歴書の作成）
- 手書きで悩む時間をショートカットする提案。
- ※内部リンク予定箇所：「志望動機・自己PRの書き方」

■ STEP2：面接官が「本当に見ていること」を知る
- スキルよりも「長く続けられそうか」「人柄はどうか（患者さんを刺激しないか）」を見ているというリアルな視点。
- ※内部リンク予定箇所：「体力に自信あります」のアピール方法

■ STEP3：よく聞かれる質問への「解答の型」を作る
- 想定問答集。丸暗記ではなく、自分の言葉で答えるための型。
- ※内部リンク予定箇所：「よく聞かれる質問と回答例」

■ STEP4：【盲点】逆質問と当日のマナー
- 「何か質問はありますか？」と聞かれたときの最強の返し方。服装や身だしなみのチェックリスト。

■ STEP5：「一人で戦わない」という最終手段（面接同行サポート）
- 面接がどうしても怖い人へ向けた最後の杖の提示。
- 一人で無理なら、プロの杖を借りましょう。派遣会社の担当者さんは、面接の場に一緒に座ってフォローしてくれたりします。

■ まとめ（Conclusion）
- 準備をすればするほど、緊張は『不安』から『覚悟』に変わります。あなたが良い職場に出会えますように。

【重要ルール】
- 各H2見出し（STEP1〜5など）の構成を厳守すること。
- HTMLやSanityのコードは出力せず、純粋なMarkdown（# や ## などの見出しとテキスト）のみを出力すること。`;

function markdownToPortableText(markdown) {
    // 簡易的なMarkdown -> Portable Text変換（HeadingとParagraphのみ）
    const blocks = [];
    const lines = markdown.split('\n');
    let currentParagraph = [];

    const flushParagraph = () => {
        if (currentParagraph.length > 0) {
            blocks.push({
                _type: 'block',
                style: 'normal',
                children: [{ _type: 'span', text: currentParagraph.join('\n') }],
                markDefs: []
            });
            currentParagraph = [];
        }
    };

    lines.forEach(line => {
        if (line.trim().startsWith('### ')) {
            flushParagraph();
            blocks.push({
                _type: 'block',
                style: 'h3',
                children: [{ _type: 'span', text: line.replace('### ', '').trim() }],
                markDefs: []
            });
        } else if (line.trim().startsWith('## ')) {
            flushParagraph();
            blocks.push({
                _type: 'block',
                style: 'h2',
                children: [{ _type: 'span', text: line.replace('## ', '').trim() }],
                markDefs: []
            });
        } else if (line.trim().startsWith('# ')) {
            flushParagraph();
            blocks.push({
                _type: 'block',
                style: 'h2', // Sanity usually starts at h2 for body content
                children: [{ _type: 'span', text: line.replace('# ', '').trim() }],
                markDefs: []
            });
        } else if (line.trim() === '') {
            flushParagraph();
        } else {
            currentParagraph.push(line);
        }
    });
    flushParagraph();
    return blocks;
}

async function main() {
    console.log("Generating article via Gemini 1.5 Pro...")

    // We use gemini-2.5-pro for high quality writing
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" })

    // Safety settings to ensure no blocks
    const result = await model.generateContent(PROMPT)
    const response = await result.response
    const text = response.text()

    console.log("Saving raw markdown backup...")
    fs.writeFileSync('draft_pillar_page.md', text)

    console.log("Converting to Portable Text...")
    const portableTextBody = markdownToPortableText(text)

    // Append Internal Links blocks programmatically
    const insertLink = (stepKeyword, text, _ref) => {
        const stepIndex = portableTextBody.findIndex(b => b.style === 'h2' && b.children[0].text.includes(stepKeyword))
        if (stepIndex !== -1) {
            portableTextBody.splice(stepIndex + 2, 0, {
                _type: 'block',
                style: 'normal',
                children: [
                    { _type: 'span', text: '📌 あわせて読みたい：', marks: ['strong'] },
                    {
                        _type: 'span',
                        text: text,
                        marks: [`link-${stepKeyword}`]
                    }
                ],
                markDefs: [{
                    _type: 'internalLink',
                    _key: `link-${stepKeyword}`,
                    reference: { _type: 'reference', _ref }
                }]
            })
        }
    }

    // Link 1: after STEP1 -> Resume/Motivation
    insertLink('STEP1', '【例文10選】看護助手の履歴書・志望動機の書き方', 'Jx7ptA0c3Aq7il8T99H2e2')

    // Link 2: after STEP2 -> Physical strength
    insertLink('STEP2', '面接で「体力に自信あります」をアピールする言い方', 'kWkIvI7T6XFbABGiW9XxMs')

    // Link 3: after STEP3 -> Q&A
    insertLink('STEP3', '看護助手の面接でよく聞かれる質問と回答例', 'G2Y6JXdwXQRnotb29XN0sj')

    console.log("Creating Draft in Sanity...")

    const doc = {
        _type: 'post',
        _id: 'drafts.nursing-assistant-interview-resume-roadmap', // Force draft status
        title: '【完全版】看護助手の面接・履歴書ロードマップ｜採用されるための5つのステップ',
        slug: { _type: 'slug', current: 'nursing-assistant-interview-resume-roadmap' },
        excerpt: '面接の前は誰しも不安になるものです。手書きの履歴書の悩みから、当日の面接官の視点、そして一人で戦わないためのサポートまで、採用されるための手順を5つのステップにまとめました。',
        metaDescription: '看護助手の面接と履歴書作成に向けた完全ロードマップ。履歴書の簡単な作り方、面接でよく聞かれる質問の型、逆質問のコツ、面接同行サポートの利用方法まで、採用を勝ち取るための5ステップを現役看護助手が解説します。',
        body: portableTextBody,
        // Optional classifications - can set later in Studio
    }

    try {
        const res = await client.createOrReplace(doc)
        console.log(`✅ Draft created successfully with ID: ${res._id}`)
        console.log(`Open in Sanity Studio to review and publish!`)
    } catch (err) {
        console.error("Failed to create draft:", err.message)
    }
}

main().catch(console.error)
