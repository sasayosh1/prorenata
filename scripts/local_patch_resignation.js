const fs = require('fs')

// Sera Recommendation Block Data
const seraRecoBlock = {
    _type: 'seraRecommendation',
    _key: `sera-reco-${Date.now()}`,
    badge: 'セラのイチオシ',
    title: '弁護士法人みやび',
    description: '弁護士が直接交渉を行うため、有給消化や未払い賃金の請求もワンストップで相談可能。看護助手の複雑な勤務体系でも、法律のプロがしっかり守ってくれます。',
    advice: '「本当に辞められるかな…」と不安な方へ。法律の専門家が味方についてくれる安心感は、何物にも代えられません。編集部が最も信頼しているサービスです✨',
    buttonLabel: 'みやびで無料相談してみる',
    buttonUrl: 'https://vbest-lp.com/retirement-negotiation/'
}

try {
    const raw = fs.readFileSync('current_resignation.json', 'utf8')
    const doc = JSON.parse(raw)

    if (!doc.body || !Array.isArray(doc.body)) {
        throw new Error('Invalid document structure: missing body array')
    }

    let modified = false
    const newBody = [...doc.body]

    // 1. Text Replacement
    const findText = '看護助手として同僚の相談に乗ってきた経験から'
    const replaceText = 'ProReNata編集部が、多くの看護助手の退職事例や業界の動向を踏まえて、'

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

    // 2. Injection
    const injectionTarget = 'シナリオを組み立ててくれます。'
    let insertIndex = -1

    for (let i = 0; i < newBody.length; i++) {
        const block = newBody[i]
        if (block._type === 'block' && block.children) {
            const text = block.children.map(c => c.text).join('')
            if (text.includes(injectionTarget)) {
                insertIndex = i
                break
            }
        }
    }

    if (insertIndex !== -1) {
        // Check for duplicate (simple check)
        const nextBlock = newBody[insertIndex + 1]
        if (nextBlock && nextBlock._type === 'seraRecommendation') {
            console.log('⚠️ Recommendation block already exists. Skipping injection.')
        } else {
            console.log(`✅ Injecting Sera Recommendation after index ${insertIndex}`)
            newBody.splice(insertIndex + 1, 0, seraRecoBlock)
            modified = true
        }
    } else {
        console.warn(`⚠️ Injection target not found: "${injectionTarget}"`)
    }

    if (modified) {
        doc.body = newBody
        fs.writeFileSync('patched_resignation.json', JSON.stringify(doc, null, 2))
        console.log('🎉 patched_resignation.json created successfully.')
    } else {
        console.log('ℹ️ No changes made to the document.')
    }

} catch (err) {
    console.error('❌ Error:', err.message)
    process.exit(1)
}
