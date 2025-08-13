const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN || '',
})

// 業界ニュース・最新情報のテンプレート
const industryNewsTemplates = [
  // 制度・法改正関連
  {
    title: '【2024年診療報酬改定】看護助手の業務範囲拡大が与える影響',
    slug: 'nursing-assistant-scope-expansion-2024',
    categorySlug: 'career',
    contentType: 'news',
    newsCategory: 'policy-change',
    urgency: 'high',
    targetAudience: 'experienced',
    difficulty: 'intermediate',
    focusKeyword: '看護助手 診療報酬改定',
    relatedKeywords: ['医療制度改正', '業務範囲拡大', '診療報酬'],
    newsSource: '厚生労働省',
    publishDate: '2024年4月',
    effectiveDate: '2024年6月1日',
    impactLevel: 'significant',
    actionRequired: true,
    affectedAreas: ['業務内容', '給与体系', '研修要件'],
  },
  {
    title: '看護助手の労働基準法改正対応｜2024年新労働時間規制の詳細',
    slug: 'nursing-assistant-labor-law-changes-2024',
    categorySlug: 'salary',
    contentType: 'news',
    newsCategory: 'labor-law',
    urgency: 'high',
    targetAudience: 'manager',
    difficulty: 'advanced',
    focusKeyword: '看護助手 労働基準法',
    relatedKeywords: ['労働時間規制', '働き方改革', '残業代'],
    newsSource: '厚生労働省',
    publishDate: '2024年3月',
    effectiveDate: '2024年4月1日',
    impactLevel: 'major',
    actionRequired: true,
    affectedAreas: ['勤務時間', '休暇制度', '残業管理'],
  },
  
  // 技術・設備導入関連
  {
    title: 'AI技術導入が看護助手業務に与える変化｜最新医療技術トレンド',
    slug: 'ai-technology-impact-nursing-assistants',
    categorySlug: 'practice',
    contentType: 'news',
    newsCategory: 'technology',
    urgency: 'medium',
    targetAudience: 'experienced',
    difficulty: 'intermediate',
    focusKeyword: 'AI 看護助手',
    relatedKeywords: ['医療AI', 'DX', 'デジタル化'],
    newsSource: '日本医療機器協会',
    publishDate: '2024年5月',
    effectiveDate: '2024年下半期',
    impactLevel: 'moderate',
    actionRequired: false,
    affectedAreas: ['業務効率化', 'スキル要件', '研修内容'],
  },
  {
    title: '電子カルテシステム統一化｜看護助手の記録業務変更点',
    slug: 'electronic-medical-records-standardization',
    categorySlug: 'practice',
    contentType: 'news',
    newsCategory: 'system-change',
    urgency: 'medium',
    targetAudience: 'experienced',
    difficulty: 'intermediate',
    focusKeyword: '電子カルテ 看護助手',
    relatedKeywords: ['医療記録', 'システム変更', 'IT化'],
    newsSource: '日本医療情報学会',
    publishDate: '2024年4月',
    effectiveDate: '2024年秋',
    impactLevel: 'moderate',
    actionRequired: true,
    affectedAreas: ['記録業務', 'IT操作', '研修必要'],
  },
  
  // 求人市場・給与動向
  {
    title: '【最新】看護助手求人市場分析｜2024年上半期の動向と今後の予測',
    slug: 'nursing-assistant-job-market-analysis-2024h1',
    categorySlug: 'career',
    contentType: 'news',
    newsCategory: 'market-trend',
    urgency: 'medium',
    targetAudience: 'job-seeker',
    difficulty: 'beginner',
    focusKeyword: '看護助手 求人市場',
    relatedKeywords: ['転職市場', '求人動向', '採用トレンド'],
    newsSource: '厚生労働省職業安定局',
    publishDate: '2024年7月',
    effectiveDate: '2024年現在',
    impactLevel: 'moderate',
    actionRequired: false,
    affectedAreas: ['転職活動', '給与交渉', 'スキル要求'],
  },
  {
    title: '全国看護助手給与実態調査2024｜地域別・職場別の最新データ',
    slug: 'nursing-assistant-salary-survey-2024',
    categorySlug: 'salary',
    contentType: 'news',
    newsCategory: 'survey-result',
    urgency: 'low',
    targetAudience: 'experienced',
    difficulty: 'beginner',
    focusKeyword: '看護助手 給与実態',
    relatedKeywords: ['給与調査', '待遇比較', '給与相場'],
    newsSource: '日本看護協会',
    publishDate: '2024年6月',
    effectiveDate: '2024年現在',
    impactLevel: 'minor',
    actionRequired: false,
    affectedAreas: ['給与交渉', '転職判断', 'キャリア設計'],
  },
  
  // 研修・教育制度
  {
    title: '看護助手標準研修プログラム改訂｜新カリキュラムの詳細解説',
    slug: 'nursing-assistant-training-program-revision-2024',
    categorySlug: 'basics',
    contentType: 'news',
    newsCategory: 'education-system',
    urgency: 'medium',
    targetAudience: 'beginner',
    difficulty: 'beginner',
    focusKeyword: '看護助手 研修プログラム',
    relatedKeywords: ['研修制度', '教育カリキュラム', 'スキル標準化'],
    newsSource: '日本看護協会',
    publishDate: '2024年5月',
    effectiveDate: '2024年10月1日',
    impactLevel: 'moderate',
    actionRequired: true,
    affectedAreas: ['研修内容', '資格要件', 'スキル評価'],
  },
  
  // 感染対策・安全管理
  {
    title: '最新感染対策ガイドライン2024｜看護助手が知るべき変更点',
    slug: 'infection-control-guidelines-update-2024',
    categorySlug: 'practice',
    contentType: 'news',
    newsCategory: 'safety-guideline',
    urgency: 'high',
    targetAudience: 'experienced',
    difficulty: 'intermediate',
    focusKeyword: '感染対策 ガイドライン',
    relatedKeywords: ['標準予防策', 'PPE', '安全管理'],
    newsSource: '日本感染症学会',
    publishDate: '2024年4月',
    effectiveDate: '2024年5月1日',
    impactLevel: 'significant',
    actionRequired: true,
    affectedAreas: ['感染対策', 'PPE使用', '業務手順'],
  },
  
  // 働き方改革・職場環境
  {
    title: '医療現場における働き方改革推進｜看護助手の勤務環境改善事例',
    slug: 'work-style-reform-nursing-assistant-2024',
    categorySlug: 'consultation',
    contentType: 'news',
    newsCategory: 'workplace-improvement',
    urgency: 'medium',
    targetAudience: 'experienced',
    difficulty: 'beginner',
    focusKeyword: '看護助手 働き方改革',
    relatedKeywords: ['勤務環境改善', 'ワークライフバランス', '職場改革'],
    newsSource: '厚生労働省',
    publishDate: '2024年6月',
    effectiveDate: '2024年現在',
    impactLevel: 'moderate',
    actionRequired: false,
    affectedAreas: ['勤務体制', '職場環境', 'ストレス軽減'],
  }
]

// ニュース分析フレームワーク
const newsAnalysisFramework = {
  impactAnalysis: {
    immediate: '即座に影響があるもの',
    shortTerm: '1-3ヶ月以内に影響があるもの',
    longTerm: '6ヶ月以上先に影響があるもの'
  },
  actionPriority: {
    urgent: '緊急対応が必要',
    important: '重要だが計画的対応可能',
    monitor: '継続的な情報収集が必要'
  },
  targetGroup: {
    newbie: '新人看護助手',
    experienced: '経験者看護助手',
    manager: '管理者・採用担当',
    jobSeeker: '転職検討者'
  }
}

// ニュース記事の本文生成関数
function generateNewsContent(template) {
  const sections = []
  
  // ニュース概要
  sections.push({
    _type: 'block',
    children: [{ _type: 'span', text: '📰 ニュース概要' }],
    style: 'h2',
    markDefs: [],
  })
  
  sections.push({
    _type: 'block',
    children: [{
      _type: 'span',
      text: `【発表元】${template.newsSource}\n【発表日】${template.publishDate}\n【施行日】${template.effectiveDate}\n【影響度】${template.impactLevel}\n【対応要否】${template.actionRequired ? '要対応' : '情報確認のみ'}`
    }],
    style: 'normal',
    markDefs: [],
  })
  
  // 看護助手への影響
  sections.push({
    _type: 'block',
    children: [{ _type: 'span', text: '🎯 看護助手への影響' }],
    style: 'h2',
    markDefs: [],
  })
  
  const affectedAreasText = template.affectedAreas
    .map(area => `• ${area}`)
    .join('\n')
  
  sections.push({
    _type: 'block',
    children: [{
      _type: 'span',
      text: `この変更により、看護助手の皆様に以下の影響が予想されます：\n\n${affectedAreasText}\n\n詳細な内容と対応方法について、以下で詳しく解説します。`
    }],
    style: 'normal',
    markDefs: [],
  })
  
  // 詳細解説
  sections.push({
    _type: 'block',
    children: [{ _type: 'span', text: '📋 詳細解説' }],
    style: 'h2',
    markDefs: [],
  })
  
  sections.push({
    _type: 'block',
    children: [{
      _type: 'span',
      text: `${template.focusKeyword}に関する今回の変更について、看護助手として知っておくべき重要なポイントを詳しく説明します。現場での実践に直結する内容を中心に解説します。`
    }],
    style: 'normal',
    markDefs: [],
  })
  
  // 対応が必要な場合の具体的アクション
  if (template.actionRequired) {
    sections.push({
      _type: 'block',
      children: [{ _type: 'span', text: '⚡ 必要な対応' }],
      style: 'h2',
      markDefs: [],
    })
    
    sections.push({
      _type: 'block',
      children: [{
        _type: 'span',
        text: 'この変更に対応するため、以下のアクションを推奨します：\n\n【即座に行うべきこと】\n• 最新情報の確認\n• 職場での共有と相談\n• 必要に応じた研修参加の検討\n\n【計画的に進めるべきこと】\n• スキルアップの計画立案\n• 関連資料の収集と学習\n• 同僚との情報交換'
      }],
      style: 'normal',
      markDefs: [],
    })
  }
  
  // 今後の動向予測
  sections.push({
    _type: 'block',
    children: [{ _type: 'span', text: '🔮 今後の動向予測' }],
    style: 'h2',
    markDefs: [],
  })
  
  sections.push({
    _type: 'block',
    children: [{
      _type: 'span',
      text: 'この変更を踏まえた今後の医療現場の動向と、看護助手として準備しておくべきことについて予測します。継続的な情報収集と準備が重要です。'
    }],
    style: 'normal',
    markDefs: [],
  })
  
  // 参考情報・関連リンク
  sections.push({
    _type: 'block',
    children: [{ _type: 'span', text: '🔗 参考情報' }],
    style: 'h2',
    markDefs: [],
  })
  
  sections.push({
    _type: 'block',
    children: [{
      _type: 'span',
      text: `より詳しい情報については、以下の公式資料をご確認ください：\n\n• ${template.newsSource}の公式発表\n• 関連ガイドライン文書\n• 職場での説明資料\n\n最新情報は定期的に更新されるため、継続的な確認をお勧めします。`
    }],
    style: 'normal',
    markDefs: [],
  })
  
  return sections
}

// 自動ニュース収集・分析システム（概念設計）
const newsMonitoringSystem = {
  sources: [
    '厚生労働省',
    '日本看護協会',
    '日本医師会',
    '日本病院会',
    '各都道府県医師会',
    '医療関連学会'
  ],
  keywords: [
    '看護助手',
    '看護補助者',
    '診療報酬改定',
    '医療法改正',
    '労働基準法',
    '感染対策',
    '医療安全',
    '働き方改革'
  ],
  analysisFlow: [
    'ニュース収集',
    '関連性判定',
    '影響度分析',
    '対象者特定',
    '緊急度評価',
    '記事生成',
    '配信準備'
  ]
}

// 業界ニュースコンテンツ作成関数
async function createIndustryNews() {
  try {
    console.log('📰 業界ニュースコンテンツの作成を開始...')
    
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
    
    for (const template of industryNewsTemplates) {
      const category = categoryMap[template.categorySlug]
      
      if (!category) {
        console.log(`⚠️  カテゴリが見つかりません: ${template.categorySlug}`)
        continue
      }
      
      try {
        const metaTitle = `${template.title} | 看護助手業界ニュース`
        const metaDescription = `${template.newsCategory}に関する最新情報。看護助手への影響と必要な対応について詳しく解説します。`
        
        const tags = [
          '業界ニュース',
          '看護助手',
          template.newsCategory,
          template.urgency,
          ...template.relatedKeywords.slice(0, 2)
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
          readingTime: 8,
          featured: template.urgency === 'high',
          body: generateNewsContent(template)
        })
        
        console.log(`✅ 業界ニュース作成: ${template.title}`)
        createdCount++
        
        // API制限を避けるため待機
        await new Promise(resolve => setTimeout(resolve, 1500))
        
      } catch (error) {
        console.error(`❌ 作成エラー (${template.title}):`, error.message)
      }
    }
    
    console.log(`\n🎉 業界ニュースコンテンツ作成完了: ${createdCount}件`)
    
  } catch (error) {
    console.error('❌ 業界ニュース作成エラー:', error)
  }
}

// ニュース更新・管理システム
async function updateNewsStatus() {
  try {
    console.log('📊 ニュース記事の更新状況確認...')
    
    const newsArticles = await client.fetch(`
      *[_type == "post" && contentType == "news"] {
        _id,
        title,
        publishedAt,
        tags
      }
    `)
    
    console.log(`現在のニュース記事数: ${newsArticles.length}`)
    
    // 古いニュースの自動アーカイブ（6ヶ月以上前）
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    
    const oldNews = newsArticles.filter(article => 
      new Date(article.publishedAt) < sixMonthsAgo
    )
    
    if (oldNews.length > 0) {
      console.log(`📁 ${oldNews.length}件の記事をアーカイブ対象として特定`)
      // 実際のアーカイブ処理はここで実装可能
    }
    
  } catch (error) {
    console.error('❌ ニュース更新確認エラー:', error)
  }
}

if (require.main === module) {
  createIndustryNews()
}

module.exports = { 
  createIndustryNews, 
  industryNewsTemplates,
  newsAnalysisFramework,
  newsMonitoringSystem,
  updateNewsStatus
}