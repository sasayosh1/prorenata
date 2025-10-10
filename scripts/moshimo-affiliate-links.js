/**
 * もしもアフィリエイト リンクデータベース
 * 
 * リンクコードは絶対に変更しない
 * 定期的にリンク有効性をチェック
 * 無効になったリンクは別の案件に差し替え
 */

const MOSHIMO_LINKS = {
  // 転職サービス
  renewcare: {
    name: 'リニューケア',
    description: '関西圏に特化した介護職・看護助手の転職',
    category: '転職・求人',
    targetArticles: ['転職', '求人', '関西', '大阪', '兵庫', '京都', '辞めたい'],
    html: '<a href="//af.moshimo.com/af/c/click?a_id=5207862&p_id=6826&pc_id=19536&pl_id=86880" rel="nofollow" referrerpolicy="no-referrer-when-downgrade" attributionsrc>関西圏で看護助手・介護職の転職をお考えの方はこちら</a><img src="//i.moshimo.com/af/i/impression?a_id=5207862&p_id=6826&pc_id=19536&pl_id=86880" width="1" height="1" style="border:none;" loading="lazy">',
    appealText: '🔍 関西圏で転職をお考えの方へ',
    linkText: '関西圏に特化した転職サービス「リニューケア」はこちら',
    url: '//af.moshimo.com/af/c/click?a_id=5207862&p_id=6826&pc_id=19536&pl_id=86880',
    active: true,
    addedDate: '2025-10-10'
  },

  humanlifecare: {
    name: 'ヒューマンライフケア',
    description: '介護・介護職・介護士・ケアマネージャーの求人',
    category: '転職・求人',
    targetArticles: ['転職', '求人', '介護', 'ケアマネ', '辞めたい', 'キャリア'],
    html: '<a href="//af.moshimo.com/af/c/click?a_id=5207863&p_id=6140&pc_id=17239&pl_id=78717" rel="nofollow" referrerpolicy="no-referrer-when-downgrade" attributionsrc>介護・看護助手の求人をお探しの方はこちら</a><img src="//i.moshimo.com/af/i/impression?a_id=5207863&p_id=6140&pc_id=17239&pl_id=78717" width="1" height="1" style="border:none;" loading="lazy">',
    appealText: '💼 転職・求人をお探しの方へ',
    linkText: '介護職・看護助手の求人なら「ヒューマンライフケア」',
    url: '//af.moshimo.com/af/c/click?a_id=5207863&p_id=6140&pc_id=17239&pl_id=78717',
    active: true,
    addedDate: '2025-10-10'
  },

  pasonalifecare: {
    name: 'パソナライフケア',
    description: '介護職の求職者向け人材サービス',
    category: '転職・求人',
    targetArticles: ['転職', '求人', '未経験', 'なるには', '辞めたい'],
    html: '<a href="//af.moshimo.com/af/c/click?a_id=5207867&p_id=2026&pc_id=4121&pl_id=40816" rel="nofollow" referrerpolicy="no-referrer-when-downgrade" attributionsrc>「ありがとう」が嬉しい、いつまでも必要とされ続けるお仕事</a><img src="//i.moshimo.com/af/i/impression?a_id=5207867&p_id=2026&pc_id=4121&pl_id=40816" width="1" height="1" style="border:none;" loading="lazy">',
    appealText: '✨ やりがいのある仕事をお探しの方へ',
    linkText: '「ありがとう」が嬉しい介護職の求人【パソナライフケア】',
    url: '//af.moshimo.com/af/c/click?a_id=5207867&p_id=2026&pc_id=4121&pl_id=40816',
    active: true,
    addedDate: '2025-10-10'
  },

  // 商品・グッズ
  claasshop: {
    name: 'クラースショップ',
    description: '介護靴・ケアシューズ',
    category: '商品・グッズ',
    targetArticles: ['シューズ', '靴', 'グッズ', '必要なもの', '1日の流れ', '夜勤'],
    html: '<a href="//af.moshimo.com/af/c/click?a_id=5207866&p_id=3406&pc_id=8115&pl_id=48263" rel="nofollow" referrerpolicy="no-referrer-when-downgrade" attributionsrc>看護助手・介護職向けシューズはこちら</a><img src="//i.moshimo.com/af/i/impression?a_id=5207866&p_id=3406&pc_id=8115&pl_id=48263" width="1" height="1" style="border:none;" loading="lazy">',
    appealText: '👟 快適なワークシューズをお探しの方へ',
    linkText: '介護職・看護助手向けケアシューズ【クラースショップ】',
    url: '//af.moshimo.com/af/c/click?a_id=5207866&p_id=3406&pc_id=8115&pl_id=48263',
    active: true,
    addedDate: '2025-10-10'
  },

  rakuten: {
    name: '楽天市場',
    description: '楽天市場での商品購入',
    category: '商品・グッズ',
    targetArticles: ['シューズ', '靴', 'グッズ', '制服', 'ユニフォーム', '必要なもの'],
    html: '<a href="//af.moshimo.com/af/c/click?a_id=5207851&p_id=54&pc_id=54&pl_id=621" rel="nofollow" referrerpolicy="no-referrer-when-downgrade" attributionsrc>楽天市場</a><img src="//i.moshimo.com/af/i/impression?a_id=5207851&p_id=54&pc_id=54&pl_id=621" width="1" height="1" style="border:none;" loading="lazy">',
    appealText: '🛍️ 看護助手・介護職向けグッズをお探しの方へ',
    linkText: '楽天市場で看護助手グッズを探す',
    url: '//af.moshimo.com/af/c/click?a_id=5207851&p_id=54&pc_id=54&pl_id=621',
    active: true,
    addedDate: '2025-10-10'
  }
}

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

// Portable Text形式のリンクブロックを生成
function createMoshimoLinkBlock(linkKey) {
  const link = MOSHIMO_LINKS[linkKey]
  if (!link || !link.active) return null

  const blockKey = 'block-' + Math.random().toString(36).substr(2, 9)
  const spanKey1 = 'span-' + Math.random().toString(36).substr(2, 9)
  const spanKey2 = 'span-' + Math.random().toString(36).substr(2, 9)
  const linkMarkKey = 'link-' + Math.random().toString(36).substr(2, 9)

  return {
    _type: 'block',
    _key: blockKey,
    style: 'normal',
    markDefs: [
      {
        _key: linkMarkKey,
        _type: 'link',
        href: link.url
      }
    ],
    children: [
      {
        _type: 'span',
        _key: spanKey1,
        text: link.appealText + '： ',
        marks: []
      },
      {
        _type: 'span',
        _key: spanKey2,
        text: link.linkText,
        marks: [linkMarkKey]
      }
    ]
  }
}

module.exports = {
  MOSHIMO_LINKS,
  getLinksByCategory,
  suggestLinksForArticle,
  createMoshimoLinkBlock
}
