import { getAllPosts, type Post } from '@/lib/sanity'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LazyDarkModeToggle } from '@/components/LazyComponents'
import { 
  ArrowLeft, 
  Heart,
  Clock,
  User,
  FileText,
  BookOpen,
  TrendingUp,
  Users,
  DollarSign,
  Building2
} from 'lucide-react'
import { notFound } from 'next/navigation'

// キャッシュ無効化
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface CategoryInfo {
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  slug: string
}

const categories: CategoryInfo[] = [
  {
    name: '基礎知識・入門',
    description: '看護助手の基本的な知識や技術について詳しく解説',
    icon: BookOpen,
    color: 'medical',
    slug: 'basics'
  },
  {
    name: 'キャリア・資格',
    description: '転職や資格取得、キャリアアップの方法を紹介',
    icon: TrendingUp,
    color: 'clean',
    slug: 'career'
  },
  {
    name: '実務・ノウハウ',
    description: '実際の現場で役立つ実践的なスキルとノウハウ',
    icon: Users,
    color: 'medical',
    slug: 'practice'
  },
  {
    name: '給与・待遇',
    description: '給与体系や労働条件、福利厚生について',
    icon: DollarSign,
    color: 'clean',
    slug: 'salary'
  },
  {
    name: '職場別情報',
    description: '病院、クリニック、介護施設など職場別の特徴',
    icon: Building2,
    color: 'medical',
    slug: 'workplace'
  }
]

// カテゴリー名をスラッグから逆引き
function getCategoryBySlug(slug: string): CategoryInfo | null {
  return categories.find(cat => cat.slug === slug) || null
}


export default async function CategoryPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const categoryInfo = getCategoryBySlug(slug)
  if (!categoryInfo) {
    notFound()
  }

  let posts: Post[] = []
  
  try {
    posts = await getAllPosts()
  } catch (error) {
    console.error('Failed to load posts:', error)
  }

  // カテゴリーに該当する記事をフィルタリング
  const categoryPosts = posts.filter(post => 
    post.categories?.includes(categoryInfo.name)
  )

  const IconComponent = categoryInfo.icon

  return (
    <div className="min-h-screen bg-gradient-to-b from-medical-50/30 to-white">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-professional-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/categories" 
              className="inline-flex items-center text-professional-700 hover:text-medical-600 transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-br from-medical-500 to-medical-600 rounded-lg flex items-center justify-center">
                  <Heart className="w-3 h-3 text-white" />
                </div>
                <span>カテゴリー一覧</span>
              </div>
            </Link>
            
            <LazyDarkModeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-8">
        <div className="max-w-6xl mx-auto px-6">
          {/* Category Header */}
          <div className="medical-card p-8 mb-8">
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${
                categoryInfo.color === 'medical' 
                  ? 'from-medical-500 to-medical-600' 
                  : 'from-clean-500 to-clean-600'
              } flex items-center justify-center`}>
                <IconComponent className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-professional-900 mb-2">
                  {categoryInfo.name}
                </h1>
                <p className="text-lg text-professional-700">
                  {categoryInfo.description}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge variant={categoryInfo.color === 'medical' ? 'medical' : 'clean'} className="text-base px-4 py-2">
                {categoryPosts.length}記事
              </Badge>
              <span className="text-professional-600">
                あなたのキャリアに役立つ専門情報
              </span>
            </div>
          </div>

          {/* Articles Grid */}
          {categoryPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryPosts.map((post) => (
                <article key={post._id} className="article-card group">
                  <div className="article-card-content">
                    {/* Meta Info */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="medical" className="text-xs">
                          ProReNata
                        </Badge>
                        {post.contentType && (
                          <Badge variant="outline" className="text-xs">
                            {post.contentType === 'howto' && 'ハウツー'}
                            {post.contentType === 'experience' && '体験談'}
                            {post.contentType === 'comparison' && '比較'}
                            {post.contentType === 'faq' && 'FAQ'}
                            {post.contentType === 'list' && 'まとめ'}
                          </Badge>
                        )}
                      </div>
                      <time className="text-xs text-professional-500" dateTime={post.publishedAt}>
                        {formatDate(post.publishedAt)}
                      </time>
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-lg font-semibold text-professional-900 mb-3 line-clamp-2 group-hover:text-medical-600 transition-colors">
                      <Link href={`/posts/${post.slug.current}`}>
                        {post.title}
                      </Link>
                    </h3>
                    
                    {/* Excerpt */}
                    {post.excerpt && (
                      <p className="text-professional-700 text-sm leading-relaxed mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>
                    )}

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {post.tags.slice(0, 3).map((tag, index) => (
                          <span key={index} className="text-xs px-2 py-1 bg-professional-100 text-professional-600 rounded">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-professional-100">
                      <Link 
                        href={`/posts/${post.slug.current}`}
                        className="inline-flex items-center text-medical-600 hover:text-medical-700 text-sm font-medium group/link"
                      >
                        記事を読む
                        <ArrowLeft className="w-4 h-4 ml-1 rotate-180 group-hover/link:translate-x-1 transition-transform" />
                      </Link>
                      
                      <div className="flex items-center gap-3 text-xs text-professional-500">
                        {post.readingTime && (
                          <div className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {post.readingTime}分
                          </div>
                        )}
                        {post.difficulty && (
                          <div className="flex items-center">
                            <User className="w-3 h-3 mr-1" />
                            {post.difficulty === 'beginner' && '初心者'}
                            {post.difficulty === 'intermediate' && '中級者'}
                            {post.difficulty === 'advanced' && '上級者'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            /* No Articles */
            <div className="medical-card p-8 text-center">
              <FileText className="w-16 h-16 mx-auto text-professional-400 mb-4" />
              <h3 className="text-xl font-semibold text-professional-900 mb-2">
                このカテゴリーの記事は準備中です
              </h3>
              <p className="text-professional-700 mb-6">
                現在、{categoryInfo.name}に関する記事を準備中です。他のカテゴリーもぜひご覧ください。
              </p>
              <div className="flex gap-4 justify-center">
                <Link href="/categories">
                  <Button variant="outline">
                    他のカテゴリーを見る
                  </Button>
                </Link>
                <Link href="/posts">
                  <Button>
                    すべての記事を見る
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Back to Categories */}
          <div className="text-center mt-12">
            <Link href="/categories">
              <Button variant="outline" size="lg">
                カテゴリー一覧に戻る
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

// 静的パラメータ生成
export async function generateStaticParams() {
  return categories.map((category) => ({
    slug: category.slug,
  }))
}