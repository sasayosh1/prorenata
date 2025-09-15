// Google Analytics 4 設定

declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js',
      targetId: string | Date,
      config?: Record<string, unknown>
    ) => void
    dataLayer: Record<string, unknown>[]
  }
}

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID

// ページビューを送信
export const pageview = (url: string) => {
  if (!GA_TRACKING_ID || typeof window === 'undefined' || !window.gtag) return

  window.gtag('config', GA_TRACKING_ID, {
    page_location: url,
  })
}

// カスタムイベントを送信
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string
  category: string
  label?: string
  value?: number
}) => {
  if (!GA_TRACKING_ID || typeof window === 'undefined' || !window.gtag) return

  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  })
}

// 記事閲覧イベント
export const trackArticleView = (articleTitle: string) => {
  event({
    action: 'view_article',
    category: 'engagement',
    label: articleTitle,
  })
}

// 検索イベント
export const trackSearch = (searchTerm: string, resultCount: number) => {
  event({
    action: 'search',
    category: 'engagement',
    label: searchTerm,
    value: resultCount,
  })
}

// 外部リンククリックイベント
export const trackExternalLink = (url: string) => {
  event({
    action: 'click_external_link',
    category: 'engagement',
    label: url,
  })
}

// パフォーマンス計測
export const trackPerformance = () => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    
    if (navigation) {
      // ページロード時間
      const loadTime = navigation.loadEventEnd - navigation.loadEventStart
      
      event({
        action: 'page_load_time',
        category: 'performance',
        value: Math.round(loadTime),
      })
      
      // DOM準備時間
      const domTime = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart
      
      event({
        action: 'dom_ready_time',
        category: 'performance',
        value: Math.round(domTime),
      })
    }
  }
}