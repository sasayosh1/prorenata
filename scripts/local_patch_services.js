const fs = require('fs')

// Sera Speech Bubbles
const speech1 = {
    _type: 'speechBubble',
    _key: `sera-voice-1-${Date.now()}`,
    speaker: 'セラ',
    emotion: 'happy',
    speech: '「転職サイトって電話がしつこそう…」と不安な方もいるかもしれません。\nでも、ここで紹介する３社は「連絡頻度」や「連絡手段（LINEなど）」に配慮があるところばかりです。自分のペースで進められますよ✨'
}

const speech2 = {
    _type: 'speechBubble',
    _key: `sera-voice-2-${Date.now()}`,
    speaker: 'セラ',
    emotion: 'happy',
    speech: 'わたしも最初は一人で求人票を眺めて悩みましたが、相談してみると「こんな働き方もあったんだ！」という発見がありました。\nまずは気軽に話を聞いてみるだけでも、気持ちが楽になりますよ🍀'
}

try {
    const raw = fs.readFileSync('current_services.json', 'utf8')
    const doc = JSON.parse(raw)

    if (!doc.body || !Array.isArray(doc.body)) {
        throw new Error('Invalid document structure: missing body array')
    }

    let modified = false
    const newBody = [...doc.body]

    // 1. Text Replacement
    const findText = 'この記事では、現場でよく耳にする３つの相談先を'
    const replaceText = 'ProReNata編集部では、現場でよく耳にする３つの相談先を'

    newBody.forEach(block => {
        if (block._type === 'block' && block.children) {
            block.children.forEach(span => {
                if (span._type === 'span' && span.text && span.text.includes(findText)) {
                    console.log(`✅ Replacing text: "${findText.substring(0, 10)}..."`)
                    span.text = span.text.replace(findText, replaceText)
                    modified = true
                }
            })
        }
    })

    // 2. Injection 1
    const target1 = 'あなたの優先順位によって登録すべきサービスは変わります。'
    let index1 = -1
    for (let i = 0; i < newBody.length; i++) {
        const block = newBody[i]
        if (block._type === 'block' && block.children) {
            const text = block.children.map(c => c.text).join('')
            if (text.includes(target1)) {
                index1 = i
                break
            }
        }
    }

    if (index1 !== -1) {
        const nextBlock = newBody[index1 + 1]
        if (nextBlock && nextBlock._type === 'speechBubble') {
            console.log('⚠️ Speech bubble 1 already exists. Skipping.')
        } else {
            console.log(`✅ Injecting Speech Bubble 1 after index ${index1}`)
            newBody.splice(index1 + 1, 0, speech1)
            modified = true
        }
    } else {
        console.warn(`⚠️ Injection target 1 not found: "${target1}"`)
    }

    // 3. Injection 2
    // Updated Anchor
    const target2 = 'できるだけ早く情報を集めるのが成功の近道です。'
    let index2 = -1
    for (let i = 0; i < newBody.length; i++) {
        const block = newBody[i]
        if (block._type === 'block' && block.children) {
            const text = block.children.map(c => c.text).join('')
            if (text.includes(target2)) {
                index2 = i
                break
            }
        }
    }

    if (index2 !== -1) {
        const nextBlock = newBody[index2 + 1]
        if (nextBlock && nextBlock._type === 'speechBubble') {
            console.log('⚠️ Speech bubble 2 already exists. Skipping.')
        } else {
            console.log(`✅ Injecting Speech Bubble 2 after index ${index2}`)
            newBody.splice(index2 + 1, 0, speech2)
            modified = true
        }
    } else {
        console.warn(`⚠️ Injection target 2 not found: "${target2}"`)
    }

    if (modified) {
        doc.body = newBody
        fs.writeFileSync('patched_services.json', JSON.stringify(doc, null, 2))
        console.log('🎉 patched_services.json created successfully.')
    } else {
        console.log('ℹ️ No changes made to the document.')
    }

} catch (err) {
    console.error('❌ Error:', err.message)
    process.exit(1)
}
