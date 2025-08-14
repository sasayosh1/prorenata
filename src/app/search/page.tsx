'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { LazyAdvancedSearch, LazyDarkModeToggle } from '@/components/LazyComponents'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, 
  Heart, 
  Clock, 
  User, 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  BarChart3,
  Loader2
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Post {
  _id: string
  title: string
  slug: { current: string }
  publishedAt: string
  excerpt?: string
  categories?: string[]
  author?: { name: string }
  readingTime?: number
  difficulty?: string
  contentType?: string
  tags?: string[]
}

interface SearchStats {
  totalResults: number
  currentPage: number
  totalPages: number
  resultsPerPage: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

interface SearchData {
  posts: Post[]
  stats: SearchStats
  categoryCounts: Record<string, number>
  appliedFilters: {
    query: string
    category: string
    difficulty: string
    contentType: string
    readingTime: string
    sortBy: string
  }
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const [searchData, setSearchData] = useState<SearchData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const initialQuery = searchParams.get('q') || ''
  const initialFilters = {
    category: searchParams.get('category') || '',
    difficulty: searchParams.get('difficulty') || '',
    contentType: searchParams.get('contentType') || '',
    readingTime: searchParams.get('readingTime') || '',
    sortBy: searchParams.get('sortBy') || 'relevance',
  }
  const currentPage = parseInt(searchParams.get('page') || '1')

  const performSearch = async (query: string = initialQuery, filters: typeof initialFilters = initialFilters, page: number = 1) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (query.trim()) params.set('q', query.trim())
      if (filters.category) params.set('category', filters.category)
      if (filters.difficulty) params.set('difficulty', filters.difficulty)
      if (filters.contentType) params.set('contentType', filters.contentType)
      if (filters.readingTime) params.set('readingTime', filters.readingTime)
      if (filters.sortBy) params.set('sortBy', filters.sortBy)
      params.set('page', page.toString())
      params.set('limit', '12')

      const response = await fetch(`/api/search?${params.toString()}`)
      if (!response.ok) {
        throw new Error('検索に失敗しました')
      }

      const result = await response.json()
      if (result.success) {
        setSearchData(result.data)
      } else {
        throw new Error(result.message || '検索エラー')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '検索中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    performSearch(initialQuery, initialFilters, currentPage)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (query: string, filters: typeof initialFilters) => {
    performSearch(query, filters, 1)
  }

  const handlePageChange = (page: number) => {
    if (searchData) {
      performSearch(searchData.appliedFilters.query, searchData.appliedFilters, page)
    }
  }

  const getContentTypeLabel = (contentType: string) => {
    const types: Record<string, string> = {
      'howto': 'ハウツー',
      'experience': '体験談',
      'comparison': '比較',
      'faq': 'FAQ',
      'list': 'まとめ'
    }
    return types[contentType] || contentType
  }

  const getDifficultyLabel = (difficulty: string) => {
    const levels: Record<string, string> = {
      'beginner': '初心者',
      'intermediate': '中級者',
      'advanced': '上級者'
    }
    return levels[difficulty] || difficulty
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
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-professional-900 mb-4">
              記事検索
            </h1>
            <p className="text-lg text-professional-700">
              看護助手に関する情報を効率的に見つけましょう
            </p>
          </div>

          {/* Advanced Search */}
          <div className="mb-8">
            <LazyAdvancedSearch
              initialQuery={initialQuery}
              initialFilters={initialFilters}
              onSearch={handleSearch}
              placeholder="記事やキーワードを検索..."
            />
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-medical-500" />
              <span className="ml-2 text-professional-600">検索中...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="medical-card p-6 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => performSearch()} variant="outline">
                再試行
              </Button>
            </div>
          )}

          {/* Search Results */}
          {!loading && !error && searchData && (
            <>
              {/* Search Stats */}
              <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  {searchData.appliedFilters.query ? (
                    <p className="text-professional-700">
                      <span className="font-medium">「{searchData.appliedFilters.query}」</span>
                      の検索結果: <span className="font-medium">{searchData.stats.totalResults}</span>件
                      {searchData.stats.totalPages > 1 && (
                        <span className="text-professional-500 ml-2">
                          ({searchData.stats.currentPage}/{searchData.stats.totalPages}ページ目)
                        </span>
                      )}
                    </p>
                  ) : (
                    <p className="text-professional-700">
                      全記事: <span className="font-medium">{searchData.stats.totalResults}</span>件
                    </p>
                  )}
                </div>

                {/* Category Stats */}
                {Object.keys(searchData.categoryCounts).length > 0 && (
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-professional-500" />
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(searchData.categoryCounts)
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 3)
                        .map(([category, count]) => (
                        <Badge key={category} variant="outline" className="text-xs">
                          {category}: {count}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Results Grid */}
              {searchData.posts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {searchData.posts.map((post) => (
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
                                {getContentTypeLabel(post.contentType)}
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
                                {getDifficultyLabel(post.difficulty)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                /* No Results */
                <div className="medical-card p-8 text-center">
                  <TrendingUp className="w-16 h-16 mx-auto text-professional-400 mb-4" />
                  <h3 className="text-xl font-semibold text-professional-900 mb-2">
                    検索結果が見つかりませんでした
                  </h3>
                  <p className="text-professional-700 mb-6">
                    {searchData.appliedFilters.query 
                      ? `「${searchData.appliedFilters.query}」に一致する記事はありません。`
                      : '条件に一致する記事はありません。'
                    }
                    別のキーワードや条件で検索してみてください。
                  </p>
                  <Button 
                    onClick={() => handleSearch('', { category: '', difficulty: '', contentType: '', readingTime: '', sortBy: 'newest' })}
                    variant="outline"
                  >
                    すべての記事を表示
                  </Button>
                </div>
              )}

              {/* Pagination */}
              {searchData.stats.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(searchData.stats.currentPage - 1)}
                    disabled={!searchData.stats.hasPrevPage}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    前へ
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, searchData.stats.totalPages) }, (_, i) => {
                      const page = Math.max(1, Math.min(
                        searchData.stats.totalPages - 4,
                        searchData.stats.currentPage - 2
                      )) + i
                      
                      return (
                        <Button
                          key={page}
                          variant={page === searchData.stats.currentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                          className="w-8 h-8 p-0"
                        >
                          {page}
                        </Button>
                      )
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(searchData.stats.currentPage + 1)}
                    disabled={!searchData.stats.hasNextPage}
                  >
                    次へ
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}