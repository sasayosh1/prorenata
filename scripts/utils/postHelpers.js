/**
 * Sanity 記事のヘルパー関数
 * - テキスト抽出
 * - Excerpt 生成（白崎セラ口調）
 * - Meta Description 生成（白崎セラ口調、SEO最適化）
 * - Slug 生成
 * - 不要な挨拶文削除
 */

/**
 * 記事冒頭の不要な挨拶文を削除
 *
 * 削除対象パターン：
 * - 「こんにちは」「はじめまして」などの挨拶
 * - 「ProReNataブログ編集長の白崎セラです」などの自己紹介
 * - 「病棟で看護助手として働き始めて」などの背景説明
 *
 * @param {Array} blocks - Sanity body ブロック配列
 * @returns {Array} 挨拶文を削除したブロック配列
 */
function removeGreetings(blocks) {
  if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
    return blocks
  }

  // 削除対象パターン（正規表現）
  const greetingPatterns = [
    /^(皆さん、)?こんにちは[！!、,]?\s*/,
    /^はじめまして[。、,]?\s*/,
    /ProReNataブログ(編集長の)?白崎セラです[。、,]?\s*/g,
    /白崎セラです[。、,]?\s*/g,
    /ProReNataブログへようこそ[！!。、,]?\s*/g,
    /病棟で看護助手として働き(始めて|ながら)[^。]*?[。、,]\s*/g,
    /もうすぐ\d+年になります[。、,]?\s*/g,
    /皆さんの毎日の[「"]お疲れさま[」"]を応援しています[。、,]?\s*/g,
  ]

  const result = []

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]

    // block タイプでない場合はそのまま保持
    if (block._type !== 'block' || !block.children || !Array.isArray(block.children)) {
      result.push(block)
      continue
    }

    // テキストを結合
    let text = block.children
      .filter(child => child && child.text)
      .map(child => child.text)
      .join('')

    // 挨拶パターンを削除
    let originalText = text
    for (const pattern of greetingPatterns) {
      text = text.replace(pattern, '')
    }

    // テキストが変更されなかった、または完全に空になった場合
    if (text === originalText) {
      // 変更なし - そのまま保持
      result.push(block)
    } else if (text.trim().length === 0) {
      // 完全に空になった - このブロックをスキップ（削除）
      continue
    } else {
      // テキストが変更された - 新しいブロックを作成
      const newBlock = {
        ...block,
        children: [
          {
            _type: 'span',
            _key: block.children[0]?._key || `span-${Date.now()}`,
            text: text.trim(),
            marks: []
          }
        ]
      }
      result.push(newBlock)
    }
  }

  return result
}

/**
 * Sanity の body ブロックをプレーンテキストに変換
 * リンクURL、HTMLタグ、マークダウンは除去し、テキストのみを抽出
 *
 * @param {Array} blocks - Sanity body ブロック配列
 * @returns {string} プレーンテキスト
 */
function blocksToPlainText(blocks) {
  if (!blocks || !Array.isArray(blocks)) {
    return ''
  }

  return blocks
    .filter(block => block && block._type === 'block' && block.children && Array.isArray(block.children))
    .map(block => {
      return block.children
        .filter(child => child && child.text)
        .map(child => child.text)
        .join('')
    })
    .join('\n')
    .trim()
}

/**
 * 白崎セラ口調で excerpt を生成
 *
 * 口調の特徴:
 * - 穏やかで丁寧、柔らかいが芯の通った口調
 * - 「わたし」一人称
 * - 「です・ます」調
 * - 読者に寄り添いつつ、現実的な視点も
 * - 「〜してみませんか？」「〜かもしれません」など柔らかい表現
 *
 * @param {string} plainText - 記事本文のプレーンテキスト
 * @param {string} title - 記事タイトル
 * @returns {string} excerpt（100-150文字程度）
 */
function generateExcerpt(plainText, title) {
  if (!plainText || plainText.length < 50) {
    return `${title}について、わたしの経験も交えながらお話ししていきます。少しでも皆さんのお役に立てれば嬉しいです。`
  }

  // 本文の最初の200文字を取得
  const firstPart = plainText.substring(0, 200).trim()

  // 句点で分割して、最初の1-2文を取得
  const sentences = firstPart.split(/[。！？]/).filter(s => s.trim().length > 0)

  if (sentences.length === 0) {
    return `${title}について、わたしの経験も交えながらお話ししていきます。少しでも皆さんのお役に立てれば嬉しいです。`
  }

  // 最初の1-2文を使用（100文字程度に調整）
  let excerpt = sentences[0]
  if (excerpt.length < 80 && sentences.length > 1) {
    excerpt += '。' + sentences[1]
  }

  // 白崎セラ口調の締めくくりフレーズを追加
  const closingPhrases = [
    '。少しでも参考になれば嬉しいです。',
    '。無理なく続けるためのヒントをお伝えします。',
    '。わたしの経験も交えながらお話ししますね。',
    '。一緒に考えていきましょう。',
    '。皆さんのお役に立てれば幸いです。'
  ]

  // ランダムに締めくくりフレーズを選択
  const closingPhrase = closingPhrases[Math.floor(Math.random() * closingPhrases.length)]

  // 150文字以内に調整
  if ((excerpt + closingPhrase).length > 150) {
    excerpt = excerpt.substring(0, 120 - closingPhrase.length)
    // 文の途中で切れないように、最後の句点まで戻る
    const lastPeriod = excerpt.lastIndexOf('。')
    if (lastPeriod > 50) {
      excerpt = excerpt.substring(0, lastPeriod)
    }
  }

  return excerpt + closingPhrase
}

/**
 * SEO最適化された Meta Description を生成（白崎セラ口調）
 *
 * 要件:
 * - 100-180文字を目安（ユーザビリティやSEO優先）
 * - キーワードを含む
 * - 白崎セラ口調を維持
 * - 読者に寄り添う表現
 * - excerpt とは別のテキストを生成（excerpt の要約版ではない）
 *
 * @param {string} title - 記事タイトル
 * @param {string} plainText - 記事本文のプレーンテキスト
 * @param {Array<string>} categories - カテゴリ配列
 * @returns {string} metaDescription（100-180文字程度）
 */
function generateMetaDescription(title, plainText, categories = []) {
  // カテゴリ文字列を生成
  const categoryText = categories.length > 0 ? categories[0] : '看護助手'

  // 本文から最初の2-3文を取得（excerpt とは異なる部分を使用）
  const sentences = plainText
    .substring(0, 400)
    .split(/[。！？]/)
    .filter(s => s.trim().length > 10)

  let baseText = ''

  // タイトルのキーワードを含む文を優先的に選択
  const titleKeywords = title
    .replace(/[「」『』【】\(\)（）]/g, '')
    .split(/[・、\s]/)
    .filter(w => w.length > 1)

  const relevantSentences = sentences.filter(sentence =>
    titleKeywords.some(keyword => sentence.includes(keyword))
  )

  if (relevantSentences.length > 0) {
    baseText = relevantSentences[0]
  } else if (sentences.length > 0) {
    baseText = sentences[0]
  } else {
    baseText = title
  }

  // 白崎セラ口調の導入フレーズ
  const introPhases = [
    '看護助手として働く中で',
    'このブログでは',
    'わたしの経験から',
    '現場で働く皆さんに',
    '日々の業務で'
  ]

  // SEO最適化された締めくくりフレーズ
  const seoClosingPhrases = [
    '。現場目線で詳しくお伝えします。',
    '。実体験をもとに解説します。',
    '。わたしの経験も交えてお話しします。',
    '。具体的な方法をご紹介します。',
    '。無理なく続けるヒントをお届けします。'
  ]

  const intro = introPhases[Math.floor(Math.random() * introPhases.length)]
  const closing = seoClosingPhrases[Math.floor(Math.random() * seoClosingPhrases.length)]

  // Meta Description を組み立て
  let metaDescription = `${intro}、${baseText.trim()}`

  // 180文字以内に調整（ユーザビリティやSEO優先）
  const maxLength = 180 - closing.length
  if (metaDescription.length > maxLength) {
    metaDescription = metaDescription.substring(0, maxLength)
    // 文の途中で切れないように調整
    const lastComma = metaDescription.lastIndexOf('、')
    const lastPeriod = metaDescription.lastIndexOf('。')
    const cutPoint = Math.max(lastComma, lastPeriod)
    if (cutPoint > 60) {
      metaDescription = metaDescription.substring(0, cutPoint)
    }
  }

  metaDescription += closing

  // 100文字未満の場合は補足情報を追加
  if (metaDescription.length < 100 && sentences.length > 1) {
    const secondSentence = sentences[1].substring(0, 50)
    const additionalText = `${secondSentence}など、`
    const newLength = metaDescription.length - closing.length + additionalText.length + closing.length

    if (newLength <= 180) {
      metaDescription = metaDescription.replace(closing, additionalText + closing)
    }
  }

  return metaDescription
}

/**
 * タイトルと本文から最も適切なカテゴリを選択
 *
 * @param {string} title - 記事タイトル
 * @param {string} plainText - 記事本文のプレーンテキスト
 * @param {Array<Object>} allCategories - 全カテゴリ配列 [{_id, title, description}]
 * @returns {Object|null} 最も適切なカテゴリオブジェクト
 */
function selectBestCategory(title, plainText, allCategories) {
  if (!allCategories || allCategories.length === 0) {
    return null
  }

  const text = (title + ' ' + plainText.substring(0, 500)).toLowerCase()

  // カテゴリごとのキーワードマッピング
  const categoryKeywords = {
    '給与・待遇': ['給料', '給与', '年収', '月給', '時給', '賞与', 'ボーナス', '手当', '待遇', '福利厚生'],
    '退職・転職サポート': ['退職', '辞め', '辞める', '転職', 'キャリアチェンジ', '退職代行'],
    '就職・転職活動': ['就職', '転職活動', '求人', '面接', '履歴書', '職務経歴書', '志望動機'],
    'キャリア・資格': ['キャリア', 'キャリア形成', 'キャリアアップ', '資格取得', 'スキルアップ'],
    '資格取得': ['資格', '認定', '免許', '試験', '受験', '勉強'],
    '仕事内容・役割': ['仕事内容', '業務内容', '役割', '職務', '1日', 'スケジュール', '担当'],
    '患者対応': ['患者', '患者さん', 'コミュニケーション', '接遇', '対応'],
    '悩み・相談': ['悩み', '相談', 'ストレス', '不安', '心配', '精神的', '負担', 'メンタル'],
    '必要なスキル': ['スキル', '能力', 'コツ', 'テクニック', '上達', '向上'],
    '効率化テクニック': ['効率', '時短', '工夫', '改善', 'コツ', 'テクニック'],
    '実務・ノウハウ': ['実務', 'ノウハウ', '現場', '実践', '経験', '実際'],
    '感染対策': ['感染', '衛生', '清潔', '手洗い', 'マスク', '消毒'],
    '医療現場の基本': ['医療', '医療現場', '病院', '基本', '基礎', '医療知識'],
    '看護師への道': ['看護師', '正看護師', '准看護師', '看護学校', '目指す'],
    '職場別情報': ['病院', 'クリニック', '介護施設', '老人ホーム', '訪問', '職場'],
    '基礎知識・入門': ['基礎', '入門', '初心者', '未経験', '始め方', 'とは']
  }

  // 各カテゴリのスコアを計算
  const scores = allCategories.map(category => {
    const keywords = categoryKeywords[category.title] || []
    let score = 0

    // タイトルでのマッチは2倍のスコア
    keywords.forEach(keyword => {
      if (title.toLowerCase().includes(keyword)) {
        score += 2
      }
      if (plainText.substring(0, 500).toLowerCase().includes(keyword)) {
        score += 1
      }
    })

    return { category, score }
  })

  // スコアでソート
  scores.sort((a, b) => b.score - a.score)

  // スコアが0より大きい最上位カテゴリを返す
  if (scores[0].score > 0) {
    return scores[0].category
  }

  // マッチするものがない場合は「基礎知識・入門」を返す
  return allCategories.find(cat => cat.title === '基礎知識・入門') || allCategories[0]
}

/**
 * タイトルから URL スラッグを生成
 *
 * ルール:
 * - 小文字に変換
 * - 英数字とハイフンのみ許可
 * - 連続するハイフンを1つに
 * - 前後のハイフンを削除
 *
 * @param {string} title - 記事タイトル
 * @returns {string} URL スラッグ
 */
function generateSlugFromTitle(title) {
  if (!title) {
    return 'nursing-assistant-article'
  }

  // 日本語を削除し、英数字とハイフンのみ残す
  return title
    .toLowerCase()
    .replace(/\s+/g, '-')           // スペースをハイフンに
    .replace(/[^a-z0-9-]/g, '-')    // 英数字とハイフン以外をハイフンに
    .replace(/-+/g, '-')            // 連続するハイフンを1つに
    .replace(/^-|-$/g, '')          // 前後のハイフンを削除
    .substring(0, 200)              // 最大200文字
    || 'nursing-assistant-article'  // 空の場合のデフォルト
}

/**
 * 記事の締めくくり文を削除
 * 「次のステップ」セクションへの誘導を妨げる文章を削除
 *
 * @param {Array} blocks - Portable Text blocks
 * @returns {Array} - 処理後のブロック配列
 */
function removeClosingRemarks(blocks) {
  if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
    return blocks
  }

  // 削除対象パターン（正規表現）
  const closingPatterns = [
    /ProReNataブログは、頑張る看護助手さんをいつでも応援しています[。、,]?\s*/g,
    /また次回の記事でお会いしましょう[！!。、,]?\s*/g,
    /次回のブログも、どうぞお楽しみに[！!。、,]?\s*/g,
    /次回もお楽しみに[！!。、,]?\s*/g,
    /どうぞお楽しみに[！!。、,]?\s*/g,
    /次回も(また)?お会いしましょう[！!。、,]?\s*/g,
  ]

  const result = []

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]

    // block タイプでない場合はそのまま保持
    if (block._type !== 'block' || !block.children || !Array.isArray(block.children)) {
      result.push(block)
      continue
    }

    // テキストを結合
    let text = block.children
      .filter(child => child && child.text)
      .map(child => child.text)
      .join('')

    // 締めくくりパターンを削除
    let originalText = text
    for (const pattern of closingPatterns) {
      text = text.replace(pattern, '')
    }

    // テキストが変更されなかった、または完全に空になった場合
    if (text === originalText) {
      // 変更なし - そのまま保持
      result.push(block)
    } else if (text.trim().length === 0) {
      // 完全に空になった - このブロックをスキップ（削除）
      continue
    } else {
      // テキストが変更された - 新しいブロックを作成
      const newBlock = {
        ...block,
        children: [
          {
            _type: 'span',
            _key: block.children[0]?._key || `span-${Date.now()}`,
            text: text.trim(),
            marks: []
          }
        ]
      }
      result.push(newBlock)
    }
  }

  return result
}

/**
 * プレースホルダーリンクを削除
 *
 * 削除対象パターン：
 * - [INTERNAL_LINK: キーワード]
 * - [AFFILIATE_LINK: キーワード]
 *
 * @param {Array} blocks - Sanity body ブロック配列
 * @returns {Array} プレースホルダーを削除したブロック配列
 */
function removePlaceholderLinks(blocks) {
  if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
    return blocks
  }

  // 削除対象パターン（正規表現）
  const placeholderPatterns = [
    /\[INTERNAL_LINK:[^\]]+\]/g,
    /\[AFFILIATE_LINK:[^\]]+\]/g,
  ]

  const result = []

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]

    // block タイプでない場合はそのまま保持
    if (block._type !== 'block' || !block.children || !Array.isArray(block.children)) {
      result.push(block)
      continue
    }

    // テキストを結合
    let text = block.children
      .filter(child => child && child.text)
      .map(child => child.text)
      .join('')

    // プレースホルダーパターンを削除
    let originalText = text
    for (const pattern of placeholderPatterns) {
      text = text.replace(pattern, '')
    }

    // テキストが変更されなかった、または完全に空になった場合
    if (text === originalText) {
      // 変更なし - そのまま保持
      result.push(block)
    } else if (text.trim().length === 0) {
      // 完全に空になった - このブロックをスキップ（削除）
      continue
    } else {
      // テキストが変更された - 新しいブロックを作成
      const newBlock = {
        ...block,
        children: [
          {
            _type: 'span',
            _key: block.children[0]?._key || `span-${Date.now()}`,
            text: text.trim(),
            marks: []
          }
        ]
      }
      result.push(newBlock)
    }
  }

  return result
}

/**
 * アフィリエイトリンクを独立した段落として分離する
 * @param {Array} blocks - Portable Text blocks
 * @returns {Array} - 処理後のブロック配列
 */
function separateAffiliateLinks(blocks) {
  if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
    return blocks
  }

  // アフィリエイトリンクのパターン（ドメイン検出）
  const affiliatePatterns = [
    /a8\.net/i,
    /affiliate-b\.com/i,
    /moshimo\.com/i,
    /valuecommerce\.ne\.jp/i,
    /linksynergy\.com/i,
    /track\./i,
  ]

  const result = []

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]

    // ブロックタイプがblock以外、またはchildrenがない場合はそのまま追加
    if (block._type !== 'block' || !block.children || !Array.isArray(block.children)) {
      result.push(block)
      continue
    }

    // markDefsにアフィリエイトリンクが含まれているかチェック
    const hasAffiliateLink = block.markDefs?.some(markDef => {
      if (!markDef.href) return false
      return affiliatePatterns.some(pattern => pattern.test(markDef.href))
    })

    // アフィリエイトリンクがない場合はそのまま追加
    if (!hasAffiliateLink) {
      result.push(block)
      continue
    }

    // アフィリエイトリンクがある場合、段落を分割
    const affiliateMarkKey = block.markDefs?.find(markDef => {
      if (!markDef.href) return false
      return affiliatePatterns.some(pattern => pattern.test(markDef.href))
    })?._key

    if (!affiliateMarkKey) {
      result.push(block)
      continue
    }

    // children配列を解析して、アフィリエイトリンクの位置を特定
    const beforeChildren = []
    const affiliateChildren = []
    const afterChildren = []
    let foundAffiliate = false
    let isAfter = false

    for (const child of block.children) {
      if (child.marks && Array.isArray(child.marks) && child.marks.includes(affiliateMarkKey)) {
        // アフィリエイトリンクのspan
        affiliateChildren.push(child)
        foundAffiliate = true
        isAfter = true
      } else if (!isAfter) {
        // リンク前のテキスト
        beforeChildren.push(child)
      } else {
        // リンク後のテキスト
        afterChildren.push(child)
      }
    }

    // リンク前のテキストがある場合、段落として追加
    if (beforeChildren.length > 0) {
      const beforeText = beforeChildren.map(c => c.text || '').join('').trim()
      if (beforeText.length > 0) {
        result.push({
          ...block,
          children: beforeChildren,
          markDefs: [] // リンク前の段落にはmarkDefsは不要
        })
      }
    }

    // アフィリエイトリンクを独立した段落として追加
    if (affiliateChildren.length > 0) {
      result.push({
        ...block,
        children: affiliateChildren,
        markDefs: block.markDefs // markDefsはそのまま保持
      })
    }

    // リンク後のテキストがある場合、段落として追加
    if (afterChildren.length > 0) {
      const afterText = afterChildren.map(c => c.text || '').join('').trim()
      if (afterText.length > 0) {
        result.push({
          ...block,
          children: afterChildren,
          markDefs: [] // リンク後の段落にはmarkDefsは不要
        })
      }
    }

    // アフィリエイトリンクが見つからなかった場合は元のブロックを追加
    if (!foundAffiliate) {
      result.push(block)
    }
  }

  return result
}

module.exports = {
  blocksToPlainText,
  generateExcerpt,
  generateMetaDescription,
  generateSlugFromTitle,
  selectBestCategory,
  removeGreetings,
  removeClosingRemarks,
  removePlaceholderLinks,
  separateAffiliateLinks
}
