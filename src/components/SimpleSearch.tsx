'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface SimpleSearchProps {
  placeholder?: string
}

export default function SimpleSearch({ placeholder = "記事を検索..." }: SimpleSearchProps) {
  const [query, setQuery] = useState('')
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit(e as React.FormEvent)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
        autoComplete="off"
      />
      <button
        type="submit"
        disabled={!query.trim()}
        className="px-4 py-2 bg-gray-900 text-white border border-gray-900 rounded-r-md text-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        検索
      </button>
    </form>
  )
}