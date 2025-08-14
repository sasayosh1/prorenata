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

    return () => clearTimeout(timer)
  }, [pathname, searchParams])

  return null
}