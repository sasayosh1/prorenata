'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getAllPosts, type Post, formatPostDate } from '@/lib/sanity'

interface FilterOptions {
  category: string
  contentType: string
  difficulty: string
  readingTime: string
}

export default function SearchResults() {
  const searchParams = useSearchParams()
  const query = searchParams?.get('q') || ''
  
  const [allPosts, setAllPosts] = useState<Post[]>([])
  const [filteredResults, setFilteredResults] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<FilterOptions>({
    category: '',
    contentType: '',
    difficulty: '',
    readingTime: ''
  })
  
  const resultsPerPage = 12
  const startIndex = (currentPage - 1) * resultsPerPage
  const endIndex = startIndex + resultsPerPage
  const currentResults = filteredResults.slice(startIndex, endIndex)
  const totalPages = Math.ceil(filteredResults.length / resultsPerPage)

  // 初回データ取得
  useEffect(() => {
    const loadPosts = async () => {
      setIsLoading(true)
      try {
        const posts = await getAllPosts()
        setAllPosts(posts)
      } catch (error) {
        console.error('記事取得エラー:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadPosts()
  }, [])

  // 検索とフィルタリング
  useEffect(() => {
    if (allPosts.length === 0) return

    let results = [...allPosts]

    // キーワード検索
    if (query.trim()) {
      const searchTerm = query.toLowerCase()
      results = results.filter(post => 
        post.title?.toLowerCase().includes(searchTerm) ||
        post.excerpt?.toLowerCase().includes(searchTerm) ||
        post.focusKeyword?.toLowerCase().includes(searchTerm) ||
        post.relatedKeywords?.some(keyword => 
          keyword.toLowerCase().includes(searchTerm)
        ) ||
        post.tags?.some(tag => 
          tag.toLowerCase().includes(searchTerm)
        )
      )
    }

    // カテゴリフィルター
    if (filters.category) {
      results = results.filter(post => 
        post.categories?.some(cat => cat.title === filters.category)
      )
    }

    // コンテンツタイプフィルター
    if (filters.contentType) {
      results = results.filter(post => post.contentType === filters.contentType)
    }

    // 難易度フィルター
    if (filters.difficulty) {
      results = results.filter(post => post.difficulty === filters.difficulty)
    }

    // 読了時間フィルター
    if (filters.readingTime) {
      const timeRange = filters.readingTime.split('-')
      if (timeRange.length === 2) {
        const min = parseInt(timeRange[0])
        const max = parseInt(timeRange[1])
        results = results.filter(post => {
          const readTime = post.readingTime || 5
          return readTime >= min && readTime <= max
        })
      }
    }

    setFilteredResults(results)
    setCurrentPage(1) // フィルター変更時は1ページ目に戻る
  }, [allPosts, query, filters])

  const handleFilterChange = (filterType: keyof FilterOptions, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }))
  }

  const clearFilters = () => {
    setFilters({
      category: '',
      contentType: '',
      difficulty: '',
      readingTime: ''
    })
  }

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text
    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return parts.map((part, i) => (
      part.toLowerCase() === query.toLowerCase() ? 
        <mark key={i} className="bg-yellow-200 text-yellow-800 px-1 rounded">{part}</mark> : part
    ))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-slate-600">検索中...</span>
      </div>
    )
  }

  return (
    <div>
      {/* 検索結果ヘッダー */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          {query ? `「${query}」の検索結果` : '記事一覧'}
        </h1>
        <p className="text-slate-600">
          {filteredResults.length}件の記事が見つかりました
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* フィルターサイドバー */}
        <aside className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-lg border border-slate-200 p-6 sticky top-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800">絞り込み</h2>
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                クリア
              </button>
            </div>

            <div className="space-y-6">
              {/* カテゴリフィルター */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  カテゴリー
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">すべて</option>
                  <option value="転職">転職</option>
                  <option value="退職">退職</option>
                  <option value="仕事内容">仕事内容</option>
                  <option value="実務">実務</option>
                  <option value="給与">給与</option>
                  <option value="資格">資格</option>
                  <option value="看護師">看護師</option>
                  <option value="患者対応">患者対応</option>
                  <option value="悩み">悩み</option>
                  <option value="人間関係">人間関係</option>
                  <option value="感染対策">感染対策</option>
                </select>
              </div>

              {/* コンテンツタイプフィルター */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  記事タイプ
                </label>
                <select
                  value={filters.contentType}
                  onChange={(e) => handleFilterChange('contentType', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">すべて</option>
                  <option value="howto">ハウツー</option>
                  <option value="comparison">比較・選び方</option>
                  <option value="list">まとめ・リスト</option>
                  <option value="faq">FAQ・相談</option>
                  <option value="experience">体験談・実例</option>
                </select>
              </div>

              {/* 難易度フィルター */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  難易度
                </label>
                <select
                  value={filters.difficulty}
                  onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">すべて</option>
                  <option value="beginner">初心者向け</option>
                  <option value="intermediate">中級者向け</option>
                  <option value="advanced">上級者向け</option>
                </select>
              </div>

              {/* 読了時間フィルター */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  読了時間
                </label>
                <select
                  value={filters.readingTime}
                  onChange={(e) => handleFilterChange('readingTime', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">すべて</option>
                  <option value="1-3">1-3分</option>
                  <option value="4-6">4-6分</option>
                  <option value="7-10">7-10分</option>
                  <option value="11-15">11分以上</option>
                </select>
              </div>
            </div>
          </div>
        </aside>

        {/* メイン検索結果 */}
        <main className="flex-1">
          {filteredResults.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">検索結果が見つかりません</h3>
              <p className="text-slate-500 mb-4">
                {query ? `「${query}」に一致する記事がありませんでした` : '条件に一致する記事がありませんでした'}
              </p>
              <button
                onClick={clearFilters}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                フィルターをクリアして再検索
              </button>
            </div>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {currentResults.map((post) => (
                  <article key={post._id} className="bg-white rounded-lg border border-slate-200 hover:shadow-lg transition-shadow">
                    <Link href={`/posts/${post.slug.current}`}>
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                            {post.contentType || '記事'}
                          </span>
                          {(() => {
                            const { dateTime, label } = formatPostDate(post, { year: 'numeric', month: '2-digit', day: '2-digit' })
                            return dateTime ? (
                              <time dateTime={dateTime} className="text-xs text-slate-500">
                                {label}
                              </time>
                            ) : (
                              <span className="text-xs text-slate-500">{label}</span>
                            )
                          })()}
                        </div>
                        
                        <h3 className="text-lg font-semibold text-slate-800 mb-3 line-clamp-2">
                          {highlightMatch(post.title, query)}
                        </h3>
                        
                        {post.excerpt && (
                          <p className="text-slate-600 text-sm leading-relaxed mb-4 line-clamp-3">
                            {highlightMatch(post.excerpt.substring(0, 150) + '...', query)}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {post.readingTime || 3}分で読める
                          </div>
                          <div className="flex items-center text-blue-600">
                            <span className="text-sm font-medium">読む</span>
                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>

              {/* ページネーション */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <nav className="flex items-center space-x-1">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      前へ
                    </button>
                    
                    {[...Array(totalPages)].map((_, i) => {
                      const page = i + 1
                      if (
                        page === 1 || 
                        page === totalPages || 
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-2 text-sm rounded ${
                              page === currentPage
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {page}
                          </button>
                        )
                      } else if (
                        page === currentPage - 2 || 
                        page === currentPage + 2
                      ) {
                        return <span key={page} className="px-3 py-2 text-slate-400">...</span>
                      }
                      return null
                    })}
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      次へ
                    </button>
                  </nav>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
