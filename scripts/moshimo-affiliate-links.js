/**
 * アフィリエイトリンクデータベース
 *
 * リンクコードは絶対に変更しない
 * 定期的にリンク有効性をチェック
 * 無効になったリンクは別の案件に差し替え
 */

const { randomUUID } = require('crypto')

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

  // アイテム・商品
  nursery: {
    name: 'ナースリー',
    description: '看護・医療・介護ユニフォーム専門店',
    category: 'アイテム',
    targetArticles: ['制服', 'ユニフォーム', 'グッズ', '必要なもの', '靴', 'シューズ'],
    html: '<a href="//ck.jp.ap.valuecommerce.com/servlet/referral?sid=3755453&pid=892161180" rel="nofollow"><img src="//ad.jp.ap.valuecommerce.com/servlet/gifbanner?sid=3755453&pid=892161180" height="1" width="1" border="0">看護助手向けユニフォーム・グッズを探す</a>',
    appealText: '👔 ユニフォーム・グッズをお探しの方へ',
    linkText: '看護・介護ユニフォーム専門店「ナースリー」',
    url: '//ck.jp.ap.valuecommerce.com/servlet/referral?sid=3755453&pid=892161180',
    active: true,
    addedDate: '2025-10-14',
    reward: '10.47%（9.52%）',
    condition: '商品購入'
  },

  amazon: {
    name: 'Amazon（もしもアフィリエイト経由）',
    description: 'Amazon商品購入',
    category: 'アイテム',
    targetArticles: ['グッズ', '靴', 'シューズ', '本', '書籍', '必要なもの'],
    html: '<a href="//af.moshimo.com/af/c/click?a_id=5211352&p_id=170&pc_id=185&pl_id=4161" rel="nofollow" referrerpolicy="no-referrer-when-downgrade" attributionsrc>Amazonで看護助手グッズを探す</a><img src="//i.moshimo.com/af/i/impression?a_id=5211352&p_id=170&pc_id=185&pl_id=4161" width="1" height="1" style="border:none;" loading="lazy">',
    appealText: '📦 看護助手・介護職向けグッズをお探しの方へ',
    linkText: 'Amazonで看護助手グッズを探す',
    url: '//af.moshimo.com/af/c/click?a_id=5211352&p_id=170&pc_id=185&pl_id=4161',
    active: true,
    addedDate: '2025-10-16',
    reward: '2.0%（もしも経由）',
    condition: '商品購入',
    note: 'もしもアフィリエイト経由で一括管理'
  },

  rakuten: {
    name: '楽天市場',
    description: '楽天市場での商品購入',
    category: 'アイテム',
    targetArticles: ['シューズ', '靴', 'グッズ', '制服', 'ユニフォーム', '必要なもの'],
    html: '<a href="//af.moshimo.com/af/c/click?a_id=5207851&p_id=54&pc_id=54&pl_id=621" rel="nofollow" referrerpolicy="no-referrer-when-downgrade" attributionsrc>楽天市場</a><img src="//i.moshimo.com/af/i/impression?a_id=5207851&p_id=54&pc_id=54&pl_id=621" width="1" height="1" style="border:none;" loading="lazy">',
    appealText: '🛍️ 看護助手・介護職向けグッズをお探しの方へ',
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
  '就職・転職': link =>
    `[PR] 看護助手として次の職場を検討するときは、教育サポートや夜勤体制も合わせて確認してください。${link.name}なら担当者に相談しながら条件を整理できます。`,
  'アイテム': link =>
    `[PR] こまめに道具を入れ替えておくとケアの質が安定します。${link.name}で必要なものをまとめてチェックしておくと準備がスムーズです。`,
  '退職代行': link =>
    `[PR] 退職手続きに不安がある場合は、専門サービスに早めに相談して流れを確認しましょう。${link.name}なら相談窓口が整っていて段取りを一緒に組み立てられます。`
}

const AFFILIATE_KEY_CTA = {
  nursery: link =>
    `[PR] ユニフォームやポケットオーガナイザーをまとめて揃えるなら${link.name}が便利です。現場で必要なサイズやカラーも細かく選べます。`,
  amazon: link =>
    `[PR] 小物や替えのグローブなど、毎日使うアイテムは${link.name}で常備しておくと安心です。`,
  rakuten: link =>
    `[PR] 価格や配送スピードを比較しながら買い足したいときは${link.name}が頼りになります。ポイント活用でコストも抑えられます。`
}

function selectAffiliateCtaText(linkKey, link) {
  if (!link) return ''
  if (AFFILIATE_KEY_CTA[linkKey]) {
    return AFFILIATE_KEY_CTA[linkKey](link)
  }
  const template = AFFILIATE_CATEGORY_CTA[link.category]
  if (template) {
    return template(link)
  }
  return `[PR] 必要なサポートを信頼できるサービスと一緒に確認しておくと、迷わず動けます。${link.name}は看護助手の相談にも対応しています。`
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

function createMoshimoLinkBlocks(linkKey) {
  const link = MOSHIMO_LINKS[linkKey]
  if (!link || !link.active) return null

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
        text: selectAffiliateCtaText(linkKey, link)
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
  getLinksByCategory,
  suggestLinksForArticle,
  createMoshimoLinkBlocks
}
