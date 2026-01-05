const CATEGORY_NORMALIZATION_MAP = {
  '離職理由': '退職',
  '退職': '退職',
  '辞めたい': '退職',
  '賃金水準': '給与',
  '給与': '給与',
  '資格要件': '資格',
  '資格': '資格',
  '就業移動（転職）': '転職',
  '転職': '転職',
  '心理的負担（メンタル負担）': '心身',
  'メンタルケア': '心身',
  '悩み': '心身',
  '人間関係': '心身',
  '業務範囲（療養生活上の世話）': '仕事',
  '日常業務プロトコル': '仕事',
  '患者ケア手順': '仕事',
  '実務': '仕事',
  '仕事内容': '仕事',
  '看護師‐看護補助者の役割境界': '仕事',
  '医療関連感染対策': '仕事',
  'チーム内の役割分担': '心身',
  '経験談': '体験',
  'ストーリー': '体験',
  '現場の声': '体験'
}

const CATEGORY_KEYWORDS = {
  仕事: [
    '仕事',
    '業務',
    '仕事内容',
    '実務',
    'ケア',
    '手順',
    'ナースコール',
    '物品',
    '感染',
    '衛生',
    '患者対応',
    'コミュニケーション',
    '段取り',
    'スケジュール',
    '体位変換',
    '清拭',
    '排泄',
    '口腔',
    '記録',
    'バイタル',
    'ルーティン'
  ],
  給与: [
    '給与',
    '給料',
    '年収',
    '月給',
    '賞与',
    '時給',
    'ボーナス',
    '手当',
    '昇給',
    '待遇',
    '収入',
    '賃金',
    '時短',
    '扶養'
  ],
  資格: [
    '資格',
    '講座',
    '研修',
    '検定',
    '受験',
    '学習',
    '通信',
    'カリキュラム',
    'スキルアップ',
    '履修',
    '実務者研修',
    '介護職員初任者研修',
    '受講'
  ],
  転職: [
    '転職',
    '就職',
    '求人',
    '応募',
    '履歴書',
    '派遣',
    '内定',
    'エージェント',
    '職務経歴書',
    'ダブルワーク',
    '副業',
    '面接',
    '応募先',
    'キャリア'
  ],
  退職: [
    '退職',
    '退社',
    '離職',
    '辞め',
    '円満',
    '退職代行',
    '有給消化',
    '引き継ぎ',
    '退職届',
    '退職願',
    '手続き',
    '退職理由'
  ],
  心身: [
    'ストレス',
    '不安',
    'メンタル',
    '心',
    '疲れ',
    'しんどい',
    'つらい',
    '睡眠',
    '休息',
    'セルフケア',
    '燃え尽き',
    '人間関係',
    'チーム',
    'コミュニケーション',
    'モチベーション'
  ],
  体験: [
    '体験',
    '体験談',
    '経験',
    'エピソード',
    '現場の声',
    'リアル',
    'ストーリー',
    'コラム',
    '気づき',
    '振り返り',
    '学び',
    '新人',
    '先輩',
    '日記'
  ]
}

const CATEGORY_DESCRIPTIONS = {
  仕事: '現場での業務手順や患者さん対応、感染対策など「看護助手の仕事そのもの」に関するカテゴリです。',
  給与: '賃金構造基本統計調査などのデータを根拠に、給与・手当・待遇のリアルを整理するカテゴリです。',
  資格: '取得できる資格や研修情報、勉強の進め方など、スキルアップに関する情報を扱います。',
  転職: 'キャリアチェンジの手順や求人探しのコツなど、転職活動に役立つ情報をまとめます。',
  退職: '円満退職のポイントや退職手続き、有給消化の進め方など、退職に関する情報を扱います。',
  心身: 'メンタルケア、人間関係、休息の工夫など、心と体を整えるための情報を扱うカテゴリです。',
  体験: '現場での気づきや経験談、小さな学びを共有し、読者の背中をそっと押すストーリーを集めます。'
}

const CATEGORY_REFERENCE_SNIPPETS = {
  仕事: '本記事の業務内容・手順は厚生労働省「職業情報提供サイト（看護助手）」など公的資料を参考にしています。',
  給与: '給与・賃金データは厚生労働省「賃金構造基本統計調査」などの公開資料を参照しています。',
  資格: '資格や研修情報は日本看護協会・厚生労働省が公開するガイドラインに基づいています。',
  転職: '転職・就業移動に関する情報は厚生労働省の統計やキャリア支援資料を参考にしています。',
  退職: '退職手続き・制度に関する情報は厚生労働省や労働基準監督署が公開する資料を参照しています。',
  心身: 'メンタルケアや人間関係の知見は日本看護協会等が発行する看護補助者向け資料を参考にしています。',
  体験: '現場で得た体験談は、白崎セラ自身の実務経験と確認済みの事実に基づいています。'
}

const CANONICAL_CATEGORY_TITLES = Object.keys(CATEGORY_DESCRIPTIONS)

function normalizeCategoryTitle(title = '') {
  const normalized = CATEGORY_NORMALIZATION_MAP[title]
  if (normalized) return normalized
  if (CATEGORY_DESCRIPTIONS[title]) return title
  return title.trim()
}

function extractCategoryTitle(category) {
  if (!category) return ''
  if (typeof category === 'string') return category
  if (typeof category.title === 'string') return category.title
  if (typeof category.name === 'string') return category.name
  return ''
}

function getNormalizedCategoryTitles(categories = []) {
  return categories
    .map(extractCategoryTitle)
    .map(title => normalizeCategoryTitle(title))
    .map(title => (title || '').trim())
    .filter(Boolean)
}

module.exports = {
  CATEGORY_NORMALIZATION_MAP,
  CATEGORY_KEYWORDS,
  CATEGORY_DESCRIPTIONS,
  CATEGORY_REFERENCE_SNIPPETS,
  CANONICAL_CATEGORY_TITLES,
  normalizeCategoryTitle,
  getNormalizedCategoryTitles,
}
