export type CategorySlug =
  | 'work'
  | 'salary'
  | 'license'
  | 'career-change'
  | 'resignation'
  | 'wellbeing'
  | 'stories'

export interface TagDefinition {
  slug: string
  title: string
  description: string
  categorySlug: CategorySlug
  keywords: string[]
  heroTitle?: string
  heroDescription?: string
}

export const CATEGORY_SUMMARY: Record<CategorySlug, { title: string; description: string }> = {
  work: {
    title: '仕事',
    description: '現場の業務手順や患者さん対応、感染対策など「看護助手の仕事そのもの」に関するテーマをまとめています。',
  },
  salary: {
    title: '給与',
    description: '賃金構造基本統計調査などのデータをもとに、給与・手当・待遇のリアルを整理しています。',
  },
  license: {
    title: '資格',
    description: '取得できる資格や研修情報、勉強の進め方など、スキルアップに関するトピックです。',
  },
  'career-change': {
    title: '転職',
    description: 'キャリアチェンジの準備や求人探しのコツなど、転職活動に役立つ情報をまとめています。',
  },
  resignation: {
    title: '退職',
    description: '円満退職のポイントや退職手続き、有給消化の進め方など、退職前後の不安に寄り添うカテゴリです。',
  },
  wellbeing: {
    title: 'メンタル',
    description: 'メンタルケア、人間関係、休息の工夫など、心と身体を整えるための視点を扱っています。',
  },
  stories: {
    title: '体験',
    description: '現場での気づきや経験談、小さな学びを共有し、同じ立場の方の背中をそっと押すストーリーを集めています。',
  },
}

export const TAG_CATALOG: TagDefinition[] = [
  {
    slug: 'basics',
    title: '基礎知識',
    description: '新人さんが押さえておきたい仕事内容や用語、1日の流れなどをまとめています。',
    categorySlug: 'work',
    keywords: ['基礎知識', '入門', '新人', '仕事内容', '基本'],
  },
  {
    slug: 'infection-control',
    title: '感染対策',
    description: '清潔操作やマスク・手袋の扱い方など、現場で欠かせない感染対策の基本を整理します。',
    categorySlug: 'work',
    keywords: ['感染対策', '清潔', '消毒', '感染', '衛生'],
  },
  {
    slug: 'patient-care',
    title: '患者対応',
    description: '声かけや案内のコツ、安心してもらうためのコミュニケーション術を紹介します。',
    categorySlug: 'work',
    keywords: ['患者対応', '声かけ', '傾聴', '案内', '接遇'],
  },
  {
    slug: 'work-efficiency',
    title: '業務効率',
    description: '物品管理や準備の流れ、家事スキルの応用など、業務をスムーズに進める工夫をまとめています。',
    categorySlug: 'work',
    keywords: ['効率', '段取り', '準備', '物品', 'チェックリスト'],
  },
  {
    slug: 'career-prep',
    title: '転職準備',
    description: '転職活動の進め方、スケジュール、求人選びのチェックポイントを解説します。',
    categorySlug: 'career-change',
    keywords: ['転職', '求人', '就職', '応募', '職務経歴書'],
  },
  {
    slug: 'interview',
    title: '面接・志望動機',
    description: '志望動機のまとめ方や面接でよく聞かれる質問を整理し、安心して挑めるようサポートします。',
    categorySlug: 'career-change',
    keywords: ['面接', '志望動機', '質問', '自己PR', '採用'],
  },
  {
    slug: 'nursing-path',
    title: '看護師への道',
    description: '看護助手から看護師を目指すステップ、学校選びや勉強法をまとめています。',
    categorySlug: 'career-change',
    keywords: ['看護師', '正看', '准看', '進学', 'ブリッジ'],
  },
  {
    slug: 'salary-bonus',
    title: '給与・待遇',
    description: '給料の内訳や賞与、夜勤手当など、働き方ごとの待遇を整理しています。',
    categorySlug: 'salary',
    keywords: ['給与', '年収', '月給', '時給', '賞与', 'ボーナス', '手当'],
  },
  {
    slug: 'side-jobs',
    title: '副業・働き方',
    description: '副業の可否やダブルワーク、働き方の選択肢をプライバシーに配慮して解説します。',
    categorySlug: 'salary',
    keywords: ['副業', 'ダブルワーク', '兼業', '働き方', 'シフト'],
  },
  {
    slug: 'allowance',
    title: '手当・福利厚生',
    description: '夜勤手当や資格手当、福利厚生の活用法をわかりやすく紹介します。',
    categorySlug: 'salary',
    keywords: ['手当', '福利厚生', '交通費', '制度', '加算'],
  },
  {
    slug: 'wellbeing',
    title: 'メンタルケア',
    description: '忙しい日々でも心を整えるためのセルフケアやごほうび習慣を共有します。',
    categorySlug: 'wellbeing',
    keywords: ['メンタル', '心', 'ストレス', 'ケア', 'ごほうび'],
  },
  {
    slug: 'human-relationships',
    title: '人間関係',
    description: '先輩との関わり方やチームコミュニケーションの工夫をまとめています。',
    categorySlug: 'wellbeing',
    keywords: ['人間関係', 'チーム', '先輩', '上司', '伝え方'],
  },
  {
    slug: 'rest-and-shift',
    title: '休息・シフト管理',
    description: '夜勤明けの整え方や体力管理のコツ、小さな休息アイデアを紹介します。',
    categorySlug: 'wellbeing',
    keywords: ['休息', '睡眠', '夜勤', 'シフト調整', '体調管理'],
  },
  {
    slug: 'study-methods',
    title: '勉強法・研修',
    description: '資格取得や研修の活用法、学び直しのコツをわかりやすく解説します。',
    categorySlug: 'license',
    keywords: ['勉強法', '研修', '講座', '学び直し', '通信'],
  },
  {
    slug: 'certification',
    title: '資格取得',
    description: '介護職員初任者研修や実務者研修など、取得メリットと学習計画を整理します。',
    categorySlug: 'license',
    keywords: ['資格取得', '初任者研修', '実務者研修', '介護', '試験'],
  },
  {
    slug: 'resignation-steps',
    title: '退職手続き',
    description: '退職届の書き方や伝え方、有給消化までの流れを段階別にまとめています。',
    categorySlug: 'resignation',
    keywords: ['退職', '退職届', '退職願', '伝え方', '手続き'],
  },
  {
    slug: 'paid-leave',
    title: '有給消化',
    description: '有給の申請タイミングやトラブル回避のポイントを解説します。',
    categorySlug: 'resignation',
    keywords: ['有給', '消化', '休暇', '申請', 'スケジュール'],
  },
  {
    slug: 'story',
    title: '体験談',
    description: '心に残った患者さんの言葉や、現場での気づきを共有するストーリーです。',
    categorySlug: 'stories',
    keywords: ['体験談', 'エピソード', '現場', '気づき', '声'],
  },
  {
    slug: 'newcomer-notes',
    title: '新人の気づき',
    description: '新人時代に感じた不安や乗り越え方、小さな成功体験をまとめています。',
    categorySlug: 'stories',
    keywords: ['新人', 'はじめて', '不安', '気づき', 'メモ'],
  },
]

export function getTagDefinition(slug: string): TagDefinition | undefined {
  return TAG_CATALOG.find(tag => tag.slug === slug)
}

export function getTagsGroupedByCategory(definitions: TagDefinition[] = TAG_CATALOG) {
  return definitions.reduce<Record<CategorySlug, TagDefinition[]>>((acc, tag) => {
    if (!acc[tag.categorySlug]) {
      acc[tag.categorySlug] = []
    }
    acc[tag.categorySlug].push(tag)
    return acc
  }, {} as Record<CategorySlug, TagDefinition[]>)
}
