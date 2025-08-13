const { createClient } = require('@sanity/client')

// 各コンテンツ作成モジュールをインポート
const { createContent } = require('./create-nursing-content.js')
const { createAdditionalArticles } = require('./generate-additional-articles.js')
const { createEducationalContent } = require('./educational-content-templates.js')
const { createCareerSupportContent } = require('./career-support-content.js')
const { createIndustryNews } = require('./industry-news-system.js')

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN || '',
})

// 統合コンテンツ作成システム
class NursingAssistantContentManager {
  constructor() {
    this.client = client
    this.batchSize = 5 // エラー防止のためのバッチサイズ
    this.delayBetweenBatches = 3000 // バッチ間の待機時間（ms）
  }

  // 安全にバッチ処理を実行
  async executeBatch(batchFunction, batchName, options = {}) {
    try {
      console.log(`\n🚀 ${batchName}を開始...`)
      const startTime = Date.now()
      
      await batchFunction(options)
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2)
      console.log(`✅ ${batchName}完了 (${duration}秒)`)
      
      // バッチ間の待機
      if (this.delayBetweenBatches > 0) {
        console.log(`⏳ ${this.delayBetweenBatches / 1000}秒待機中...`)
        await new Promise(resolve => setTimeout(resolve, this.delayBetweenBatches))
      }
      
      return true
    } catch (error) {
      console.error(`❌ ${batchName}でエラー:`, error.message)
      return false
    }
  }

  // 現在のコンテンツ状況を確認
  async checkCurrentStatus() {
    try {
      console.log('📊 現在のコンテンツ状況を確認中...')
      
      const [authors, categories, posts] = await Promise.all([
        this.client.fetch('count(*[_type == "author"])'),
        this.client.fetch('count(*[_type == "category"])'),
        this.client.fetch('count(*[_type == "post"])')
      ])
      
      const contentTypes = await this.client.fetch(`
        *[_type == "post"] {
          contentType
        } | {
          "contentType": contentType,
          "count": count(*)
        }
      `)
      
      console.log('\n📈 現在のコンテンツ状況:')
      console.log(`- 著者数: ${authors}`)
      console.log(`- カテゴリ数: ${categories}`)
      console.log(`- 記事数: ${posts}`)
      
      if (contentTypes.length > 0) {
        console.log('\n📋 記事タイプ別内訳:')
        contentTypes.forEach(type => {
          if (type.contentType) {
            console.log(`- ${type.contentType}: ${type.count}件`)
          }
        })
      }
      
      return { authors, categories, posts }
    } catch (error) {
      console.error('❌ 状況確認エラー:', error)
      return null
    }
  }

  // すべてのコンテンツを作成
  async createAllContent() {
    try {
      console.log('🏥 看護助手向けサイト - 全コンテンツ作成開始')
      console.log('=' .repeat(60))
      
      // 初期状況確認
      const initialStatus = await this.checkCurrentStatus()
      
      // 1. 基本コンテンツの作成（カテゴリ、著者、基本記事）
      if (initialStatus && initialStatus.posts === 0) {
        const success1 = await this.executeBatch(
          createContent,
          '基本コンテンツ作成（カテゴリ・著者・基本記事）'
        )
        if (!success1) {
          throw new Error('基本コンテンツの作成に失敗しました')
        }
      } else {
        console.log('📝 基本コンテンツは既に存在します - スキップ')
      }

      // 2. 追加記事の作成
      const success2 = await this.executeBatch(
        createAdditionalArticles,
        '追加記事作成',
        this.batchSize
      )

      // 3. 教育的コンテンツの作成
      const success3 = await this.executeBatch(
        createEducationalContent,
        '教育的コンテンツ作成'
      )

      // 4. キャリア支援コンテンツの作成
      const success4 = await this.executeBatch(
        createCareerSupportContent,
        'キャリア支援コンテンツ作成'
      )

      // 5. 業界ニュースの作成
      const success5 = await this.executeBatch(
        createIndustryNews,
        '業界ニュース作成'
      )

      // 最終結果の確認
      console.log('\n' + '=' .repeat(60))
      console.log('📊 最終コンテンツ作成結果')
      console.log('=' .repeat(60))
      
      const finalStatus = await this.checkCurrentStatus()
      
      if (finalStatus && initialStatus) {
        const createdPosts = finalStatus.posts - initialStatus.posts
        console.log(`\n🎉 新規作成記事数: ${createdPosts}件`)
      }

      // 成功率の計算
      const successCount = [success2, success3, success4, success5].filter(Boolean).length
      const totalBatches = 4
      const successRate = ((successCount / totalBatches) * 100).toFixed(1)
      
      console.log(`\n📈 作成成功率: ${successRate}% (${successCount}/${totalBatches}バッチ)`)
      
      if (successRate >= 75) {
        console.log('\n🎊 コンテンツ作成が正常に完了しました！')
      } else {
        console.log('\n⚠️  一部のバッチで問題が発生しました。ログを確認してください。')
      }

      return finalStatus

    } catch (error) {
      console.error('\n💥 全体プロセスでエラーが発生しました:', error)
      throw error
    }
  }

  // 段階的なコンテンツ作成（エラー回避用）
  async createContentGradually() {
    console.log('🐌 段階的コンテンツ作成モード（エラー回避優先）')
    
    const batches = [
      { name: '基本コンテンツ', func: createContent, size: 1 },
      { name: '追加記事（第1弾）', func: createAdditionalArticles, size: 3 },
      { name: '教育コンテンツ', func: createEducationalContent, size: 1 },
      { name: '追加記事（第2弾）', func: createAdditionalArticles, size: 3 },
      { name: 'キャリア支援', func: createCareerSupportContent, size: 1 },
      { name: '業界ニュース', func: createIndustryNews, size: 1 },
      { name: '追加記事（第3弾）', func: createAdditionalArticles, size: 3 }
    ]

    let totalCreated = 0
    let successCount = 0

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]
      
      console.log(`\n📦 バッチ ${i + 1}/${batches.length}: ${batch.name}`)
      
      try {
        const beforeCount = await this.client.fetch('count(*[_type == "post"])')
        
        await batch.func(batch.size)
        
        const afterCount = await this.client.fetch('count(*[_type == "post"])')
        const created = afterCount - beforeCount
        
        console.log(`✅ ${batch.name}: ${created}件作成`)
        totalCreated += created
        successCount++
        
        // より長い待機時間
        await new Promise(resolve => setTimeout(resolve, 5000))
        
      } catch (error) {
        console.error(`❌ ${batch.name}でエラー:`, error.message)
        console.log('🔄 次のバッチに進みます...')
        
        // エラー時はより長く待機
        await new Promise(resolve => setTimeout(resolve, 10000))
      }
    }

    console.log(`\n📊 段階的作成完了: 総記事数 ${totalCreated}件 (成功率: ${((successCount / batches.length) * 100).toFixed(1)}%)`)
    
    return totalCreated
  }

  // SEO分析レポート生成
  async generateSEOReport() {
    try {
      console.log('\n📊 SEO分析レポート生成中...')
      
      const seoData = await this.client.fetch(`
        *[_type == "post"] {
          title,
          metaTitle,
          metaDescription,
          focusKeyword,
          relatedKeywords,
          tags,
          readingTime,
          difficulty,
          targetAudience,
          contentType
        }
      `)

      const report = {
        totalArticles: seoData.length,
        avgReadingTime: (seoData.reduce((sum, post) => sum + (post.readingTime || 0), 0) / seoData.length).toFixed(1),
        keywordCoverage: seoData.filter(post => post.focusKeyword).length,
        metaCompleteness: seoData.filter(post => post.metaTitle && post.metaDescription).length,
        contentTypeDistribution: {},
        difficultyDistribution: {},
        audienceDistribution: {}
      }

      // 分布の集計
      seoData.forEach(post => {
        if (post.contentType) {
          report.contentTypeDistribution[post.contentType] = 
            (report.contentTypeDistribution[post.contentType] || 0) + 1
        }
        if (post.difficulty) {
          report.difficultyDistribution[post.difficulty] = 
            (report.difficultyDistribution[post.difficulty] || 0) + 1
        }
        if (post.targetAudience) {
          report.audienceDistribution[post.targetAudience] = 
            (report.audienceDistribution[post.targetAudience] || 0) + 1
        }
      })

      console.log('\n📈 SEO分析結果:')
      console.log(`- 総記事数: ${report.totalArticles}`)
      console.log(`- 平均読了時間: ${report.avgReadingTime}分`)
      console.log(`- キーワード設定率: ${((report.keywordCoverage / report.totalArticles) * 100).toFixed(1)}%`)
      console.log(`- メタデータ完成率: ${((report.metaCompleteness / report.totalArticles) * 100).toFixed(1)}%`)
      
      console.log('\n📊 コンテンツタイプ分布:')
      Object.entries(report.contentTypeDistribution).forEach(([type, count]) => {
        console.log(`- ${type}: ${count}件`)
      })

      return report

    } catch (error) {
      console.error('❌ SEOレポート生成エラー:', error)
      return null
    }
  }
}

// メイン実行関数
async function main() {
  const manager = new NursingAssistantContentManager()
  
  try {
    // 環境変数の確認
    if (!process.env.SANITY_API_TOKEN) {
      throw new Error('SANITY_API_TOKENが設定されていません')
    }

    // 実行モードの選択
    const mode = process.argv[2] || 'normal'
    
    switch (mode) {
      case 'gradual':
        await manager.createContentGradually()
        break
      case 'status':
        await manager.checkCurrentStatus()
        break
      case 'seo':
        await manager.generateSEOReport()
        break
      default:
        await manager.createAllContent()
    }

    // SEOレポートも生成
    if (mode !== 'seo') {
      await manager.generateSEOReport()
    }

  } catch (error) {
    console.error('\n💥 実行エラー:', error.message)
    process.exit(1)
  }
}

// 実行時のヘルプ
if (process.argv.includes('--help')) {
  console.log(`
🏥 看護助手向けサイト - コンテンツ作成システム

使用方法:
  node create-all-content.js [mode]

モード:
  normal   - 通常の一括作成（デフォルト）
  gradual  - 段階的作成（エラー回避優先）
  status   - 現在の状況確認のみ
  seo      - SEO分析レポートのみ

環境変数:
  SANITY_API_TOKEN - SanityのAPIトークン（必須）

例:
  SANITY_API_TOKEN="your_token" node create-all-content.js
  SANITY_API_TOKEN="your_token" node create-all-content.js gradual
  `)
  process.exit(0)
}

// 実行
if (require.main === module) {
  main()
}

module.exports = { NursingAssistantContentManager, main }