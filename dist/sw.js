// ProReNata Service Worker
// キャッシュ戦略とオフライン機能を提供

const CACHE_NAME = 'prorenata-v1.4.0'
const OFFLINE_URL = '/offline'

// キャッシュするリソース
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/search',
  '/favorites', 
  '/community',
  '/nursing-assistant',
  '/manifest.json'
]

// 動的にキャッシュするパターン
const CACHE_PATTERNS = {
  posts: /^\/posts\/.+/,
  api: /^\/api\/.+/,
  images: /\.(png|jpg|jpeg|svg|webp|gif)$/,
  fonts: /\.(woff|woff2|ttf|otf)$/
}

// Service Worker インストール時
self.addEventListener('install', (event) => {
  console.log('[SW] Install event')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully')
        // 新しいService Workerをすぐにアクティブにする
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error)
      })
  )
})

// Service Worker アクティベーション時
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // 古いキャッシュを削除
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('[SW] Service worker activated')
        // すべてのクライアントで新しいService Workerを使用
        return self.clients.claim()
      })
  )
})

// フェッチリクエストの処理
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // 非GETリクエストは処理しない
  if (request.method !== 'GET') {
    return
  }

  // 外部リソースは処理しない
  if (url.origin !== self.location.origin) {
    return
  }

  event.respondWith(handleFetch(request))
})

async function handleFetch(request) {
  const url = new URL(request.url)
  const pathname = url.pathname

  try {
    // ナビゲーションリクエスト（ページ遷移）
    if (request.mode === 'navigate') {
      return await handleNavigation(request)
    }

    // 記事ページ
    if (CACHE_PATTERNS.posts.test(pathname)) {
      return await handlePostPage(request)
    }

    // API リクエスト
    if (CACHE_PATTERNS.api.test(pathname)) {
      return await handleApiRequest(request)
    }

    // 画像リクエスト
    if (CACHE_PATTERNS.images.test(pathname)) {
      return await handleImageRequest(request)
    }

    // フォントリクエスト
    if (CACHE_PATTERNS.fonts.test(pathname)) {
      return await handleFontRequest(request)
    }

    // その他のリクエスト
    return await handleGenericRequest(request)

  } catch (error) {
    console.error('[SW] Fetch error:', error)
    
    // ナビゲーションリクエストの場合はオフラインページを返す
    if (request.mode === 'navigate') {
      return getOfflinePage()
    }
    
    return new Response('Service Unavailable', { 
      status: 503, 
      statusText: 'Service Unavailable' 
    })
  }
}

// ナビゲーションリクエストの処理
async function handleNavigation(request) {
  try {
    // まずネットワークから取得を試みる
    const response = await fetch(request)
    
    if (response.ok) {
      // 成功した場合はキャッシュに保存
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
      return response
    }
    
    throw new Error('Network response not ok')
  } catch (error) {
    console.log('[SW] Navigation network failed, trying cache:', request.url)
    
    // ネットワークが失敗した場合はキャッシュから取得
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // キャッシュにもない場合はオフラインページを返す
    return getOfflinePage()
  }
}

// 記事ページの処理（Stale-While-Revalidate戦略）
async function handlePostPage(request) {
  const cache = await caches.open(CACHE_NAME)
  const cachedResponse = await cache.match(request)
  
  // バックグラウンドでネットワークから更新
  const networkPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone())
      }
      return response
    })
    .catch(() => cachedResponse)
  
  // キャッシュがある場合はすぐに返す
  if (cachedResponse) {
    return cachedResponse
  }
  
  // キャッシュがない場合はネットワークを待つ
  return networkPromise
}

// APIリクエストの処理（Network-First戦略）
async function handleApiRequest(request) {
  try {
    const response = await fetch(request)
    
    if (response.ok) {
      // 成功した場合はキャッシュに保存（短期間）
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    // ネットワークが失敗した場合はキャッシュから取得
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    throw error
  }
}

// 画像リクエストの処理（Cache-First戦略）
async function handleImageRequest(request) {
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    // 画像が取得できない場合のフォールバック
    return new Response('', { status: 404 })
  }
}

// フォントリクエストの処理（Cache-First戦略）
async function handleFontRequest(request) {
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }
  
  const response = await fetch(request)
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME)
    cache.put(request, response.clone())
  }
  return response
}

// 一般的なリクエストの処理
async function handleGenericRequest(request) {
  try {
    const response = await fetch(request)
    return response
  } catch (error) {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    throw error
  }
}

// オフラインページを取得
async function getOfflinePage() {
  const cache = await caches.open(CACHE_NAME)
  const cachedOffline = await cache.match(OFFLINE_URL)
  
  if (cachedOffline) {
    return cachedOffline
  }
  
  // オフラインページがキャッシュにない場合のフォールバック
  return new Response(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>オフライン - ProReNata</title>
      <style>
        body { 
          font-family: system-ui, -apple-system, sans-serif; 
          margin: 0; 
          padding: 2rem; 
          text-align: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
        }
        .container {
          max-width: 500px;
          background: rgba(255,255,255,0.1);
          padding: 2rem;
          border-radius: 1rem;
          backdrop-filter: blur(10px);
        }
        h1 { margin-bottom: 1rem; }
        p { margin-bottom: 1.5rem; line-height: 1.6; }
        .btn {
          display: inline-block;
          padding: 0.75rem 1.5rem;
          background: rgba(255,255,255,0.2);
          color: white;
          text-decoration: none;
          border-radius: 0.5rem;
          border: 1px solid rgba(255,255,255,0.3);
          transition: all 0.3s ease;
        }
        .btn:hover {
          background: rgba(255,255,255,0.3);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>📱 オフラインモード</h1>
        <p>インターネットに接続されていません。<br>接続を確認してページを再読み込みしてください。</p>
        <p>お気に入りに保存した記事は、オフラインでも閲覧できる場合があります。</p>
        <a href="/" class="btn" onclick="window.location.reload()">再試行</a>
      </div>
    </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  })
}

// プッシュ通知の処理
self.addEventListener('push', (event) => {
  if (!event.data) return
  
  const data = event.data.json()
  const options = {
    body: data.body || '新しい記事が投稿されました',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    image: data.image,
    data: data.url,
    actions: [
      {
        action: 'open',
        title: '開く',
        icon: '/icon-open.png'
      },
      {
        action: 'close',
        title: '閉じる',
        icon: '/icon-close.png'
      }
    ],
    requireInteraction: true,
    tag: 'prorenata-notification'
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'ProReNata', options)
  )
})

// 通知クリック時の処理
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  if (event.action === 'close') {
    return
  }
  
  const url = event.notification.data || '/'
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      // 既存のウィンドウがある場合はそれを使用
      for (const client of clients) {
        if (client.url === url && 'focus' in client) {
          return client.focus()
        }
      }
      
      // 新しいウィンドウを開く
      if (self.clients.openWindow) {
        return self.clients.openWindow(url)
      }
    })
  )
})

// バックグラウンド同期
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  try {
    // バックグラウンドで実行する処理
    console.log('[SW] Background sync triggered')
    
    // 例: お気に入りデータの同期
    const clients = await self.clients.matchAll()
    clients.forEach(client => {
      client.postMessage({
        type: 'BACKGROUND_SYNC',
        payload: { message: 'Sync completed' }
      })
    })
  } catch (error) {
    console.error('[SW] Background sync failed:', error)
  }
}

console.log('[SW] Service Worker loaded successfully')