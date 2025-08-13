const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN || '',
})

// 追加記事のテンプレート（大量生成用）
const additionalArticleTemplates = [
  // 基礎知識系 - さらに詳細な記事
  {
    title: '看護助手の1日の流れ｜病院勤務のリアルなスケジュールを公開',
    slug: 'nursing-assistant-daily-schedule',
    categorySlug: 'basics',
    contentType: 'experience',
    focusKeyword: '看護助手 一日の流れ',
    relatedKeywords: ['看護助手 スケジュール', '病院 勤務時間', '看護助手 業務'],
  },
  {
    title: '看護助手に必要な医療用語100選｜現場でよく使われる略語も解説',
    slug: 'medical-terminology-for-nursing-assistants',
    categorySlug: 'basics',
    contentType: 'list',
    focusKeyword: '看護助手 医療用語',
    relatedKeywords: ['医療略語', '看護用語', '医療現場 専門用語'],
  },
  {
    title: '看護助手の制服・ユニフォーム選び｜おすすめブランドと着こなしのコツ',
    slug: 'nursing-assistant-uniforms-guide',
    categorySlug: 'basics',
    contentType: 'comparison',
    focusKeyword: '看護助手 制服',
    relatedKeywords: ['ナース服', 'スクラブ', '医療用ユニフォーム'],
  },
  
  // 転職・キャリア系の詳細記事
  {
    title: '看護助手の志望動機例文集｜履歴書・面接で使える文例20選',
    slug: 'nursing-assistant-motivation-examples',
    categorySlug: 'career',
    contentType: 'list',
    focusKeyword: '看護助手 志望動機',
    relatedKeywords: ['履歴書 志望動機', '面接 志望動機', '転職 志望動機'],
  },
  {
    title: '未経験から看護助手になるには？採用されやすい人の特徴と準備',
    slug: 'inexperienced-nursing-assistant-guide',
    categorySlug: 'career',
    contentType: 'howto',
    focusKeyword: '看護助手 未経験',
    relatedKeywords: ['未経験 医療', '看護助手 採用', '医療業界 転職'],
  },
  {
    title: '看護助手の面接でよく聞かれる質問30選｜回答例と対策法',
    slug: 'nursing-assistant-interview-questions',
    categorySlug: 'career',
    contentType: 'faq',
    focusKeyword: '看護助手 面接',
    relatedKeywords: ['面接 質問', '医療面接', '看護助手 採用面接'],
  },
  
  // 給与・待遇系の詳細記事
  {
    title: '看護助手の夜勤手当はいくら？夜勤専従との違いも解説',
    slug: 'nursing-assistant-night-shift-allowance',
    categorySlug: 'salary',
    contentType: 'comparison',
    focusKeyword: '看護助手 夜勤',
    relatedKeywords: ['夜勤手当', '夜勤専従', '看護助手 夜勤 時給'],
  },
  {
    title: '看護助手のボーナス事情｜支給額の相場と職場による違い',
    slug: 'nursing-assistant-bonus-guide',
    categorySlug: 'salary',
    contentType: 'comparison',
    focusKeyword: '看護助手 ボーナス',
    relatedKeywords: ['賞与', '看護助手 年収', '医療職 ボーナス'],
  },
  {
    title: '看護助手の有給取得率と休暇事情｜働きやすい職場の見分け方',
    slug: 'nursing-assistant-vacation-benefits',
    categorySlug: 'salary',
    contentType: 'howto',
    focusKeyword: '看護助手 有給',
    relatedKeywords: ['有給取得', '医療現場 休暇', '働きやすい職場'],
  },
  
  // 実務・ノウハウ系の詳細記事
  {
    title: '患者移送の安全な方法｜看護助手が知っておくべき基本技術',
    slug: 'patient-transfer-techniques',
    categorySlug: 'practice',
    contentType: 'howto',
    focusKeyword: '患者移送',
    relatedKeywords: ['患者搬送', 'ストレッチャー', '車椅子 介助'],
  },
  {
    title: '看護助手の記録・報告書の書き方｜正確で分かりやすい文書作成術',
    slug: 'nursing-assistant-documentation',
    categorySlug: 'practice',
    contentType: 'howto',
    focusKeyword: '看護助手 記録',
    relatedKeywords: ['看護記録', '報告書', '医療文書'],
  },
  {
    title: '医療機器の基本的な扱い方｜看護助手が触れる機器の安全な使用法',
    slug: 'medical-equipment-basics',
    categorySlug: 'practice',
    contentType: 'howto',
    focusKeyword: '医療機器 看護助手',
    relatedKeywords: ['医療機器 使い方', '病院設備', '医療器具'],
  },
  
  // 職場別の詳細記事
  {
    title: '病院とクリニックの看護助手｜仕事内容と働きやすさの違い',
    slug: 'hospital-vs-clinic-nursing-assistant',
    categorySlug: 'workplace',
    contentType: 'comparison',
    focusKeyword: '看護助手 病院 クリニック',
    relatedKeywords: ['病院 看護助手', 'クリニック 看護助手', '職場 比較'],
  },
  {
    title: '介護施設の看護助手｜病院との違いと必要なスキル',
    slug: 'nursing-home-nursing-assistant',
    categorySlug: 'workplace',
    contentType: 'howto',
    focusKeyword: '介護施設 看護助手',
    relatedKeywords: ['特養 看護助手', '老健 看護助手', '介護 看護助手'],
  },
  {
    title: '精神科病院の看護助手｜特殊な業務内容と求められる適性',
    slug: 'psychiatric-hospital-nursing-assistant',
    categorySlug: 'workplace',
    contentType: 'howto',
    focusKeyword: '精神科 看護助手',
    relatedKeywords: ['精神科病院', 'メンタルヘルス', '精神科 業務'],
  },
  
  // 悩み・相談系の詳細記事
  {
    title: '看護助手がきついと感じる理由と対処法｜現役スタッフの本音',
    slug: 'nursing-assistant-challenges-solutions',
    categorySlug: 'consultation',
    contentType: 'faq',
    focusKeyword: '看護助手 きつい',
    relatedKeywords: ['看護助手 大変', '医療現場 ストレス', '看護助手 悩み'],
  },
  {
    title: '看護助手を辞めたいと思った時の判断基準｜転職すべきサインとは',
    slug: 'when-to-quit-nursing-assistant',
    categorySlug: 'consultation',
    contentType: 'faq',
    focusKeyword: '看護助手 辞めたい',
    relatedKeywords: ['転職 タイミング', '職場 退職', '看護助手 転職'],
  },
  {
    title: '新人看護助手の不安解消法｜最初の3ヶ月を乗り切るコツ',
    slug: 'new-nursing-assistant-anxiety-relief',
    categorySlug: 'consultation',
    contentType: 'howto',
    focusKeyword: '新人 看護助手',
    relatedKeywords: ['看護助手 新人研修', '医療現場 不安', '新人 悩み'],
  },
  
  // 資格・スキルアップ系
  {
    title: '看護助手に有利な資格10選｜取得方法と活用法を詳しく解説',
    slug: 'useful-certifications-for-nursing-assistants',
    categorySlug: 'career',
    contentType: 'list',
    focusKeyword: '看護助手 資格',
    relatedKeywords: ['医療事務', 'ヘルパー2級', '介護職員初任者研修'],
  },
  {
    title: '看護助手のスキルアップ方法｜キャリアアップにつながる学習法',
    slug: 'nursing-assistant-skill-development',
    categorySlug: 'career',
    contentType: 'howto',
    focusKeyword: '看護助手 スキルアップ',
    relatedKeywords: ['看護助手 勉強', 'キャリアアップ', '看護助手 研修'],
  },
]

// 記事生成関数（改良版）
function generateEnhancedArticleBody(template) {
  const sections = []
  
  // 導入部
  sections.push({
    _type: 'block',
    children: [{
      _type: 'span',
      text: `看護助手として働く方、または看護助手を目指す方にとって、「${template.focusKeyword}」は重要な関心事の一つです。この記事では、実際の現場経験を基に、実践的で具体的な情報をお届けします。`
    }],
    style: 'normal',
    markDefs: [],
  })
  
  // この記事でわかること
  sections.push({
    _type: 'block',
    children: [{ _type: 'span', text: 'この記事でわかること' }],
    style: 'h2',
    markDefs: [],
  })
  
  sections.push({
    _type: 'block',
    children: [{
      _type: 'span',
      text: `✓ ${template.focusKeyword}の基本的な知識\n✓ 実践で役立つ具体的な方法\n✓ よくある質問と回答\n✓ 専門家からのアドバイス`
    }],
    style: 'normal',
    markDefs: [],
  })
  
  // コンテンツタイプ別の詳細内容
  sections.push(...generateDetailedContent(template))
  
  // よくある質問セクション
  sections.push({
    _type: 'block',
    children: [{ _type: 'span', text: 'よくある質問' }],
    style: 'h2',
    markDefs: [],
  })
  
  sections.push({
    _type: 'block',
    children: [{
      _type: 'span',
      text: `Q: ${template.focusKeyword}について、初心者が最初に知っておくべきことは？\nA: まずは基本的な知識をしっかりと身につけることが重要です。現場での実践と併せて、継続的な学習を心がけましょう。`
    }],
    style: 'normal',
    markDefs: [],
  })
  
  // まとめ
  sections.push({
    _type: 'block',
    children: [{ _type: 'span', text: 'まとめ' }],
    style: 'h2',
    markDefs: [],
  })
  
  sections.push({
    _type: 'block',
    children: [{
      _type: 'span',
      text: `${template.focusKeyword}について詳しく解説しました。看護助手として成長し続けるために、この記事の内容を実践に活かしていただければと思います。何かご質問がありましたら、お気軽にお問い合わせください。`
    }],
    style: 'normal',
    markDefs: [],
  })
  
  return sections
}

function generateDetailedContent(template) {
  const sections = []
  
  switch (template.contentType) {
    case 'howto':
      sections.push(
        {
          _type: 'block',
          children: [{ _type: 'span', text: `${template.focusKeyword}の基本知識` }],
          style: 'h2',
          markDefs: [],
        },
        {
          _type: 'block',
          children: [{ _type: 'span', text: '基本的な知識と理解しておくべきポイントについて詳しく説明します。現場での経験を基に、実践的な内容をお届けします。' }],
          style: 'normal',
          markDefs: [],
        },
        {
          _type: 'block',
          children: [{ _type: 'span', text: '実践的な方法とステップ' }],
          style: 'h2',
          markDefs: [],
        },
        {
          _type: 'block',
          children: [{ _type: 'span', text: 'ステップ1: 基礎の確認\n具体的な手順と注意点を説明します。\n\nステップ2: 実践への応用\n実際の現場での活用方法をご紹介します。\n\nステップ3: 継続的な改善\n より良い方法への改善点をお教えします。' }],
          style: 'normal',
          markDefs: [],
        }
      )
      break
      
    case 'comparison':
      sections.push(
        {
          _type: 'block',
          children: [{ _type: 'span', text: '比較のポイント' }],
          style: 'h2',
          markDefs: [],
        },
        {
          _type: 'block',
          children: [{ _type: 'span', text: '比較する際に重要な観点と、それぞれの特徴について詳しく解説します。' }],
          style: 'normal',
          markDefs: [],
        },
        {
          _type: 'block',
          children: [{ _type: 'span', text: '詳細比較表' }],
          style: 'h2',
          markDefs: [],
        },
        {
          _type: 'block',
          children: [{ _type: 'span', text: '項目別の詳細な比較結果を表形式でわかりやすくご紹介します。給与、勤務条件、業務内容など、重要な要素を網羅的に比較します。' }],
          style: 'normal',
          markDefs: [],
        }
      )
      break
      
    case 'list':
      sections.push(
        {
          _type: 'block',
          children: [{ _type: 'span', text: '重要なポイント一覧' }],
          style: 'h2',
          markDefs: [],
        },
        {
          _type: 'block',
          children: [{ _type: 'span', text: '1. 第一のポイント: 詳細な説明\n2. 第二のポイント: 実践的なアドバイス\n3. 第三のポイント: 注意事項\n4. 第四のポイント: 活用方法\n5. 第五のポイント: 継続のコツ' }],
          style: 'normal',
          markDefs: [],
        },
        {
          _type: 'block',
          children: [{ _type: 'span', text: '各ポイントの詳細解説' }],
          style: 'h2',
          markDefs: [],
        },
        {
          _type: 'block',
          children: [{ _type: 'span', text: 'それぞれのポイントについて、具体例を交えながら詳しく解説します。現場での実践に役立つ情報をお届けします。' }],
          style: 'normal',
          markDefs: [],
        }
      )
      break
      
    case 'faq':
      sections.push(
        {
          _type: 'block',
          children: [{ _type: 'span', text: '代表的な質問と回答' }],
          style: 'h2',
          markDefs: [],
        },
        {
          _type: 'block',
          children: [{ _type: 'span', text: 'Q1: よくある質問の例\nA1: 具体的で実践的な回答\n\nQ2: 二番目によくある質問\nA2: 詳細な解説を含む回答\n\nQ3: 三番目の質問\nA3: 専門的な観点からの回答' }],
          style: 'normal',
          markDefs: [],
        },
        {
          _type: 'block',
          children: [{ _type: 'span', text: '解決のためのアドバイス' }],
          style: 'h2',
          markDefs: [],
        },
        {
          _type: 'block',
          children: [{ _type: 'span', text: '問題解決のための具体的なアドバイスと、実践的な対処法をご紹介します。' }],
          style: 'normal',
          markDefs: [],
        }
      )
      break
      
    case 'experience':
      sections.push(
        {
          _type: 'block',
          children: [{ _type: 'span', text: '実際の体験談' }],
          style: 'h2',
          markDefs: [],
        },
        {
          _type: 'block',
          children: [{ _type: 'span', text: '現場で働く看護助手の方々の実体験を基に、リアルな情報をお届けします。' }],
          style: 'normal',
          markDefs: [],
        },
        {
          _type: 'block',
          children: [{ _type: 'span', text: '学んだこととアドバイス' }],
          style: 'h2',
          markDefs: [],
        },
        {
          _type: 'block',
          children: [{ _type: 'span', text: '経験から学んだことと、これから看護助手を目指す方へのアドバイスをご紹介します。' }],
          style: 'normal',
          markDefs: [],
        }
      )
      break
  }
  
  return sections
}

// メタデータ生成関数
function generateMetadata(template) {
  const metaTitle = template.metaTitle || `${template.title} | 看護助手サポート`
  const metaDescription = template.metaDescription || `${template.focusKeyword}について詳しく解説。看護助手として働く方に役立つ実践的な情報をお届けします。`
  
  return {
    metaTitle: metaTitle.length > 60 ? metaTitle.substring(0, 57) + '...' : metaTitle,
    metaDescription: metaDescription.length > 160 ? metaDescription.substring(0, 157) + '...' : metaDescription,
  }
}

// タグ生成関数
function generateTags(template) {
  const baseTags = ['看護助手', '医療現場']
  const keywordTags = template.relatedKeywords.slice(0, 3)
  const contentTypeTags = {
    'howto': ['ガイド', 'ハウツー'],
    'comparison': ['比較', '選び方'],
    'list': ['まとめ', 'リスト'],
    'faq': ['相談', 'FAQ'],
    'experience': ['体験談', '実例']
  }
  
  return [...baseTags, ...keywordTags, ...(contentTypeTags[template.contentType] || [])]
}

// バッチ作成関数
async function createAdditionalArticles(batchSize = 5) {
  try {
    console.log(`📝 追加記事のバッチ作成を開始... (バッチサイズ: ${batchSize})`)
    
    // 既存の著者とカテゴリを取得
    const author = await client.fetch('*[_type == "author"][0]')
    const categories = await client.fetch('*[_type == "category"]')
    
    if (!author) {
      throw new Error('著者が見つかりません。先にcreate-nursing-content.jsを実行してください。')
    }
    
    const categoryMap = {}
    categories.forEach(cat => {
      if (cat.slug && cat.slug.current) {
        categoryMap[cat.slug.current] = cat
      }
    })
    
    console.log(`📊 利用可能なカテゴリ: ${Object.keys(categoryMap).join(', ')}`)
    
    let createdCount = 0
    
    for (let i = 0; i < additionalArticleTemplates.length && createdCount < batchSize; i++) {
      const template = additionalArticleTemplates[i]
      const category = categoryMap[template.categorySlug]
      
      if (!category) {
        console.log(`⚠️  カテゴリが見つかりません: ${template.categorySlug}`)
        continue
      }
      
      try {
        const metadata = generateMetadata(template)
        const tags = generateTags(template)
        
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
          excerpt: metadata.metaDescription,
          metaTitle: metadata.metaTitle,
          metaDescription: metadata.metaDescription,
          focusKeyword: template.focusKeyword,
          relatedKeywords: template.relatedKeywords,
          contentType: template.contentType,
          targetAudience: 'beginner',
          difficulty: 'beginner',
          readingTime: Math.floor(Math.random() * 5) + 6, // 6-10分
          featured: false,
          body: generateEnhancedArticleBody(template)
        })
        
        console.log(`✅ 記事作成: ${template.title}`)
        createdCount++
        
        // API制限を避けるため少し待機
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (error) {
        console.error(`❌ 記事作成エラー (${template.title}):`, error.message)
      }
    }
    
    console.log(`\n🎉 バッチ処理完了: ${createdCount}件の記事を作成しました`)
    
    // 統計情報を表示
    const totalPosts = await client.fetch('count(*[_type == "post"])')
    console.log(`📊 現在の総記事数: ${totalPosts}`)
    
  } catch (error) {
    console.error('❌ バッチ処理エラー:', error)
  }
}

// 実行
if (require.main === module) {
  const batchSize = process.argv[2] ? parseInt(process.argv[2]) : 5
  createAdditionalArticles(batchSize)
}

module.exports = { createAdditionalArticles, additionalArticleTemplates }