import { getAllPosts, type Post } from '@/lib/sanity'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import SimpleSearch from '@/components/SimpleSearch'
import DarkModeToggle from '@/components/DarkModeToggle'
import { Heart, Users, BookOpen, TrendingUp } from 'lucide-react'

// 最強のキャッシュ無効化
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export default async function Home() {
  let posts: Post[] = []
  let sanityConnected = false
  
  try {
    posts = await getAllPosts()
    sanityConnected = posts.length > 0
  } catch (error) {
    console.error('Failed to load posts:', error)
  }

  // カテゴリ別の記事数（仮データ）
  const categories = [
    { name: '基本知識', count: 25, icon: BookOpen, color: 'medical' },
    { name: 'キャリア', count: 18, icon: TrendingUp, color: 'clean' },
    { name: '実践', count: 22, icon: Users, color: 'medical' },
    { name: '給与・待遇', count: 12, icon: Heart, color: 'clean' },
  ]
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-medical-50/30 to-white">
      {/* Modern Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-professional-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between py-4">
            {/* Logo & Brand */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-medical-500 to-medical-600 rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-professional-900">ProReNata</h1>
                <p className="text-xs text-professional-600">看護助手の知識と経験</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/" className="nav-link nav-link-active">
                ホーム
              </Link>
              <Link href="/articles" className="nav-link">
                記事一覧
              </Link>
              <Link href="/categories" className="nav-link">
                カテゴリー
              </Link>
              <Link href="/about" className="nav-link">
                About
              </Link>
            </nav>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <DarkModeToggle />
              
              {/* Mobile menu button */}
              <button className="md:hidden p-2 rounded-md hover:bg-professional-100">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="hero-section">
            <div className="max-w-4xl mx-auto text-center">
              {/* Main Headline */}
              <div className="mb-8">
                <Badge variant="medical" className="mb-4">
                  Pro Re Nata - 必要に応じて、その都度
                </Badge>
                <h1 className="text-4xl lg:text-5xl font-bold text-professional-900 mb-6 leading-tight">
                  看護助手として働く
                  <span className="text-medical-600">すべての方</span>
                  へ
                </h1>
                <p className="text-xl text-professional-700 leading-relaxed max-w-3xl mx-auto mb-8">
                  元看護助手の実体験をもとに、医療現場で働く方々が必要とする情報を
                  <strong className="text-professional-900">率直</strong>かつ
                  <strong className="text-professional-900">実践的</strong>に
                  お伝えします。
                </p>
              </div>

              {/* CTA & Search */}
              <div className="flex flex-col sm:flex-row gap-6 items-center justify-center mb-12">
                <Link href="/articles">
                  <Button size="lg" className="px-8 py-4 text-base">
                    記事を読む
                  </Button>
                </Link>
                <div className="w-full sm:w-96">
                  <SimpleSearch placeholder="気になるトピックを検索..." />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {categories.map((category) => (
                  <div key={category.name} className="text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-medical-100 to-medical-200 flex items-center justify-center">
                      <category.icon className="w-6 h-6 text-medical-600" />
                    </div>
                    <div className="text-2xl font-bold text-professional-900 mb-1">
                      {category.count}
                    </div>
                    <div className="text-sm text-professional-600">
                      {category.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-professional-900 mb-4">
              カテゴリー別ガイド
            </h2>
            <p className="text-lg text-professional-700 max-w-2xl mx-auto">
              看護助手として必要な知識を分野別に整理しています
            </p>
          </div>

          <div className="grid-responsive">
            {categories.map((category) => (
              <Link
                key={category.name}
                href={`/categories/${category.name.toLowerCase()}`}
                className="medical-card group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                    category.color === 'medical' 
                      ? 'from-medical-500 to-medical-600' 
                      : 'from-clean-500 to-clean-600'
                  } flex items-center justify-center`}>
                    <category.icon className="w-6 h-6 text-white" />
                  </div>
                  <Badge variant={category.color === 'medical' ? 'medical' : 'clean'}>
                    {category.count}記事
                  </Badge>
                </div>
                
                <h3 className="text-xl font-semibold text-professional-900 mb-2 group-hover:text-medical-600 transition-colors">
                  {category.name}
                </h3>
                
                <p className="text-professional-700 text-sm leading-relaxed mb-4">
                  {category.name === '基本知識' && '看護助手の基本的な知識や技術について詳しく解説'}
                  {category.name === 'キャリア' && '転職や資格取得、キャリアアップの方法を紹介'}
                  {category.name === '実践' && '実際の現場で役立つ実践的なスキルとノウハウ'}
                  {category.name === '給与・待遇' && '給与体系や労働条件、福利厚生について'}
                </p>
                
                <div className="flex items-center text-medical-600 text-sm font-medium mt-auto">
                  詳しく見る
                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Articles */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-professional-900 mb-2">
                最新の記事
              </h2>
              <p className="text-professional-700">
                現場経験を活かした実践的な情報をお届けします
              </p>
            </div>
            <Badge variant="outline" className="px-4 py-2">
              {sanityConnected ? `${posts.length}記事` : '準備中'}
            </Badge>
          </div>
          
          {sanityConnected ? (
            <div className="grid-articles">
              {posts.slice(0, 6).map((post) => (
                <article key={post._id} className="article-card group">
                  <div className="article-card-content">
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant="medical">
                        ProReNata
                      </Badge>
                      <time className="text-sm text-professional-500" dateTime={post.publishedAt}>
                        {formatDate(post.publishedAt)}
                      </time>
                    </div>
                    
                    <h3 className="text-xl font-semibold text-professional-900 mb-3 line-clamp-2 group-hover:text-medical-600 transition-colors">
                      {post.title}
                    </h3>
                    
                    {post.excerpt && (
                      <p className="text-professional-700 text-base leading-relaxed mb-6 line-clamp-3">
                        {post.excerpt}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-professional-100">
                      <Link 
                        href={`/posts/${post.slug.current}`}
                        className="inline-flex items-center text-medical-600 hover:text-medical-700 text-sm font-medium group/link"
                      >
                        記事を読む
                        <svg className="w-4 h-4 ml-1 group-hover/link:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                      <div className="flex items-center text-xs text-professional-500">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        約{post.readingTime || 3}分
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="grid-articles">
              {/* Sample Articles */}
              <article className="article-card">
                <div className="article-card-content">
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant="medical">ProReNata</Badge>
                    <time className="text-sm text-professional-500">2025年8月12日</time>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-professional-900 mb-3">
                    看護助手として働いた日々を振り返って
                  </h3>
                  
                  <p className="text-professional-700 leading-relaxed mb-6">
                    医療現場で看護助手として働いた実体験をもとに、
                    日々感じたことや学んだことを率直に書いています。
                  </p>

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-professional-100">
                    <Link href="#" className="inline-flex items-center text-medical-600 hover:text-medical-700 text-sm font-medium">
                      記事を読む
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                    <div className="flex items-center text-xs text-professional-500">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      3分で読める
                    </div>
                  </div>
                </div>
              </article>
              
              <article className="article-card">
                <div className="article-card-content">
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant="medical">ProReNata</Badge>
                    <time className="text-sm text-professional-500">2025年8月11日</time>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-professional-900 mb-3">
                    医療現場でのコミュニケーション術
                  </h3>
                  
                  <p className="text-professional-700 leading-relaxed mb-6">
                    患者さんや医療スタッフとの効果的なコミュニケーション方法と、
                    実際の現場で学んだ重要なポイントをご紹介します。
                  </p>

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-professional-100">
                    <Link href="#" className="inline-flex items-center text-medical-600 hover:text-medical-700 text-sm font-medium">
                      記事を読む
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                    <div className="flex items-center text-xs text-professional-500">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      4分で読める
                    </div>
                  </div>
                </div>
              </article>

              <article className="article-card">
                <div className="article-card-content">
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant="clean">ProReNata</Badge>
                    <time className="text-sm text-professional-500">2025年8月10日</time>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-professional-900 mb-3">
                    看護助手のキャリアパスを考える
                  </h3>
                  
                  <p className="text-professional-700 leading-relaxed mb-6">
                    看護助手として働きながら、将来のキャリアをどう築いていくか。
                    実際の選択肢と体験談をお伝えします。
                  </p>

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-professional-100">
                    <Link href="#" className="inline-flex items-center text-medical-600 hover:text-medical-700 text-sm font-medium">
                      記事を読む
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                    <div className="flex items-center text-xs text-professional-500">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      5分で読める
                    </div>
                  </div>
                </div>
              </article>
            </div>
          )}

          <div className="text-center mt-12">
            <Link href="/articles">
              <Button variant="outline" size="lg">
                すべての記事を見る
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 bg-gradient-to-br from-medical-50 via-white to-clean-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="medical-card p-8 lg:p-12">
            <h3 className="text-2xl font-bold text-professional-900 mb-6">
              このサイトについて
            </h3>
            <p className="text-lg text-professional-700 leading-relaxed mb-8">
              ProReNataは、看護助手として医療現場で働いた実体験をもとに、
              同じような立場で働く方々に役立つ情報をお届けする個人サイトです。
              現場で感じた率直な想いや学んだことを、できるだけ具体的に紹介しています。
            </p>
            <div className="inline-flex items-center justify-center w-full p-4 bg-professional-50 rounded-lg border border-professional-200">
              <svg className="w-5 h-5 text-professional-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-professional-700">
                <strong>重要：</strong>このサイトは個人的な体験や意見を書いたものです。
                医療に関する判断は、必ず専門医にご相談ください。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-professional-900 text-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-medical-500 to-medical-600 rounded-xl flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">ProReNata</h3>
                  <p className="text-professional-400 text-sm">必要に応じて、その都度</p>
                </div>
              </div>
              <p className="text-professional-300 leading-relaxed mb-4 max-w-md">
                元看護助手の実体験をもとに、医療現場で働く方々に役立つ情報を発信しています。
              </p>
            </div>

            {/* Navigation */}
            <div>
              <h4 className="font-semibold mb-4">ナビゲーション</h4>
              <ul className="space-y-2">
                <li><Link href="/" className="text-professional-300 hover:text-white transition-colors">ホーム</Link></li>
                <li><Link href="/articles" className="text-professional-300 hover:text-white transition-colors">記事一覧</Link></li>
                <li><Link href="/categories" className="text-professional-300 hover:text-white transition-colors">カテゴリー</Link></li>
                <li><Link href="/about" className="text-professional-300 hover:text-white transition-colors">About</Link></li>
              </ul>
            </div>

            {/* Categories */}
            <div>
              <h4 className="font-semibold mb-4">カテゴリー</h4>
              <ul className="space-y-2">
                <li><Link href="/categories/basics" className="text-professional-300 hover:text-white transition-colors">基本知識</Link></li>
                <li><Link href="/categories/career" className="text-professional-300 hover:text-white transition-colors">キャリア</Link></li>
                <li><Link href="/categories/practice" className="text-professional-300 hover:text-white transition-colors">実践</Link></li>
                <li><Link href="/categories/salary" className="text-professional-300 hover:text-white transition-colors">給与・待遇</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-professional-700 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <p className="text-professional-400 text-sm mb-4 md:mb-0">
                © 2025 ProReNata. All rights reserved.
              </p>
              <p className="text-professional-400 text-xs">
                Pro Re Nata - ラテン語で「必要に応じて、その都度」
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}