'use client'

import dynamic from 'next/dynamic'
import { ComponentProps } from 'react'

// 重いコンポーネントの遅延読み込み
export const LazyAdvancedSearch = dynamic(
  () => import('./AdvancedSearch'),
  {
    loading: () => (
      <div className="w-full max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <div className="h-12 bg-professional-200 rounded-xl"></div>
            </div>
            <div className="h-12 w-24 bg-professional-200 rounded-xl"></div>
            <div className="h-12 w-20 bg-medical-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    ),
    ssr: false
  }
)

// PWAインストーラーの遅延読み込み
export const LazyPWAInstaller = dynamic(
  () => import('./PWAInstaller'),
  {
    loading: () => null,
    ssr: false
  }
)

// ダークモードトグルの遅延読み込み
export const LazyDarkModeToggle = dynamic(
  () => import('./DarkModeToggle'),
  {
    loading: () => (
      <div className="w-6 h-6 bg-professional-200 rounded-full animate-pulse"></div>
    ),
    ssr: false
  }
)

// コンポーネントの型定義
export type AdvancedSearchProps = ComponentProps<typeof LazyAdvancedSearch>
export type PWAInstallerProps = ComponentProps<typeof LazyPWAInstaller>
export type DarkModeToggleProps = ComponentProps<typeof LazyDarkModeToggle>