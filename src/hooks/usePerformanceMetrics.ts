'use client'

import { useEffect, useState } from 'react'

interface PerformanceMetrics {
  // Core Web Vitals
  FCP: number | null // First Contentful Paint
  LCP: number | null // Largest Contentful Paint
  FID: number | null // First Input Delay
  CLS: number | null // Cumulative Layout Shift
  
  // その他のメトリクス
  TTFB: number | null // Time to First Byte
  domContentLoaded: number | null
  windowLoaded: number | null
  
  // カスタムメトリクス
  navigationStart: number | null
  responseStart: number | null
  domComplete: number | null
}

interface UsePerformanceMetricsOptions {
  reportToConsole?: boolean
  reportInterval?: number
  enableWebVitals?: boolean
}

export function usePerformanceMetrics(options: UsePerformanceMetricsOptions = {}) {
  const {
    reportToConsole = false,
    reportInterval = 30000, // 30秒間隔
    enableWebVitals = true
  } = options

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    FCP: null,
    LCP: null,
    FID: null,
    CLS: null,
    TTFB: null,
    domContentLoaded: null,
    windowLoaded: null,
    navigationStart: null,
    responseStart: null,
    domComplete: null
  })

  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Performance API のサポート確認
    const supported = 'performance' in window && 'getEntriesByType' in window.performance
    setIsSupported(supported)

    if (!supported) {
      console.warn('Performance API is not supported in this browser')
      return
    }

    // 基本的なタイミング情報を取得
    const collectBasicMetrics = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming

      if (navigation) {
        setMetrics(prev => ({
          ...prev,
          navigationStart: navigation.startTime,
          responseStart: navigation.responseStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.startTime,
          windowLoaded: navigation.loadEventEnd - navigation.startTime,
          domComplete: navigation.domComplete - navigation.startTime,
          TTFB: navigation.responseStart - navigation.requestStart
        }))
      }
    }

    // Web Vitals の収集
    const collectWebVitals = () => {
      if (!enableWebVitals) return

      // Performance Observer を使用してメトリクスを取得
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          switch (entry.entryType) {
            case 'paint':
              if (entry.name === 'first-contentful-paint') {
                setMetrics(prev => ({
                  ...prev,
                  FCP: Math.round(entry.startTime)
                }))
              }
              break
            
            case 'largest-contentful-paint':
              setMetrics(prev => ({
                ...prev,
                LCP: Math.round(entry.startTime)
              }))
              break
            
            case 'first-input':
              setMetrics(prev => ({
                ...prev,
                FID: Math.round(((entry as unknown) as { processingStart: number }).processingStart - entry.startTime)
              }))
              break
            
            case 'layout-shift':
              if (!((entry as unknown) as { hadRecentInput: boolean }).hadRecentInput) {
                setMetrics(prev => ({
                  ...prev,
                  CLS: prev.CLS ? prev.CLS + ((entry as unknown) as { value: number }).value : ((entry as unknown) as { value: number }).value
                }))
              }
              break
          }
        })
      })

      // 各メトリクスタイプを監視
      try {
        observer.observe({ entryTypes: ['paint'] })
        observer.observe({ entryTypes: ['largest-contentful-paint'] })
        observer.observe({ entryTypes: ['first-input'] })
        observer.observe({ entryTypes: ['layout-shift'] })
      } catch (error) {
        console.warn('Some performance metrics are not supported:', error)
      }

      return observer
    }

    // 初回計測
    collectBasicMetrics()
    const observer = collectWebVitals()

    // 定期レポート
    const reportIntervalId = setInterval(() => {
      if (reportToConsole) {
        console.group('📊 Performance Metrics')
        console.table(metrics)
        console.groupEnd()
      }

      // カスタムイベントを発火してアナリティクスに送信可能
      window.dispatchEvent(new CustomEvent('performanceMetrics', {
        detail: metrics
      }))
    }, reportInterval)

    // ページ離脱時に最終メトリクスを取得
    const handleBeforeUnload = () => {
      collectBasicMetrics()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      if (observer) observer.disconnect()
      clearInterval(reportIntervalId)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [enableWebVitals, reportToConsole, reportInterval, metrics])

  // パフォーマンススコアの計算
  const getPerformanceScore = (): {
    overall: number
    scores: {
      FCP: number
      LCP: number
      FID: number
      CLS: number
    }
  } => {
    const scoreThresholds = {
      FCP: { good: 1800, poor: 3000 },
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 }
    }

    const calculateScore = (value: number | null, thresholds: { good: number; poor: number }) => {
      if (value === null) return 0
      if (value <= thresholds.good) return 100
      if (value <= thresholds.poor) return 50
      return 25
    }

    const scores = {
      FCP: calculateScore(metrics.FCP, scoreThresholds.FCP),
      LCP: calculateScore(metrics.LCP, scoreThresholds.LCP),
      FID: calculateScore(metrics.FID, scoreThresholds.FID),
      CLS: metrics.CLS ? (metrics.CLS <= scoreThresholds.CLS.good ? 100 : 
           metrics.CLS <= scoreThresholds.CLS.poor ? 50 : 25) : 0
    }

    const overall = Math.round((scores.FCP + scores.LCP + scores.FID + scores.CLS) / 4)

    return { overall, scores }
  }

  // メトリクスの人間向けフォーマット
  const formatMetrics = () => {
    return {
      FCP: metrics.FCP ? `${Math.round(metrics.FCP)}ms` : 'N/A',
      LCP: metrics.LCP ? `${Math.round(metrics.LCP)}ms` : 'N/A',
      FID: metrics.FID ? `${Math.round(metrics.FID)}ms` : 'N/A',
      CLS: metrics.CLS ? `${Math.round(metrics.CLS * 1000) / 1000}` : 'N/A',
      TTFB: metrics.TTFB ? `${Math.round(metrics.TTFB)}ms` : 'N/A',
      domContentLoaded: metrics.domContentLoaded ? `${Math.round(metrics.domContentLoaded)}ms` : 'N/A',
      windowLoaded: metrics.windowLoaded ? `${Math.round(metrics.windowLoaded)}ms` : 'N/A'
    }
  }

  // パフォーマンス改善の推奨事項
  const getRecommendations = (): string[] => {
    const recommendations: string[] = []

    if (metrics.FCP && metrics.FCP > 3000) {
      recommendations.push('First Contentful Paint が遅いです。画像最適化やリソースの優先読み込みを検討してください。')
    }

    if (metrics.LCP && metrics.LCP > 4000) {
      recommendations.push('Largest Contentful Paint が遅いです。画像のサイズ最適化や遅延読み込みを見直してください。')
    }

    if (metrics.FID && metrics.FID > 300) {
      recommendations.push('First Input Delay が長いです。JavaScriptの実行時間を最適化してください。')
    }

    if (metrics.CLS && metrics.CLS > 0.25) {
      recommendations.push('Cumulative Layout Shift が大きいです。画像やフォントの読み込みによるレイアウトシフトを改善してください。')
    }

    if (metrics.TTFB && metrics.TTFB > 800) {
      recommendations.push('Time to First Byte が遅いです。サーバーの応答速度を改善してください。')
    }

    return recommendations
  }

  return {
    metrics,
    isSupported,
    getPerformanceScore,
    formatMetrics,
    getRecommendations
  }
}

// Analytics への送信用ヘルパー関数
export const sendMetricsToAnalytics = (metrics: PerformanceMetrics) => {
  if (typeof window !== 'undefined' && (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag) {
    // Google Analytics 4 への送信例
    ;((window as unknown) as { gtag: (...args: unknown[]) => void }).gtag('event', 'web_vitals', {
      custom_parameter_1: metrics.FCP,
      custom_parameter_2: metrics.LCP,
      custom_parameter_3: metrics.FID,
      custom_parameter_4: metrics.CLS
    })
  }

  // 他のアナリティクスサービスへの送信も可能
  console.log('📈 Metrics sent to analytics:', metrics)
}