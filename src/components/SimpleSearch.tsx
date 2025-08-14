'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

interface SimpleSearchProps {
  placeholder?: string
  className?: string
}

export default function SimpleSearch({ 
  placeholder = "記事を検索...",
  className = "w-full max-w-md"
}: SimpleSearchProps) {
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
    <form onSubmit={handleSubmit} className={className}>
      <div className="relative flex">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-professional-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-3 border border-professional-300 rounded-l-xl text-base focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-medical-500 bg-white shadow-sm"
            autoComplete="off"
          />
        </div>
        <button
          type="submit"
          disabled={!query.trim()}
          className="px-6 py-3 bg-medical-600 text-white border border-medical-600 rounded-r-xl text-base font-medium hover:bg-medical-700 focus:outline-none focus:ring-2 focus:ring-medical-500 focus:ring-offset-2 disabled:bg-professional-300 disabled:border-professional-300 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
        >
          検索
        </button>
      </div>
    </form>
  )
}