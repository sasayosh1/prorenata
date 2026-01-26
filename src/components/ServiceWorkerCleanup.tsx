"use client";

import { useEffect } from "react";

/**
 * ServiceWorkerCleanup - Zero-Trust Specification
 * 
 * すべての Service Worker を強制解除し、関連する全ブラウザキャッシュを削除します。
 * これにより、古いバージョンのサイト（特にPWA/Workbox関連）が残る問題を根本的に解決します。
 */
export default function ServiceWorkerCleanup() {
  useEffect(() => {
    let cancelled = false;

    async function clearAllCachesAndSWs() {
      if (typeof window === "undefined") return;

      // 1. すべての Service Worker を強制的に解除
      if ("serviceWorker" in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          let swCleared = false;

          for (const registration of registrations) {
            await registration.unregister();
            swCleared = true;
          }

          if (swCleared && !cancelled) {
            console.log("Service Worker cleared.");
          }
        } catch (error) {
          console.error("Failed to unregister Service Worker:", error);
        }
      }

      // 2. すべての Cache Storage を削除
      if ("caches" in window) {
        try {
          const cacheKeys = await caches.keys();
          let cacheCleared = false;

          for (const key of cacheKeys) {
            await caches.delete(key);
            cacheCleared = true;
          }

          if (cacheCleared && !cancelled) {
            console.log("Caches cleared.");
          }
        } catch (error) {
          console.error("Failed to clear caches:", error);
        }
      }

      // 3. 実行後に一度だけリロードが必要な場合（オプション）
      // 現在はコンポーネントがマウントされるたびに走るため、無限ループを避けるため自動リロードは保留
    }

    void clearAllCachesAndSWs();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
