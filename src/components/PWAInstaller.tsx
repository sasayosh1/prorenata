'use client'

import { useState, useEffect } from 'react'
import { Download, X, Smartphone, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}

export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [swRegistered, setSwRegistered] = useState(false)

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })
      
      console.log('✅ Service Worker: Registered successfully', registration.scope)
      setSwRegistered(true)

      // Service Worker の更新チェック
      registration.addEventListener('updatefound', () => {
        console.log('🔄 Service Worker: Update found')
        const newWorker = registration.installing
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🆕 Service Worker: New version available')
              // ユーザーに更新を通知
              showUpdateNotification()
            }
          })
        }
      })

      // Service Worker からのメッセージ受信
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { type, payload } = event.data
        console.log('📨 Service Worker message:', type, payload)
      })

    } catch (error) {
      console.error('❌ Service Worker: Registration failed', error)
    }
  }

  useEffect(() => {
    // Service Worker 登録
    if ('serviceWorker' in navigator && !swRegistered) {
      registerServiceWorker()
    }

    // インストールプロンプトの準備
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      console.log('💫 PWA: Install prompt available')
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallPrompt(true)
    }

    // PWAがインストールされた時
    const handleAppInstalled = () => {
      console.log('✅ PWA: App installed successfully')
      setIsInstalled(true)
      setShowInstallPrompt(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // 既にインストール済みかチェック
    checkIfInstalled()

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkIfInstalled = () => {
    // PWAがスタンドアロンモードで起動しているかチェック
    if (window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as { standalone?: boolean }).standalone === true) {
      setIsInstalled(true)
      setShowInstallPrompt(false)
    }
  }

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      console.log('🚀 PWA: Showing install prompt')
      await deferredPrompt.prompt()
      
      const { outcome } = await deferredPrompt.userChoice
      console.log('🎯 PWA: User choice:', outcome)
      
      if (outcome === 'accepted') {
        console.log('👍 PWA: User accepted installation')
      } else {
        console.log('👎 PWA: User dismissed installation')
      }
      
      setDeferredPrompt(null)
      setShowInstallPrompt(false)
    } catch (error) {
      console.error('❌ PWA: Install prompt failed', error)
    }
  }

  const showUpdateNotification = () => {
    // ユーザーに新しいバージョンが利用可能であることを通知
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('ProReNata アップデート', {
        body: '新しいバージョンが利用可能です。ページを再読み込みして更新してください。',
        icon: '/icon-192x192.png',
        tag: 'app-update'
      })
    }
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
  }

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        console.log('✅ Notification permission granted')
      }
    }
  }

  // モバイルデバイスかどうかの判定
  const isMobile = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )

  if (isInstalled || !showInstallPrompt) {
    return null
  }

  return (
    <>
      {/* インストールバナー */}
      <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
        <div className="bg-gradient-to-r from-medical-500 to-medical-600 text-white rounded-xl shadow-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {isMobile ? (
                <Smartphone className="w-6 h-6" />
              ) : (
                <Monitor className="w-6 h-6" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base mb-1">
                ProReNataをインストール
              </h3>
              <p className="text-sm text-medical-50 mb-3 leading-relaxed">
                {isMobile 
                  ? 'ホーム画面に追加して、いつでも看護助手の情報にアクセス'
                  : 'アプリとしてインストールして、より快適に利用'
                }
              </p>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleInstallClick}
                  size="sm"
                  className="bg-white text-medical-600 hover:bg-medical-50 font-medium"
                >
                  <Download className="w-4 h-4 mr-1.5" />
                  インストール
                </Button>
                <Button
                  onClick={handleDismiss}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-medical-400/20"
                >
                  後で
                </Button>
              </div>
            </div>
            
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 text-medical-50 hover:text-white transition-colors p-1"
              aria-label="閉じる"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 通知許可リクエスト */}
      <div className="fixed top-4 right-4 z-50 max-w-sm">
        <div className="bg-white border border-professional-200 rounded-lg shadow-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-medical-100 flex items-center justify-center flex-shrink-0">
              <span className="text-medical-600 text-sm">🔔</span>
            </div>
            
            <div className="flex-1">
              <h4 className="font-medium text-professional-900 mb-1">
                通知を有効にしますか？
              </h4>
              <p className="text-sm text-professional-600 mb-3">
                新しい記事の投稿をお知らせします
              </p>
              
              <div className="flex gap-2">
                <Button
                  onClick={requestNotificationPermission}
                  size="sm"
                  variant="outline"
                >
                  許可
                </Button>
                <Button
                  onClick={() => {}}
                  size="sm"
                  variant="ghost"
                >
                  後で
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// Service Workerの状態を監視するカスタムフック
export function useServiceWorker() {
  const [swState, setSwState] = useState<'loading' | 'registered' | 'error'>('loading')

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then(() => {
          setSwState('registered')
          console.log('✅ Service Worker: Ready')
        })
        .catch(() => {
          setSwState('error')
          console.error('❌ Service Worker: Error')
        })
    } else {
      setSwState('error')
    }
  }, [])

  return swState
}