/**
 * アフィリエイトリンクデータベース
 *
 * リンクコードは絶対に変更しない
 * 定期的にリンク有効性をチェック
 * 無効になったリンクは別の案件に差し替え
 */

const { randomUUID } = require('crypto')

const INLINE_AFFILIATE_KEYS = new Set(['amazon', 'rakuten', 'nursery'])

const MOSHIMO_LINKS = {
  // 就職・転職サービス
  humanlifecare: {
    name: 'ヒューマンライフケア',
    description: '介護・介護職・介護士・ケアマネージャーの求人',
    category: '就職・転職',
    targetArticles: ['転職', '求人', '介護', 'ケアマネ', '辞めたい', 'キャリア'],
    html: '<a href="//af.moshimo.com/af/c/click?a_id=5207863&p_id=6140&pc_id=17239&pl_id=78717" rel="nofollow" referrerpolicy="no-referrer-when-downgrade" attributionsrc>介護・看護助手の求人をお探しの方はこちら</a><img src="//i.moshimo.com/af/i/impression?a_id=5207863&p_id=6140&pc_id=17239&pl_id=78717" width="1" height="1" style="border:none;" loading="lazy">',
    appealText: '💼 転職・求人をお探しの方へ',
    linkText: '介護職・看護助手の求人なら「ヒューマンライフケア」',
    url: '//af.moshimo.com/af/c/click?a_id=5207863&p_id=6140&pc_id=17239&pl_id=78717',
    active: true,
    addedDate: '2025-10-10',
    reward: '15,385円',
    condition: 'WEB応募完了'
  },

  kaigobatake: {
    name: 'かいご畑',
    description: '介護職専門の人材サービス',
    category: '就職・転職',
    targetArticles: ['転職', '求人', '介護', '未経験', '資格', '辞めたい'],
    html: '<a href="https://px.a8.net/svt/ejp?a8mat=2ZTT9A+D2Y8MQ+1W34+C8VWY" rel="nofollow">かいご畑で介護職・看護助手の求人を探す</a><img border="0" width="1" height="1" src="https://www15.a8.net/0.gif?a8mat=2ZTT9A+D2Y8MQ+1W34+C8VWY" alt="">',
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
    html: '<a href="//af.moshimo.com/af/c/click?a_id=5207862&p_id=6826&pc_id=19536&pl_id=86880" rel="nofollow" referrerpolicy="no-referrer-when-downgrade" attributionsrc>（自由テキスト）</a><img src="//i.moshimo.com/af/i/impression?a_id=5207862&p_id=6826&pc_id=19536&pl_id=86880" width="1" height="1" style="border:none;" loading="lazy">',
    appealText: '💼 関西圏の転職相談をしたい方へ',
    linkText: '関西特化の転職サービス「リニューケア」',
    url: '//af.moshimo.com/af/c/click?a_id=5207862&p_id=6826&pc_id=19536&pl_id=86880',
    active: true,
    addedDate: '2025-10-14',
    reward: '7,000円',
    condition: '新規会員登録'
  },

  pasonalifecare: {
    name: 'パソナライフケア',
    description: '「ありがとう」が嬉しい介護職の転職・派遣サポート',
    category: '就職・転職',
    targetArticles: ['転職', '求人', '派遣', '職場', '人間関係'],
    html: '<a href="//af.moshimo.com/af/c/click?a_id=5207867&p_id=2026&pc_id=4121&pl_id=40816" rel="nofollow" referrerpolicy="no-referrer-when-downgrade" attributionsrc>「ありがとう」が嬉しい、いつまでも必要とされ続けるお仕事</a><img src="//i.moshimo.com/af/i/impression?a_id=5207867&p_id=2026&pc_id=4121&pl_id=40816" width="1" height="1" style="border:none;" loading="lazy">',
    appealText: '🤝 人に寄り添う働き方を探す方へ',
    linkText: '介護職専門の求人「パソナライフケア」',
    url: '//af.moshimo.com/af/c/click?a_id=5207867&p_id=2026&pc_id=4121&pl_id=40816',
    active: true,
    addedDate: '2025-11-11',
    reward: '5,000円',
    condition: '新規簡易応募'
  },

  // アイテム・商品
  nursery: {
    name: 'ナースリー',
    description: '看護・医療・介護ユニフォーム専門店',
    category: 'アイテム',
    targetArticles: ['制服', 'ユニフォーム', 'グッズ', '必要なもの', '靴', 'シューズ', 'スクラブ', 'ナース服', 'ウェア'],
    html: '<a href="//ck.jp.ap.valuecommerce.com/servlet/referral?sid=3755453&pid=892289712" rel="nofollow"><img src="//ad.jp.ap.valuecommerce.com/servlet/gifbanner?sid=3755453&pid=892289712" height="1" width="1" border="0">看護助手向けユニフォーム・グッズを探す</a>',
    appealText: '',
    linkText: '看護・介護ユニフォーム専門店「ナースリー」',
    url: '//ck.jp.ap.valuecommerce.com/servlet/referral?sid=3755453&pid=892289712',
    active: true,
    addedDate: '2025-11-17',
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
    html: '<a href="//ck.jp.ap.valuecommerce.com/servlet/referral?sid=3515026&pid=892170743" rel="nofollow"><img src="//ad.jp.ap.valuecommerce.com/servlet/gifbanner?sid=3515026&pid=892170743" height="1" width="1" border="0">弁護士による退職代行サービス</a>',
    appealText: '⚖️ 退職でお悩みの方へ',
    linkText: '弁護士による退職代行サービス【弁護士法人みやび】',
    url: '//ck.jp.ap.valuecommerce.com/servlet/referral?sid=3515026&pid=892170743',
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

  // 注意: 退職代行カテゴリは現在 miyabi / sokuyame の2案件のみ有効
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
      ? `「${contextHeading}」で感じた課題を整理するときは`
      : '働き方を見直すときは'
    return `${intro}${link.name}に相談して条件やサポート体制を具体化してみてください。`
  },
  'アイテム': (link, contextHeading) => {
    const intro = contextHeading
      ? `「${contextHeading}」で使う備品は`
      : '現場で使う備品は'
    return `${intro}${link.name}でまとめて揃えておくと準備がスムーズです。`
  },
  '退職代行': (link, contextHeading) => {
    const intro = contextHeading
      ? `「${contextHeading}」で退職を考えたときは`
      : '退職の段取りに迷うときは'
    return `${intro}${link.name}の窓口で手順を確認しながら進めると安心です。`
  }
}

function contextualPrefix(contextHeading, base) {
  if (!contextHeading) return base
  return `「${contextHeading}」では${base}`
}

const AFFILIATE_KEY_CTA = {
  nursery: (link, contextHeading) => {
    const prefix = contextHeading
      ? `「${contextHeading}」で着るユニフォームやポケットオーガナイザーは`
      : 'ユニフォームやポケットオーガナイザーをまとめて揃えるなら'
    return `${prefix}${link.name}が便利です。現場で必要なサイズやカラーも細かく選べます。`
  },
  amazon: (link, contextHeading) => {
    const prefix = contextHeading
      ? `「${contextHeading}」で使う小物や替えのグローブは`
      : '小物や替えのグローブなど、毎日使うアイテムは'
    return `${prefix}${link.name}で常備しておくと安心です。`
  },
  rakuten: (link, contextHeading) => {
    const prefix = contextHeading
      ? `「${contextHeading}」の備品を買い足すときは`
      : '価格や配送スピードを比較しながら買い足したいときは'
    return `${prefix}${link.name}が頼りになります。ポイント活用でコストも抑えられます。`
  }
}

function selectAffiliateCtaText(linkKey, link, contextHeading = '') {
  if (!link) return ''
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

function wrapAffiliateHtml(link) {
  const appeal = escapeHtml(link.appealText || '')
  const note = escapeHtml(link.description || '')
  return `
<div class="affiliate-card">
  ${appeal ? `<p class="affiliate-card__lead">${appeal}</p>` : ''}
  <div class="affiliate-card__body">
    ${link.html}
  </div>
  ${note ? `<p class="affiliate-card__note">${note}</p>` : ''}
</div>
`.trim()
}

function createInlineAffiliateBlock(linkKey, link, contextHeading = '') {
  const ctaText = selectAffiliateCtaText(linkKey, link, contextHeading).trim()

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

function createMoshimoLinkBlocks(linkKey, contextHeading = '') {
  const link = MOSHIMO_LINKS[linkKey]
  if (!link || !link.active) return null

  if (INLINE_AFFILIATE_KEYS.has(linkKey)) {
    return createInlineAffiliateBlock(linkKey, link, contextHeading)
  }

  const embedKey = `affiliate-${randomUUID()}`
  const ctaBlock = {
    _type: 'block',
    _key: `affiliate-cta-${randomUUID()}`,
    style: 'normal',
    markDefs: [],
    children: [
      {
        _type: 'span',
        _key: `affiliate-cta-span-${randomUUID()}`,
        marks: [],
        text: selectAffiliateCtaText(linkKey, link, contextHeading)
      }
    ]
  }

  const embedBlock = {
    _type: 'affiliateEmbed',
    _key: embedKey,
    provider: link.name,
    linkKey,
    label: link.linkText,
    html: wrapAffiliateHtml(link)
  }

  return [ctaBlock, embedBlock]
}

module.exports = {
  MOSHIMO_LINKS,
  NON_LIMITED_AFFILIATE_KEYS,
  INLINE_AFFILIATE_KEYS,
  getLinksByCategory,
  suggestLinksForArticle,
  createMoshimoLinkBlocks,
  createInlineAffiliateBlock
}
