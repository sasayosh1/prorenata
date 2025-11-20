'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function HeaderSearch() {
  const [query, setQuery] = useState('')
  const router = useRouter()

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    router.push(`/search?q=${encodeURIComponent(trimmed)}`)
    setQuery('')
  }

  return (
    <div className="flex items-center gap-2">
      <form
        onSubmit={handleSubmit}
        className="hidden md:flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 focus-within:border-cyan-500 focus-within:bg-white transition-colors"
      >
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="記事検索"
          className="w-40 bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
          autoComplete="off"
        />
        <button
          type="submit"
          className="ml-2 text-sm font-semibold text-cyan-600 hover:text-cyan-700 transition-colors"
        >
          検索
        </button>
      </form>

      <button
        type="button"
        onClick={() => router.push('/search')}
        aria-label="記事検索ページへ"
        className="md:hidden inline-flex items-center justify-center rounded-full border border-gray-200 bg-white p-2 text-gray-600 hover:text-cyan-600 hover:border-cyan-400 transition-colors"
      >
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>
    </div>
  )
}
