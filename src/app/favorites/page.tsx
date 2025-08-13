'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { favorites, readingHistory, type FavoritePost } from '@/lib/favorites'

// SEO metadata (クライアントコンポーネントなので動的に設定)
const pageTitle = 'お気に入り記事 | ProReNata'
const pageDescription = 'あなたがお気に入りに追加した看護助手関連の記事一覧。いつでも簡単にアクセスできます。'

export default function FavoritesPage() {
  const [favoritesPosts, setFavoritesPosts] = useState<FavoritePost[]>([])
  const [historyPosts, setHistoryPosts] = useState<FavoritePost[]>([])
  const [activeTab, setActiveTab] = useState<'favorites' | 'history'>('favorites')
  const [isLoading, setIsLoading] = useState(true)

  // ページタイトルを動的に設定
  useEffect(() => {
    document.title = pageTitle
    
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', pageDescription)
    }
  }, [])

  // データを初期ロード
  useEffect(() => {
    const loadData = () => {
      setFavoritesPosts(favorites.getAll())
      setHistoryPosts(readingHistory.getAll())
      setIsLoading(false)
    }

    loadData()
    
    // お気に入りが変更されたときに再読み込み
    const handleFavoritesChange = () => {
      setFavoritesPosts(favorites.getAll())
    }

    window.addEventListener('favoritesChanged', handleFavoritesChange)
    
    return () => {
      window.removeEventListener('favoritesChanged', handleFavoritesChange)
    }
  }, [])

  const clearFavorites = () => {
    if (confirm('すべてのお気に入りを削除してもよろしいですか？')) {
      favorites.clear()
      setFavoritesPosts([])
    }
  }

  const clearHistory = () => {
    if (confirm('読書履歴をすべて削除してもよろしいですか？')) {
      readingHistory.clear()
      setHistoryPosts([])
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-slate-600">読み込み中...</span>
        </div>
      </div>
    )
  }

  const currentPosts = activeTab === 'favorites' ? favoritesPosts : historyPosts
  const currentTitle = activeTab === 'favorites' ? 'お気に入り記事' : '読書履歴'
  const currentEmptyMessage = activeTab === 'favorites' 
    ? 'お気に入りに追加した記事はありません。記事ページでハートマークをクリックしてお気に入りに追加してみましょう。'
    : 'まだ読んだ記事がありません。記事を読むと自動的にここに履歴が保存されます。'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
              </svg>
              <span className="text-xl font-bold text-slate-800">ProReNata</span>
            </Link>
            
            <nav className="flex items-center space-x-6 text-sm">
              <Link href="/" className="text-slate-600 hover:text-blue-600">ホーム</Link>
              <Link href="/articles" className="text-slate-600 hover:text-blue-600">記事一覧</Link>
              <Link href="/nursing-assistant" className="text-slate-600 hover:text-blue-600">看護助手情報</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="py-8">
        <div className="max-w-6xl mx-auto px-6">
          {/* タブナビゲーション */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex space-x-1 bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('favorites')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'favorites'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                お気に入り ({favoritesPosts.length})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'history'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                読書履歴 ({historyPosts.length})
              </button>
            </div>

            {currentPosts.length > 0 && (
              <button
                onClick={activeTab === 'favorites' ? clearFavorites : clearHistory}
                className="text-sm text-slate-500 hover:text-red-600 transition-colors"
              >
                すべてクリア
              </button>
            )}
          </div>

          {/* ページタイトル */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">{currentTitle}</h1>
            <p className="text-slate-600">
              {currentPosts.length > 0 
                ? `${currentPosts.length}件の記事があります`
                : currentEmptyMessage
              }
            </p>
          </div>

          {/* 記事一覧 */}
          {currentPosts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {activeTab === 'favorites' ? (
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                {activeTab === 'favorites' ? 'お気に入りはまだありません' : '読書履歴はまだありません'}
              </h3>
              <p className="text-slate-500 mb-6 max-w-md mx-auto">
                {currentEmptyMessage}
              </p>
              <Link
                href="/articles"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                記事を読む
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {currentPosts.map((post) => (
                <article key={post._id} className="bg-white rounded-lg border border-slate-200 hover:shadow-lg transition-all group">
                  <Link href={`/posts/${post.slug}`}>
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                            {post.contentType || '記事'}
                          </span>
                          {post.categories && post.categories.length > 0 && (
                            <span className="text-xs text-slate-500">
                              {post.categories[0]}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {activeTab === 'favorites' && (
                            <button
                              onClick={() => favorites.remove(post._id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-red-500 hover:text-red-600"
                              title="お気に入りから削除"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                              </svg>
                            </button>
                          )}
                          <time className="text-xs text-slate-400">
                            {new Date(post.publishedAt).toLocaleDateString('ja-JP')}
                          </time>
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-slate-800 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {post.title}
                      </h3>
                      
                      {post.excerpt && (
                        <p className="text-slate-600 text-sm leading-relaxed mb-4 line-clamp-3">
                          {post.excerpt}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {post.readingTime || 3}分で読める
                        </div>
                        <div className="flex items-center text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-sm font-medium">読む</span>
                          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>

                      {/* お気に入り追加日時 */}
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <p className="text-xs text-slate-400">
                          {activeTab === 'favorites' 
                            ? `お気に入り追加: ${new Date(post.addedAt).toLocaleDateString('ja-JP')}`
                            : `最終閲覧: ${new Date(post.addedAt).toLocaleDateString('ja-JP')}`
                          }
                        </p>
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}