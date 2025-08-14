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
        className="search-input flex-1 rounded-l-lg rounded-r-none border-r-0"
        autoComplete="off"
      />
      <button
        type="submit"
        disabled={!query.trim()}
        className="search-button rounded-l-none rounded-r-lg border-l-0"
      >
        🔍 検索
      </button>
    </form>
  )
}