'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { pageview, trackPerformance } from '@/lib/analytics'

export default function Analytics() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')

    // ページビューを送信
    pageview(url)

    // パフォーマンス計測（ページロード後に実行）
    const timer = setTimeout(() => {
      trackPerformance()
    }, 1000)

    // アフィリエイトリンクのクリック計測
    const handleAffiliateClick = (e: MouseEvent) => {
      // ターゲットがElementかどうかを確認（TextNodeやDocumentなどの場合は無視）
      if (!(e.target instanceof Element)) return

      const target = e.target.closest('a[data-affiliate-link="true"]')

      if (target) {
        const href = target.getAttribute('href')
        const provider = target.getAttribute('data-provider') || 'unknown'
        const isExternal = target.getAttribute('data-external') === 'true'

        // GA4イベント送信
        if (typeof window.gtag === 'function') {
          window.gtag('event', 'affiliate_click', {
            event_category: 'affiliate',
            event_label: href,
            provider: provider,
            is_external: isExternal,
            page_location: url
          })
          console.log('Affiliate Click Tracked:', href)
        }
      }
    }

    document.addEventListener('click', handleAffiliateClick)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('click', handleAffiliateClick)
    }
  }, [pathname, searchParams])

  return null
}