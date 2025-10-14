/**
 * nursing-assistant-quit-retirement記事の修正スクリプト
 *
 * 修正内容：
 * 1. 第1位セクション内の「ヒューマンライフケア」リンクを削除
 * 2. ガーディアンのセクション（第2位）を削除
 * 3. モームリを第2位に変更
 * 4. 第3位（旧モームリセクション）内の「リニューケア」リンクを削除
 * 5. セルフ退職支援サービス（ムリサポ!）を第3位として追加
 * 6. 比較まとめセクションを更新
 * 7. まとめセクションをよくある質問の後に移動
 * 8. よくある質問内のアフィリエイトリンクを削除（汐留パートナーズとパソナライフケア）
 * 9. 次のステップカードを最後に追加（関連記事へのリンク）
 */

const sanityClient = require('@sanity/client')

const client = sanityClient.createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
})

async function fixArticle() {
  console.log('📝 記事を取得中...')

  const post = await client.fetch(`
    *[_type == "post" && slug.current == "nursing-assistant-quit-retirement"][0] {
      _id,
      title,
      body
    }
  `)

  if (!post) {
    console.error('❌ 記事が見つかりません')
    return
  }

  console.log(`✅ 記事を取得: ${post.title}`)
  console.log(`📄 現在のブロック数: ${post.body.length}`)

  const newBody = []
  let skipUntilNextH3 = false
  let skipGardianSection = false
  let currentSectionType = null

  for (let i = 0; i < post.body.length; i++) {
    const block = post.body[i]

    // H2見出しの検出
    if (block._type === 'block' && block.style === 'h2') {
      const text = block.children?.[0]?.text || ''

      if (text.includes('信頼性・即日性・コスパで選ぶ')) {
        currentSectionType = 'services'
        newBody.push(block)
        continue
      } else if (text.includes('比較まとめ')) {
        currentSectionType = 'comparison'
        // 比較まとめは後で追加するのでスキップ
        continue
      } else if (text.includes('退職後にやるべきこと')) {
        currentSectionType = 'after'
        newBody.push(block)
        continue
      } else if (text.includes('まとめ')) {
        currentSectionType = 'summary'
        // まとめは後で追加するのでスキップ
        continue
      } else if (text.includes('よくある質問')) {
        currentSectionType = 'faq'
        newBody.push(block)
        continue
      } else {
        currentSectionType = null
        newBody.push(block)
        continue
      }
    }

    // H3見出しの検出
    if (block._type === 'block' && block.style === 'h3') {
      const text = block.children?.[0]?.text || ''

      if (text.includes('第１位') || text.includes('第1位')) {
        skipUntilNextH3 = false
        skipGardianSection = false
        newBody.push(block)
        continue
      } else if (text.includes('第２位') || text.includes('第2位')) {
        // ガーディアンのセクションはスキップ
        skipGardianSection = true
        skipUntilNextH3 = false
        continue
      } else if (text.includes('第３位') || text.includes('第3位')) {
        // モームリを第2位に変更
        skipGardianSection = false
        skipUntilNextH3 = false
        newBody.push({
          ...block,
          children: [{
            ...block.children[0],
            text: '第２位：退職代行モームリ'
          }]
        })
        continue
      } else {
        skipUntilNextH3 = false
        skipGardianSection = false
        newBody.push(block)
        continue
      }
    }

    // ガーディアンセクション中はスキップ
    if (skipGardianSection) {
      continue
    }

    // リンクブロックの処理
    if (block._type === 'block' && block.children) {
      const text = block.children.map(c => c.text).join('')

      // ヒューマンライフケアリンクを削除（第1位セクション内）
      if (text.includes('ヒューマンライフケア') && currentSectionType === 'services') {
        console.log('🗑️  ヒューマンライフケアリンクを削除')
        continue
      }

      // リニューケアリンクを削除（第3位→第2位セクション内）
      if (text.includes('リニューケア') && currentSectionType === 'services') {
        console.log('🗑️  リニューケアリンクを削除')
        continue
      }

      // よくある質問内のアフィリエイトリンクを削除
      if (currentSectionType === 'faq') {
        if (text.includes('汐留パートナーズ') || text.includes('パソナライフケア')) {
          console.log('🗑️  FAQ内のアフィリエイトリンクを削除:', text.substring(0, 50))
          continue
        }
      }
    }

    // 画像ブロックは保持
    if (block._type === 'image') {
      newBody.push(block)
      continue
    }

    // その他のブロックは保持（ガーディアンセクション以外）
    if (!skipGardianSection && !skipUntilNextH3) {
      newBody.push(block)
    }
  }

  // 第3位：セルフ退職ムリサポ!を追加
  console.log('➕ ムリサポ!セクションを追加')

  const murisapoSection = [
    {
      _type: 'block',
      _key: 'murisapo-h3-' + Math.random().toString(36).substr(2, 9),
      style: 'h3',
      children: [{
        _type: 'span',
        _key: 'span-' + Math.random().toString(36).substr(2, 9),
        text: '第３位：セルフ退職ムリサポ!',
        marks: []
      }],
      markDefs: []
    },
    {
      _type: 'block',
      _key: 'murisapo-desc-' + Math.random().toString(36).substr(2, 9),
      style: 'normal',
      children: [{
        _type: 'span',
        _key: 'span-' + Math.random().toString(36).substr(2, 9),
        text: '自分で退職を伝えたいけど、手順が不安な方におすすめ。\nテンプレートや法律相談を受けながら、自分で退職を完了させるタイプのサービスです。\n退職代行ほどコストをかけず、でも一人で悩まずに進められるのが特徴。',
        marks: []
      }],
      markDefs: []
    },
    {
      _type: 'block',
      _key: 'murisapo-price-' + Math.random().toString(36).substr(2, 9),
      style: 'normal',
      children: [{
        _type: 'span',
        _key: 'span-' + Math.random().toString(36).substr(2, 9),
        text: '料金：相談無料（詳細は公式サイトへ）\n形式：セルフ退職支援・テンプレート提供\n特徴：法律相談付き・自分で手続き・コスパ重視',
        marks: []
      }],
      markDefs: []
    },
    {
      _type: 'block',
      _key: 'murisapo-link-' + Math.random().toString(36).substr(2, 9),
      style: 'normal',
      children: [
        {
          _type: 'span',
          _key: 'span1-' + Math.random().toString(36).substr(2, 9),
          text: '📝 自分で退職したい方へ： ',
          marks: []
        },
        {
          _type: 'span',
          _key: 'span2-' + Math.random().toString(36).substr(2, 9),
          text: 'セルフ退職支援サービス「ムリサポ!」はこちら',
          marks: ['murisapo-link']
        }
      ],
      markDefs: [{
        _key: 'murisapo-link',
        _type: 'link',
        href: '//af.moshimo.com/af/c/click?a_id=5211243&p_id=5787&pc_id=16026&pl_id=74424'
      }]
    }
  ]

  // 退職後セクションの前に挿入
  const afterSectionIndex = newBody.findIndex(b =>
    b._type === 'block' && b.style === 'h2' && b.children?.[0]?.text?.includes('退職後にやるべきこと')
  )

  if (afterSectionIndex !== -1) {
    newBody.splice(afterSectionIndex, 0, ...murisapoSection)
    console.log('✅ ムリサポ!セクションを追加しました')
  }

  // 比較まとめセクションを更新して追加
  console.log('➕ 比較まとめセクションを追加')
  const comparisonSection = [
    {
      _type: 'block',
      _key: 'comparison-h2-' + Math.random().toString(36).substr(2, 9),
      style: 'h2',
      children: [{
        _type: 'span',
        _key: 'span-' + Math.random().toString(36).substr(2, 9),
        text: '📊 比較まとめ',
        marks: []
      }],
      markDefs: []
    },
    {
      _type: 'block',
      _key: 'comparison-text-' + Math.random().toString(36).substr(2, 9),
      style: 'normal',
      children: [{
        _type: 'span',
        _key: 'span-' + Math.random().toString(36).substr(2, 9),
        text: '法律に強く安心したい → 退職110番（あおば）\nコスパ重視・スピード重視 → モームリ\n自分で進めたい・伴走サポート希望 → ムリサポ!',
        marks: []
      }],
      markDefs: []
    }
  ]

  // 退職後セクションの後、FAQの前に挿入
  const faqIndex = newBody.findIndex(b =>
    b._type === 'block' && b.style === 'h2' && b.children?.[0]?.text?.includes('よくある質問')
  )

  if (faqIndex !== -1) {
    newBody.splice(faqIndex, 0, ...comparisonSection)
    console.log('✅ 比較まとめセクションを追加しました')
  }

  // まとめセクションをFAQの後に移動
  console.log('➕ まとめセクションを追加')
  const summarySection = [
    {
      _type: 'block',
      _key: 'summary-h2-' + Math.random().toString(36).substr(2, 9),
      style: 'h2',
      children: [{
        _type: 'span',
        _key: 'span-' + Math.random().toString(36).substr(2, 9),
        text: '🧩 まとめ：無理せず、自分を守る退職を',
        marks: []
      }],
      markDefs: []
    },
    {
      _type: 'block',
      _key: 'summary-text-' + Math.random().toString(36).substr(2, 9),
      style: 'normal',
      children: [{
        _type: 'span',
        _key: 'span-' + Math.random().toString(36).substr(2, 9),
        text: '「辞めたい」と思ったときに無理を続けると、心や体を壊してしまいます。\nあなたの状況に合った退職の形を選ぶことが、最初の"自分を守る行動"です。\n弁護士・民間サポート・セルフ支援、それぞれ強みが異なります。\n焦らず比較して、「自分を守る退職」を選びましょう。',
        marks: []
      }],
      markDefs: []
    }
  ]

  // 最後に追加
  newBody.push(...summarySection)
  console.log('✅ まとめセクションを追加しました')

  // 次のステップカードを追加（関連記事）
  console.log('➕ 次のステップカードを追加')

  const relatedArticlesSection = [
    {
      _type: 'block',
      _key: 'related-h2-' + Math.random().toString(36).substr(2, 9),
      style: 'h2',
      children: [{
        _type: 'span',
        _key: 'span-' + Math.random().toString(36).substr(2, 9),
        text: '📌 次のステップ',
        marks: []
      }],
      markDefs: []
    },
    {
      _type: 'block',
      _key: 'related-text-' + Math.random().toString(36).substr(2, 9),
      style: 'normal',
      children: [{
        _type: 'span',
        _key: 'span-' + Math.random().toString(36).substr(2, 9),
        text: '退職を決めたら、次は上司への伝え方が重要です。円満退職のコツをチェックしましょう。',
        marks: []
      }],
      markDefs: []
    },
    {
      _type: 'block',
      _key: 'related-link-' + Math.random().toString(36).substr(2, 9),
      style: 'normal',
      children: [
        {
          _type: 'span',
          _key: 'span1-' + Math.random().toString(36).substr(2, 9),
          text: '👉 関連記事：',
          marks: []
        },
        {
          _type: 'span',
          _key: 'span2-' + Math.random().toString(36).substr(2, 9),
          text: '看護助手を辞めたいとき上手な退職理由の伝え方',
          marks: ['related-link']
        }
      ],
      markDefs: [{
        _key: 'related-link',
        _type: 'link',
        href: '/posts/nursing-assistant-how-to-quits'
      }]
    }
  ]

  newBody.push(...relatedArticlesSection)
  console.log('✅ 次のステップカードを追加しました')

  console.log(`\n📊 修正後のブロック数: ${newBody.length}`)
  console.log('\n🔍 変更内容の確認:')
  console.log('  - ヒューマンライフケアリンク削除')
  console.log('  - ガーディアンセクション削除')
  console.log('  - モームリを第2位に変更')
  console.log('  - リニューケアリンク削除')
  console.log('  - ムリサポ!を第3位として追加')
  console.log('  - 比較まとめ更新')
  console.log('  - まとめを最後に移動')
  console.log('  - FAQ内のアフィリエイトリンク削除')

  // Sanityに更新を送信
  console.log('\n💾 Sanityに更新を送信中...')

  await client
    .patch(post._id)
    .set({ body: newBody })
    .commit()

  console.log('✅ 更新完了!')
}

// 実行
fixArticle().catch(err => {
  console.error('❌ エラーが発生しました:', err)
  process.exit(1)
})
