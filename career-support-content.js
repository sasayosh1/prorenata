const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN || '',
})

// キャリア支援コンテンツの設計
const careerSupportTemplates = [
  // キャリア診断・自己分析系
  {
    title: '看護助手適性診断｜あなたに向いている医療現場は？',
    slug: 'nursing-assistant-aptitude-test',
    categorySlug: 'career',
    contentType: 'assessment',
    careerStage: 'exploration',
    targetAudience: 'beginner',
    difficulty: 'beginner',
    focusKeyword: '看護助手 適性診断',
    relatedKeywords: ['看護助手 向いている', '医療適性', 'キャリア診断'],
    careerSupportType: 'self-assessment',
    interactiveContent: true,
    actionItems: [
      '自分の性格特性を理解する',
      '適している職場環境を把握する',
      '必要なスキル開発計画を立てる'
    ],
  },
  {
    title: '看護助手のキャリアビジョン設計ワークショップ｜5年後の自分を描く',
    slug: 'nursing-assistant-career-vision-workshop',
    categorySlug: 'career',
    contentType: 'howto',
    careerStage: 'planning',
    targetAudience: 'experienced',
    difficulty: 'intermediate',
    focusKeyword: '看護助手 キャリアビジョン',
    relatedKeywords: ['キャリア設計', '将来設計', 'キャリアプラン'],
    careerSupportType: 'career-planning',
    interactiveContent: true,
    actionItems: [
      'キャリア目標を明確にする',
      '具体的な行動計画を作成する',
      '定期的な見直しスケジュールを設定する'
    ],
  },
  
  // スキル開発・資格取得系
  {
    title: '看護助手スキルアップロードマップ｜段階別成長プラン',
    slug: 'nursing-assistant-skill-roadmap',
    categorySlug: 'career',
    contentType: 'howto',
    careerStage: 'development',
    targetAudience: 'experienced',
    difficulty: 'intermediate',
    focusKeyword: '看護助手 スキルアップ',
    relatedKeywords: ['スキル向上', '能力開発', 'キャリアアップ'],
    careerSupportType: 'skill-development',
    interactiveContent: false,
    actionItems: [
      '現在のスキルレベルを評価する',
      '必要なスキルを特定する',
      '学習計画を立てて実行する'
    ],
  },
  {
    title: '看護助手に有利な資格取得完全ガイド｜優先順位と取得戦略',
    slug: 'nursing-assistant-certification-strategy',
    categorySlug: 'career',
    contentType: 'howto',
    careerStage: 'development',
    targetAudience: 'experienced',
    difficulty: 'intermediate',
    focusKeyword: '看護助手 資格取得',
    relatedKeywords: ['医療資格', '看護資格', '資格勉強'],
    careerSupportType: 'certification',
    interactiveContent: false,
    actionItems: [
      '目標に応じた資格を選択する',
      '効率的な学習計画を作成する',
      '資格取得後の活用方法を検討する'
    ],
  },
  
  // 転職・就職支援系
  {
    title: '看護助手転職成功の5ステップ｜失敗しない転職戦略',
    slug: 'nursing-assistant-job-change-success',
    categorySlug: 'career',
    contentType: 'howto',
    careerStage: 'transition',
    targetAudience: 'job-seeker',
    difficulty: 'intermediate',
    focusKeyword: '看護助手 転職成功',
    relatedKeywords: ['転職戦略', '転職活動', '求人選び'],
    careerSupportType: 'job-search',
    interactiveContent: false,
    actionItems: [
      '転職理由と目標を明確にする',
      '効果的な求人検索を行う',
      '面接対策を徹底する'
    ],
  },
  {
    title: '看護助手面接対策マスター講座｜よくある質問と回答例',
    slug: 'nursing-assistant-interview-mastery',
    categorySlug: 'career',
    contentType: 'howto',
    careerStage: 'transition',
    targetAudience: 'job-seeker',
    difficulty: 'beginner',
    focusKeyword: '看護助手 面接対策',
    relatedKeywords: ['面接準備', '志望動機', '面接質問'],
    careerSupportType: 'interview-prep',
    interactiveContent: true,
    actionItems: [
      '想定質問への回答を準備する',
      '模擬面接を実施する',
      '面接当日の準備チェックリストを作成する'
    ],
  },
  {
    title: '看護助手履歴書・職務経歴書の書き方｜採用担当者に響く文書作成術',
    slug: 'nursing-assistant-resume-writing',
    categorySlug: 'career',
    contentType: 'howto',
    careerStage: 'transition',
    targetAudience: 'job-seeker',
    difficulty: 'beginner',
    focusKeyword: '看護助手 履歴書',
    relatedKeywords: ['職務経歴書', '履歴書作成', '応募書類'],
    careerSupportType: 'resume-writing',
    interactiveContent: true,
    actionItems: [
      '効果的な自己PRを作成する',
      '経験とスキルを整理する',
      '志望動機を具体的に記述する'
    ],
  },
  
  // キャリアチェンジ・看護師への道
  {
    title: '看護助手から看護師への最短ルート｜准看護師vs正看護師',
    slug: 'nursing-assistant-to-nurse-pathway',
    categorySlug: 'career',
    contentType: 'comparison',
    careerStage: 'transition',
    targetAudience: 'nurse-aspirant',
    difficulty: 'intermediate',
    focusKeyword: '看護助手から看護師',
    relatedKeywords: ['准看護師', '正看護師', '看護学校'],
    careerSupportType: 'career-change',
    interactiveContent: false,
    actionItems: [
      '看護師の種類と要件を理解する',
      '学習計画と資金計画を立てる',
      '入学準備を進める'
    ],
  },
  {
    title: '看護学校入学準備完全マニュアル｜働きながら学ぶ方法',
    slug: 'nursing-school-preparation-guide',
    categorySlug: 'career',
    contentType: 'howto',
    careerStage: 'transition',
    targetAudience: 'nurse-aspirant',
    difficulty: 'advanced',
    focusKeyword: '看護学校 準備',
    relatedKeywords: ['看護学校入学', '働きながら勉強', '社会人入学'],
    careerSupportType: 'education-planning',
    interactiveContent: false,
    actionItems: [
      '入学要件と試験内容を確認する',
      '学習スケジュールを作成する',
      '経済的な準備を進める'
    ],
  },
  
  // 職場選択・環境分析系
  {
    title: '理想の職場選び診断｜看護助手にとって働きやすい環境とは',
    slug: 'ideal-workplace-selection-guide',
    categorySlug: 'career',
    contentType: 'assessment',
    careerStage: 'exploration',
    targetAudience: 'job-seeker',
    difficulty: 'beginner',
    focusKeyword: '看護助手 職場選び',
    relatedKeywords: ['働きやすい職場', '職場環境', '病院選び'],
    careerSupportType: 'workplace-selection',
    interactiveContent: true,
    actionItems: [
      '自分の価値観を明確にする',
      '職場の条件を整理する',
      '情報収集の方法を学ぶ'
    ],
  },
  {
    title: '病院・クリニック・介護施設比較ガイド｜あなたに合う職場は？',
    slug: 'healthcare-workplace-comparison',
    categorySlug: 'workplace',
    contentType: 'comparison',
    careerStage: 'exploration',
    targetAudience: 'beginner',
    difficulty: 'beginner',
    focusKeyword: '看護助手 職場比較',
    relatedKeywords: ['病院 クリニック', '介護施設', '医療現場'],
    careerSupportType: 'workplace-analysis',
    interactiveContent: false,
    actionItems: [
      '各職場の特徴を理解する',
      '自分の適性を評価する',
      '見学や体験の機会を活用する'
    ],
  },
  
  // メンター・ネットワーキング系
  {
    title: '看護助手のネットワーキング術｜キャリアに活かす人脈作り',
    slug: 'nursing-assistant-networking-guide',
    categorySlug: 'career',
    contentType: 'howto',
    careerStage: 'development',
    targetAudience: 'experienced',
    difficulty: 'intermediate',
    focusKeyword: '看護助手 ネットワーキング',
    relatedKeywords: ['人脈作り', '職場人間関係', 'キャリア人脈'],
    careerSupportType: 'networking',
    interactiveContent: false,
    actionItems: [
      '目的意識を持ったネットワーキングを行う',
      '継続的な関係構築を心がける',
      '相互利益となる関係を築く'
    ],
  }
]

// キャリア支援ツール（チェックリスト、テンプレート等）
const careerSupportTools = {
  'self-assessment-checklist': {
    title: '看護助手適性チェックリスト',
    items: [
      '人とのコミュニケーションが好き',
      '体力に自信がある',
      '責任感が強い',
      'チームワークを大切にできる',
      '学習意欲がある',
      '清潔感を保てる',
      '時間管理ができる',
      'ストレス耐性がある'
    ]
  },
  'career-planning-template': {
    title: 'キャリアプランニングテンプレート',
    sections: [
      '現状分析（スキル、経験、価値観）',
      '5年後の目標設定',
      '必要なスキル・資格の特定',
      '具体的なアクションプラン',
      '定期評価とプラン見直し'
    ]
  },
  'job-search-checklist': {
    title: '転職活動チェックリスト',
    phases: {
      'preparation': [
        '転職理由の明確化',
        '希望条件の整理',
        '履歴書・職務経歴書の準備',
        'ポートフォリオの作成'
      ],
      'search': [
        '求人サイトの登録',
        '転職エージェントへの相談',
        '職場見学の申し込み',
        '情報収集の実施'
      ],
      'application': [
        '応募書類の提出',
        '面接日程の調整',
        '面接対策の実施',
        '条件交渉の準備'
      ]
    }
  }
}

// インタラクティブコンテンツ生成関数
function generateInteractiveContent(template) {
  const sections = []
  
  if (template.careerSupportType === 'self-assessment') {
    sections.push({
      _type: 'block',
      children: [{ _type: 'span', text: '🔍 適性診断テスト' }],
      style: 'h2',
      markDefs: [],
    })
    
    sections.push({
      _type: 'block',
      children: [{
        _type: 'span',
        text: '以下の質問に答えて、あなたの看護助手としての適性を確認してみましょう。\n\n【診断方法】\n各項目について、当てはまる度合いを5段階で評価してください。\n5：とても当てはまる\n4：やや当てはまる\n3：どちらでもない\n2：あまり当てはまらない\n1：全く当てはまらない'
      }],
      style: 'normal',
      markDefs: [],
    })
  }
  
  if (template.careerSupportType === 'career-planning') {
    sections.push({
      _type: 'block',
      children: [{ _type: 'span', text: '📋 キャリアプランニングワークシート' }],
      style: 'h2',
      markDefs: [],
    })
    
    sections.push({
      _type: 'block',
      children: [{
        _type: 'span',
        text: 'このワークシートを使って、あなたのキャリアプランを具体的に設計しましょう。\n\n【STEP 1】現状分析\n• 現在のスキルレベル：\n• 得意な業務：\n• 改善したい点：\n\n【STEP 2】目標設定\n• 5年後の理想の姿：\n• 1年後の目標：\n• 3ヶ月後の目標：'
      }],
      style: 'normal',
      markDefs: [],
    })
  }
  
  return sections
}

// キャリア支援コンテンツの本文生成関数
function generateCareerSupportContent(template) {
  const sections = []
  
  // 導入とキャリアステージの説明
  sections.push({
    _type: 'block',
    children: [{
      _type: 'span',
      text: `キャリア${template.careerStage === 'exploration' ? '探索' : template.careerStage === 'planning' ? '計画' : template.careerStage === 'development' ? '開発' : '転換'}段階にある看護助手の方に向けて、${template.focusKeyword}について詳しく解説します。`
    }],
    style: 'normal',
    markDefs: [],
  })
  
  // この記事で得られること
  sections.push({
    _type: 'block',
    children: [{ _type: 'span', text: '🎯 この記事で得られること' }],
    style: 'h2',
    markDefs: [],
  })
  
  const actionItemsText = template.actionItems
    .map((item, index) => `${index + 1}. ${item}`)
    .join('\n')
  
  sections.push({
    _type: 'block',
    children: [{ _type: 'span', text: actionItemsText }],
    style: 'normal',
    markDefs: [],
  })
  
  // インタラクティブコンテンツ（該当する場合）
  if (template.interactiveContent) {
    sections.push(...generateInteractiveContent(template))
  }
  
  // 基本知識
  sections.push({
    _type: 'block',
    children: [{ _type: 'span', text: '📚 基本知識' }],
    style: 'h2',
    markDefs: [],
  })
  
  sections.push({
    _type: 'block',
    children: [{
      _type: 'span',
      text: `${template.focusKeyword}について、基本的な知識から実践的な方法まで体系的に学習しましょう。キャリア形成において重要なポイントを理解し、具体的な行動につなげることが大切です。`
    }],
    style: 'normal',
    markDefs: [],
  })
  
  // 実践的なアドバイス
  sections.push({
    _type: 'block',
    children: [{ _type: 'span', text: '💡 実践的なアドバイス' }],
    style: 'h2',
    markDefs: [],
  })
  
  sections.push({
    _type: 'block',
    children: [{
      _type: 'span',
      text: '実際のキャリア形成において重要なポイント：\n\n• 継続的な学習と自己啓発\n• 明確な目標設定と計画的な行動\n• ネットワーキングと人間関係の構築\n• 定期的な自己評価と計画の見直し\n• 新しいチャレンジへの積極的な取り組み'
    }],
    style: 'normal',
    markDefs: [],
  })
  
  // 成功事例
  sections.push({
    _type: 'block',
    children: [{ _type: 'span', text: '🌟 成功事例' }],
    style: 'h2',
    markDefs: [],
  })
  
  sections.push({
    _type: 'block',
    children: [{
      _type: 'span',
      text: '実際に看護助手としてキャリアアップを達成した方々の事例をご紹介します。具体的な取り組みや工夫したポイントを参考に、あなたのキャリア形成に活かしてください。'
    }],
    style: 'normal',
    markDefs: [],
  })
  
  // 次のステップ
  sections.push({
    _type: 'block',
    children: [{ _type: 'span', text: '🚀 次のステップ' }],
    style: 'h2',
    markDefs: [],
  })
  
  sections.push({
    _type: 'block',
    children: [{
      _type: 'span',
      text: 'この記事で学んだことを基に、具体的な行動を起こしましょう。小さな一歩でも継続することで、理想のキャリアに近づくことができます。定期的に目標を見直し、着実に前進していきましょう。'
    }],
    style: 'normal',
    markDefs: [],
  })
  
  return sections
}

// キャリア支援コンテンツ作成関数
async function createCareerSupportContent() {
  try {
    console.log('🎯 キャリア支援コンテンツの作成を開始...')
    
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
    
    for (const template of careerSupportTemplates) {
      const category = categoryMap[template.categorySlug]
      
      if (!category) {
        console.log(`⚠️  カテゴリが見つかりません: ${template.categorySlug}`)
        continue
      }
      
      try {
        const metaTitle = `${template.title} | 看護助手キャリア支援`
        const metaDescription = `看護助手の${template.careerStage}段階において、${template.focusKeyword}について具体的で実践的なアドバイスをお届けします。`
        
        const tags = [
          'キャリア支援',
          '看護助手',
          template.careerStage,
          template.careerSupportType,
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
          readingTime: template.interactiveContent ? 15 : 10,
          featured: template.careerStage === 'exploration',
          body: generateCareerSupportContent(template)
        })
        
        console.log(`✅ キャリア支援コンテンツ作成: ${template.title}`)
        createdCount++
        
        // API制限を避けるため待機
        await new Promise(resolve => setTimeout(resolve, 1500))
        
      } catch (error) {
        console.error(`❌ 作成エラー (${template.title}):`, error.message)
      }
    }
    
    console.log(`\n🎉 キャリア支援コンテンツ作成完了: ${createdCount}件`)
    
  } catch (error) {
    console.error('❌ キャリア支援コンテンツ作成エラー:', error)
  }
}

if (require.main === module) {
  createCareerSupportContent()
}

module.exports = { 
  createCareerSupportContent, 
  careerSupportTemplates,
  careerSupportTools
}