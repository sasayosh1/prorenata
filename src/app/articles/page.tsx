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
  Search,
  Filter
} from 'lucide-react'

// キャッシュ無効化
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ArticlesPage() {
  let posts: Post[] = []
  
  try {
    posts = await getAllPosts()
  } catch (error) {
    console.error('Failed to load posts:', error)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-medical-50/30 to-white">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-professional-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/" 
              className="inline-flex items-center text-professional-700 hover:text-medical-600 transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-br from-medical-500 to-medical-600 rounded-lg flex items-center justify-center">
                  <Heart className="w-3 h-3 text-white" />
                </div>
                <span>ProReNata</span>
              </div>
            </Link>
            
            <LazyDarkModeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-8">
        <div className="max-w-6xl mx-auto px-6">
          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-professional-900 mb-4">
              記事一覧
            </h1>
            <p className="text-lg text-professional-700 max-w-2xl mx-auto mb-6">
              看護助手として働く方・目指す方のための実践的な情報をお届けしています
            </p>
            
            {/* Search CTA */}
            <div className="flex gap-4 justify-center">
              <Link href="/search">
                <Button className="inline-flex items-center">
                  <Search className="w-4 h-4 mr-2" />
                  記事を検索
                </Button>
              </Link>
              <Link href="/categories">
                <Button variant="outline" className="inline-flex items-center">
                  <Filter className="w-4 h-4 mr-2" />
                  カテゴリー別
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="medical-card p-6 mb-8 text-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-3xl font-bold text-medical-600 mb-1">
                  {posts.length}
                </div>
                <div className="text-professional-700">記事数</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-medical-600 mb-1">
                  5
                </div>
                <div className="text-professional-700">カテゴリー</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-medical-600 mb-1">
                  {Math.round(posts.reduce((acc, post) => acc + (post.readingTime || 5), 0) / posts.length) || 5}
                </div>
                <div className="text-professional-700">平均読了時間（分）</div>
              </div>
            </div>
          </div>

          {/* Articles Grid */}
          {posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
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

                    {/* Categories */}
                    {post.categories && post.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {post.categories.slice(0, 2).map((category, index) => (
                          <span key={index} className="text-xs px-2 py-1 bg-medical-100 text-medical-700 rounded">
                            {category}
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
              <div className="text-xl font-semibold text-professional-900 mb-2">
                記事を読み込み中...
              </div>
              <p className="text-professional-700">
                少々お待ちください
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}