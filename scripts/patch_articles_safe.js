const { createClient } = require('@sanity/client')

// Hardcoded valid token from ~/.config/sanity/config.json
const token = "skvhUA9WNYFdx3yTa1f462Z94kUyzLnBpWab0kTY1NA5e8ahqhe6pZfCDeftW6mWAnB7dPazt1bd2bZd8"

console.log(`🔑 Using Token (Length: ${token.length})`)

const client = createClient({
    projectId: '72m8vhy2',
    dataset: 'production',
    apiVersion: '2024-01-01',
    useCdn: false,
    token: token,
})

const patches = {
    'comparison-of-three-resignation-agencies': {
        replacements: [
            {
                find: '看護助手として同僚の相談に乗ってきた経験から',
                replace: 'ProReNata編集部が、多くの看護助手の退職事例や業界の動向を踏まえて、'
            }
        ],
        injections: [
            {
                afterText: 'シナリオを組み立ててくれます。',
                block: {
                    _type: 'seraRecommendation',
                    _key: `sera-reco-${Date.now()}`,
                    badge: 'セラのイチオシ',
                    title: '弁護士法人みやび',
                    description: '弁護士が直接交渉を行うため、有給消化や未払い賃金の請求もワンストップで相談可能。看護助手の複雑な勤務体系でも、法律のプロがしっかり守ってくれます。',
                    advice: '「本当に辞められるかな…」と不安な方へ。法律の専門家が味方についてくれる安心感は、何物にも代えられません。編集部が最も信頼しているサービスです✨',
                    buttonLabel: 'みやびで無料相談してみる',
                    buttonUrl: 'https://vbest-lp.com/retirement-negotiation/'
                }
            }
        ]
    },
    'nursing-assistant-compare-services-perspective': {
        replacements: [
            {
                find: 'この記事では、現場でよく耳にする３つの相談先を',
                replace: 'ProReNata編集部では、現場でよく耳にする３つの相談先を'
            }
        ],
        injections: [
            {
                afterText: 'あなたの優先順位によって登録すべきサービスは変わります。',
                block: {
                    _type: 'speechBubble',
                    _key: `sera-voice-${Date.now()}`,
                    speaker: 'セラ',
                    emotion: 'happy',
                    speech: '「転職サイトって電話がしつこそう…」と不安な方もいるかもしれません。\nでも、ここで紹介する３社は「連絡頻度」や「連絡手段（LINEなど）」に配慮があるところばかりです。自分のペースで進められますよ✨'
                }
            },
            // Corrected anchor for the second bubble
            {
                afterText: 'できるだけ早く情報を集めるのが成功の近道です。',
                block: {
                    _type: 'speechBubble',
                    _key: `sera-voice-end-${Date.now()}`,
                    speaker: 'セラ',
                    emotion: 'happy',
                    speech: 'わたしも最初は一人で求人票を眺めて悩みましたが、相談してみると「こんな働き方もあったんだ！」という発見がありました。\nまずは気軽に話を聞いてみるだけでも、気持ちが楽になりますよ🍀'
                }
            }
        ]
    }
}

async function patchArticle(slug, rules) {
    console.log(`\n🔍 Processing: ${slug}`)

    try {
        const query = `*[_type == "post" && slug.current == $slug][0]`
        const doc = await client.fetch(query, { slug })

        if (!doc) {
            console.error(`❌ Post not found: ${slug}`)
            return
        }

        let newBody = [...doc.body]
        let modifiedCount = 0

        // 2. Perform Replacements
        if (rules.replacements) {
            newBody = newBody.map(block => {
                if (block._type !== 'block' || !block.children) return block

                const newChildren = block.children.map(span => {
                    if (span._type === 'span' && typeof span.text === 'string') {
                        for (const rule of rules.replacements) {
                            if (span.text.includes(rule.find)) {
                                console.log(`\t✅ Replaced text: "${rule.find.substring(0, 20)}..."`)
                                modifiedCount++
                                return { ...span, text: span.text.replace(rule.find, rule.replace) }
                            }
                        }
                    }
                    return span
                })
                return { ...block, children: newChildren }
            })
        }

        // 3. Perform Injections
        if (rules.injections) {
            for (const rule of rules.injections) {
                let insertIndex = -1

                // Search for the injection point
                for (let i = 0; i < newBody.length; i++) {
                    const block = newBody[i]
                    // Check text content recursively
                    if (block._type === 'block' && block.children) {
                        const text = block.children.map(c => c.text).join('')
                        if (text.includes(rule.afterText)) {
                            insertIndex = i
                            break
                        }
                    }
                    if (block._type === 'image' && block.caption === rule.afterText) {
                        insertIndex = i
                        break
                    }
                }

                if (insertIndex !== -1) {
                    // Check for duplicates (roughly)
                    const nextBlock = newBody[insertIndex + 1]
                    if (nextBlock && nextBlock._type === rule.block._type) {
                        // Avoid double insertion if type matches (simple heuristic)
                        console.log(`\t⚠️ Skipping potential duplicate injection after: "${rule.afterText.substring(0, 20)}..."`)
                    } else {
                        console.log(`\t✅ Injected block after: "${rule.afterText.substring(0, 20)}..."`)
                        newBody.splice(insertIndex + 1, 0, rule.block)
                        modifiedCount++
                    }
                } else {
                    console.warn(`\t⚠️ Could not find injection point: "${rule.afterText.substring(0, 20)}..."`)
                }
            }
        }

        if (modifiedCount > 0) {
            // 4. Commit Patch
            await client
                .patch(doc._id)
                .set({ body: newBody })
                .commit()
            console.log(`🎉 Successfully patched ${slug} with ${modifiedCount} changes.`)
        } else {
            console.log(`ℹ️ No changes performed for ${slug} (Already updated or target not found)`)
        }
    } catch (err) {
        console.error(`❌ Error in patchArticle: ${err.message}`)
    }
}

async function run() {
    for (const [slug, rules] of Object.entries(patches)) {
        await patchArticle(slug, rules)
    }
}

run()
