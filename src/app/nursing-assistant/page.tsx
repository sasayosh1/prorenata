import { getAllPosts, type Post, formatPostDate } from '@/lib/sanity'
import Link from 'next/link'

// SEO metadata
export const metadata = {
  title: '看護助手向け情報サイト | ProReNata - 現場経験者が教える実践的ガイド',
  description: '看護助手として働く方、目指す方のための情報サイト。転職、資格、給与、現場ノウハウなど実践的な情報を現場経験者が詳しく解説します。',
  keywords: '看護助手,看護補助者,転職,退職,資格,給料,医療現場,ノウハウ,人間関係,感染対策',
  openGraph: {
    title: '看護助手向け情報サイト | ProReNata',
    description: '看護助手として働く方、目指す方のための専門情報サイト',
    type: 'website',
  }
}

// 強制的な動的レンダリング
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function NursingAssistantPage() {
  let posts: Post[] = []
  let nursingPosts: Post[] = []
  
  try {
    posts = await getAllPosts()
    // 看護助手関連の記事をフィルタリング
    nursingPosts = posts.filter(post => 
      post.title?.includes('看護助手') || 
      post.excerpt?.includes('看護助手') ||
      post.focusKeyword?.includes('看護助手') ||
      post.tags?.some(tag => tag.includes('看護助手'))
    )
  } catch (error) {
    console.error('記事取得エラー:', error)
  }

  const categories = [
    {
      title: '転職',
      icon: '🧭',
      color: 'bg-blue-50 border-blue-200 text-blue-800',
      description: '求人の探し方や応募書類、面接準備など転職活動を進めるためのステップを丁寧に解説します。',
      topics: ['求人選び', '履歴書・職歴書', '面接対策', '転職後の定着']
    },
    {
      title: '退職',
      icon: '🚪',
      color: 'bg-sky-50 border-sky-200 text-sky-800',
      description: '円満退職の段取りや退職願の書き方、退職代行の検討ポイントなどをまとめています。',
      topics: ['退職手続き', '引き継ぎ', '有給消化', '退職代行']
    },
    {
      title: '仕事内容',
      icon: '📋',
      color: 'bg-indigo-50 border-indigo-200 text-indigo-800',
      description: '病棟や外来などで担当する業務や1日の流れを現場目線で整理。できる・できない業務も明確にします。',
      topics: ['日勤の流れ', 'できる仕事・できない仕事', '配属別の違い', '働き方']
    },
    {
      title: '実務',
      icon: '🛠️',
      color: 'bg-red-50 border-red-200 text-red-800',
      description: '身体介助や物品準備など現場で欠かせない手順を具体的に紹介。段取りのコツも解説します。',
      topics: ['移乗・体位変換', '清潔ケア', '物品管理', '記録のコツ']
    },
    {
      title: '給与',
      icon: '💰',
      color: 'bg-amber-50 border-amber-200 text-amber-800',
      description: '看護助手の給与水準や手当、昇給の仕組みをデータと体験談から読み解きます。',
      topics: ['給与相場', '夜勤手当', '賞与', '副業・収入アップ']
    },
    {
      title: '資格',
      icon: '🎓',
      color: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      description: '取得しやすい資格や研修情報、学習の進め方、資格手当につながる制度を紹介します。',
      topics: ['初任者研修', '介護福祉士', '認定資格', '学習計画']
    },
    {
      title: '看護師',
      icon: '👩‍⚕️',
      color: 'bg-purple-50 border-purple-200 text-purple-800',
      description: '看護師を目指したい方に向けて学校選びや勉強法、両立の工夫などステップアップ情報をまとめました。',
      topics: ['進学ルート', '奨学金', '受験対策', '両立のコツ']
    },
    {
      title: '患者対応',
      icon: '🤝',
      color: 'bg-teal-50 border-teal-200 text-teal-800',
      description: '安心してもらえる声かけや接遇のポイント、認知症ケアなど患者さんとの向き合い方を解説します。',
      topics: ['接遇マナー', '声かけフレーズ', '認知症ケア', '家族対応']
    },
    {
      title: '悩み',
      icon: '💭',
      color: 'bg-pink-50 border-pink-200 text-pink-800',
      description: '夜勤の疲れや仕事の不安など、心がしんどいときの向き合い方を体験談とともにお届けします。',
      topics: ['ストレスケア', '不安との付き合い方', 'モチベーション', '働き続ける工夫']
    },
    {
      title: '人間関係',
      icon: '👥',
      color: 'bg-gray-50 border-gray-200 text-gray-800',
      description: '上司・先輩との連携方法や職場コミュニケーションのコツを共有。トラブル回避の知恵もまとめています。',
      topics: ['チーム連携', '相談の仕方', '伝え方', 'トラブル対策']
    },
    {
      title: '感染対策',
      icon: '🧴',
      color: 'bg-lime-50 border-lime-200 text-lime-800',
      description: '日々の感染対策や季節ごとの注意点、チェックリストを最新情報とともに掲載します。',
      topics: ['手指衛生', '個人防護具', '環境整備', '季節対策']
    }
  ]

  const featuredArticles = [
    {
      title: '【完全ガイド】看護助手とは？仕事内容から必要なスキルまで徹底解説',
      description: '看護助手の基本的な仕事内容、必要なスキル、向いている人の特徴を初心者向けに分かりやすく解説します。',
      category: '仕事内容',
      readTime: '8分',
      featured: true
    },
    {
      title: '看護助手の転職成功マニュアル｜求人の選び方から面接対策まで',
      description: '転職を成功させるための具体的な方法を、求人選びから面接対策まで詳しくご紹介します。',
      category: '転職',
      readTime: '12分',
      featured: true
    },
    {
      title: '【2024年最新】看護助手の給料相場｜職場別・地域別に徹底比較',
      description: '最新の給料相場を職場別・地域別に詳しく比較。手当やボーナスの実態も含めて解説します。',
      category: '給与',
      readTime: '9分',
      featured: true
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* ヘッダーセクション */}
      <header className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-white/20 rounded-full p-4">
                <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                </svg>
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              看護助手向け情報サイト
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              現場経験者が教える実践的なガイド
            </p>
            <p className="text-lg max-w-3xl mx-auto leading-relaxed text-blue-50">
              看護助手として働く方、これから目指す方のための専門情報サイト。
              実際の現場経験を基に、転職・資格・給与・実務ノウハウなど、
              本当に役立つ情報をお届けします。
            </p>
            
            {/* 統計情報 */}
            <div className="flex flex-wrap justify-center gap-8 mt-12">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">100+</div>
                <div className="text-blue-100">記事数</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{categories.length}</div>
                <div className="text-blue-100">カテゴリ</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">100%</div>
                <div className="text-blue-100">実体験ベース</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ナビゲーション */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between py-4">
            <Link href="/" className="text-slate-700 hover:text-blue-600 font-medium">
              ← ProReNataホームに戻る
            </Link>
            <div className="flex items-center space-x-6">
              <Link href="#categories" className="text-slate-700 hover:text-blue-600">
                カテゴリ
              </Link>
              <Link href="#articles" className="text-slate-700 hover:text-blue-600">
                記事一覧
              </Link>
              <Link href="#about" className="text-slate-700 hover:text-blue-600">
                このサイトについて
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          
          {/* 注目記事セクション */}
          <section className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-slate-800 mb-4">
                🌟 注目記事
              </h2>
              <p className="text-lg text-slate-600">
                看護助手として知っておきたい重要な情報をピックアップ
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {featuredArticles.map((article, index) => (
                <article key={index} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                        {article.category}
                      </span>
                      <span className="text-xs text-slate-500">
                        📖 {article.readTime}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-slate-800 mb-3 line-clamp-2">
                      {article.title}
                    </h3>
                    
                    <p className="text-slate-600 text-sm leading-relaxed mb-4 line-clamp-3">
                      {article.description}
                    </p>
                    
                    <Link 
                      href={`#article-${index}`}
                      className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      記事を読む
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* カテゴリ一覧セクション */}
          <section id="categories" className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-slate-800 mb-4">
                📂 カテゴリ一覧
              </h2>
              <p className="text-lg text-slate-600">
                あなたの知りたい情報をカテゴリから探してみてください
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category, index) => (
                <div key={index} className={`${category.color} rounded-xl p-6 border-2 hover:shadow-lg transition-all duration-300 cursor-pointer`}>
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">{category.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold mb-2">
                        {category.title}
                      </h3>
                      <p className="text-sm opacity-80 mb-4">
                        {category.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {category.topics.map((topic, topicIndex) => (
                          <span key={topicIndex} className="px-2 py-1 bg-white/50 rounded text-xs">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 記事一覧セクション */}
          <section id="articles" className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-slate-800 mb-4">
                📝 最新記事
              </h2>
              <p className="text-lg text-slate-600">
                現在{nursingPosts.length}件の看護助手関連記事を公開中
              </p>
            </div>
            
            {nursingPosts.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {nursingPosts.slice(0, 12).map((post) => {
                  const { dateTime, label } = formatPostDate(post, { year: 'numeric', month: '2-digit', day: '2-digit' })

                  return (
                    <article key={post._id} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300">
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-3">
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                            {post.contentType || '記事'}
                          </span>
                          {dateTime ? (
                            <time dateTime={dateTime} className="text-xs text-slate-500">
                              {label}
                            </time>
                          ) : (
                            <span className="text-xs text-slate-500">{label}</span>
                          )}
                        </div>
                      
                      <h3 className="font-bold text-slate-800 mb-3 line-clamp-2">
                        {post.title}
                      </h3>
                      
                      {post.excerpt && (
                        <p className="text-slate-600 text-sm leading-relaxed mb-4 line-clamp-3">
                          {post.excerpt}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <Link 
                          href={`/posts/${post.slug.current}`}
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                          記事を読む →
                        </Link>
                        <span className="text-xs text-slate-400">
                          {post.readingTime || 5}分で読める
                        </span>
                      </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">記事を準備中です</h3>
                <p className="text-slate-500">
                  看護助手向けの記事を鋭意作成中です。もうしばらくお待ちください。
                </p>
              </div>
            )}
          </section>

          {/* このサイトについてセクション */}
          <section id="about" className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-800 mb-4">
                  💡 このサイトについて
                </h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    🎯 私たちの目標
                  </h3>
                  <ul className="space-y-3 text-slate-600">
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span>
                      看護助手として働く方の疑問や悩みを解決
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span>
                      実際の現場経験に基づいた実践的な情報提供
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span>
                      キャリアアップや転職活動のサポート
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span>
                      看護助手コミュニティの発展への貢献
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    📋 コンテンツの特徴
                  </h3>
                  <ul className="space-y-3 text-slate-600">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">🔸</span>
                      現場経験者による実体験ベースの記事
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">🔸</span>
                      初心者から経験者まで対応した内容
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">🔸</span>
                      最新の業界動向と制度変更情報
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">🔸</span>
                      定期的な更新と新しい情報の追加
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-blue-800 text-center">
                  <strong>免責事項:</strong> 
                  このサイトは情報提供を目的としており、医療行為や医療判断の代替とはなりません。
                  医療に関する判断は、必ず専門医または担当の医療スタッフにご相談ください。
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* フッター */}
      <footer className="bg-slate-900 text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">看護助手向け情報サイト</h3>
            <p className="text-slate-300 mb-6">
              現場経験者が教える実践的なガイド
            </p>
            <div className="flex justify-center space-x-8 text-sm">
              <Link href="/" className="hover:text-white transition-colors">
                ProReNataホーム
              </Link>
              <Link href="/privacy" className="hover:text-white transition-colors">
                プライバシーポリシー
              </Link>
              <Link href="/contact" className="hover:text-white transition-colors">
                お問い合わせ
              </Link>
            </div>
          </div>
          
          <div className="border-t border-slate-800 pt-8 mt-8 text-center">
            <p className="text-slate-400 text-sm">
              © 2025 ProReNata 看護助手向け情報サイト. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
