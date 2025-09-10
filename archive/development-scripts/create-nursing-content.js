const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN || '',
})

// 看護助手関連カテゴリの定義
const categories = [
  {
    title: '基礎知識・入門',
    slug: 'basics',
    description: '看護助手の基本的な知識と入門情報',
    level: 1,
    icon: '📚',
    color: '#3B82F6',
    sortOrder: 1,
    metaTitle: '看護助手の基礎知識・入門ガイド',
    metaDescription: '看護助手として働くための基本的な知識、仕事内容、必要なスキルを分かりやすく解説します。',
    featured: true,
  },
  {
    title: 'キャリア・資格',
    slug: 'career',
    description: 'キャリア形成、資格取得、転職に関する情報',
    level: 1,
    icon: '🎯',
    color: '#10B981',
    sortOrder: 2,
    metaTitle: '看護助手のキャリア・資格情報',
    metaDescription: '看護助手のキャリアアップ、資格取得、転職活動に役立つ情報をお届けします。',
    featured: true,
  },
  {
    title: '給与・待遇',
    slug: 'salary',
    description: '給与、待遇、労働条件に関する情報',
    level: 1,
    icon: '💰',
    color: '#F59E0B',
    sortOrder: 3,
    metaTitle: '看護助手の給与・待遇情報',
    metaDescription: '看護助手の給与相場、手当、福利厚生など、待遇に関する詳しい情報をご紹介します。',
    featured: true,
  },
  {
    title: '実務・ノウハウ',
    slug: 'practice',
    description: '現場での実務や効率化のテクニック',
    level: 1,
    icon: '⚕️',
    color: '#EF4444',
    sortOrder: 4,
    metaTitle: '看護助手の実務ノウハウ',
    metaDescription: '看護助手の実務で役立つテクニック、効率化の方法、患者対応のコツをお教えします。',
    featured: true,
  },
  {
    title: '職場別情報',
    slug: 'workplace',
    description: '病院、クリニック、介護施設など職場別の情報',
    level: 1,
    icon: '🏥',
    color: '#8B5CF6',
    sortOrder: 5,
    metaTitle: '看護助手の職場別情報',
    metaDescription: '病院、クリニック、介護施設など、看護助手が働く様々な職場の特徴を比較解説します。',
    featured: false,
  },
  {
    title: '悩み・相談',
    slug: 'consultation',
    description: '職場での悩みや相談に関するアドバイス',
    level: 1,
    icon: '💭',
    color: '#EC4899',
    sortOrder: 6,
    metaTitle: '看護助手の悩み・相談',
    metaDescription: '看護助手が抱える悩みや相談に対するアドバイス、解決方法をご提案します。',
    featured: false,
  },
]

// サブカテゴリの定義
const subCategories = [
  // 基礎知識のサブカテゴリ
  { title: '仕事内容・役割', slug: 'job-description', parentSlug: 'basics', level: 2 },
  { title: '必要なスキル', slug: 'required-skills', parentSlug: 'basics', level: 2 },
  { title: '医療現場の基本', slug: 'medical-basics', parentSlug: 'basics', level: 2 },
  
  // キャリアのサブカテゴリ
  { title: '就職・転職活動', slug: 'job-hunting', parentSlug: 'career', level: 2 },
  { title: '資格取得', slug: 'certification', parentSlug: 'career', level: 2 },
  { title: '看護師への道', slug: 'nurse-path', parentSlug: 'career', level: 2 },
  
  // 実務のサブカテゴリ
  { title: '患者対応', slug: 'patient-care', parentSlug: 'practice', level: 2 },
  { title: '感染対策', slug: 'infection-control', parentSlug: 'practice', level: 2 },
  { title: '効率化テクニック', slug: 'efficiency', parentSlug: 'practice', level: 2 },
]

// 記事のテンプレート定義
const articleTemplates = [
  // 基礎知識系の記事
  {
    title: '【完全ガイド】看護助手とは？仕事内容から必要なスキルまで徹底解説',
    slug: 'nursing-assistant-complete-guide',
    categorySlug: 'basics',
    contentType: 'howto',
    targetAudience: 'beginner',
    difficulty: 'beginner',
    focusKeyword: '看護助手とは',
    relatedKeywords: ['看護助手 仕事内容', '看護補助者', '医療助手', '看護助手 役割'],
    metaTitle: '【完全ガイド】看護助手とは？仕事内容から必要なスキルまで徹底解説',
    metaDescription: '看護助手（看護補助者）の仕事内容、必要なスキル、向いている人の特徴を初心者向けに分かりやすく解説。医療現場での役割や責任について詳しくご紹介します。',
    readingTime: 8,
    featured: true,
    tags: ['看護助手', '仕事内容', '医療現場', '初心者向け'],
  },
  {
    title: '看護助手に向いている人の特徴5選｜性格や適性を徹底分析',
    slug: 'nursing-assistant-personality-traits',
    categorySlug: 'basics',
    contentType: 'list',
    targetAudience: 'beginner',
    difficulty: 'beginner',
    focusKeyword: '看護助手 向いている人',
    relatedKeywords: ['看護助手 適性', '看護助手 性格', '医療現場 向き不向き'],
    metaTitle: '看護助手に向いている人の特徴5選｜性格や適性を徹底分析',
    metaDescription: '看護助手に向いている人の性格や特徴を詳しく解説。自分が看護助手に適しているか診断したい方必見の内容です。',
    readingTime: 6,
    featured: false,
    tags: ['看護助手', '適性', '性格', '向き不向き'],
  },
  
  // キャリア系の記事
  {
    title: '看護助手の転職成功マニュアル｜求人の選び方から面接対策まで',
    slug: 'nursing-assistant-job-change-guide',
    categorySlug: 'career',
    contentType: 'howto',
    targetAudience: 'job-seeker',
    difficulty: 'intermediate',
    focusKeyword: '看護助手 転職',
    relatedKeywords: ['看護助手 求人', '看護助手 面接', '医療転職'],
    metaTitle: '看護助手の転職成功マニュアル｜求人の選び方から面接対策まで',
    metaDescription: '看護助手の転職を成功させるための完全ガイド。求人の選び方、履歴書の書き方、面接対策まで詳しく解説します。',
    readingTime: 12,
    featured: true,
    tags: ['転職', '求人', '面接', 'キャリア'],
  },
  {
    title: '看護助手から看護師になるには？最短ルートと体験談を紹介',
    slug: 'from-nursing-assistant-to-nurse',
    categorySlug: 'career',
    contentType: 'howto',
    targetAudience: 'nurse-aspirant',
    difficulty: 'intermediate',
    focusKeyword: '看護助手から看護師',
    relatedKeywords: ['准看護師', '正看護師', '看護学校', 'キャリアアップ'],
    metaTitle: '看護助手から看護師になるには？最短ルートと体験談を紹介',
    metaDescription: '看護助手から看護師へのキャリアアップ方法を詳しく解説。准看護師・正看護師への道のりと実際の体験談をご紹介します。',
    readingTime: 10,
    featured: true,
    tags: ['看護師', 'キャリアアップ', '准看護師', '看護学校'],
  },
  
  // 給与・待遇系の記事
  {
    title: '【2024年最新】看護助手の給料相場｜職場別・地域別に徹底比較',
    slug: 'nursing-assistant-salary-2024',
    categorySlug: 'salary',
    contentType: 'comparison',
    targetAudience: 'experienced',
    difficulty: 'beginner',
    focusKeyword: '看護助手 給料',
    relatedKeywords: ['看護助手 年収', '看護助手 時給', '看護助手 手当'],
    metaTitle: '【2024年最新】看護助手の給料相場｜職場別・地域別に徹底比較',
    metaDescription: '2024年最新の看護助手の給料相場を職場別・地域別に詳しく比較。手当やボーナスの実態も含めて徹底解説します。',
    readingTime: 9,
    featured: true,
    tags: ['給料', '年収', '時給', '手当', '2024年'],
  },
  
  // 実務系の記事
  {
    title: '看護助手の感染対策基本マニュアル｜現場で実践すべき5つのポイント',
    slug: 'infection-control-for-nursing-assistants',
    categorySlug: 'practice',
    contentType: 'howto',
    targetAudience: 'beginner',
    difficulty: 'intermediate',
    focusKeyword: '看護助手 感染対策',
    relatedKeywords: ['手洗い', '個人防護具', 'PPE', '標準予防策'],
    metaTitle: '看護助手の感染対策基本マニュアル｜現場で実践すべき5つのポイント',
    metaDescription: '看護助手が知っておくべき感染対策の基本を分かりやすく解説。手洗いからPPEの使用まで実践的な内容をお届けします。',
    readingTime: 7,
    featured: false,
    tags: ['感染対策', '手洗い', 'PPE', '標準予防策'],
  },
  
  // 悩み・相談系の記事
  {
    title: '看護助手の人間関係が辛い時の対処法｜職場のストレス解決策5選',
    slug: 'nursing-assistant-workplace-stress',
    categorySlug: 'consultation',
    contentType: 'faq',
    targetAudience: 'experienced',
    difficulty: 'beginner',
    focusKeyword: '看護助手 人間関係',
    relatedKeywords: ['看護助手 ストレス', '職場 悩み', '看護助手 辞めたい'],
    metaTitle: '看護助手の人間関係が辛い時の対処法｜職場のストレス解決策5選',
    metaDescription: '看護助手の職場での人間関係の悩みを解決するための具体的な対処法をご紹介。ストレス軽減のコツも詳しく解説します。',
    readingTime: 8,
    featured: false,
    tags: ['人間関係', 'ストレス', '職場の悩み', '対処法'],
  },
]

// 著者情報
const authorData = {
  name: '看護助手サポート編集部',
  slug: 'nursing-support-editorial',
  bio: [
    {
      _type: 'block',
      children: [
        {
          _type: 'span',
          text: '看護助手として働く方々を支援する専門編集チームです。現場経験豊富な看護助手や医療従事者、キャリアコンサルタントが執筆・監修を行い、実践的で信頼性の高い情報をお届けします。'
        }
      ],
      style: 'normal'
    }
  ]
}

// 記事本文のテンプレート生成関数
function generateArticleBody(template) {
  const sections = []
  
  // 導入部
  sections.push({
    _type: 'block',
    children: [{ _type: 'span', text: `この記事では、「${template.focusKeyword}」について詳しく解説します。現場経験豊富な専門家の知見を基に、実践的で役立つ情報をお届けします。` }],
    style: 'normal'
  })
  
  // 目次（見出しのみ）
  sections.push({
    _type: 'block',
    children: [{ _type: 'span', text: '目次' }],
    style: 'h2'
  })
  
  // コンテンツタイプに応じた構成
  switch (template.contentType) {
    case 'howto':
      sections.push(...generateHowtoContent(template))
      break
    case 'comparison':
      sections.push(...generateComparisonContent(template))
      break
    case 'list':
      sections.push(...generateListContent(template))
      break
    case 'faq':
      sections.push(...generateFaqContent(template))
      break
    default:
      sections.push(...generateDefaultContent(template))
  }
  
  // まとめ
  sections.push({
    _type: 'block',
    children: [{ _type: 'span', text: 'まとめ' }],
    style: 'h2'
  })
  
  sections.push({
    _type: 'block',
    children: [{ _type: 'span', text: `この記事では、${template.focusKeyword}について詳しく解説しました。看護助手として働く皆様のお役に立てれば幸いです。` }],
    style: 'normal'
  })
  
  return sections
}

function generateHowtoContent(template) {
  return [
    {
      _type: 'block',
      children: [{ _type: 'span', text: `${template.focusKeyword}の基本` }],
      style: 'h2'
    },
    {
      _type: 'block',
      children: [{ _type: 'span', text: 'ここでは基本的な内容について詳しく説明します。' }],
      style: 'normal'
    },
    {
      _type: 'block',
      children: [{ _type: 'span', text: '具体的なステップ' }],
      style: 'h2'
    },
    {
      _type: 'block',
      children: [{ _type: 'span', text: 'ステップ1: 基本を理解する\nステップ2: 実践に移す\nステップ3: 継続的に改善する' }],
      style: 'normal'
    },
    {
      _type: 'block',
      children: [{ _type: 'span', text: '注意点とコツ' }],
      style: 'h2'
    },
    {
      _type: 'block',
      children: [{ _type: 'span', text: '実践する際の注意点やコツについて詳しく解説します。' }],
      style: 'normal'
    }
  ]
}

function generateComparisonContent(template) {
  return [
    {
      _type: 'block',
      children: [{ _type: 'span', text: '比較のポイント' }],
      style: 'h2'
    },
    {
      _type: 'block',
      children: [{ _type: 'span', text: '比較する際に重要なポイントについて説明します。' }],
      style: 'normal'
    },
    {
      _type: 'block',
      children: [{ _type: 'span', text: '詳細比較' }],
      style: 'h2'
    },
    {
      _type: 'block',
      children: [{ _type: 'span', text: '項目別の詳細な比較結果をご紹介します。' }],
      style: 'normal'
    },
    {
      _type: 'block',
      children: [{ _type: 'span', text: 'おすすめの選び方' }],
      style: 'h2'
    },
    {
      _type: 'block',
      children: [{ _type: 'span', text: 'あなたに最適な選択肢の見つけ方をお教えします。' }],
      style: 'normal'
    }
  ]
}

function generateListContent(template) {
  return [
    {
      _type: 'block',
      children: [{ _type: 'span', text: '重要な特徴一覧' }],
      style: 'h2'
    },
    {
      _type: 'block',
      children: [{ _type: 'span', text: '1. 第一の特徴\n2. 第二の特徴\n3. 第三の特徴\n4. 第四の特徴\n5. 第五の特徴' }],
      style: 'normal'
    },
    {
      _type: 'block',
      children: [{ _type: 'span', text: '各特徴の詳細解説' }],
      style: 'h2'
    },
    {
      _type: 'block',
      children: [{ _type: 'span', text: 'それぞれの特徴について詳しく解説していきます。' }],
      style: 'normal'
    }
  ]
}

function generateFaqContent(template) {
  return [
    {
      _type: 'block',
      children: [{ _type: 'span', text: 'よくある質問' }],
      style: 'h2'
    },
    {
      _type: 'block',
      children: [{ _type: 'span', text: 'Q: よくある質問の例\nA: 回答の例' }],
      style: 'normal'
    },
    {
      _type: 'block',
      children: [{ _type: 'span', text: '解決策とアドバイス' }],
      style: 'h2'
    },
    {
      _type: 'block',
      children: [{ _type: 'span', text: '具体的な解決策とアドバイスをご提供します。' }],
      style: 'normal'
    }
  ]
}

function generateDefaultContent(template) {
  return [
    {
      _type: 'block',
      children: [{ _type: 'span', text: '詳細情報' }],
      style: 'h2'
    },
    {
      _type: 'block',
      children: [{ _type: 'span', text: '詳細な情報について解説します。' }],
      style: 'normal'
    }
  ]
}

async function createContent() {
  try {
    console.log('🏥 看護助手向けサイトのコンテンツ作成を開始...')
    
    // 1. 著者を作成
    console.log('👤 著者を作成中...')
    const author = await client.create({
      _type: 'author',
      name: authorData.name,
      slug: {
        _type: 'slug',
        current: authorData.slug
      },
      bio: authorData.bio
    })
    console.log(`✅ 著者作成完了: ${author._id}`)
    
    // 2. メインカテゴリを作成
    console.log('📂 メインカテゴリを作成中...')
    const createdCategories = {}
    
    for (const categoryData of categories) {
      const category = await client.create({
        _type: 'category',
        title: categoryData.title,
        slug: {
          _type: 'slug',
          current: categoryData.slug
        },
        description: categoryData.description,
        level: categoryData.level,
        icon: categoryData.icon,
        color: categoryData.color,
        metaTitle: categoryData.metaTitle,
        metaDescription: categoryData.metaDescription,
        featured: categoryData.featured,
        sortOrder: categoryData.sortOrder,
        isActive: true
      })
      createdCategories[categoryData.slug] = category
      console.log(`✅ カテゴリ作成: ${categoryData.title}`)
    }
    
    // 3. サブカテゴリを作成
    console.log('📁 サブカテゴリを作成中...')
    for (const subCatData of subCategories) {
      const parentCategory = createdCategories[subCatData.parentSlug]
      if (parentCategory) {
        const subCategory = await client.create({
          _type: 'category',
          title: subCatData.title,
          slug: {
            _type: 'slug',
            current: subCatData.slug
          },
          description: `${subCatData.title}に関する詳細情報`,
          parentCategory: {
            _type: 'reference',
            _ref: parentCategory._id
          },
          level: subCatData.level,
          isActive: true,
          sortOrder: 0
        })
        console.log(`✅ サブカテゴリ作成: ${subCatData.title}`)
      }
    }
    
    // 4. 記事を作成
    console.log('📝 記事を作成中...')
    for (const template of articleTemplates) {
      const category = createdCategories[template.categorySlug]
      if (category) {
        const article = await client.create({
          const article = await client.create({
          const article = await client.create({
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
          tags: template.tags,
          publishedAt: new Date().toISOString(),
          excerpt: template.metaDescription,
          metaTitle: template.metaTitle,
          metaDescription: template.metaDescription,
          focusKeyword: template.focusKeyword,
          relatedKeywords: template.relatedKeywords,
          contentType: template.contentType,
          targetAudience: template.targetAudience,
          difficulty: template.difficulty,
          readingTime: template.readingTime,
          featured: template.featured,
          body: generateArticleBody(template)
        })
        console.log(`✅ 記事作成: ${template.title}`))
        console.log(`✅ 記事作成: ${template.title}`)
        console.log(`✅ 記事作成: ${template.title}`))
        console.log(`✅ 記事作成: ${template.title}`)
      }
    }
    
    console.log('\n🎉 看護助手向けサイトのコンテンツ作成が完了しました！')
    
    // 作成されたコンテンツの確認
    const allPosts = await client.fetch('*[_type == "post"]')
    const allCategories = await client.fetch('*[_type == "category"]')
    console.log(`\n📊 作成結果:`)
    console.log(`- カテゴリ数: ${allCategories.length}`)
    console.log(`- 記事数: ${allPosts.length}`)
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
  }
}

// 実行
if (require.main === module) {
  createContent()
}

module.exports = { createContent, categories, articleTemplates }