'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface PostsSearchProps {
  initialQuery?: string
}

export default function PostsSearch({ initialQuery = '' }: PostsSearchProps) {
  const [searchTerm, setSearchTerm] = useState(initialQuery || '')
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()

    if (searchTerm.trim()) {
      // 検索クエリがある場合
      const params = new URLSearchParams()
      params.set('search', searchTerm.trim())
      router.push(`/posts?${params.toString()}`)
    } else {
      // 検索クエリが空の場合は通常の記事一覧に戻る
      router.push('/posts')
    }
  }

  const handleClear = () => {
    setSearchTerm('')
    router.push('/posts')
  }

  return (
    <div className="mb-8">
      <form onSubmit={handleSearch} className="flex gap-2 max-w-md mx-auto">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="記事を検索..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </form>

      {initialQuery && (
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            「<span className="font-medium">{initialQuery}</span>」の検索結果
          </p>
          <button
            onClick={handleClear}
            className="text-sm text-blue-600 hover:text-blue-800 underline mt-1"
          >
            検索をクリア
          </button>
        </div>
      )}
    </div>
  )
}