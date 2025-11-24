/**
 * アフィリエイト商品データベース
 * ユーザーにとって本当に役立つ商品のみを厳選
 */

export const affiliateProducts = {
  // ナースシューズ（看護助手必須アイテム）
  nurseShoes: [
    {
      name: 'アシックス ナースウォーカー',
      category: 'ナースシューズ',
      userBenefit: '長時間の立ち仕事でも足が疲れにくい医療現場専用設計',
      features: [
        '滑りにくいソール',
        '疲労軽減クッション',
        '通気性の良い素材'
      ],
      amazonUrl: 'https://www.amazon.co.jp/s?k=%E3%82%A2%E3%82%B7%E3%83%83%E3%82%AF%E3%82%B9+%E3%83%8A%E3%83%BC%E3%82%B9%E3%82%A6%E3%82%A9%E3%83%BC%E3%82%AB%E3%83%BC&tag=ptb875pmj49-22',
      rakutenUrl: 'https://search.rakuten.co.jp/search/mall/%E3%82%A2%E3%82%B7%E3%83%83%E3%82%AF%E3%82%B9+%E3%83%8A%E3%83%BC%E3%82%B9%E3%82%A6%E3%82%A9%E3%83%BC%E3%82%AB%E3%83%BC/',
      price: '6,000円前後',
      commission: 'Amazon: 3%, 楽天: 4%'
    },
    {
      name: 'ミズノ メディカルシューズ',
      category: 'ナースシューズ',
      userBenefit: 'スポーツブランドの技術で足への負担を最小化',
      features: [
        '軽量設計',
        '足裏サポート',
        '耐久性に優れる'
      ],
      amazonUrl: 'https://www.amazon.co.jp/s?k=%E3%83%9F%E3%82%BA%E3%83%8E+%E3%83%A1%E3%83%87%E3%82%A3%E3%82%AB%E3%83%AB%E3%82%B7%E3%83%A5%E3%83%BC%E3%82%BA&tag=ptb875pmj49-22',
      rakutenUrl: 'https://search.rakuten.co.jp/search/mall/%E3%83%9F%E3%82%BA%E3%83%8E+%E3%83%A1%E3%83%87%E3%82%A3%E3%82%AB%E3%83%AB%E3%82%B7%E3%83%A5%E3%83%BC%E3%82%BA/',
      price: '5,500円前後',
      commission: 'Amazon: 3%, 楽天: 4%'
    }
  ],

  // 医療用メモ帳・文房具
  medicalStationery: [
    {
      name: 'ナース専用メモ帳',
      category: '医療用文房具',
      userBenefit: 'ポケットに入るサイズで患者情報を素早くメモ',
      features: [
        'コンパクトサイズ',
        '防水加工',
        'チェックリスト付き'
      ],
      amazonUrl: 'https://www.amazon.co.jp/s?k=%E3%83%8A%E3%83%BC%E3%82%B9+%E3%83%A1%E3%83%A2%E5%B8%B3&tag=ptb875pmj49-22',
      rakutenUrl: 'https://search.rakuten.co.jp/search/mall/%E3%83%8A%E3%83%BC%E3%82%B9+%E3%83%A1%E3%83%A2%E5%B8%B3/',
      price: '800円前後',
      commission: 'Amazon: 3%, 楽天: 4%'
    }
  ],

  // 医療用ハサミ
  medicalScissors: [
    {
      name: 'ステンレス医療用ハサミ',
      category: '医療用具',
      userBenefit: '包帯やテープのカットに最適、錆びにくく衛生的',
      features: [
        'ステンレス製',
        '先端丸型で安全',
        '消毒可能'
      ],
      amazonUrl: 'https://www.amazon.co.jp/s?k=%E5%8C%BB%E7%99%82%E7%94%A8%E3%83%8F%E3%82%B5%E3%83%9F&tag=ptb875pmj49-22',
      rakutenUrl: 'https://search.rakuten.co.jp/search/mall/%E5%8C%BB%E7%99%82%E7%94%A8%E3%83%8F%E3%82%B5%E3%83%9F/',
      price: '1,200円前後',
      commission: 'Amazon: 3%, 楽天: 4%'
    }
  ],

  // タイマー付き腕時計
  nurseWatch: [
    {
      name: 'ナース専用腕時計',
      category: '医療用時計',
      userBenefit: '秒針付きで脈拍測定、防水仕様で手洗いも安心',
      features: [
        '秒針付き',
        '防水仕様',
        '見やすい文字盤'
      ],
      amazonUrl: 'https://www.amazon.co.jp/s?k=%E3%83%8A%E3%83%BC%E3%82%B9%E3%82%A6%E3%82%A9%E3%83%83%E3%83%81&tag=ptb875pmj49-22',
      rakutenUrl: 'https://search.rakuten.co.jp/search/mall/%E3%83%8A%E3%83%BC%E3%82%B9%E3%82%A6%E3%82%A9%E3%83%83%E3%83%81/',
      price: '3,000円前後',
      commission: 'Amazon: 3%, 楽天: 4%'
    }
  ],

  // ボールペン（医療用）
  medicalPen: [
    {
      name: '三色ボールペン（医療用）',
      category: '医療用文房具',
      userBenefit: '記録・申し送りに便利、インク切れの心配なし',
      features: [
        '黒・赤・青の3色',
        'クリップ付き',
        '速乾性インク'
      ],
      amazonUrl: 'https://www.amazon.co.jp/s?k=%E4%B8%89%E8%89%B2%E3%83%9C%E3%83%BC%E3%83%AB%E3%83%9A%E3%83%B3+%E5%8C%BB%E7%99%82&tag=ptb875pmj49-22',
      rakutenUrl: 'https://search.rakuten.co.jp/search/mall/%E4%B8%89%E8%89%B2%E3%83%9C%E3%83%BC%E3%83%AB%E3%83%9A%E3%83%B3/',
      price: '500円前後',
      commission: 'Amazon: 3%, 楽天: 4%'
    }
  ]
};

/**
 * 記事カテゴリごとの推奨商品マッピング
 */
export const articleToProductMapping = {
  // 仕事内容系の記事
  '看護助手-仕事内容': {
    sectionTitle: '現場で本当に役立つ基本アイテム',
    products: ['nurseShoes', 'medicalStationery', 'medicalScissors'],
    insertPosition: 'before-matome', // まとめの前
    intro: '看護助手として働く上で、これらのアイテムがあると仕事がスムーズになります。'
  },

  // なるには系の記事
  '看護助手-なるには': {
    sectionTitle: '働き始める前に準備しておきたいもの',
    products: ['nurseShoes', 'medicalStationery', 'nurseWatch'],
    insertPosition: 'before-matome',
    intro: '看護助手として働き始める前に、以下のアイテムを準備しておくと安心です。'
  },

  // 1日の流れ系の記事
  '看護助手-1日': {
    sectionTitle: '日々の業務に欠かせないアイテム',
    products: ['nurseShoes', 'nurseWatch', 'medicalPen'],
    insertPosition: 'before-matome',
    intro: '毎日の業務をサポートしてくれる、現場スタッフ愛用のアイテムをご紹介します。'
  },

  // 大変・きつい系の記事
  '看護助手-大変': {
    sectionTitle: '身体的負担を軽減するアイテム',
    products: ['nurseShoes', 'medicalStationery'],
    insertPosition: 'before-matome',
    intro: '看護助手の仕事は体力的にも大変です。これらのアイテムで少しでも負担を軽減しましょう。'
  }
};

/**
 * 転職サービス情報
 */
export const jobServices = [
  {
    name: 'かいご畑',
    category: '看護助手・介護職専門転職サービス',
    userBenefit: '無資格・未経験OKの看護助手求人が豊富、資格取得支援制度あり',
    features: [
      '無資格・未経験OKの求人が中心',
      '看護助手の求人が豊富',
      '資格取得支援制度あり（実質0円で資格取得可能）',
      '専任コーディネーターによる就職サポート',
      '完全無料で利用可能'
    ],
    affiliateUrl: 'https://px.a8.net/svt/ejp?a8mat=2ZTT9A+D2Y8MQ+1W34+C8VWY',
    a8Tracking: '<img border="0" width="1" height="1" src="https://www17.a8.net/0.gif?a8mat=2ZTT9A+D2Y8MQ+1W34+C8VWY" alt="">',
    commission: 'A8.net経由',
    targetArticles: [
      '看護助手-辞めたい',
      '看護助手-給料',
      '看護助手-転職',
      '看護助手-きつい',
      '看護助手-大変'
    ]
  }
];

/**
 * 記事タイトルから適切な商品カテゴリを判定
 */
export function determineProductCategory(title) {
  if (title.includes('仕事内容') || title.includes('役割')) {
    return '看護助手-仕事内容';
  }
  if (title.includes('なるには') || title.includes('資格') || title.includes('未経験')) {
    return '看護助手-なるには';
  }
  if (title.includes('1日') || title.includes('スケジュール')) {
    return '看護助手-1日';
  }
  if (title.includes('大変') || title.includes('きつい') || title.includes('しんどい')) {
    return '看護助手-大変';
  }
  return null;
}

/**
 * 記事タイトルから転職サービスを表示すべきか判定
 */
export function shouldShowJobService(title) {
  const keywords = ['辞めたい', '給料', '転職', 'きつい', '大変', '悩み'];
  return keywords.some(keyword => title.includes(keyword));
}
