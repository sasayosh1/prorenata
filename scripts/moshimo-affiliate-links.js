/**
 * アフィリエイトリンクデータベース
 *
 * リンクコードは絶対に変更しない
 * 定期的にリンク有効性をチェック
 * 無効になったリンクは別の案件に差し替え
 */

const { randomUUID } = require('crypto')

const INLINE_AFFILIATE_KEYS = new Set([])

const MOSHIMO_LINKS = {
  // 就職・転職サービス
  humanlifecare: {
    name: 'ヒューマンライフケア',
    description: '介護・介護職・介護士・ケアマネージャーの求人',
    category: '就職・転職',
    targetArticles: ['転職', '求人', '介護', 'ケアマネ', '辞めたい', 'キャリア'],
    html: '<img src="https://www.rentracks.jp/adx/p.gifx?idx=0.71551.371865.8943.12704&dna=148900" border="0" height="1" width="1"><a href="https://www.rentracks.jp/adx/r.html?idx=0.71551.371865.8943.12704&dna=148900" rel="nofollow noopener" target="_blank">ヒューマンライフケア</a>',
    appealText: '💼 転職・求人をお探しの方へ',
    linkText: '介護職・看護助手の求人なら「ヒューマンライフケア」',
    url: 'https://www.rentracks.jp/adx/r.html?idx=0.71551.371865.8943.12704&dna=148900',
    active: true,
    addedDate: '2025-10-10',
    reward: '17,600円',
    condition: '申込定額'
  },

  kaigobatake: {
    name: 'かいご畑',
    description: '介護職専門の人材サービス',
    category: '就職・転職',
    targetArticles: ['転職', '求人', '介護', '未経験', '資格', '辞めたい'],
    html: '<a href="https://px.a8.net/svt/ejp?a8mat=2ZTT9A+D2Y8MQ+1W34+C8VWY" rel="nofollow">かいご畑で介護職・看護助手の求人を探す</a><img border="0" width="1" height="1" src="https://www17.a8.net/0.gif?a8mat=2ZTT9A+D2Y8MQ+1W34+C8VWY" alt="">',
    appealText: '🌾 介護職専門の求人をお探しの方へ',
    linkText: '介護職・看護助手の求人なら「かいご畑」',
    url: 'https://px.a8.net/svt/ejp?a8mat=2ZTT9A+D2Y8MQ+1W34+C8VWY',
    active: true,
    addedDate: '2025-10-14',
    reward: '6,000円',
    condition: '新規人材サービス登録'
  },

  renewcare: {
    name: 'リニューケア',
    description: '関西圏に特化した介護職・看護助手の転職',
    category: '就職・転職',
    targetArticles: ['関西', '都市部', '転職', '求人', '相談'],
    html: '<a href="//af.moshimo.com/af/c/click?a_id=5207862&p_id=6826&pc_id=19536&pl_id=86880" rel="nofollow" referrerpolicy="no-referrer-when-downgrade" attributionsrc>リニューケアの転職支援に相談する</a><img src="//www18.moshimo.com/af/i/impression?a_id=5207862&p_id=6826&pc_id=19536&pl_id=86880" width="1" height="1" style="border:none;" loading="lazy" alt="">',
    appealText: '💼 関西圏の転職相談をしたい方へ',
    linkText: 'リニューケアの転職支援に相談する',
    url: '//af.moshimo.com/af/c/click?a_id=5207862&p_id=6826&pc_id=19536&pl_id=86880',
    active: true,
    addedDate: '2025-10-14',
    reward: '7,000円',
    condition: '新規会員登録'
  },

  kaigobiyou: {
    name: '介護美容研究所',
    description: '介護×美容専門のスクール（週1通学＋振替制度／現場実習あり）',
    category: '資格',
    targetArticles: ['介護美容', 'スクール', '学び直し', '研修', 'カリキュラム'],
    html: '<a href="https://px.a8.net/svt/ejp?a8mat=3BQLBJ+BSICCY+4LBY+5YJRM" rel="nofollow">介護美容研究所</a><img border="0" width="1" height="1" src="https://www16.a8.net/0.gif?a8mat=3BQLBJ+BSICCY+4LBY+5YJRM" alt="">',
    appealText: '💡 介護×美容の専門スクール資料を取り寄せる',
    linkText: '介護美容研究所で資料を取り寄せる',
    url: 'https://px.a8.net/svt/ejp?a8mat=3BQLBJ+BSICCY+4LBY+5YJRM',
    active: true,
    addedDate: '2025-11-27',
    reward: '紹介成果に準ずる',
    condition: '資料請求・説明会申込'
  },

  // アイテム・商品
  nursery: {
    name: 'ナースリー',
    description: '看護・医療・介護ユニフォーム専門店',
    category: 'アイテム',
    targetArticles: ['制服', 'ユニフォーム', 'グッズ', '必要なもの', '靴', 'シューズ', 'スクラブ', 'ナース服', 'ウェア'],
    html: '<a href="//ck.jp.ap.valuecommerce.com/servlet/referral?sid=3757192&pid=892328264" rel="nofollow"><img src="//ad.jp.ap.valuecommerce.com/servlet/gifbanner?sid=3757192&pid=892328264" height="1" width="1" border="0">看護助手向けユニフォーム・グッズを探す</a>',
    appealText: '',
    linkText: '看護・介護ユニフォーム専門店「ナースリー」',
    url: '//ck.jp.ap.valuecommerce.com/servlet/referral?sid=3757192&pid=892328264',
    active: true,
    addedDate: '2025-11-29',
    reward: '10.47%（9.52%）',
    condition: '商品購入'
  },

  amazon: {
    name: 'Amazon',
    description: 'Amazon商品購入',
    category: 'アイテム',
    targetArticles: ['グッズ', '靴', 'シューズ', '本', '書籍', '必要なもの', '小物', '手袋', 'グローブ', '備品', '衛生用品', '物品', '補充'],
    html: '<a href="//af.moshimo.com/af/c/click?a_id=5211352&p_id=170&pc_id=185&pl_id=4161" rel="nofollow" referrerpolicy="no-referrer-when-downgrade" attributionsrc>Amazonで看護助手グッズを探す</a><img src="//i.moshimo.com/af/i/impression?a_id=5211352&p_id=170&pc_id=185&pl_id=4161" width="1" height="1" style="border:none;" loading="lazy">',
    appealText: '',
    linkText: 'Amazonで看護助手グッズを探す',
    url: '//af.moshimo.com/af/c/click?a_id=5211352&p_id=170&pc_id=185&pl_id=4161',
    active: true,
    addedDate: '2025-10-16',
    reward: '2.0%（もしも経由）',
    condition: '商品購入',
    note: ''
  },

  rakuten: {
    name: '楽天市場',
    description: '楽天市場での商品購入',
    category: 'アイテム',
    targetArticles: ['シューズ', '靴', 'グッズ', '制服', 'ユニフォーム', '必要なもの', '通販', '買い足す', 'ポイント', '比較', '物品'],
    html: '<a href="//af.moshimo.com/af/c/click?a_id=5207851&p_id=54&pc_id=54&pl_id=621" rel="nofollow" referrerpolicy="no-referrer-when-downgrade" attributionsrc>楽天市場</a><img src="//i.moshimo.com/af/i/impression?a_id=5207851&p_id=54&pc_id=54&pl_id=621" width="1" height="1" style="border:none;" loading="lazy">',
    appealText: '',
    linkText: '楽天市場で看護助手グッズを探す',
    url: '//af.moshimo.com/af/c/click?a_id=5207851&p_id=54&pc_id=54&pl_id=621',
    active: true,
    addedDate: '2025-10-10',
    reward: '2%',
    condition: '商品購入'
  },

  // 退職代行サービス
  miyabi: {
    name: '弁護士法人みやび',
    description: '弁護士による退職代行サービス',
    category: '退職代行',
    targetArticles: ['辞めたい', '退職', '辞める', '転職', '辞め方', '理由', '弁護士'],
    html: '<a href="//ck.jp.ap.valuecommerce.com/servlet/referral?sid=3757192&pid=892314166" rel="nofollow"><img src="//ad.jp.ap.valuecommerce.com/servlet/gifbanner?sid=3757192&pid=892314166" height="1" width="1" border="0">自由テキスト</a>',
    appealText: '⚖️ 退職でお悩みの方へ',
    linkText: '弁護士による退職代行サービス【弁護士法人みやび】',
    url: '//ck.jp.ap.valuecommerce.com/servlet/referral?sid=3757192&pid=892314166',
    active: true,
    addedDate: '2025-10-14',
    reward: '16,500円',
    condition: '商品購入'
  },

  sokuyame: {
    name: '退職代行 即ヤメ',
    description: 'スピード退職代行サービス',
    category: '退職代行',
    targetArticles: ['辞めたい', '退職', '辞める', 'すぐ', '即日', '辞め方'],
    html: '<a href="//af.moshimo.com/af/c/click?a_id=5211257&p_id=4655&pc_id=12227&pl_id=61921" rel="nofollow" referrerpolicy="no-referrer-when-downgrade" attributionsrc>即日退職可能な退職代行サービス</a><img src="//i.moshimo.com/af/i/impression?a_id=5211257&p_id=4655&pc_id=12227&pl_id=61921" width="1" height="1" style="border:none;" loading="lazy">',
    appealText: '⚡ すぐに退職したい方へ',
    linkText: '即日退職可能な「退職代行 即ヤメ」',
    url: '//af.moshimo.com/af/c/click?a_id=5211257&p_id=4655&pc_id=12227&pl_id=61921',
    active: true,
    addedDate: '2025-10-14',
    reward: '15,000円',
    condition: 'webからの退職代行サービスの依頼'
  },

  gaia: {
    name: '弁護士法人ガイア法律事務所',
    description: 'LINEもしくはメールでの相談問い合わせ完了後',
    category: '退職代行',
    targetArticles: ['辞めたい', '退職', '辞める', '相談', 'LINE', '弁護士'],
    html: '<a href="//af.moshimo.com/af/c/click?a_id=5211256&p_id=5546&pc_id=15198&pl_id=71517" rel="nofollow" referrerpolicy="no-referrer-when-downgrade" attributionsrc>（自由テキスト）</a><img src="//i.moshimo.com/af/i/impression?a_id=5211256&p_id=5546&pc_id=15198&pl_id=71517" width="1" height="1" style="border:none;" loading="lazy">',
    appealText: '💬 LINEで気軽に相談したい方へ',
    linkText: '弁護士法人ガイア法律事務所で相談する',
    url: '//af.moshimo.com/af/c/click?a_id=5211256&p_id=5546&pc_id=15198&pl_id=71517',
    active: true,
    addedDate: '2025-10-14',
    reward: '14,000円',
    condition: 'LINEもしくはメールでの相談問い合わせ完了後',
    network: 'もしも',
    officialUrl: 'https://www.gaia-law-office.jp/taisyoku/'
  },

  // 注意: 退職代行カテゴリは現在 miyabi / sokuyame / gaia の3案件が有効
}

const NON_LIMITED_AFFILIATE_KEYS = new Set(['amazon', 'rakuten', 'nursery'])

// カテゴリ別にリンクを取得
function getLinksByCategory(category) {
  return Object.entries(MOSHIMO_LINKS)
    .filter(([_, link]) => link.category === category && link.active)
    .map(([key, link]) => ({ key, ...link }))
}

// キーワードに基づいて適切なリンクを提案
function suggestLinksForArticle(articleTitle, articleBody = '') {
  const text = (articleTitle + ' ' + articleBody).toLowerCase()
  const suggestions = []

  Object.entries(MOSHIMO_LINKS).forEach(([key, link]) => {
    if (!link.active) return

    const matchCount = link.targetArticles.filter(keyword =>
      text.includes(keyword.toLowerCase())
    ).length

    if (matchCount > 0) {
      suggestions.push({
        key,
        ...link,
        matchScore: matchCount
      })
    }
  })

  return suggestions.sort((a, b) => b.matchScore - a.matchScore)
}

// Portable Text形式のリンクブロック + 埋め込みブロックを生成
function escapeHtml(text = '') {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const AFFILIATE_CATEGORY_CTA = {
  '就職・転職': (link, contextHeading) => {
    const intro = contextHeading
      ? `「${contextHeading}」の場面で、もし「今の環境だと難しいな」と感じるなら、`
      : '働き方や将来のことが少し気になるときは、'
    return `${intro}${link.name}で今の条件を確認してみると、心がふっと軽くなるかもしれません。`
  },
  'アイテム': (link, contextHeading) => {
    const intro = contextHeading
      ? `「${contextHeading}」で使う備品などは、`
      : '現場で毎日使うアイテムは、'
    return `${intro}${link.name}でまとめて揃えておくと、準備に追われずゆとりを持って動けますよ。`
  },
  '退職代行': (link, contextHeading) => {
    const intro = contextHeading
      ? `「${contextHeading}」で退職を考えていて、もし一人で抱えきれないときは、`
      : '退職の段取りが不安で、心身がしんどいときは、'
    return `${intro}${link.name}のような専門の窓口に手順をお任せするのも、自分を守る一歩になります。`
  }
}

function contextualPrefix(contextHeading, base) {
  if (!contextHeading) return base
  return `「${contextHeading}」では${base}`
}

// 記事の内容から主要なアイテムを抽出
function extractMainItemFromArticle(title = '', body = '') {
  const text = (title + ' ' + body).toLowerCase()

  // アイテム別キーワードマッピング（優先度順）
  const itemPatterns = [
    { keywords: ['シューズ', '靴', 'くつ', '履く', '歩く'], item: 'シューズ', variants: ['シューズや滑りにくい靴', 'シューズ', '現場で使う靴'] },
    { keywords: ['ユニフォーム', '制服', 'スクラブ', 'ナース服', '白衣'], item: 'ユニフォーム', variants: ['ユニフォームやスクラブ', 'ユニフォーム', '制服'] },
    { keywords: ['グローブ', '手袋', '使い捨て', 'ディスポ'], item: 'グローブ', variants: ['グローブや使い捨て手袋', 'グローブ', '手袋'] },
    { keywords: ['ポケット', 'オーガナイザー', 'ポーチ', '小物入れ'], item: 'ポケットオーガナイザー', variants: ['ポケットオーガナイザーや小物入れ', 'ポケットオーガナイザー'] },
    { keywords: ['文房具', 'ペン', 'メモ', 'ノート'], item: '文房具', variants: ['ペンやメモ帳', '文房具', '筆記用具'] },
    { keywords: ['腕時計', '時計', 'ウォッチ'], item: '腕時計', variants: ['防水腕時計', '腕時計', '時計'] },
    { keywords: ['備品', '消耗品', '物品', '小物'], item: '備品', variants: ['備品や消耗品', '小物', '備品'] }
  ]

  // マッチしたアイテムとスコアを計算
  const matches = itemPatterns.map(pattern => {
    const matchCount = pattern.keywords.filter(keyword => text.includes(keyword)).length
    return { ...pattern, score: matchCount }
  }).filter(match => match.score > 0)

  // 最もスコアの高いアイテムを返す
  if (matches.length > 0) {
    matches.sort((a, b) => b.score - a.score)
    return matches[0]
  }

  return null
}

// 記事の直近の文脈を考慮した訴求文を生成
function generateContextualCta(linkKey, link, articleTitle = '', articleBody = '', contextHeading = '') {
  const mainItem = extractMainItemFromArticle(articleTitle, articleBody)

  // アイテムキー別の訴求文生成
  if (linkKey === 'nursery') {
    if (mainItem && mainItem.item) {
      const itemVariant = mainItem.variants[0] || mainItem.item
      return `${itemVariant}は${link.name}が便利です。現場で必要なサイズやカラーも細かく選べます。`
    }
    return `ユニフォームやポケットオーガナイザーは${link.name}が便利です。現場で必要なサイズやカラーも細かく選べます。`
  }

  if (linkKey === 'amazon') {
    if (mainItem && mainItem.item) {
      const itemVariant = mainItem.variants[1] || mainItem.item
      return `${itemVariant}を買い足すときは、${link.name}で常備しておくと安心です。`
    }
    return `小物や替えのグローブなど、毎日使うアイテムは${link.name}で常備しておくと安心です。`
  }

  if (linkKey === 'rakuten') {
    if (mainItem && mainItem.item) {
      const itemVariant = mainItem.variants[1] || mainItem.item
      return `${itemVariant}を探すときは、${link.name}が頼りになります。ポイント活用でコストも抑えられます。`
    }
    return `備品を買い足すときは、${link.name}が頼りになります。ポイント活用でコストも抑えられます。`
  }

  // デフォルト
  return null
}

const AFFILIATE_KEY_CTA = {
  nursery: (link, contextHeading) => {
    const prefix = contextHeading
      ? `「${contextHeading}」で着るユニフォームや、あると便利な小物類は、`
      : 'ユニフォームやオーガナイザーなどの備品を新しく揃えるなら、'
    return `${prefix}${link.name}が見ていて楽しいですし、サイズも細かく選べて安心ですよ。`
  },
  amazon: (link, contextHeading) => {
    const prefix = contextHeading
      ? `「${contextHeading}」で使うちょっとした小物や替えのグローブは、`
      : '毎日使う消耗品や、ちょっとした便利グッズは、'
    return `${prefix}${link.name}で用意しておくと、忙しいときでもサッと届いて助かります。`
  },
  rakuten: (link, contextHeading) => {
    const prefix = contextHeading
      ? `「${contextHeading}」の備品などを新しく買い足すときは、`
      : '価格を比較したり、ポイントを貯めながら買い足したいときは、'
    return `${prefix}${link.name}も頼りになります。使い慣れたサイトなら、お買い物も気楽にできますね。`
  }
}

function selectAffiliateCtaText(linkKey, link, contextHeading = '', articleTitle = '', articleBody = '') {
  if (!link) return ''

  // アイテムカテゴリの場合、記事文脈を考慮した訴求文を優先
  if (link.category === 'アイテム' && (articleTitle || articleBody)) {
    const contextualCta = generateContextualCta(linkKey, link, articleTitle, articleBody, contextHeading)
    if (contextualCta) {
      return contextualCta
    }
  }

  // 従来のテンプレートベース訴求文（アイテム以外）
  if (AFFILIATE_KEY_CTA[linkKey]) {
    return AFFILIATE_KEY_CTA[linkKey](link, contextHeading)
  }
  const template = AFFILIATE_CATEGORY_CTA[link.category]
  if (template) {
    return template(link, contextHeading)
  }
  const intro = contextHeading
    ? `「${contextHeading}」で必要なサポートは`
    : '必要なサポートは'
  return `${intro}${link.name}のような信頼できるサービスと一緒に確認しておくと、迷わず動けます。`
}

function wrapAffiliateHtml(link, ctaText = '', contextHeading = '', additionalLinks = []) {
  const cta = escapeHtml(ctaText || '')

  // メインリンクを生成
  const mainLinkText = escapeHtml(link.linkText || '')
  const mainLinkUrl = link.url || '#'
  const mainImgMatch = link.html.match(/<img[^>]*>/i)
  const mainTrackingPixel = mainImgMatch ? mainImgMatch[0] : ''

  // 追加リンクを生成
  let additionalLinksHtml = ''
  additionalLinks.forEach((additionalLink, index) => {
    const linkText = escapeHtml(additionalLink.linkText || '')
    const linkUrl = additionalLink.url || '#'
    const imgMatch = additionalLink.html.match(/<img[^>]*>/i)
    const trackingPixel = imgMatch ? imgMatch[0] : ''
    const isLast = index === additionalLinks.length - 1

    additionalLinksHtml += `
  <p style="margin: ${isLast ? '0' : '0 0 8px 0'};">
    [PR]
    <a href="${linkUrl}" target="_blank" rel="nofollow" style="color: #0066cc; text-decoration: underline;">${linkText}</a>${trackingPixel}
  </p>`
  })

  return `
<div style="background: linear-gradient(135deg, #f0f7ff 0%, #e6f2ff 100%); border: 1px solid #b3d9ff; border-radius: 8px; padding: 16px; margin: 16px 0;">
  ${cta ? `<p style="margin: 0 0 12px 0; color: #1a1a1a; line-height: 1.6;">${cta}</p>` : ''}
  <p style="margin: ${additionalLinks.length > 0 ? '0 0 8px 0' : '0'};">
    [PR]
    <a href="${mainLinkUrl}" target="_blank" rel="nofollow" style="color: #0066cc; text-decoration: underline;">${mainLinkText}</a>${mainTrackingPixel}
  </p>${additionalLinksHtml}
</div>
`.trim()
}

function createInlineAffiliateBlock(linkKey, link, contextHeading = '', articleTitle = '', articleBody = '') {
  const ctaText = selectAffiliateCtaText(linkKey, link, contextHeading, articleTitle, articleBody).trim()

  const infoBlock = {
    _type: 'block',
    _key: `inline-cta-${randomUUID()}`,
    style: 'normal',
    markDefs: [],
    children: [
      {
        _type: 'span',
        _key: `inline-cta-text-${randomUUID()}`,
        marks: [],
        text: ctaText
      }
    ]
  }

  const linkMarkKey = `affiliate-inline-${randomUUID()}`
  const linkBlock = {
    _type: 'block',
    _key: `inline-link-${randomUUID()}`,
    style: 'normal',
    markDefs: [
      {
        _key: linkMarkKey,
        _type: 'link',
        href: link.url,
        openInNewTab: true
      }
    ],
    children: [
      {
        _type: 'span',
        _key: `inline-pr-${randomUUID()}`,
        marks: [],
        text: '[PR] '
      },
      {
        _type: 'span',
        _key: `inline-link-text-${randomUUID()}`,
        marks: [linkMarkKey],
        text: link.linkText
      }
    ]
  }

  return [infoBlock, linkBlock]
}

function createMoshimoLinkBlocks(linkKey, contextHeading = '', options = {}) {
  const link = MOSHIMO_LINKS[linkKey]
  if (!link || !link.active) return null

  const articleTitle = options.articleTitle || ''
  const articleBody = options.articleBody || ''
  const additionalLinksKeys = options.additionalLinks || []

  // 追加リンクのデータを取得
  const additionalLinksData = additionalLinksKeys.map(linkData => {
    if (typeof linkData === 'string') {
      return MOSHIMO_LINKS[linkData]
    }
    return linkData
  }).filter(Boolean)

  if (INLINE_AFFILIATE_KEYS.has(linkKey)) {
    return createInlineAffiliateBlock(linkKey, link, contextHeading, articleTitle, articleBody)
  }

  const ctaTextOverride = options.ctaText
  const resolvedCta = ctaTextOverride || selectAffiliateCtaText(linkKey, link, contextHeading, articleTitle, articleBody)
  const embedKey = `affiliate-${randomUUID()}`
  const embedBlock = {
    _type: 'affiliateEmbed',
    _key: embedKey,
    provider: link.name,
    linkKey,
    label: link.linkText,
    html: wrapAffiliateHtml(link, resolvedCta, contextHeading, additionalLinksData)
  }

  return [embedBlock]
}

module.exports = {
  MOSHIMO_LINKS,
  NON_LIMITED_AFFILIATE_KEYS,
  INLINE_AFFILIATE_KEYS,
  getLinksByCategory,
  suggestLinksForArticle,
  createMoshimoLinkBlocks,
  createInlineAffiliateBlock,
  extractMainItemFromArticle
}
