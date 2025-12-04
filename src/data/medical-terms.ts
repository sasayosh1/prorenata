export interface MedicalTerm {
  id: string
  term: string
  reading: string
  meaning: string
  distractors: string[]
  category: 'vital-signs' | 'medication' | 'anatomy' | 'equipment' | 'procedures'
  difficulty: 1 | 2 | 3
}

export const medicalTerms: MedicalTerm[] = [
  // バイタルサイン
  {
    id: 'bt',
    term: 'BT（ビーティー）',
    reading: 'びーてぃー',
    meaning: '体温（Body Temperature）',
    distractors: ['血圧', '脈拍'],
    category: 'vital-signs',
    difficulty: 1
  },
  {
    id: 'bp',
    term: 'BP（ビーピー）',
    reading: 'びーぴー',
    meaning: '血圧（Blood Pressure）',
    distractors: ['体温', '血糖値'],
    category: 'vital-signs',
    difficulty: 1
  },
  {
    id: 'pr',
    term: 'PR（ピーアール）',
    reading: 'ぴーあーる',
    meaning: '脈拍（Pulse Rate）',
    distractors: ['呼吸数', '体温'],
    category: 'vital-signs',
    difficulty: 1
  },
  {
    id: 'spo2',
    term: 'SpO2（エスピーオーツー）',
    reading: 'えすぴーおーつー',
    meaning: '経皮的動脈血酸素飽和度',
    distractors: ['血糖値', '血液型'],
    category: 'vital-signs',
    difficulty: 2
  },
  {
    id: 'rr',
    term: 'RR（アールアール）',
    reading: 'あーるあーる',
    meaning: '呼吸数（Respiratory Rate）',
    distractors: ['心拍数', '体温'],
    category: 'vital-signs',
    difficulty: 1
  },

  // 薬剤
  {
    id: 'ton',
    term: '頓服（とんぷく）',
    reading: 'とんぷく',
    meaning: '必要な時だけ服用する薬',
    distractors: ['毎食後に飲む薬', '1日3回飲む薬'],
    category: 'medication',
    difficulty: 1
  },
  {
    id: 'naifuku',
    term: '内服（ないふく）',
    reading: 'ないふく',
    meaning: '薬を飲むこと',
    distractors: ['薬を塗ること', '薬を注射すること'],
    category: 'medication',
    difficulty: 1
  },
  {
    id: 'gaiyou',
    term: '外用（がいよう）',
    reading: 'がいよう',
    meaning: '皮膚や粘膜に塗る薬',
    distractors: ['飲む薬', '注射する薬'],
    category: 'medication',
    difficulty: 1
  },

  // 解剖
  {
    id: 'zuigai',
    term: '頭蓋（ずがい）',
    reading: 'ずがい',
    meaning: '頭の骨',
    distractors: ['背骨', '骨盤'],
    category: 'anatomy',
    difficulty: 2
  },
  {
    id: 'kyoubu',
    term: '胸部（きょうぶ）',
    reading: 'きょうぶ',
    meaning: '胸の部分',
    distractors: ['お腹の部分', '背中の部分'],
    category: 'anatomy',
    difficulty: 1
  },
  {
    id: 'fukubu',
    term: '腹部（ふくぶ）',
    reading: 'ふくぶ',
    meaning: 'お腹の部分',
    distractors: ['胸の部分', '腰の部分'],
    category: 'anatomy',
    difficulty: 1
  },
  {
    id: 'shisei',
    term: '四肢（しし）',
    reading: 'しし',
    meaning: '両手両足',
    distractors: ['胴体', '頭部'],
    category: 'anatomy',
    difficulty: 2
  },

  // 医療器具
  {
    id: 'kea',
    term: 'ガーゼ',
    reading: 'がーぜ',
    meaning: '傷口を覆う布',
    distractors: ['体温を測る器具', '血圧を測る器具'],
    category: 'equipment',
    difficulty: 1
  },
  {
    id: 'sonde',
    term: 'ゾンデ',
    reading: 'ぞんで',
    meaning: '胃や鼻に入れる管',
    distractors: ['注射針', '体温計'],
    category: 'equipment',
    difficulty: 2
  },
  {
    id: 'stretcher',
    term: 'ストレッチャー',
    reading: 'すとれっちゃー',
    meaning: '患者を運ぶ車輪付きベッド',
    distractors: ['車椅子', 'ベッド柵'],
    category: 'equipment',
    difficulty: 1
  },

  // 処置・ケア
  {
    id: 'seishin',
    term: '清拭（せいしき）',
    reading: 'せいしき',
    meaning: '体を拭いて清潔にすること',
    distractors: ['入浴すること', '歯を磨くこと'],
    category: 'procedures',
    difficulty: 2
  },
  {
    id: 'haisesu',
    term: '排泄（はいせつ）',
    reading: 'はいせつ',
    meaning: '尿や便を出すこと',
    distractors: ['食事を摂ること', '薬を飲むこと'],
    category: 'procedures',
    difficulty: 1
  },
  {
    id: 'taii',
    term: '体位（たいい）',
    reading: 'たいい',
    meaning: '体の姿勢',
    distractors: ['体温', '体重'],
    category: 'procedures',
    difficulty: 1
  },
  {
    id: 'kanshoku',
    term: '観察（かんさつ）',
    reading: 'かんさつ',
    meaning: '患者の状態を注意深く見ること',
    distractors: ['薬を投与すること', 'リハビリをすること'],
    category: 'procedures',
    difficulty: 1
  },
  {
    id: 'shokujikaijokan',
    term: '食事介助（しょくじかいじょ）',
    reading: 'しょくじかいじょ',
    meaning: '食事のお手伝いをすること',
    distractors: ['食事を作ること', '食事を運ぶこと'],
    category: 'procedures',
    difficulty: 1
  },

  // 追加の重要用語
  {
    id: 'ido',
    term: '移動（いどう）',
    reading: 'いどう',
    meaning: '場所を変えること',
    distractors: ['入浴すること', '食事すること'],
    category: 'procedures',
    difficulty: 1
  },
  {
    id: 'tenteki',
    term: '点滴（てんてき）',
    reading: 'てんてき',
    meaning: '血管に薬や栄養を少しずつ入れること',
    distractors: ['飲み薬', '塗り薬'],
    category: 'medication',
    difficulty: 1
  },
  {
    id: 'shoujou',
    term: '症状（しょうじょう）',
    reading: 'しょうじょう',
    meaning: '病気の現れ方・状態',
    distractors: ['薬の名前', '検査の方法'],
    category: 'procedures',
    difficulty: 1
  },
  {
    id: 'kinkyuu',
    term: '緊急（きんきゅう）',
    reading: 'きんきゅう',
    meaning: '急いで対応が必要な状態',
    distractors: ['予定された処置', 'ゆっくり対応できる状態'],
    category: 'procedures',
    difficulty: 1
  },
  {
    id: 'ansei',
    term: '安静（あんせい）',
    reading: 'あんせい',
    meaning: '体を休めて動かないこと',
    distractors: ['運動すること', '歩くこと'],
    category: 'procedures',
    difficulty: 1
  },
  {
    id: 'rinsh',
    term: '臨床（りんしょう）',
    reading: 'りんしょう',
    meaning: '実際の医療現場',
    distractors: ['研究室', '図書館'],
    category: 'procedures',
    difficulty: 2
  },
  {
    id: 'kanja',
    term: '患者（かんじゃ）',
    reading: 'かんじゃ',
    meaning: '病気やケガで治療を受ける人',
    distractors: ['医師', '看護師'],
    category: 'procedures',
    difficulty: 1
  },
  {
    id: 'nyuuin',
    term: '入院（にゅういん）',
    reading: 'にゅういん',
    meaning: '病院に泊まって治療を受けること',
    distractors: ['通院すること', '退院すること'],
    category: 'procedures',
    difficulty: 1
  },
  {
    id: 'taiin',
    term: '退院（たいいん）',
    reading: 'たいいん',
    meaning: '病院から家に帰ること',
    distractors: ['病院に入ること', '転院すること'],
    category: 'procedures',
    difficulty: 1
  },
  {
    id: 'kaigo',
    term: '介護（かいご）',
    reading: 'かいご',
    meaning: '日常生活の手助けをすること',
    distractors: ['手術をすること', '検査をすること'],
    category: 'procedures',
    difficulty: 1
  },
  {
    id: 'thermometer',
    term: '体温計',
    reading: 'たいおんけい',
    meaning: '体温を測定する医療器具',
    distractors: ['血圧測定器', '聴診器', '点滴スタンド'],
    category: 'equipment',
    difficulty: 1
  },
  {
    id: 'medication-001',
    term: '与薬（よやく）',
    reading: 'よやく',
    meaning: '患者に薬を投与すること。',
    distractors: ['採血', 'バイタルサイン測定'],
    category: 'medication',
    difficulty: 1
  },
  {
    id: 'abdomen',
    term: '腹部',
    reading: 'ふくぶ',
    meaning: 'お腹のこと。胃、腸、肝臓など消化器系の臓器や、その他多くの臓器が位置する体の部分。',
    distractors: ['四肢', '骨盤'],
    category: 'anatomy',
    difficulty: 1
  },
  {
    id: 's-lamp',
    term: '吸引器',
    reading: 'きゅういんき',
    meaning: '気道内の分泌物などを吸い取るための医療器具',
    distractors: ['点滴スタンド', '聴診器'],
    category: 'equipment',
    difficulty: 1
  },
  {
    id: 'med-001',
    term: '与薬（よやく）',
    reading: 'よやく',
    meaning: '薬を患者に投与すること。',
    distractors: ['採血', '体温測定'],
    category: 'medication',
    difficulty: 1
  },
  {
    id: 'abdomen-anatomy',
    term: '腹部',
    reading: 'ふくぶ',
    meaning: 'お腹の部分のこと。',
    distractors: ['背部', '上肢'],
    category: 'anatomy',
    difficulty: 1
  },
  {
    id: 'syr',
    term: 'シリンジ',
    reading: 'しりんじ',
    meaning: '注射器',
    distractors: ['ガーゼ', '鑷子（ピンセット）'],
    category: 'equipment',
    difficulty: 1
  },
  {
    id: 'temp',
    term: '体温',
    reading: 'たいおん',
    meaning: '体の温度のこと。腋窩（わきの下）、口腔、直腸などで測定する。',
    distractors: ['呼吸数', '血圧'],
    category: 'vital-signs',
    difficulty: 1
  },
  {
    id: 'medication-order',
    term: '処方箋（しょほうせん）',
    reading: 'しょほうせん',
    meaning: '医師が患者に投与する薬の種類、量、用法などを指示する文書。',
    distractors: ['点滴指示書', '検査結果報告書'],
    category: 'medication',
    difficulty: 1
  },
  {
    id: 'kekkanshou',
    term: '血管（けっかん）',
    reading: 'けっかん',
    meaning: '血液が流れる管のこと。動脈、静脈、毛細血管などがある。',
    distractors: ['筋肉', '骨格'],
    category: 'anatomy',
    difficulty: 1
  },
  {
    id: 'iv-catheter',
    term: 'IVカテーテル',
    reading: 'アイブイカテーテル',
    meaning: '点滴を行う際に血管に挿入する細い管のこと。',
    distractors: ['酸素マスク', '吸引チューブ'],
    category: 'equipment',
    difficulty: 1
  },
  {
    id: 'body-temperature-check',
    term: '体温測定',
    reading: 'たいおんそくてい',
    meaning: '体温計を用いて、体温を測ること。',
    distractors: ['血圧測定', '脈拍測定'],
    category: 'vital-signs',
    difficulty: 1
  },
  {
    id: 'med-injection',
    term: '与薬（よやく）',
    reading: 'よやく',
    meaning: '薬剤を患者に投与すること。',
    distractors: ['食事介助', '体位変換', 'バイタルサイン測定'],
    category: 'medication',
    difficulty: 1
  },
  {
    id: 'kekkansho',
    term: '血管床',
    reading: 'けっかんしょう',
    meaning: '血管が分布している組織や領域のこと。',
    distractors: ['呼吸器系のこと。', '消化管のこと。'],
    category: 'anatomy',
    difficulty: 1
  },
  {
    id: 'iv-pump',
    term: '輸液ポンプ',
    reading: 'ゆえきぽんぷ',
    meaning: '点滴の速度を一定に保つ医療機器',
    distractors: ['吸引器', '酸素マスク', '血圧計'],
    category: 'equipment',
    difficulty: 1
  },
  {
    id: 'body-temperature',
    term: '体温',
    reading: 'たいおん',
    meaning: '体の温度。健康状態を知るための重要な指標。',
    distractors: ['呼吸数', '血圧'],
    category: 'vital-signs',
    difficulty: 1
  },
  {
    id: 'med-injection-2',
    term: '注射（ちゅうしゃ）',
    reading: 'ちゅうしゃ',
    meaning: '薬剤を体内に注入する行為。皮下、筋肉、静脈など、投与経路は様々。',
    distractors: ['点滴', '服薬'],
    category: 'medication',
    difficulty: 1
  },
  {
    id: 'mizuchi',
    term: '四肢（しし）',
    reading: 'しし',
    meaning: '人間の手足のこと',
    distractors: ['体幹', '頭頸部'],
    category: 'anatomy',
    difficulty: 1
  },
]

export const categories = {
  'vital-signs': 'バイタルサイン',
  'medication': '薬剤',
  'anatomy': '解剖',
  'equipment': '医療器具',
  'procedures': '処置・ケア'
} as const

export const difficulties = {
  1: '基礎',
  2: '標準',
  3: '応用'
} as const
