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

  // カテゴリごとのキーワードマッピング（2025-10 カテゴリ再編後）
  const categoryKeywords = {
    転職: ['転職', '就職', '応募', '履歴書', '面接', '求人', '派遣', '志望動機', '内定', 'エージェント', '職務経歴書'],
    退職: ['退職', '辞め', '辞める', '離職', '円満', '退社', '退職代行', '退職届', '退職願', '有給', '引き継ぎ'],
    給与: ['給料', '給与', '年収', '月給', '時給', '賞与', 'ボーナス', '手当', '待遇', '収入', '賃金', '昇給'],
    仕事内容: ['仕事内容', '業務内容', '役割', '職務', '1日', 'スケジュール', 'できる', 'できない', '種類', '働き方', 'とは'],
    実務: ['実務', '現場', 'ノウハウ', '介助', '体位変換', '清拭', '排泄', '口腔ケア', '物品', 'シーツ', '記録', 'バイタル', '環境整備', '準備', '手順'],
    資格: ['資格', '取得', '受験', '勉強', '講座', '研修', '検定', '合格', '通信', '模試', '学習'],
    看護師: ['看護師', '准看', '正看', '看護学校', '看護大学', '看護学科', '看護師国家試験', '看護学生'],
    患者対応: ['患者', '患者さん', '接遇', '声かけ', '案内', '安心', '不安', 'コミュニケーション', '気持ち', '寄り添う', '傾聴'],
    悩み: ['悩み', '相談', 'ストレス', '不安', '心配', '精神的', '負担', 'メンタル', 'つらい', '疲れ', '落ち込む'],
    人間関係: ['人間関係', '上司', '先輩', '同僚', 'スタッフ', 'チーム', '人付き合い', '関係性', 'トラブル', '雰囲気'],
    感染対策: ['感染', '衛生', '消毒', 'マスク', '防護', '予防', '清潔', '手洗い', '除菌', 'コロナ', 'インフル', '防護具', '感染症']
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

  // マッチするものがない場合は汎用カテゴリ「仕事内容」を返す
  return allCategories.find(cat => cat.title === '仕事内容') || allCategories[0]
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
const SLUG_KEYWORD_MAPPINGS = [
  { keywords: ['精神', 'メンタル', '心', 'ストレス', '不安'], words: ['mental', 'care'] },
  { keywords: ['ストレス', '負担', '楽になる'], words: ['stress', 'relief'] },
  { keywords: ['夜勤', '夜間', '交代'], words: ['night', 'shift'] },
  { keywords: ['給料', '年収', '収入', '手当'], words: ['salary', 'update'] },
  { keywords: ['資格', '試験', '勉強', '勉強法'], words: ['qualification', 'study'] },
  { keywords: ['転職', '異業種', '一般企業', 'キャリア', '求人'], words: ['career', 'change'] },
  { keywords: ['医療事務'], words: ['medical', 'office'] },
  { keywords: ['面接'], words: ['interview', 'tips'] },
  { keywords: ['仕事内容', '業務', '役割'], words: ['job', 'role'] },
  { keywords: ['体験談', '経験談'], words: ['experience', 'story'] },
  { keywords: ['志望動機'], words: ['motivation', 'points'] },
  { keywords: ['家庭', '両立', 'ワークライフ'], words: ['work', 'life'] },
  { keywords: ['サポート', '支援'], words: ['team', 'support'] },
  { keywords: ['患者', '安全', '観察', '急変'], words: ['patient', 'safety'] },
  { keywords: ['学校', '進学'], words: ['school', 'path'] },
  { keywords: ['辞め', '退職'], words: ['resignation', 'advice'] },
  { keywords: ['未経験'], words: ['no', 'experience'] },
  { keywords: ['理想', '診断', '選び方', '職場'], words: ['workplace', 'fit'] },
  { keywords: ['コツ'], words: ['practical', 'tips'] },
  { keywords: ['スケジュール', '一日', '流れ'], words: ['daily', 'schedule'] },
  { keywords: ['長期', '続ける'], words: ['long', 'term'] },
  { keywords: ['フォロー'], words: ['follow', 'care'] },
  { keywords: ['ポイント'], words: ['key', 'points'] },
  { keywords: ['相場', '比較'], words: ['market', 'info'] },
  { keywords: ['おすすめ', '選'], words: ['recommended', 'options'] },
]

const SLUG_FALLBACK_WORDS = ['care', 'guide', 'tips', 'support', 'insights', 'advice', 'focus', 'path', 'growth']
const SLUG_STOP_WORDS = new Set(['nursing', 'assistant', 'article', 'blog', 'prorenata'])

function generateSlugFromTitle(title) {
  const originalTitle = title || ''
  const normalizedTitle = originalTitle.toLowerCase()
  const collectedWords = []

  SLUG_KEYWORD_MAPPINGS.forEach(mapping => {
    const hit = mapping.keywords.some(keyword =>
      originalTitle.includes(keyword) || normalizedTitle.includes(keyword)
    )
    if (hit) {
      collectedWords.push(...mapping.words)
    }
  })

  const asciiBase = originalTitle
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

  const asciiTokens = asciiBase
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/[\s-]+/)
    .filter(token => token.length >= 3 && !SLUG_STOP_WORDS.has(token) && !/^\d+$/.test(token))

  collectedWords.push(...asciiTokens)

  const uniqueWords = []
  const seen = new Set()

  collectedWords.forEach(word => {
    const sanitized = word.replace(/[^a-z0-9]/g, '')
    if (!sanitized || SLUG_STOP_WORDS.has(sanitized) || /^\d+$/.test(sanitized)) {
      return
    }
    if (!seen.has(sanitized)) {
      seen.add(sanitized)
      uniqueWords.push(sanitized)
    }
  })

  for (const fallback of SLUG_FALLBACK_WORDS) {
    if (uniqueWords.length >= 2) break
    if (!seen.has(fallback)) {
      seen.add(fallback)
      uniqueWords.push(fallback)
    }
  }

  if (uniqueWords.length === 1) {
    uniqueWords.push('guide')
  }

  const finalWords = uniqueWords.slice(0, 3)

  if (finalWords.length === 0) {
    return 'nursing-assistant-guide'
  }

  return `nursing-assistant-${finalWords.join('-')}`
}

/**
 * タイトルと本文から関連タグを自動生成
 *
 * @param {string} title - 記事タイトル
 * @param {string} plainText - 本文のプレーンテキスト
 * @param {string} selectedTopic - 選択されたトピック
 * @returns {Array<string>} - 生成されたタグ配列（最大5つ）
 */
function generateTags(title, plainText, selectedTopic) {
  // 基本タグ（必須）
  const baseTags = [selectedTopic, '看護助手']

  // 候補タグのキーワードマッピング
  const tagCandidates = {
    '給料': ['給料', '年収', '収入', '手取り', '時給', '賃金'],
    '夜勤': ['夜勤', '夜間', '深夜', '交代勤務'],
    '転職': ['転職', '転職活動', '求人', '就職'],
    '退職': ['退職', '辞める', '辞めたい', '退職代行'],
    '資格': ['資格', '資格取得', '介護福祉士', '初任者研修'],
    'キャリア': ['キャリア', 'キャリアアップ', '昇給', '昇進'],
    '人間関係': ['人間関係', '人間関係が悪い', '看護師との関係', 'チームワーク'],
    '仕事内容': ['仕事内容', '業務内容', '役割', '仕事'],
    '患者対応': ['患者', '患者さん', '患者対応', 'コミュニケーション'],
    'メンタル': ['メンタル', 'ストレス', '精神的', '悩み', '不安'],
    '未経験': ['未経験', '初心者', '新人', '始め方'],
    '経験': ['経験', 'ベテラン', 'スキル', '成長'],
    '病院': ['病院', 'クリニック', '医療機関', '職場'],
    '介護施設': ['介護施設', '老人ホーム', '特養', '施設'],
  }

  // タイトルと本文を結合（タイトルの重みを2倍に）
  const combinedText = `${title} ${title} ${plainText.substring(0, 500)}`.toLowerCase()

  // 各候補タグのスコアを計算
  const scores = Object.entries(tagCandidates).map(([tag, keywords]) => {
    let score = 0
    keywords.forEach(keyword => {
      // タイトルに含まれる場合は高スコア
      if (title.toLowerCase().includes(keyword)) {
        score += 10
      }
      // 本文に含まれる場合
      const occurrences = (combinedText.match(new RegExp(keyword, 'gi')) || []).length
      score += occurrences
    })
    return { tag, score }
  })

  // スコアでソート
  scores.sort((a, b) => b.score - a.score)

  // スコアが1以上のタグを最大3つ取得
  const additionalTags = scores
    .filter(item => item.score > 0)
    .slice(0, 3)
    .map(item => item.tag)

  // 基本タグ + 追加タグ（重複削除）
  return [...new Set([...baseTags, ...additionalTags])].slice(0, 5)
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

/**
 * 記事冒頭の #〇〇 で始まる一行を削除
 *
 * 削除対象パターン：
 * - #看護助手
 * - #転職
 * など、ハッシュタグのような見出し
 *
 * @param {Array} blocks - Sanity body ブロック配列
 * @returns {Array} ハッシュタグ行を削除したブロック配列
 */
function removeHashtagLines(blocks) {
  if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
    return blocks
  }

  const result = []

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]

    // block タイプでない場合はそのまま保持
    if (block._type !== 'block' || !block.children || !Array.isArray(block.children)) {
      result.push(block)
      continue
    }

    // テキストを結合
    const text = block.children
      .map(child => child.text || '')
      .join('')
      .trim()

    // #で始まる1行のみのブロックを削除（記事冒頭5ブロック以内）
    if (i < 5 && /^#[^\s]+$/.test(text)) {
      continue // このブロックをスキップ
    }

    result.push(block)
  }

  return result
}

/**
 * H3タイトルのみで本文がないセクションに本文を追加
 *
 * H3見出しの直後に別の見出し（H2/H3）が来る場合、
 * そのH3セクションに本文がないため、簡単な説明文を追加
 *
 * @param {Array} blocks - Sanity body ブロック配列
 * @param {string} title - 記事タイトル（コンテキスト）
 * @returns {Array} 本文を追加したブロック配列
 */
function addBodyToEmptyH3Sections(blocks, title) {
  if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
    return blocks
  }

  const result = []
  const { randomUUID } = require('crypto')

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]
    result.push(block)

    // H3見出しかチェック
    if (block._type === 'block' && block.style === 'h3') {
      const nextBlock = blocks[i + 1]

      // 次のブロックが見出し（H2/H3）または存在しない場合、本文がない
      const isNextBlockHeading = nextBlock && nextBlock._type === 'block' && (nextBlock.style === 'h2' || nextBlock.style === 'h3')
      const isLastBlock = i === blocks.length - 1

      if (isNextBlockHeading || isLastBlock) {
        // H3見出しのテキストを取得
        const h3Text = block.children
          .map(child => child.text || '')
          .join('')
          .trim()

        // 簡単な本文を追加
        const bodyText = `${h3Text}について、具体的に見ていきましょう。`

        const bodyBlock = {
          _type: 'block',
          _key: `body-${randomUUID()}`,
          style: 'normal',
          markDefs: [],
          children: [
            {
              _type: 'span',
              _key: `span-${randomUUID()}`,
              marks: [],
              text: bodyText
            }
          ]
        }

        result.push(bodyBlock)
      }
    }
  }

  return result
}

/**
 * まとめセクションではH3使用禁止
 *
 * 「まとめ」H2見出し以降に出現するH3見出しを、
 * 通常の段落（太字）に変換する
 *
 * @param {Array} blocks - Sanity body ブロック配列
 * @returns {Array} H3を通常段落に変換したブロック配列
 */
function removeH3FromSummarySection(blocks) {
  if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
    return blocks
  }

  let inSummarySection = false
  const result = []

  for (const block of blocks) {
    // H2見出しが「まとめ」の場合、フラグをON
    if (block._type === 'block' && block.style === 'h2') {
      const h2Text = block.children
        .map(child => child.text || '')
        .join('')
        .trim()

      if (h2Text === 'まとめ') {
        inSummarySection = true
      } else {
        // 別のH2見出しが来たらフラグをOFF
        inSummarySection = false
      }

      result.push(block)
      continue
    }

    // まとめセクション内のH3を通常段落（太字）に変換
    if (inSummarySection && block._type === 'block' && block.style === 'h3') {
      const convertedBlock = {
        ...block,
        style: 'normal',
        children: block.children.map(child => ({
          ...child,
          marks: [...(child.marks || []), 'strong']
        }))
      }
      result.push(convertedBlock)
      continue
    }

    result.push(block)
  }

  return result
}

module.exports = {
  blocksToPlainText,
  generateExcerpt,
  generateMetaDescription,
  generateSlugFromTitle,
  generateTags,
  selectBestCategory,
  removeGreetings,
  removeClosingRemarks,
  removePlaceholderLinks,
  separateAffiliateLinks,
  removeHashtagLines,
  addBodyToEmptyH3Sections,
  removeH3FromSummarySection
}
