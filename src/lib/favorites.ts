// お気に入り・ブックマーク機能
// ローカルストレージを使用してクライアントサイドで管理

type StoredCategory = string | { title?: string | null }

export interface FavoritePost {
  _id: string
  title: string
  slug: string
  excerpt?: string
  publishedAt: string
  readingTime?: number
  contentType?: string
  categories?: StoredCategory[]
  addedAt: string
}

const FAVORITES_KEY = 'prorenata_favorites'
const READING_HISTORY_KEY = 'prorenata_reading_history'
const RECENT_SEARCHES_KEY = 'prorenata_recent_searches'

// お気に入り管理
export const favorites = {
  // お気に入り一覧を取得
  getAll(): FavoritePost[] {
    if (typeof window === 'undefined') return []
    
    try {
      const stored = localStorage.getItem(FAVORITES_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('お気に入り取得エラー:', error)
      return []
    }
  },

  // 記事がお気に入りかチェック
  has(postId: string): boolean {
    return this.getAll().some(fav => fav._id === postId)
  },

  // お気に入りに追加
  add(post: {
    _id: string
    title: string
    slug: { current: string }
    excerpt?: string
    publishedAt: string
    readingTime?: number
    contentType?: string
    tags?: string[]
    categories?: StoredCategory[]
  }): boolean {
    if (typeof window === 'undefined') return false
    
    try {
      const favorites = this.getAll()
      
      // 既に存在する場合は何もしない
      if (this.has(post._id)) {
        return false
      }

      const newFavorite: FavoritePost = {
        _id: post._id,
        title: post.title,
        slug: post.slug.current,
        excerpt: post.excerpt,
        publishedAt: post.publishedAt,
        readingTime: post.readingTime,
        contentType: post.contentType,
        categories: post.categories ?? post.tags,
        addedAt: new Date().toISOString()
      }

      const updated = [newFavorite, ...favorites]
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated))
      
      // カスタムイベントを発火してUIを更新
      window.dispatchEvent(new CustomEvent('favoritesChanged'))
      return true
    } catch (error) {
      console.error('お気に入り追加エラー:', error)
      return false
    }
  },

  // お気に入りから削除
  remove(postId: string): boolean {
    if (typeof window === 'undefined') return false
    
    try {
      const favorites = this.getAll()
      const updated = favorites.filter(fav => fav._id !== postId)
      
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated))
      
      // カスタムイベントを発火してUIを更新
      window.dispatchEvent(new CustomEvent('favoritesChanged'))
      return true
    } catch (error) {
      console.error('お気に入り削除エラー:', error)
      return false
    }
  },

  // お気に入りをトグル
  toggle(post: { _id: string; title: string; slug: { current: string }; excerpt?: string; contentType?: string; tags?: string[]; categories?: StoredCategory[]; readingTime?: number; publishedAt?: string }): boolean {
    return this.has(post._id) ? this.remove(post._id) : this.add({
      ...post,
      publishedAt: post.publishedAt || new Date().toISOString()
    })
  },

  // お気に入り数を取得
  count(): number {
    return this.getAll().length
  },

  // お気に入りをクリア
  clear(): void {
    if (typeof window === 'undefined') return
    
    localStorage.removeItem(FAVORITES_KEY)
    window.dispatchEvent(new CustomEvent('favoritesChanged'))
  }
}

// 読書履歴管理
export const readingHistory = {
  // 履歴を取得
  getAll(): FavoritePost[] {
    if (typeof window === 'undefined') return []
    
    try {
      const stored = localStorage.getItem(READING_HISTORY_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('読書履歴取得エラー:', error)
      return []
    }
  },

  // 記事を履歴に追加
  add(post: { _id: string; title: string; slug: { current: string }; excerpt?: string; contentType?: string; tags?: string[]; categories?: StoredCategory[]; readingTime?: number; publishedAt: string }): void {
    if (typeof window === 'undefined') return
    
    try {
      let history = this.getAll()
      
      // 既存の履歴から同じ記事を削除
      history = history.filter(item => item._id !== post._id)
      
      // 新しい履歴を先頭に追加
      const newHistoryItem: FavoritePost = {
        _id: post._id,
        title: post.title,
        slug: post.slug.current,
        excerpt: post.excerpt,
        publishedAt: post.publishedAt,
        readingTime: post.readingTime,
        contentType: post.contentType,
        categories: post.categories ?? post.tags,
        addedAt: new Date().toISOString()
      }
      
      history.unshift(newHistoryItem)
      
      // 最大50件まで保持
      if (history.length > 50) {
        history = history.slice(0, 50)
      }
      
      localStorage.setItem(READING_HISTORY_KEY, JSON.stringify(history))
    } catch (error) {
      console.error('読書履歴追加エラー:', error)
    }
  },

  // 履歴をクリア
  clear(): void {
    if (typeof window === 'undefined') return
    
    localStorage.removeItem(READING_HISTORY_KEY)
  }
}

// 最近の検索履歴管理
export const recentSearches = {
  // 検索履歴を取得
  getAll(): string[] {
    if (typeof window === 'undefined') return []
    
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('検索履歴取得エラー:', error)
      return []
    }
  },

  // 検索キーワードを追加
  add(query: string): void {
    if (typeof window === 'undefined' || !query.trim()) return
    
    try {
      let searches = this.getAll()
      
      // 既存の同じクエリを削除
      searches = searches.filter(search => search !== query)
      
      // 新しいクエリを先頭に追加
      searches.unshift(query)
      
      // 最大10件まで保持
      if (searches.length > 10) {
        searches = searches.slice(0, 10)
      }
      
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches))
    } catch (error) {
      console.error('検索履歴追加エラー:', error)
    }
  },

  // 検索履歴をクリア
  clear(): void {
    if (typeof window === 'undefined') return
    
    localStorage.removeItem(RECENT_SEARCHES_KEY)
  }
}

// 統計情報
export const userStats = {
  // ユーザーの利用統計を取得
  getStats() {
    return {
      favoritesCount: favorites.count(),
      readingHistoryCount: readingHistory.getAll().length,
      recentSearchesCount: recentSearches.getAll().length
    }
  },

  // すべてのデータをクリア
  clearAll(): void {
    favorites.clear()
    readingHistory.clear()
    recentSearches.clear()
  }
}
