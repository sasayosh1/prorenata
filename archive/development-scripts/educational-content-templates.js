const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN || '',
})

// 教育的コンテンツの専用テンプレート
const educationalContentTemplates = [
  // 基礎教育シリーズ
  {
    series: '看護助手基礎講座',
    title: '第1回：看護助手の役割と責任｜医療チームにおける位置づけ',
    slug: 'nursing-assistant-role-responsibility-01',
    categorySlug: 'basics',
    contentType: 'howto',
    educationalLevel: 'fundamental',
    targetAudience: 'beginner',
    difficulty: 'beginner',
    focusKeyword: '看護助手 役割',
    relatedKeywords: ['看護助手 責任', '医療チーム', '看護補助者'],
    learningObjectives: [
      '看護助手の基本的な役割を理解する',
      '医療チーム内での位置づけを把握する',
      '責任の範囲と限界を明確にする'
    ],
    prerequisites: 'なし',
    estimatedStudyTime: 30,
    assessmentIncluded: true,
  },
  {
    series: '看護助手基礎講座',
    title: '第2回：医療現場のコミュニケーション｜患者様・スタッフとの関わり方',
    slug: 'nursing-assistant-communication-02',
    categorySlug: 'basics',
    contentType: 'howto',
    educationalLevel: 'fundamental',
    targetAudience: 'beginner',
    difficulty: 'beginner',
    focusKeyword: '看護助手 コミュニケーション',
    relatedKeywords: ['患者対応', '医療コミュニケーション', 'チームワーク'],
    learningObjectives: [
      '効果的なコミュニケーション技術を身につける',
      '患者様との適切な関わり方を学ぶ',
      'チーム内での報告・連絡・相談の方法を理解する'
    ],
    prerequisites: '第1回の受講',
    estimatedStudyTime: 45,
    assessmentIncluded: true,
  },
  {
    series: '看護助手基礎講座',
    title: '第3回：感染対策の基本｜標準予防策と手洗いの重要性',
    slug: 'nursing-assistant-infection-control-03',
    categorySlug: 'practice',
    contentType: 'howto',
    educationalLevel: 'fundamental',
    targetAudience: 'beginner',
    difficulty: 'intermediate',
    focusKeyword: '看護助手 感染対策',
    relatedKeywords: ['標準予防策', '手洗い', 'PPE', '個人防護具'],
    learningObjectives: [
      '標準予防策の基本原則を理解する',
      '正しい手洗い手技を習得する',
      'PPEの適切な使用方法を学ぶ'
    ],
    prerequisites: '第1回・第2回の受講',
    estimatedStudyTime: 60,
    assessmentIncluded: true,
  },
  
  // 実践スキルシリーズ
  {
    series: '実践スキル向上講座',
    title: '患者移送の安全技術｜ストレッチャー・車椅子の正しい使い方',
    slug: 'patient-transfer-safety-skills',
    categorySlug: 'practice',
    contentType: 'howto',
    educationalLevel: 'intermediate',
    targetAudience: 'experienced',
    difficulty: 'intermediate',
    focusKeyword: '患者移送',
    relatedKeywords: ['ストレッチャー', '車椅子', '患者搬送', '安全技術'],
    learningObjectives: [
      '安全な患者移送の原則を理解する',
      'ストレッチャーの操作技術を習得する',
      '車椅子での移送時の注意点を学ぶ'
    ],
    prerequisites: '基礎講座の修了',
    estimatedStudyTime: 50,
    assessmentIncluded: true,
  },
  {
    series: '実践スキル向上講座',
    title: 'バイタルサイン測定の補助｜正確な測定をサポートする技術',
    slug: 'vital-signs-measurement-support',
    categorySlug: 'practice',
    contentType: 'howto',
    educationalLevel: 'intermediate',
    targetAudience: 'experienced',
    difficulty: 'intermediate',
    focusKeyword: 'バイタルサイン 看護助手',
    relatedKeywords: ['血圧測定', '体温測定', '脈拍', '呼吸数'],
    learningObjectives: [
      'バイタルサインの基本知識を理解する',
      '測定機器の正しい取り扱いを学ぶ',
      '測定時の患者様への配慮方法を習得する'
    ],
    prerequisites: '基礎講座の修了',
    estimatedStudyTime: 45,
    assessmentIncluded: true,
  },
  
  // キャリア開発シリーズ
  {
    series: 'キャリア開発講座',
    title: '看護助手のキャリアパス設計｜将来への道筋を描く',
    slug: 'nursing-assistant-career-path-planning',
    categorySlug: 'career',
    contentType: 'howto',
    educationalLevel: 'advanced',
    targetAudience: 'experienced',
    difficulty: 'intermediate',
    focusKeyword: '看護助手 キャリアパス',
    relatedKeywords: ['キャリア設計', '看護師への道', 'スキルアップ'],
    learningObjectives: [
      '自分のキャリア目標を明確にする',
      'キャリアアップのための具体的な計画を立てる',
      '必要な資格やスキルを特定する'
    ],
    prerequisites: '現場経験1年以上',
    estimatedStudyTime: 60,
    assessmentIncluded: true,
  },
  
  // 専門分野シリーズ
  {
    series: '専門分野理解講座',
    title: '手術室での看護助手業務｜特殊な環境での役割と注意点',
    slug: 'operating-room-nursing-assistant',
    categorySlug: 'workplace',
    contentType: 'howto',
    educationalLevel: 'advanced',
    targetAudience: 'experienced',
    difficulty: 'advanced',
    focusKeyword: '手術室 看護助手',
    relatedKeywords: ['手術室業務', '無菌操作', 'OR看護'],
    learningObjectives: [
      '手術室の特殊な環境を理解する',
      '無菌操作の基本を学ぶ',
      '手術室での看護助手の役割を把握する'
    ],
    prerequisites: '実践スキル講座の修了',
    estimatedStudyTime: 75,
    assessmentIncluded: true,
  },
  {
    series: '専門分野理解講座',
    title: 'ICU・救急病棟での看護助手業務｜重症患者ケアの補助',
    slug: 'icu-emergency-nursing-assistant',
    categorySlug: 'workplace',
    contentType: 'howto',
    educationalLevel: 'advanced',
    targetAudience: 'experienced',
    difficulty: 'advanced',
    focusKeyword: 'ICU 看護助手',
    relatedKeywords: ['集中治療室', '救急病棟', '重症患者', '医療機器'],
    learningObjectives: [
      'ICU・救急病棟の特殊性を理解する',
      '重症患者ケアの基本を学ぶ',
      '医療機器周辺での安全な業務方法を習得する'
    ],
    prerequisites: '実践スキル講座の修了',
    estimatedStudyTime: 80,
    assessmentIncluded: true,
  }
]

// クイズ・アセスメント用のコンテンツ
const assessmentQuestions = {
  'nursing-assistant-role-responsibility-01': [
    {
      question: '看護助手が直接行ってはいけない業務はどれですか？',
      type: 'multiple-choice',
      options: [
        'ベッドメイキング',
        '薬剤の投与',
        '患者様の見守り',
        '食事の配膳'
      ],
      correctAnswer: 1,
      explanation: '薬剤の投与は看護師の専門業務であり、看護助手が行うことはできません。'
    },
    {
      question: '医療チームにおける看護助手の主な役割を説明してください。',
      type: 'short-answer',
      sampleAnswer: '看護師の業務をサポートし、患者様の療養環境を整備し、医療チーム全体の効率的な運営に貢献すること。'
    }
  ],
  'nursing-assistant-communication-02': [
    {
      question: '患者様とのコミュニケーションで最も重要なことは？',
      type: 'multiple-choice',
      options: [
        '早く話すこと',
        '相手の立場に立つこと',
        '専門用語を使うこと',
        '距離を保つこと'
      ],
      correctAnswer: 1,
      explanation: '患者様の立場に立って、相手の気持ちを理解しようとする姿勢が最も重要です。'
    }
  ]
}

// 教育的コンテンツの本文生成関数
function generateEducationalContent(template) {
  const sections = []
  
  // 学習目標
  sections.push({
    _type: 'block',
    children: [{ _type: 'span', text: '🎯 学習目標' }],
    style: 'h2',
    markDefs: [],
  })
  
  const objectivesText = template.learningObjectives
    .map((obj, index) => `${index + 1}. ${obj}`)
    .join('\n')
  
  sections.push({
    _type: 'block',
    children: [{ _type: 'span', text: objectivesText }],
    style: 'normal',
    markDefs: [],
  })
  
  // 前提条件
  if (template.prerequisites && template.prerequisites !== 'なし') {
    sections.push({
      _type: 'block',
      children: [{ _type: 'span', text: '📋 前提条件' }],
      style: 'h3',
      markDefs: [],
    })
    
    sections.push({
      _type: 'block',
      children: [{ _type: 'span', text: template.prerequisites }],
      style: 'normal',
      markDefs: [],
    })
  }
  
  // 推定学習時間
  sections.push({
    _type: 'block',
    children: [{ _type: 'span', text: '⏱️ 推定学習時間' }],
    style: 'h3',
    markDefs: [],
  })
  
  sections.push({
    _type: 'block',
    children: [{ _type: 'span', text: `約${template.estimatedStudyTime}分` }],
    style: 'normal',
    markDefs: [],
  })
  
  // 導入
  sections.push({
    _type: 'block',
    children: [{ _type: 'span', text: 'はじめに' }],
    style: 'h2',
    markDefs: [],
  })
  
  sections.push({
    _type: 'block',
    children: [{
      _type: 'span',
      text: `この講座では、${template.focusKeyword}について体系的に学習します。実際の医療現場での経験を基に、実践的で役立つ知識とスキルを身につけることができます。`
    }],
    style: 'normal',
    markDefs: [],
  })
  
  // 理論部分
  sections.push({
    _type: 'block',
    children: [{ _type: 'span', text: '📚 基礎知識' }],
    style: 'h2',
    markDefs: [],
  })
  
  sections.push({
    _type: 'block',
    children: [{
      _type: 'span',
      text: `${template.focusKeyword}に関する基礎的な知識について詳しく解説します。医療現場での実践に必要な理論的背景を理解しましょう。`
    }],
    style: 'normal',
    markDefs: [],
  })
  
  // 実践部分
  sections.push({
    _type: 'block',
    children: [{ _type: 'span', text: '💡 実践のポイント' }],
    style: 'h2',
    markDefs: [],
  })
  
  sections.push({
    _type: 'block',
    children: [{
      _type: 'span',
      text: '実際の現場で活用するための具体的な方法と注意点について説明します。\n\n重要なポイント：\n• 安全性を最優先に考える\n• 患者様の尊厳を尊重する\n• チームワークを大切にする\n• 継続的な学習を心がける'
    }],
    style: 'normal',
    markDefs: [],
  })
  
  // 事例・症例
  sections.push({
    _type: 'block',
    children: [{ _type: 'span', text: '📖 実際の事例' }],
    style: 'h2',
    markDefs: [],
  })
  
  sections.push({
    _type: 'block',
    children: [{
      _type: 'span',
      text: '実際の医療現場での事例を通じて、学習内容の理解を深めましょう。具体的なシチュエーションを想定した対応方法を学習します。'
    }],
    style: 'normal',
    markDefs: [],
  })
  
  // チェックポイント
  if (template.assessmentIncluded) {
    sections.push({
      _type: 'block',
      children: [{ _type: 'span', text: '✅ 理解度チェック' }],
      style: 'h2',
      markDefs: [],
    })
    
    sections.push({
      _type: 'block',
      children: [{
        _type: 'span',
        text: '学習内容の理解度を確認するためのチェックポイントです。すべての項目について自信を持って答えられるか確認してください。'
      }],
      style: 'normal',
      markDefs: [],
    })
  }
  
  // まとめ
  sections.push({
    _type: 'block',
    children: [{ _type: 'span', text: '📝 まとめ' }],
    style: 'h2',
    markDefs: [],
  })
  
  sections.push({
    _type: 'block',
    children: [{
      _type: 'span',
      text: `この講座では、${template.focusKeyword}について学習しました。学んだ知識とスキルを実際の現場で活用し、継続的な向上を心がけましょう。次の講座でさらに深い理解を目指しましょう。`
    }],
    style: 'normal',
    markDefs: [],
  })
  
  return sections
}

// 教育的コンテンツ作成関数
async function createEducationalContent() {
  try {
    console.log('📚 教育的コンテンツの作成を開始...')
    
    // 既存の著者とカテゴリを取得
    const author = await client.fetch('*[_type == "author"][0]')
    const categories = await client.fetch('*[_type == "category"]')
    
    if (!author) {
      throw new Error('著者が見つかりません。')
    }
    
    const categoryMap = {}
    categories.forEach(cat => {
      if (cat.slug && cat.slug.current) {
        categoryMap[cat.slug.current] = cat
      }
    })
    
    let createdCount = 0
    
    for (const template of educationalContentTemplates) {
      const category = categoryMap[template.categorySlug]
      
      if (!category) {
        console.log(`⚠️  カテゴリが見つかりません: ${template.categorySlug}`)
        continue
      }
      
      try {
        try {
        const metaTitle = `${template.title} | 看護助手教育講座`
        const metaDescription = `${template.series}の一環として、${template.focusKeyword}について体系的に学習します。実践的な知識とスキルを身につけましょう。`
        
        const tags = [
          '教育コンテンツ',
          '看護助手',
          template.series,
          template.educationalLevel,
          ...template.relatedKeywords.slice(0, 3)
        ]
        
        const article = await client.create({
          _type: 'post',
          title: template.title,
          slug: {
            _type: 'slug',
            current: template.slug
          },
          author: {
            _type: 'reference',
            _ref: author._id
          },
          categories: [
            {
              _type: 'reference',
              _ref: category._id
            }
          ],
          tags: tags,
          publishedAt: new Date().toISOString(),
          excerpt: metaDescription,
          metaTitle: metaTitle,
          metaDescription: metaDescription,
          focusKeyword: template.focusKeyword,
          relatedKeywords: template.relatedKeywords,
          contentType: template.contentType,
          targetAudience: template.targetAudience,
          difficulty: template.difficulty,
          readingTime: template.estimatedStudyTime,
          featured: template.educationalLevel === 'fundamental',
          body: generateEducationalContent(template)
        })
        createdCount++
        
        // API制限を避けるため待機
        await new Promise(resolve => setTimeout(resolve, 1500))
        
      } catch (error) {
        console.error(`❌ 作成エラー (${template.title}):`, error.message)
      }
    }
    
    console.log(`\n🎉 教育的コンテンツ作成完了: ${createdCount}件`)
    
  } catch (error) {
    console.error('❌ 教育的コンテンツ作成エラー:', error)
  }
}

// 学習進捗管理のためのスキーマ（参考）
const learningProgressSchema = {
  name: 'learningProgress',
  title: 'Learning Progress',
  type: 'document',
  fields: [
    {
      name: 'user',
      title: 'User',
      type: 'string',
      description: 'ユーザーID'
    },
    {
      name: 'course',
      title: 'Course',
      type: 'reference',
      to: [{ type: 'post' }],
      description: '受講中のコース'
    },
    {
      name: 'progress',
      title: 'Progress',
      type: 'number',
      description: '進捗率（0-100）'
    },
    {
      name: 'completedSections',
      title: 'Completed Sections',
      type: 'array',
      of: [{ type: 'string' }],
      description: '完了したセクション'
    },
    {
      name: 'assessmentScore',
      title: 'Assessment Score',
      type: 'number',
      description: 'アセスメントスコア'
    },
    {
      name: 'completedAt',
      title: 'Completed At',
      type: 'datetime',
      description: '完了日時'
    }
  ]
}

if (require.main === module) {
  createEducationalContent()
}

module.exports = { 
  createEducationalContent, 
  educationalContentTemplates, 
  assessmentQuestions,
  learningProgressSchema
}