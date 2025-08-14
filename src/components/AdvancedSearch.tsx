'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Filter, X, Clock, User, Tag, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface SearchFilters {
  category: string
  difficulty: string
  contentType: string
  readingTime: string
  sortBy: string
}

interface AdvancedSearchProps {
  initialQuery?: string
  initialFilters?: Partial<SearchFilters>
  placeholder?: string
  onSearch?: (query: string, filters: SearchFilters) => void
}

const categories = [
  { value: '', label: 'すべてのカテゴリー' },
  { value: '基礎知識・入門', label: '基礎知識・入門' },
  { value: 'キャリア・資格', label: 'キャリア・資格' },
  { value: '給与・待遇', label: '給与・待遇' },
  { value: '実務・ノウハウ', label: '実務・ノウハウ' },
  { value: '職場別情報', label: '職場別情報' },
]

const difficulties = [
  { value: '', label: 'すべてのレベル' },
  { value: 'beginner', label: '初心者向け' },
  { value: 'intermediate', label: '中級者向け' },
  { value: 'advanced', label: '上級者向け' },
]

const contentTypes = [
  { value: '', label: 'すべての種類' },
  { value: 'howto', label: 'ハウツー・ガイド' },
  { value: 'experience', label: '体験談・実例' },
  { value: 'comparison', label: '比較・選び方' },
  { value: 'faq', label: '相談・FAQ' },
  { value: 'list', label: 'まとめ・リスト' },
]

const readingTimes = [
  { value: '', label: 'すべての長さ' },
  { value: '0-3', label: '3分以内' },
  { value: '3-7', label: '3-7分' },
  { value: '7-15', label: '7-15分' },
  { value: '15+', label: '15分以上' },
]

const sortOptions = [
  { value: 'relevance', label: '関連度順' },
  { value: 'newest', label: '新しい順' },
  { value: 'oldest', label: '古い順' },
  { value: 'reading-time-asc', label: '短い順' },
  { value: 'reading-time-desc', label: '長い順' },
]

export default function AdvancedSearch({ 
  initialQuery = '', 
  initialFilters = {},
  placeholder = "記事やキーワードを検索...",
  onSearch 
}: AdvancedSearchProps) {
  const [query, setQuery] = useState(initialQuery)
  const [filters, setFilters] = useState<SearchFilters>({
    category: initialFilters.category || '',
    difficulty: initialFilters.difficulty || '',
    contentType: initialFilters.contentType || '',
    readingTime: initialFilters.readingTime || '',
    sortBy: initialFilters.sortBy || 'relevance',
  })
  const [showFilters, setShowFilters] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  
  const router = useRouter()

  // 人気キーワード
  const popularKeywords = useMemo(() => [
    '看護助手 給料', '未経験', '夜勤', 'ボーナス', '志望動機',
    '面接', '医療用語', '患者移送', '制服', '転職'
  ], [])

  // 検索候補の生成（実際の実装では Sanity から取得）
  const generateSuggestions = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSuggestions(popularKeywords.slice(0, 5))
      return
    }

    const filtered = popularKeywords.filter(keyword =>
      keyword.toLowerCase().includes(searchQuery.toLowerCase())
    )
    
    // 実際の実装では、記事タイトルやタグからも候補を生成
    const additionalSuggestions = [
      `${searchQuery} とは`,
      `${searchQuery} 方法`,
      `${searchQuery} コツ`,
      `${searchQuery} 注意点`
    ]

    setSuggestions([...filtered, ...additionalSuggestions].slice(0, 8))
  }, [popularKeywords])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      generateSuggestions(query)
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [query, generateSuggestions])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    performSearch()
  }

  const performSearch = () => {
    const trimmedQuery = query.trim()
    if (!trimmedQuery && !hasActiveFilters()) return

    setShowSuggestions(false)

    if (onSearch) {
      onSearch(trimmedQuery, filters)
    } else {
      const params = new URLSearchParams()
      if (trimmedQuery) params.set('q', trimmedQuery)
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value)
      })

      router.push(`/search?${params.toString()}`)
    }
  }

  const hasActiveFilters = () => {
    return Object.values(filters).some(value => value && value !== 'relevance')
  }

  const clearFilters = () => {
    setFilters({
      category: '',
      difficulty: '',
      contentType: '',
      readingTime: '',
      sortBy: 'relevance',
    })
  }

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    setShowSuggestions(false)
    // 即座に検索実行
    setTimeout(() => performSearch(), 0)
  }

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(value => value && value !== 'relevance').length
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* メイン検索フォーム */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-professional-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder={placeholder}
                className="w-full pl-10 pr-4 py-3 border border-professional-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-medical-500 bg-white shadow-sm"
                autoComplete="off"
              />
            </div>

            {/* 検索候補 */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-professional-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full px-4 py-2 text-left hover:bg-medical-50 flex items-center gap-2 text-sm"
                  >
                    <Search className="w-3 h-3 text-professional-400" />
                    <span className="text-professional-700">{suggestion}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* フィルタートグル */}
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-3 relative"
          >
            <Filter className="w-4 h-4 mr-2" />
            フィルター
            {showFilters ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
            {getActiveFilterCount() > 0 && (
              <Badge variant="medical" className="absolute -top-2 -right-2 min-w-[1.25rem] h-5 text-xs">
                {getActiveFilterCount()}
              </Badge>
            )}
          </Button>

          {/* 検索実行ボタン */}
          <Button type="submit" className="px-6 py-3">
            検索
          </Button>
        </div>
      </form>

      {/* フィルターパネル */}
      {showFilters && (
        <div className="mt-4 p-6 bg-gradient-to-br from-medical-50/50 to-clean-50/50 border border-professional-200 rounded-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* カテゴリー */}
            <div>
              <label className="block text-sm font-medium text-professional-700 mb-2">
                カテゴリー
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full p-2 border border-professional-300 rounded-lg focus:ring-2 focus:ring-medical-500 focus:border-medical-500 bg-white text-sm"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* 難易度 */}
            <div>
              <label className="block text-sm font-medium text-professional-700 mb-2">
                <User className="inline w-4 h-4 mr-1" />
                対象レベル
              </label>
              <select
                value={filters.difficulty}
                onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                className="w-full p-2 border border-professional-300 rounded-lg focus:ring-2 focus:ring-medical-500 focus:border-medical-500 bg-white text-sm"
              >
                {difficulties.map(diff => (
                  <option key={diff.value} value={diff.value}>{diff.label}</option>
                ))}
              </select>
            </div>

            {/* コンテンツ種類 */}
            <div>
              <label className="block text-sm font-medium text-professional-700 mb-2">
                <Tag className="inline w-4 h-4 mr-1" />
                記事の種類
              </label>
              <select
                value={filters.contentType}
                onChange={(e) => handleFilterChange('contentType', e.target.value)}
                className="w-full p-2 border border-professional-300 rounded-lg focus:ring-2 focus:ring-medical-500 focus:border-medical-500 bg-white text-sm"
              >
                {contentTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            {/* 読了時間 */}
            <div>
              <label className="block text-sm font-medium text-professional-700 mb-2">
                <Clock className="inline w-4 h-4 mr-1" />
                読了時間
              </label>
              <select
                value={filters.readingTime}
                onChange={(e) => handleFilterChange('readingTime', e.target.value)}
                className="w-full p-2 border border-professional-300 rounded-lg focus:ring-2 focus:ring-medical-500 focus:border-medical-500 bg-white text-sm"
              >
                {readingTimes.map(time => (
                  <option key={time.value} value={time.value}>{time.label}</option>
                ))}
              </select>
            </div>

            {/* ソート */}
            <div>
              <label className="block text-sm font-medium text-professional-700 mb-2">
                並び順
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full p-2 border border-professional-300 rounded-lg focus:ring-2 focus:ring-medical-500 focus:border-medical-500 bg-white text-sm"
              >
                {sortOptions.map(sort => (
                  <option key={sort.value} value={sort.value}>{sort.label}</option>
                ))}
              </select>
            </div>

            {/* フィルタークリア */}
            <div className="flex items-end">
              {hasActiveFilters() && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={clearFilters}
                  className="w-full"
                >
                  <X className="w-4 h-4 mr-1" />
                  クリア
                </Button>
              )}
            </div>
          </div>

          {/* アクティブフィルター表示 */}
          {hasActiveFilters() && (
            <div className="mt-4 pt-4 border-t border-professional-200">
              <p className="text-sm text-professional-600 mb-2">適用中のフィルター:</p>
              <div className="flex flex-wrap gap-2">
                {filters.category && (
                  <Badge variant="medical" className="text-xs">
                    カテゴリー: {categories.find(c => c.value === filters.category)?.label}
                  </Badge>
                )}
                {filters.difficulty && (
                  <Badge variant="clean" className="text-xs">
                    レベル: {difficulties.find(d => d.value === filters.difficulty)?.label}
                  </Badge>
                )}
                {filters.contentType && (
                  <Badge variant="medical" className="text-xs">
                    種類: {contentTypes.find(t => t.value === filters.contentType)?.label}
                  </Badge>
                )}
                {filters.readingTime && (
                  <Badge variant="clean" className="text-xs">
                    時間: {readingTimes.find(t => t.value === filters.readingTime)?.label}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 人気キーワード */}
      {!query && (
        <div className="mt-4">
          <p className="text-sm text-professional-600 mb-2">人気のキーワード:</p>
          <div className="flex flex-wrap gap-2">
            {popularKeywords.slice(0, 10).map((keyword, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSuggestionClick(keyword)}
                className="text-xs px-3 py-1 bg-professional-100 text-professional-700 rounded-full hover:bg-medical-100 hover:text-medical-700 transition-colors"
              >
                {keyword}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}