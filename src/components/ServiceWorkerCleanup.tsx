"use client";

import { useEffect } from "react";

export default function ServiceWorkerCleanup() {
  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (typeof window === "undefined") return;
      if (!("serviceWorker" in navigator)) return;

      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        if (cancelled) return;

        await Promise.all(
          registrations.map(async (registration) => {
            const scriptUrl = registration.active?.scriptURL || registration.installing?.scriptURL || "";
            // 画像が消える等の「キャッシュ暴走」対策として、sw.js系のみ確実に解除する
            if (scriptUrl.endsWith("/sw.js") || scriptUrl.includes("workbox")) {
              await registration.unregister();
            }
          })
        );

        if (!("caches" in window)) return;
        const keys = await caches.keys();
        if (cancelled) return;

        await Promise.all(
          keys.map(async (key) => {
            // workbox/next系のキャッシュだけを削除（originスコープ内）
            if (/^workbox-|^next-|next\.cache|_next/i.test(key) || /^prorenata-/i.test(key)) {
              await caches.delete(key);
            }
          })
        );
      } catch {
        // noop
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
