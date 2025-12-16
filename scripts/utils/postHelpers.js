/**
 * Sanity 記事のヘルパー関数
 * - テキスト抽出
 * - Excerpt 生成（白崎セラ口調）
 * - Meta Description 生成（白崎セラ口調、SEO最適化）
 * - Slug 生成
 * - 不要な挨拶文削除
 */

const {
  CATEGORY_KEYWORDS,
  normalizeCategoryTitle
} = require('./categoryMappings')
const { MOSHIMO_LINKS } = require('../moshimo-affiliate-links')

const INTRO_PARAGRAPH_PATTERNS = [
  /\d{1,2}歳/,
  /現役看護助手/,
  /あなたを応援/,
  /一緒に[、,。]?.*お伝え/,
  /わたしも最初/,
  /ProReNata/,
  /落ち着いて伝えて/,
  /病棟で働きながら/
]

function isPersonaIntroParagraph(text = '', index = 0) {
  if (!text) return false
  if (index > 1) return false
  const normalized = text.trim()
  if (normalized.length > 220) {
    return false
  }

  const matchCount = INTRO_PARAGRAPH_PATTERNS.filter(pattern => pattern.test(normalized)).length
  if (matchCount >= 2) {
    return true
  }

  const hasFirstPerson = /わたし|私|白崎セラ/.test(normalized)
  const hasEncouragement = /応援|大丈夫|一緒に頑張|ドキドキ/.test(normalized)
  return matchCount === 1 && hasFirstPerson && hasEncouragement
}

function cleanupPersonaIntroText(text = '') {
  if (!text) return ''
  const sentences = text
    .split(/(?<=[。！？!?\n])/)
    .map(sentence => sentence.trim())
    .filter(Boolean)

const filtered = sentences.filter(sentence => {
    if (sentence.length === 0) return false
    const matchCount = INTRO_PARAGRAPH_PATTERNS.filter(pattern => pattern.test(sentence)).length
    const hasFirstPerson = /わたし|私|白崎セラ/.test(sentence)
    const hasEncouragement = /応援|大丈夫|一緒に頑張|ドキドキ/.test(sentence)
    if (matchCount >= 1 && (hasFirstPerson || hasEncouragement)) {
      return false
    }
    return true
  })

  return filtered.join('')
}

function isInlineAffiliateBlock(block) {
  return Boolean(
    block &&
    block._type === 'block' &&
    typeof block._key === 'string' &&
    block._key.startsWith('inline-')
  )
}

function normalizeAffiliateHref(href = '') {
  return href
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^\/\//, '')
    .replace(/\/+$/, '')
}

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
      if (isPersonaIntroParagraph(text, i)) {
        const cleanedIntro = cleanupPersonaIntroText(text)
        if (cleanedIntro.trim().length === 0) {
          continue
        }
        result.push({
          ...block,
          children: [
            {
              _type: 'span',
              _key: block.children[0]?._key || `span-${Date.now()}`,
              text: cleanedIntro.trim(),
              marks: []
            }
          ]
        })
        continue
      }
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
      if (isPersonaIntroParagraph(text, i)) {
        const cleanedIntro = cleanupPersonaIntroText(text)
        if (cleanedIntro.trim().length === 0) {
          continue
        }
        result.push({
          ...newBlock,
          children: [
            {
              ...newBlock.children[0],
              text: cleanedIntro.trim()
            }
          ]
        })
        continue
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
function removePersonaName(text = '') {
  if (!text) return ''
  return text.replace(/白崎セラ/g, '看護助手')
}

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

function blockPlainText(block) {
  if (!block || block._type !== 'block' || !Array.isArray(block.children)) {
    return ''
  }
  return block.children
    .map(child => (child && typeof child.text === 'string' ? child.text : ''))
    .join('')
    .trim()
}

function stripFormatting(text = '') {
  return text
    .replace(/[*_`]/g, '')
    .replace(/^[●・-]\s*/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function truncateText(text = '', max = 60) {
  if (text.length <= max) return text
  return `${text.slice(0, max - 1)}…`
}

const H3_FALLBACK_PATTERNS = [
  {
    keywords: ['睡眠', '眠', '休息', '仮眠'],
    template: ({ h3Text, bulletSample }) =>
      `「${h3Text}」では、短時間でも深く休める工夫を取り入れてみましょう。${bulletSample ? `例えば「${bulletSample}」のような習慣をメモしておくと、翌日の体調が安定します。` : '照明や水分補給を見直すだけでも、夜勤明けの疲労感が和らぎます。'}`
  },
  {
    keywords: ['夜勤', '夜間', '深夜'],
    template: ({ h3Text, sectionTitle, bulletSample }) =>
      `${sectionTitle ? `${sectionTitle}の場面では` : '夜勤帯のケアでは'}、${h3Text}を意識して情報共有すると安心です。${bulletSample ? `「${bulletSample}」のようなチェックポイントを持っておくと、申し送りがぐっと楽になります。` : '声のトーンや照明の調整など、患者さんが安心できる雰囲気づくりを忘れずに。'}`
  },
  {
    keywords: ['声', 'コミュ', '伝え', '会話', '質問'],
    template: ({ h3Text, bulletSample }) =>
      `「${h3Text}」では、患者さんの表情を見ながら一言添えるだけでも安心感が高まります。${bulletSample ? `「${bulletSample}」のような声掛けを決めておくと、落ち着いて伝えられます。` : '返答まで少し待つ余裕を持ち、理解できたか確認しながら進めましょう。'}`
  },
  {
    keywords: ['ストレス', '不安', 'メンタル', '心', '気持ち'],
    template: ({ h3Text, sectionTitle }) =>
      `${sectionTitle || 'このセクション'}で触れた「${h3Text}」は、自分の気持ちを客観的に振り返る時間を確保するだけでも前向きに取り組めます。感じた負担は短いメモにして、看護師や同僚と共有しておくと安心です。`
  },
  {
    keywords: ['転職', 'キャリア', '進学', '資格', '学校'],
    template: ({ h3Text }) =>
      `「${h3Text}」を考えるときは、今の業務で得た経験を整理し、次に磨きたい力を言葉にしてみましょう。学習方法やスケジュールを小さく試すことで、無理のないステップを描けます。`
  },
  {
    keywords: ['患者', '家族', '利用者', '対応', '介助'],
    template: ({ h3Text, bulletSample }) =>
      `${h3Text}では、患者さんの反応をこまめに観察しながら声掛けをしていくことが大切です。${bulletSample ? `「${bulletSample}」のような支援のコツを共有しておくと、チーム全体で温かな対応ができます。` : '小さな変化も看護師へ伝え、安心感につながるサポートを重ねましょう。'}`
  },
  {
    keywords: ['安全', '注意', '事故', 'トラブル'],
    template: ({ h3Text, bulletSample }) =>
      `「${h3Text}」に臨む前に、事前のチェックリストを整えておくと焦らずに対応できます。${bulletSample ? `特に「${bulletSample}」のような確認事項は共有メモにしておくと安心です。` : '声に出して手順をなぞるだけでもヒヤリハットを減らせます。'}`
  },
  {
    keywords: ['段取り', '準備', '整理', '効率', '工夫'],
    template: ({ h3Text, sectionTitle }) =>
      `${sectionTitle || '業務全体'}をスムーズに進めるためにも、「${h3Text}」は申し送り前に整えておくのがコツです。必要な物品をまとめておくだけでも、患者さんへの対応に余裕が生まれます。`
  }
]

function generateFallbackH3Paragraph({ articleTitle, sectionTitle, h3Text, bulletSamples = [] }) {
  const cleanedHeading = stripFormatting(h3Text || '')
  const normalized = cleanedHeading.toLowerCase()
  const firstBullet = bulletSamples.length > 0 ? truncateText(stripFormatting(bulletSamples[0])) : ''

  for (const pattern of H3_FALLBACK_PATTERNS) {
    if (pattern.keywords.some(keyword => normalized.includes(keyword))) {
      return pattern.template({
        articleTitle,
        sectionTitle,
        h3Text: cleanedHeading,
        bulletSample: firstBullet
      })
    }
  }

  const anchor = sectionTitle ? `「${sectionTitle}」の場面で` : '現場のケアで'
  return `${anchor}「${cleanedHeading}」に向き合うときは、患者さんの様子をこまめにメモしながら看護師へ共有する流れを作っておきましょう。${firstBullet ? `例えば「${firstBullet}」のようなポイントを押さえておくと、安心感につながります。` : '焦らず一つずつ確認し、無理のない範囲で工夫を積み重ねることが大切です。'}`
}

function buildFallbackSummaryBlocks({ articleTitle, summaryBlocks, leadingBlocks }) {
  const { randomUUID } = require('crypto')

  const stableIndex = (seed = '', mod = 1) => {
    const str = String(seed || '')
    let hash = 0
    for (let i = 0; i < str.length; i += 1) {
      hash = (hash * 31 + str.charCodeAt(i)) >>> 0
    }
    return mod > 0 ? hash % mod : 0
  }

  const getText = block =>
    stripFormatting(
      (block?.children || [])
        .map(child => child?.text || '')
        .join('')
    )

  const topicCandidates = []
  leadingBlocks.forEach(block => {
    if (!block || block._type !== 'block') return
    if (block.style !== 'h2' && block.style !== 'h3') return
    const text = getText(block)
    if (!text) return
    if (/^(まとめ|参考資料|参考|免責|注意|次のステップ)$/i.test(text)) return
    if (!topicCandidates.includes(text)) topicCandidates.push(text)
  })

  const bulletCandidates = summaryBlocks
    .filter(block => block && (block.listItem === 'bullet' || block.style === 'h3'))
    .map(getText)
    .filter(Boolean)

  if (bulletCandidates.length < 3) {
    const additional = []
    let currentH2 = ''
    leadingBlocks.forEach(block => {
      if (!block || block._type !== 'block') return
      if (block.style === 'h2') {
        currentH2 = getText(block)
        return
      }
      if (block.style === 'h3') {
        const text = getText(block)
        if (text) {
          additional.push(`${currentH2 ? `${currentH2}の視点で` : ''}${text}に目を向ける`)
        }
      } else if (block.listItem === 'bullet') {
        const text = getText(block)
        if (text) {
          additional.push(text)
        }
      }
    })
    bulletCandidates.push(...additional)
  }

  const highlights = []
  bulletCandidates.forEach(text => {
    const cleaned = truncateText(text)
    if (cleaned && !highlights.includes(cleaned)) {
      highlights.push(cleaned)
    }
  })

  const topics = topicCandidates.slice(0, 5)
  const focus = topics.length > 0 ? topics[stableIndex(articleTitle, topics.length)] : ''
  const focusTextRaw = focus && focus.length <= 28 ? focus : ''

  const shortTitle = String(articleTitle || '')
    .replace(/（[^）]*）/g, '')
    .replace(/【[^】]*】/g, '')
    .split(/[：:｜|]/)[0]
    .trim()
  const shortTitleText = truncateText(shortTitle, 32)

  const hintPieces = highlights.slice(0, 2).map(h => truncateText(h, 28))
  const hintText = hintPieces.filter(Boolean).join('・')

  const openingTemplates = [
    ({ shortTitleText: st, focusTextRaw: f, hintText: h }) => {
      const focus = f || (st ? st : '')
      if (focus && h) return `この記事では「${focus}」を軸に、${h}などのポイントを整理しました。`
      if (focus) return `この記事では「${focus}」で押さえたいコツを、看護助手の視点でまとめました。`
      return 'この記事では、現場で押さえたいコツを、看護助手の視点でまとめました。'
    },
    ({ shortTitleText: st, hintText: h }) => {
      if (h) return `忙しい日でも取り入れやすい工夫として、${h}を中心にまとめました。`
      if (st) return `「${st}」のテーマで、今日から試しやすい工夫をまとめました。`
      return '今日から試しやすい工夫をまとめました。'
    },
    ({ focusTextRaw: f, hintText: h }) => {
      if (f) return `「${f}」の場面でつまずきやすい点を、無理のない手順に落とし込みました。`
      if (h) return `${h}を手がかりに、無理のない進め方を整理しました。`
      return '無理のない進め方を整理しました。'
    },
    ({ shortTitleText: st, hintText: h }) => {
      if (st && h) return `「${st}」について、${h}を中心にポイントを絞って整理しました。`
      if (st) return `「${st}」について、現場で役立つ考え方を短く整理しました。`
      if (h) return `${h}を中心に、今日から使えるコツを整理しました。`
      return '現場で役立つ考え方を短く整理しました。'
    },
    ({ focusTextRaw: f, hintText: h }) => {
      if (f && h) return `「${f}」の場面で、${h}をどう使うかを整理しました。`
      if (f) return `「${f}」の場面で、やり方を迷ったときの考え方をまとめました。`
      if (h) return `${h}のポイントを、ひとつずつ確認できる形にしました。`
      return 'やり方を迷ったときの考え方をまとめました。'
    }
  ]
  const closingTemplates = [
    () =>
      '全部を一度に変えなくても大丈夫です。気になるところをひとつ選んで、小さく試してみてくださいね。',
    () =>
      '迷ったら、今の状況と困っている点を短く共有してみましょう。チームで揃えるだけでも、動きやすくなることがあります。',
    () =>
      '不安が強い日は、優先順位をひとつに絞るのも手です。今日の勤務につながる一歩から始めていきましょう。'
    ,
    () =>
      '急がなくて大丈夫です。できそうなところから一つだけ選んで、次の勤務で試してみましょう。',
    () =>
      'うまくいかない日があっても大丈夫です。続けやすい形に整えながら、少しずつ自分の型にしていきましょう。',
    () =>
      '「いま一番困っていること」だけでも言葉にできると、相談もしやすくなります。無理のない範囲で整えていきましょう。'
  ]

  const makeParagraph = text => ({
    _type: 'block',
    _key: `summary-${randomUUID()}`,
    style: 'normal',
    markDefs: [],
    children: [
      {
        _type: 'span',
        _key: `summary-span-${randomUUID()}`,
        marks: [],
        text
      }
    ]
  })

  const makeBullet = text => ({
    _type: 'block',
    _key: `summary-bullet-${randomUUID()}`,
    style: 'normal',
    listItem: 'bullet',
    level: 1,
    markDefs: [],
    children: [
      {
        _type: 'span',
        _key: `summary-bullet-span-${randomUUID()}`,
        marks: [],
        text
      }
    ]
  })

  const result = []
  result.push(
    makeParagraph(
      openingTemplates[stableIndex(articleTitle, openingTemplates.length)]({
        shortTitleText,
        focusTextRaw,
        hintText
      })
    )
  )

  if (highlights.length > 0) {
    const introCandidates = [
      'まずは、今日の勤務で試しやすい順に並べると、次のようになります。',
      'すぐに形にしやすい工夫を、3つに絞ると次の通りです。',
      '忙しい日でも取り入れやすいヒントは、次の通りです。'
    ]
    result.push(makeParagraph(introCandidates[stableIndex(`${articleTitle}-intro`, introCandidates.length)]))
    highlights.slice(0, 3).forEach(text => result.push(makeBullet(text)))
  }

  result.push(makeParagraph(closingTemplates[stableIndex(`${articleTitle}-close`, closingTemplates.length)]()))

  return result
}

function isGenericFallbackSummaryText(text = '') {
  if (!text) return false
  const needles = [
    'でお伝えした内容を振り返ると',
    'あわてず一歩ずつ',
    'すぐに試しやすい行動のヒントは次の通りです'
  ]
  return needles.some(needle => text.includes(needle))
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
    return removePersonaName(`${title}について、わたしの経験も交えながらお話ししていきます。少しでも皆さんのお役に立てれば嬉しいです。`)
  }

  // 本文の最初の200文字を取得
  const firstPart = plainText.substring(0, 200).trim()

  // 句点で分割して、最初の1-2文を取得
  const sentences = firstPart.split(/[。！？]/).filter(s => s.trim().length > 0)

  if (sentences.length === 0) {
    return removePersonaName(`${title}について、わたしの経験も交えながらお話ししていきます。少しでも皆さんのお役に立てれば嬉しいです。`)
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

  return removePersonaName(excerpt + closingPhrase)
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

  return removePersonaName(metaDescription)
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

  const lowerTitle = title.toLowerCase()
  const lowerBody = plainText.substring(0, 500).toLowerCase()

  // 各カテゴリのスコアを計算
  const scores = allCategories.map(category => {
    const normalizedTitle = normalizeCategoryTitle(category.title)
    const keywords = CATEGORY_KEYWORDS[normalizedTitle] || []
    let score = 0

    // タイトルでのマッチは2倍のスコア
    keywords.forEach(keyword => {
      const loweredKeyword = keyword.toLowerCase()
      if (lowerTitle.includes(loweredKeyword)) {
        score += 2
      }
      if (lowerBody.includes(loweredKeyword)) {
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
  const fallback = allCategories.find(cat => normalizeCategoryTitle(cat.title) === '業務範囲（療養生活上の世話）')
  return fallback || allCategories[0]
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

  const finalWords = uniqueWords.slice(0, 4)

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
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return blocks
  }

  // 削除対象パターン（正規表現）
  const placeholderPatterns = [
    /\[INTERNAL_LINK:[^\]]+\]/g,
    /\[AFFILIATE_LINK:[^\]]+\]/g,
  ]

  const cleanedBlocks = []

  for (const block of blocks) {
    if (block?._type !== 'block' || !Array.isArray(block.children)) {
      cleanedBlocks.push(block)
      continue
    }

    let blockChanged = false
    const newChildren = []

    for (const child of block.children) {
      if (!child || typeof child.text !== 'string') {
        newChildren.push(child)
        continue
      }

      let newText = child.text
      placeholderPatterns.forEach(pattern => {
        const replaced = newText.replace(pattern, '')
        if (replaced !== newText) {
          blockChanged = true
          newText = replaced
        }
      })

      if (newText.length === 0) {
        blockChanged = true
        continue
      }

      newChildren.push({
        ...child,
        text: newText
      })
    }

    if (!blockChanged) {
      cleanedBlocks.push(block)
      continue
    }

    if (newChildren.length === 0) {
      // プレースホルダーのみだった場合はブロックごと削除
      continue
    }

    cleanedBlocks.push({
      ...block,
      children: newChildren
    })
  }

  return cleanedBlocks
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
 * H3タイトルのみで本文がないセクションに本文を追加（Gemini API使用）
 *
 * H3見出しの直後に別の見出し（H2/H3）が来る場合、
 * 前後のコンテキストを理解して自然な本文を生成
 *
 * @param {Array} blocks - Sanity body ブロック配列
 * @param {string} title - 記事タイトル（コンテキスト）
 * @param {Object} geminiModel - Gemini APIモデル（オプション）
 * @returns {Promise<Array>} 本文を追加したブロック配列
 */
async function addBodyToEmptyH3Sections(blocks, title, geminiModel = null) {
  if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
    return blocks
  }

  const result = []
  const { randomUUID } = require('crypto')
  let currentH2 = ''

  // Gemini APIが利用できない場合は、簡易版を使用
  if (!geminiModel) {
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i]

      if (block._type === 'block' && block.style === 'h2') {
        currentH2 = block.children.map(child => child.text || '').join('').trim()
      }

      result.push(block)

      if (block._type === 'block' && block.style === 'h3') {
        const nextBlock = blocks[i + 1]
        const isNextBlockHeading = nextBlock && nextBlock._type === 'block' && (nextBlock.style === 'h2' || nextBlock.style === 'h3')
        const isLastBlock = i === blocks.length - 1

        if (isNextBlockHeading || isLastBlock) {
          const h3Text = block.children.map(child => child.text || '').join('').trim()
          const bulletSamples = []
          for (let j = i + 1; j < blocks.length; j++) {
            const lookahead = blocks[j]
            if (!lookahead || lookahead._type !== 'block') continue
            if (lookahead.style === 'h2' || lookahead.style === 'h3') {
              break
            }
            if (lookahead.listItem === 'bullet') {
              bulletSamples.push(lookahead.children?.map(child => child.text || '').join('') || '')
              if (bulletSamples.length >= 2) break
            }
          }
          const bodyText = generateFallbackH3Paragraph({
            articleTitle: title,
            sectionTitle: currentH2,
            h3Text,
            bulletSamples
          })

          result.push({
            _type: 'block',
            _key: `body-${randomUUID()}`,
            style: 'normal',
            markDefs: [],
            children: [{ _type: 'span', _key: `span-${randomUUID()}`, marks: [], text: bodyText }]
          })
        }
      }
    }
    return result
  }

  // Gemini APIを使用して高品質な本文を生成
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]
    result.push(block)

    if (block._type === 'block' && block.style === 'h3') {
      const nextBlock = blocks[i + 1]
      const isNextBlockHeading = nextBlock && nextBlock._type === 'block' && (nextBlock.style === 'h2' || nextBlock.style === 'h3')
      const isLastBlock = i === blocks.length - 1

      if (isNextBlockHeading || isLastBlock) {
        // H3見出しのテキストを取得
        const h3Text = block.children.map(child => child.text || '').join('').trim()

        // 前後のコンテキストを取得（前のH2セクション、周辺の段落）
        let contextBefore = ''
        let currentH2 = ''
        for (let j = i - 1; j >= 0; j--) {
          const prevBlock = blocks[j]
          if (prevBlock._type === 'block') {
            if (prevBlock.style === 'h2') {
              currentH2 = prevBlock.children.map(c => c.text || '').join('').trim()
              break
            }
            if (prevBlock.style === 'normal') {
              const text = prevBlock.children.map(c => c.text || '').join('').trim()
              contextBefore = text + ' ' + contextBefore
              if (contextBefore.length > 200) break
            }
          }
        }

        // Gemini APIで本文を生成
        const prompt = `あなたは20歳の看護助手「白崎セラ」です。一人称「わたし」、丁寧な「です・ます」調で書いてください。

記事タイトル: ${title}
現在のセクション（H2）: ${currentH2}
H3見出し: ${h3Text}
前のコンテキスト: ${contextBefore}

このH3見出しに続く本文を2〜3文（80〜150文字）で書いてください。
- 前後の文脈に自然につながる内容
- 白崎セラの優しい口調
- 「です。」「ます。」の短文が連続して幼く見えないよう、文を自然につなげたり語尾を少し変化させる
- 読者に役立つ具体的な情報
- 本文のみ出力（見出しや装飾なし）`

        try {
          const geminiResult = await geminiModel.generateContent(prompt)
          const response = await geminiResult.response
          const bodyText = response.text().trim()

          result.push({
            _type: 'block',
            _key: `body-${randomUUID()}`,
            style: 'normal',
            markDefs: [],
            children: [{ _type: 'span', _key: `span-${randomUUID()}`, marks: [], text: bodyText }]
          })
        } catch (error) {
          // エラー時は簡易版を使用
          const bodyText = `${h3Text}について、具体的に見ていきましょう。`
          result.push({
            _type: 'block',
            _key: `body-${randomUUID()}`,
            style: 'normal',
            markDefs: [],
            children: [{ _type: 'span', _key: `span-${randomUUID()}`, marks: [], text: bodyText }]
          })
        }
      }
    }
  }

  return result
}

/**
 * まとめセクションを最適化（Gemini API使用）
 *
 * 「まとめ」セクション全体を簡潔に再構築：
 * - 本文のみ、または「本文→箇条書き→締め」の形式
 * - だらだら長いのを避ける
 * - 次のステップやアフィリエイトリンクへの誘導を強化
 *
 * @param {Array} blocks - Sanity body ブロック配列
 * @param {string} title - 記事タイトル（コンテキスト）
 * @param {Object} geminiModel - Gemini APIモデル（オプション）
 * @returns {Promise<Array>} 最適化されたブロック配列
 */
async function optimizeSummarySection(blocks, title, geminiModel = null) {
  if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
    return blocks
  }

  const { randomUUID } = require('crypto')

  // まとめセクションを検出
  let summaryIndex = -1
  let nextSectionIndex = -1

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]
    if (block._type === 'block' && block.style === 'h2') {
      const h2Text = block.children.map(child => child.text || '').join('').trim()

      if (h2Text === 'まとめ') {
        summaryIndex = i
      } else if (summaryIndex !== -1 && i > summaryIndex) {
        // まとめの後に別のH2が来た
        nextSectionIndex = i
        break
      }
    }
  }

  // まとめセクションがない場合はそのまま返す
  if (summaryIndex === -1) {
    return blocks
  }

  // まとめセクションの内容を取得
  const endIndex = nextSectionIndex !== -1 ? nextSectionIndex : blocks.length
  const summaryBlocks = blocks.slice(summaryIndex + 1, endIndex)

  // Gemini APIが利用できない場合は、H3を削除するのみ
  if (!geminiModel) {
    const summaryText = summaryBlocks
      .filter(b => b && b._type === 'block')
      .map(b => b.children?.map(c => c.text || '').join('').trim())
      .filter(Boolean)
      .join('\n')

    const hasH3InSummary = summaryBlocks.some(b => b && b._type === 'block' && b.style === 'h3')
    const shouldRegenerate =
      summaryBlocks.length === 0 || isGenericFallbackSummaryText(summaryText)

    // 原則: Geminiが無い場合は「まとめ」を勝手に置き換えない（差分最小）
    // ただし、テンプレまとめ・空に近い場合のみフォールバックで再生成する
    if (!shouldRegenerate && !hasH3InSummary) {
      return blocks
    }

    const cleanedSummaryBlocks = shouldRegenerate
      ? buildFallbackSummaryBlocks({
          articleTitle: title,
          summaryBlocks,
          leadingBlocks: blocks.slice(0, summaryIndex)
        })
      : summaryBlocks.filter(b => !(b && b._type === 'block' && b.style === 'h3'))

    const result = [
      ...blocks.slice(0, summaryIndex + 1),
      ...cleanedSummaryBlocks
    ]

    if (nextSectionIndex !== -1) {
      result.push(...blocks.slice(nextSectionIndex))
    }
    return result
  }

  // 記事全体のコンテキストを取得（まとめより前の内容）
  const articleContext = blocks
    .slice(0, summaryIndex)
    .filter(b => b._type === 'block' && (b.style === 'h2' || b.style === 'normal'))
    .map(b => b.children.map(c => c.text || '').join('').trim())
    .filter(Boolean)
    .join('\n')
    .slice(0, 1500)

  // 現在のまとめ内容
  const currentSummary = summaryBlocks
    .filter(b => b._type === 'block')
    .map(b => b.children.map(c => c.text || '').join('').trim())
    .filter(Boolean)
    .join('\n')

  // Gemini APIでまとめセクションを最適化
  const prompt = `あなたは20歳の看護助手「白崎セラ」です。一人称「わたし」、丁寧な「です・ます」調で書いてください。

記事タイトル: ${title}

記事の主な内容:
${articleContext}

現在のまとめ:
${currentSummary}

この記事のまとめセクションを簡潔に書き直してください。

**要件**:
1. 簡潔でしっかり伝わるまとめ（目安200〜400文字、内容次第で柔軟に調整可）
2. 形式は以下のいずれか:
   - 本文のみ（2〜3段落）
   - 本文（1段落）→ 箇条書き（●で始まる2〜3項目）→ 締めの文（1文）
3. 長すぎるとユーザビリティに反するので、簡潔さと伝わりやすさのバランスを重視
4. 「汎用テンプレの言い回し」は禁止（本文の具体語を最低2つ入れる）
5. 締めの文で「次のステップ」や「行動」を促す
6. 最後に1文だけ、押しつけない形でフォローを入れる（ブックマーク or 公式X @prorenata_jp）
7. H3見出しは使わない

**出力形式**:
プレーンテキストで出力してください。箇条書きは ● で始めてください。`

  try {
    const geminiResult = await geminiModel.generateContent(prompt)
    const response = await geminiResult.response
    const optimizedText = response.text().trim()

    // テキストを段落と箇条書きに分解
    const lines = optimizedText.split('\n').map(l => l.trim()).filter(Boolean)
    const newSummaryBlocks = []

    for (const line of lines) {
      if (line.startsWith('●')) {
        // 箇条書き
        newSummaryBlocks.push({
          _type: 'block',
          _key: `li-${randomUUID()}`,
          style: 'normal',
          listItem: 'bullet',
          level: 1,
          markDefs: [],
          children: [
            { _type: 'span', _key: `span-${randomUUID()}`, marks: [], text: line.replace(/^●\s*/, '') }
          ]
        })
      } else {
        // 通常段落
        newSummaryBlocks.push({
          _type: 'block',
          _key: `p-${randomUUID()}`,
          style: 'normal',
          markDefs: [],
          children: [
            { _type: 'span', _key: `span-${randomUUID()}`, marks: [], text: line }
          ]
        })
      }
    }

    // まとめセクションを置き換え
    const result = [
      ...blocks.slice(0, summaryIndex + 1),
      ...newSummaryBlocks
    ]

    if (nextSectionIndex !== -1) {
      result.push(...blocks.slice(nextSectionIndex))
    }

    return result
  } catch (error) {
    // エラー時は元のブロックを返す
    console.error('まとめセクション最適化エラー:', error.message)
    return blocks
  }
}

/**
 * アフィリエイトリンクを記事に自動追加
 *
 * - 記事内容に応じて最適なリンクを選択
 * - 「まとめ」セクションの前に挿入
 * - 本文とは分離した独立ブロックとして配置
 *
 * @param {Array} blocks - Portable Text ブロック配列
 * @param {string} title - 記事タイトル
 * @returns {Array} アフィリエイトリンクが追加されたブロック配列
 */
function isAffiliateSuggestionRelevant(link, combinedText, slug, categoryNames) {
  if (!link) return false

  if (link.category === '退職代行') {
    const textMatches = /退職|退社|辞め|離職|退職代行/.test(combinedText)
    const slugMatches = /retire|resign|quit/.test(slug)
    const categoryMatches = /退職|辞め/.test(categoryNames)
    return textMatches && (slugMatches || categoryMatches)
  }

  if (link.category === '就職・転職') {
    return /転職|求人|就職|応募|面接|キャリア|採用/.test(combinedText)
  }

  if (link.category === 'アイテム') {
    return /グッズ|ユニフォーム|靴|シューズ|持ち物|アイテム|道具|備品/.test(combinedText)
  }

  return true
}

function addAffiliateLinksToArticle(blocks, title, currentPost = null, options = {}) {
  if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
    return { body: blocks, addedLinks: 0 }
  }

  const {
    suggestLinksForArticle,
    createMoshimoLinkBlocks,
    NON_LIMITED_AFFILIATE_KEYS,
    MOSHIMO_LINKS,
    extractMainItemFromArticle
  } = require('../moshimo-affiliate-links')
  const SERVICE_AFFILIATE_LIMIT = 2
  const disableRetirementAffiliates = Boolean(options.disableRetirementAffiliates)
  const disableCareerAffiliates = Boolean(options.disableCareerAffiliates)
  const bodyText = blocksToPlainText(blocks)
  const mainItem = extractMainItemFromArticle(title, bodyText)
  const allowItemAffiliates = Boolean(mainItem && mainItem.item)
  const suggestions = suggestLinksForArticle(title, bodyText)

  const affiliateHrefMap = Object.entries(MOSHIMO_LINKS).reduce((map, [key, link]) => {
    const normalized = normalizeAffiliateHref(link.url || '')
    if (normalized) {
      map.set(normalized, key)
    }
    return map
  }, new Map())

  const resolveAffiliateKeyFromHref = href => {
    const normalized = normalizeAffiliateHref(href || '')
    if (!normalized) {
      return null
    }
    if (affiliateHrefMap.has(normalized)) {
      return affiliateHrefMap.get(normalized)
    }
    for (const [stored, storedKey] of affiliateHrefMap.entries()) {
      if (normalized.includes(stored) || stored.includes(normalized)) {
        return storedKey
      }
    }
    return null
  }

  const slug = (typeof currentPost?.slug === 'string'
    ? currentPost.slug
    : currentPost?.slug?.current || ''
  ).toLowerCase()
  const categoryNames = (currentPost?.categories || [])
    .map(category => (typeof category === 'string' ? category : category?.title || ''))
    .join(' ')
    .toLowerCase()
  const combinedText = `${title} ${bodyText}`.toLowerCase()

  if (!suggestions || suggestions.length === 0) {
    return { body: blocks, addedLinks: 0 }
  }

  const existingAffiliateKeys = new Set()
  blocks.forEach(block => {
    if (block?._type === 'affiliateEmbed' && typeof block.linkKey === 'string') {
      existingAffiliateKeys.add(block.linkKey)
      return
    }
    if (isInlineAffiliateBlock(block) && Array.isArray(block.markDefs)) {
      const inlineMark = block.markDefs.find(def => def && def._type === 'link' && typeof def.href === 'string')
      const inlineKey = inlineMark ? resolveAffiliateKeyFromHref(inlineMark.href) : null
      if (inlineKey) {
        existingAffiliateKeys.add(inlineKey)
      }
    }
  })

  const existingServiceCount = blocks.filter(
    block => block?._type === 'affiliateEmbed' &&
      typeof block.linkKey === 'string' &&
      !NON_LIMITED_AFFILIATE_KEYS.has(block.linkKey)
  ).length
  let remainingServiceSlots = Math.max(0, SERVICE_AFFILIATE_LIMIT - existingServiceCount)

  const preferredKeys = resolvePreferredAffiliateKeys(currentPost, combinedText)
  const prioritizedSuggestions = suggestions
    .filter(link => isAffiliateSuggestionRelevant(link, combinedText, slug, categoryNames))
    // アイテム案件は「アイテム記事」だけに限定（不適切な挿入を防ぐ）
    .filter(link => (allowItemAffiliates ? true : link.category !== 'アイテム'))

  const selectedLinks = []
  const trySelect = link => {
    if (disableRetirementAffiliates && link.category === '退職代行') {
      return
    }
    if (disableCareerAffiliates && link.category === '就職・転職') {
      return
    }
    if (existingAffiliateKeys.has(link.key)) {
      return
    }
    if (preferredKeys.length > 0 && !preferredKeys.includes(link.key)) {
      return
    }
    const isNonLimited = NON_LIMITED_AFFILIATE_KEYS.has(link.key)
    if (!isNonLimited && remainingServiceSlots <= 0) {
      return
    }
    selectedLinks.push({ link, isNonLimited })
    if (!isNonLimited) {
      remainingServiceSlots -= 1
    }
  }

  prioritizedSuggestions.forEach(trySelect)

  if (preferredKeys.length === 0 && selectedLinks.length === 0 && remainingServiceSlots > 0) {
    prioritizedSuggestions.forEach(trySelect)
  }

  if (selectedLinks.length === 0) {
    const fallbackKeys = determineFallbackAffiliateKeys({
      text: combinedText,
      slug,
      categories: categoryNames,
      disableRetirement: disableRetirementAffiliates,
      disableCareer: disableCareerAffiliates
    })
    fallbackKeys.forEach(key => {
      const link = MOSHIMO_LINKS[key]
      if (link) {
        trySelect({ key, ...link })
      }
    })
  }

  const resultBlocks = [...blocks]
  let addedLinks = 0
  const insertionIndex = findSummaryInsertIndex(resultBlocks)

  // Amazon/Rakutenを分離
  const amazonLink = selectedLinks.find(({ link }) => link.key === 'amazon')
  const rakutenLink = selectedLinks.find(({ link }) => link.key === 'rakuten')
  const otherLinks = selectedLinks.filter(({ link }) => link.key !== 'amazon' && link.key !== 'rakuten')

  // Amazon/Rakutenを一つのカードにまとめる
  if (amazonLink && rakutenLink) {
    const contextHeading = findAffiliateContextHeading(resultBlocks, insertionIndex)
    const { extractMainItemFromArticle } = require('../moshimo-affiliate-links')
    const mainItem = extractMainItemFromArticle(title, bodyText)
    const itemText = mainItem?.variants?.[1] || mainItem?.item || '小物や替えのグローブなど、毎日使うアイテム'

    const combinedCta = `${itemText}を買い足すときは、Amazon・楽天で常備しておくと安心です。ポイント活用でコストも抑えられます。`

    const linkBlocks = createMoshimoLinkBlocks('amazon', contextHeading, {
      articleTitle: title,
      articleBody: bodyText,
      ctaText: combinedCta,
      additionalLinks: [rakutenLink.link]
    })

    if (linkBlocks && linkBlocks.length > 0) {
      resultBlocks.splice(insertionIndex, 0, ...linkBlocks)
      addedLinks += 2
    }
  } else if (amazonLink) {
    const contextHeading = findAffiliateContextHeading(resultBlocks, insertionIndex)
    const linkBlocks = createMoshimoLinkBlocks(amazonLink.link.key, contextHeading, {
      articleTitle: title,
      articleBody: bodyText
    })
    if (linkBlocks && linkBlocks.length > 0) {
      resultBlocks.splice(insertionIndex, 0, ...linkBlocks)
      addedLinks += 1
    }
  } else if (rakutenLink) {
    const contextHeading = findAffiliateContextHeading(resultBlocks, insertionIndex)
    const linkBlocks = createMoshimoLinkBlocks(rakutenLink.link.key, contextHeading, {
      articleTitle: title,
      articleBody: bodyText
    })
    if (linkBlocks && linkBlocks.length > 0) {
      resultBlocks.splice(insertionIndex, 0, ...linkBlocks)
      addedLinks += 1
    }
  }

  // 他のリンクを追加
  otherLinks.forEach(({ link }) => {
    const contextHeading = findAffiliateContextHeading(resultBlocks, insertionIndex)
    const linkBlocks = createMoshimoLinkBlocks(link.key, contextHeading, {
      articleTitle: title,
      articleBody: bodyText
    })
    if (!linkBlocks || linkBlocks.length === 0) {
      return
    }

    resultBlocks.splice(insertionIndex, 0, ...linkBlocks)
    addedLinks += 1
  })

  return {
    body: resultBlocks,
    addedLinks
  }
}

function findSummaryInsertIndex(blocks) {
  let summaryIndex = -1

  // 「まとめ」H2見出しを見つける
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]
    if (block?._type === 'block' && block.style === 'h2') {
      const text = blockPlainText(block)
      if (text === 'まとめ') {
        summaryIndex = i
        break
      }
    }
  }

  if (summaryIndex === -1) {
    return blocks.length
  }

  // 「まとめ」セクションの最後を見つける（次のH2または免責事項の前）
  for (let i = summaryIndex + 1; i < blocks.length; i++) {
    const block = blocks[i]

    // 次のH2見出しが見つかった場合、その直前
    if (block?._type === 'block' && block.style === 'h2') {
      return i
    }

    // 免責事項が見つかった場合、その直前
    if (block?._type === 'block' && Array.isArray(block.children)) {
      const firstChildText = block.children[0]?.text?.trim() || ''
      if (firstChildText.startsWith('免責事項')) {
        return i
      }
    }
  }

  // 見つからなかった場合は最後
  return blocks.length
}

function findAffiliateContextHeading(blocks, insertIndex) {
  for (let i = insertIndex - 1; i >= 0; i -= 1) {
    const block = blocks[i]
    if (
      block &&
      block._type === 'block' &&
      (block.style === 'h2' || block.style === 'h3')
    ) {
      const text = blockPlainText(block)
      if (text) {
        return text
      }
    }
  }
  return ''
}

function removeSummaryListItems(blocks) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return { body: blocks, converted: 0 }
  }

  const summaryIndex = blocks.findIndex(block => {
    if (!block || block._type !== 'block' || block.style !== 'h2') return false
    return blockPlainText(block) === 'まとめ'
  })

  if (summaryIndex === -1) {
    return { body: blocks, converted: 0 }
  }

  let endIndex = blocks.length
  for (let i = summaryIndex + 1; i < blocks.length; i += 1) {
    const block = blocks[i]
    if (block && block._type === 'block' && block.style === 'h2') {
      endIndex = i
      break
    }
  }

  const updated = [...blocks]
  let converted = 0

  for (let i = summaryIndex + 1; i < endIndex; i += 1) {
    const block = updated[i]
    if (!block || block._type !== 'block') continue
    if (block.listItem) {
      const newBlock = { ...block }
      delete newBlock.listItem
      delete newBlock.level
      newBlock.style = 'normal'
      updated[i] = newBlock
      converted += 1
    }
  }

  return { body: converted > 0 ? updated : blocks, converted }
}

function isServiceAffiliateBlock(block) {
  if (!block || block._type !== 'affiliateEmbed') {
    return false
  }
  const key = block.linkKey
  if (!key || !MOSHIMO_LINKS[key]) return false
  const category = MOSHIMO_LINKS[key].category || ''
  return category !== 'アイテム'
}

function repositionServiceAffiliates(blocks) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return { body: blocks, moved: 0 }
  }

  const summaryInsertIndex = findSummaryInsertIndex(blocks)
  if (summaryInsertIndex <= 0 || summaryInsertIndex > blocks.length) {
    return { body: blocks, moved: 0 }
  }

  const serviceIndexes = []
  blocks.forEach((block, index) => {
    if (isServiceAffiliateBlock(block)) {
      serviceIndexes.push(index)
    }
  })

  if (serviceIndexes.length === 0) {
    return { body: blocks, moved: 0 }
  }

  const targetIndex = serviceIndexes[serviceIndexes.length - 1]
  const updated = [...blocks]
  const [targetBlock] = updated.splice(targetIndex, 1)

  const newInsertionIndex = findSummaryInsertIndex(updated)
  if (newInsertionIndex <= 0 || newInsertionIndex > updated.length) {
    updated.splice(targetIndex, 0, targetBlock)
    return { body: blocks, moved: 0 }
  }

  updated.splice(newInsertionIndex, 0, targetBlock)
  return { body: updated, moved: 1 }
}

function resolvePreferredAffiliateKeys(post, combinedText) {
  const text = (combinedText || '').toLowerCase()
  const slug = (typeof post?.slug === 'string'
    ? post.slug
    : post?.slug?.current || ''
  ).toLowerCase()
  const categories = (post?.categories || [])
    .map(category => (typeof category === 'string' ? category : category?.title || ''))
    .join(' ')
    .toLowerCase()

  const matchedKeys = new Set()
  AFFILIATE_LINK_RULES.forEach(rule => {
    const matchText = rule.textKeywords.some(keyword => text.includes(keyword))
    const matchSlug = rule.slugKeywords.some(keyword => slug.includes(keyword))
    const matchCategory = rule.categoryKeywords.some(keyword => categories.includes(keyword))
    if (matchText || matchSlug || matchCategory) {
      rule.linkKeys.forEach(key => matchedKeys.add(key))
    }
  })

  return [...matchedKeys]
}

function findSectionInsertionIndex(blocks, keywords = [], options = {}) {
  if (!Array.isArray(blocks) || blocks.length === 0 || !keywords || keywords.length === 0) {
    return -1
  }

  const includeHeadings = Boolean(options.includeHeadings)
  let currentSectionStart = -1
  let currentSectionMatches = false

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]
    if (!block || block._type !== 'block') continue

    if (block.style === 'h2' || block.style === 'h3') {
      const text = blockPlainText(block)
      if (text === 'まとめ') {
        if (currentSectionMatches) {
          return determineSectionInsertIndex(blocks, currentSectionStart, i, includeHeadings)
        }
        return -1
      }

      if (currentSectionMatches) {
        return determineSectionInsertIndex(blocks, currentSectionStart, i, includeHeadings)
      }

      currentSectionStart = i
      currentSectionMatches = keywords.some(keyword => text.includes(keyword))
    }
  }

  if (currentSectionMatches) {
    return determineSectionInsertIndex(blocks, currentSectionStart, blocks.length, includeHeadings)
  }
  return -1
}

function determineSectionInsertIndex(blocks, startIndex, endIndex, includeHeadings) {
  let insertIndex = endIndex
  for (let i = endIndex - 1; i > startIndex; i--) {
    const block = blocks[i]
    if (!block || block._type !== 'block') continue
    if (block.listItem) continue
    if (block.style === 'normal') {
      return i + 1
    }
  }
  return includeHeadings ? endIndex : -1
}

/**
 * 出典リンクを記事に自動追加（YMYL対策）
 *
 * - 記事内容に応じて信頼できる出典を追加
 * - 厚生労働省、医療機関などの公式データ
 *
 * @param {Array} blocks - Portable Text ブロック配列
 * @param {string} title - 記事タイトル
 * @returns {Array} 出典リンクが追加されたブロック配列
 */
const SOURCE_RULES = [
  {
    name: '厚生労働省 職業情報提供サイト（看護助手）',
    url: 'https://shigoto.mhlw.go.jp/User/Occupation/Detail/246?utm_source=chatgpt.com',
    textKeywords: ['仕事内容', '業務', 'タスク', '役割', 'job tag', '患者対応', 'ケア', '仕事とは'],
    slugKeywords: ['job', 'role', 'overview', 'detail'],
    categoryKeywords: ['仕事内容', '患者対応', '実務', '看護師']
  },
  {
    name: '厚生労働省 看護政策情報・通知一覧',
    url: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000177221.html?utm_source=chatgpt.com',
    textKeywords: ['制度', 'トレンド', '法改正', '通知', '告示', '診療報酬', '政策', 'アップデート', '見直し', '改定', '基準'],
    slugKeywords: ['policy', 'trend', 'update', 'law'],
    categoryKeywords: ['仕事']
  },
  {
    name: '日本看護協会 看護チームにおける看護補助者活用ガイドライン',
    url: 'https://www.nurse.or.jp/nursing/kango_seido/guideline/index.html?utm_source=chatgpt.com',
    textKeywords: ['ガイドライン', '看護チーム', '連携', '役割分担', '資格', '人間関係'],
    categoryKeywords: ['資格', '人間関係', '実務', '患者対応']
  },
  {
    name: '日本看護協会 看護サービス提供体制のあり方',
    url: 'https://www.nurse.or.jp/home/publication/pdf/guideline/way_of_nursing_service.pdf?utm_source=chatgpt.com',
    textKeywords: ['患者', '療養', '食事', '排泄', '入浴', '移動', '看護サービス'],
    categoryKeywords: ['患者対応', '実務', '看護師']
  },
  {
    name: '日本看護協会 看護補助者の離職状況レポート',
    url: 'https://www.nurse.or.jp/home/assets/20231005_nl01.pdf?utm_source=chatgpt.com',
    textKeywords: ['離職', '退職', '離職率', '処遇', '給与', '賃金'],
    slugKeywords: ['resignation', 'quit', 'salary'],
    categoryKeywords: ['退職', '給与', '悩み']
  },
  {
    name: 'NsPace Career 看護助手の転職・年収コラム',
    url: 'https://ns-pace-career.com/media/tips/01230/?utm_source=chatgpt.com',
    textKeywords: ['転職', '求人', 'キャリア', '面接', '志望動機', '年収'],
    slugKeywords: ['career', 'job'],
    categoryKeywords: ['転職', '給与']
  },
  {
    name: 'コメディカルドットコム 看護助手の給料解説',
    url: 'https://www.co-medical.com/knowledge/article112/?utm_source=chatgpt.com',
    textKeywords: ['給料', '年収', '月収', 'ボーナス', '相場'],
    categoryKeywords: ['給与']
  },
  {
    name: '看護助手ラボ 悩みとキャリアの記事',
    url: 'https://nurse-aide-lab.jp/career/yametahougaii/?utm_source=chatgpt.com',
    textKeywords: ['悩み', 'やめたほうがいい', '不安', 'ネガティブ', 'ストレス'],
    categoryKeywords: ['悩み', '退職']
  },
  {
    name: '介護サーチプラス 看護助手の仕事内容コラム',
    url: 'https://kaigosearch-plus.jp/columns/nursing-assistant-job-overview?utm_source=chatgpt.com',
    textKeywords: ['仕事内容', '解説', 'コラム', '働き方'],
    categoryKeywords: ['仕事内容', '実務']
  }
]

const SOURCE_URL_CACHE = new Map()

async function isSourceUrlReachable(url) {
  if (!url) return false
  if (SOURCE_URL_CACHE.has(url)) {
    return SOURCE_URL_CACHE.get(url)
  }

  const attempt = async method => {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)
      const response = await fetch(url, { method, redirect: 'follow', signal: controller.signal })
      clearTimeout(timeout)
      if (response.ok && response.status < 400) {
        return true
      }
    } catch (error) {
      return false
    }
    return false
  }

  let reachable = await attempt('HEAD')
  if (!reachable) {
    reachable = await attempt('GET')
  }

  SOURCE_URL_CACHE.set(url, reachable)
  return reachable
}

const AFFILIATE_LINK_RULES = [
  {
    textKeywords: ['転職', '求人', 'キャリア', '応募', '面接', '志望動機', '就職'],
    slugKeywords: ['career', 'job', 'application', 'interview'],
    categoryKeywords: ['転職', '求人', 'キャリア'],
    linkKeys: ['humanlifecare', 'kaigobatake']
  },
  {
    textKeywords: ['退職', '離職', '辞め', '辞職', '退社', '退職代行'],
    slugKeywords: ['resign', 'retire', 'quit'],
    categoryKeywords: ['退職'],
    linkKeys: ['miyabi', 'sokuyame']
  },
  {
    textKeywords: ['持ち物', '道具', 'アイテム', 'グッズ', 'ナースシューズ', 'ユニフォーム', 'カバン', 'ケア用品'],
    slugKeywords: ['uniform', 'item', 'goods', 'bag'],
    categoryKeywords: ['持ち物', 'グッズ', '道具'],
    linkKeys: ['amazon', 'rakuten', 'nursery']
  },
  {
    textKeywords: ['資格', '研修', '受講', '学び直し', '学校', '講座'],
    slugKeywords: ['qualification', 'school', 'study'],
    categoryKeywords: ['資格', '学び'],
    linkKeys: ['amazon', 'rakuten']
  }
]

const AFFILIATE_LINK_KEYWORDS = {
  humanlifecare: ['転職', '求人', 'キャリア', '応募', '面接'],
  kaigobatake: ['転職', '求人', '介護職', '資格', '未経験'],
  miyabi: ['退職', '離職', '辞める', '退社', '退職代行'],
  sokuyame: ['退職', '即日', '今すぐ', '退職代行'],
  amazon: ['持ち物', 'グッズ', '道具', '用品', 'アイテム', 'バッグ', 'ケア製品', '小物', '手袋', 'グローブ', '備品', '物品', '補充'],
  rakuten: ['持ち物', 'グッズ', '道具', 'アイテム', 'ショッピング', '通販', '買い足す', 'ポイント', '物品'],
  nursery: ['ユニフォーム', '制服', 'スクラブ', 'シューズ', 'ナース服', 'ウェア']
}

function determineFallbackAffiliateKeys({
  text = '',
  slug = '',
  categories = '',
  disableRetirement = false,
  disableCareer = false
}) {
  const normalizedText = text.toLowerCase()
  const normalizedSlug = slug.toLowerCase()
  const normalizedCategories = categories.toLowerCase()

  const keys = []

  const wantsRetirement =
    !disableRetirement &&
    (normalizedText.includes('退職') ||
      normalizedText.includes('辞め') ||
      normalizedCategories.includes('退職') ||
      normalizedSlug.includes('resignation'))

  const wantsCareer =
    normalizedText.includes('転職') ||
    normalizedText.includes('求人') ||
    normalizedCategories.includes('転職') ||
    normalizedSlug.includes('career')

  if (wantsRetirement) {
    keys.push('miyabi', 'sokuyame')
  } else if (wantsCareer && !disableCareer) {
    keys.push('humanlifecare', 'kaigobatake')
  }

  keys.push('amazon', 'rakuten', 'nursery')

  return keys
}

function normalizeTextForMatching(text = '') {
  return text.replace(/\s+/g, '').replace(/[、。]/g, '')
}

function findBestSourceRule({ text = '', slug = '', categories = '' }) {
  const normalizedText = normalizeTextForMatching(text.toLowerCase())
  const normalizedSlug = slug.toLowerCase()
  const normalizedCategories = categories.toLowerCase()
  let bestRule = null
  let bestScore = 0

  SOURCE_RULES.forEach(rule => {
    let score = 0
    if (rule.textKeywords && rule.textKeywords.some(keyword => normalizedText.includes(keyword))) {
      score += 3
    }
    if (rule.slugKeywords && rule.slugKeywords.some(keyword => normalizedSlug.includes(keyword))) {
      score += 2
    }
    if (rule.categoryKeywords && rule.categoryKeywords.some(keyword => normalizedCategories.includes(keyword))) {
      score += 2
    }
    if (score > bestScore) {
      bestScore = score
      bestRule = rule
    }
  })

  return bestScore > 0 ? bestRule : null
}

async function addSourceLinksToArticle(blocks, title, currentPost = null) {
  if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
    return { body: blocks, addedSource: null }
  }

  const { randomUUID } = require('crypto')
  const bodyPlainText = blocksToPlainText(blocks)
  const combinedText = `${title}\n${bodyPlainText}`
  const slugText = (typeof currentPost?.slug === 'string'
    ? currentPost.slug
    : currentPost?.slug?.current || ''
  ).toLowerCase()
  const categoryTitles = (currentPost?.categories || [])
    .map(category => (typeof category === 'string' ? category : category?.title || ''))
    .join(' ')

  const selectedSource = findBestSourceRule({
    text: combinedText,
    slug: slugText,
    categories: categoryTitles
  })

  if (!selectedSource) {
    return { body: blocks, addedSource: null }
  }

  const alreadyHasSource = blocks.some(block =>
    block?._type === 'block' &&
    Array.isArray(block.markDefs) &&
    block.markDefs.some(def => def?.href === selectedSource.url)
  )

  if (alreadyHasSource) {
    return { body: blocks, addedSource: null }
  }

  const reachable = await isSourceUrlReachable(selectedSource.url)
  if (!reachable) {
    return { body: blocks, addedSource: null }
  }

  let summaryStartIndex = -1

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]
    if (block._type === 'block' && block.style === 'h2') {
      const h2Text = block.children.map(child => child.text || '').join('').trim()

      if (h2Text === 'まとめ') {
        summaryStartIndex = i
      }
    }
  }

  // まとめセクション内（および直後）に参考を置くのは禁止。
  // 参考リンクは原則として各セクション末尾に置くが、最低限「まとめの前」に挿入してUXを守る。
  const insertPosition = summaryStartIndex !== -1 ? summaryStartIndex : blocks.length

  const linkMarkKey = `link-${randomUUID()}`
  const sourceBlock = {
    _type: 'block',
    _key: `source-${randomUUID()}`,
    style: 'normal',
    markDefs: [
      {
        _key: linkMarkKey,
        _type: 'link',
        href: selectedSource.url
      }
    ],
    children: [
      {
        _type: 'span',
        _key: `span-${randomUUID()}`,
        text: '参考資料：',
        marks: []
      },
      {
        _type: 'span',
        _key: `span-${randomUUID()}`,
        text: selectedSource.name,
        marks: [linkMarkKey]
      }
    ]
  }

  const result = blocks.slice(0, insertPosition)
  result.push(sourceBlock)

  if (insertPosition < blocks.length) {
    result.push(...blocks.slice(insertPosition))
  }

  return {
    body: result,
    addedSource: {
      name: selectedSource.name,
      url: selectedSource.url
    }
  }
}

function removeReferencesAfterSummary(blocks) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return { body: blocks, removed: 0 }
  }

  const summaryIndex = blocks.findIndex(block => {
    if (!block || block._type !== 'block' || block.style !== 'h2') return false
    const text = blockPlainText(block)
    return text === 'まとめ'
  })

  if (summaryIndex === -1) {
    return { body: blocks, removed: 0 }
  }

  let endIndex = blocks.length
  for (let i = summaryIndex + 1; i < blocks.length; i += 1) {
    const block = blocks[i]
    if (block && block._type === 'block' && block.style === 'h2') {
      endIndex = i
      break
    }
  }

  const prefixes = ['参考', '出典']
  const updated = [...blocks]
  let removed = 0

  for (let i = endIndex - 1; i > summaryIndex; i -= 1) {
    const block = updated[i]
    if (!block || block._type !== 'block') continue
    const text = blockPlainText(block)
    if (prefixes.some(prefix => text.startsWith(prefix))) {
      updated.splice(i, 1)
      removed += 1
    }
  }

  return { body: removed > 0 ? updated : blocks, removed }
}

module.exports = {
  blocksToPlainText,
  generateExcerpt,
  generateMetaDescription,
  generateSlugFromTitle,
  generateTags,
  selectBestCategory,
  removeGreetings,
  removePersonaName,
  removeClosingRemarks,
  removePlaceholderLinks,
  separateAffiliateLinks,
  removeHashtagLines,
  addBodyToEmptyH3Sections,
  optimizeSummarySection,
  addAffiliateLinksToArticle,
  addSourceLinksToArticle,
  buildFallbackSummaryBlocks,
  findSummaryInsertIndex,
  removeReferencesAfterSummary,
  removeSummaryListItems,
  repositionServiceAffiliates
}
