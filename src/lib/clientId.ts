"use client";

/**
 * ブラウザごとの匿名IDを管理するユーティリティ
 */
function tryGetCookie(name: string): string | null {
    try {
        const match = document.cookie
            .split(";")
            .map((c) => c.trim())
            .find((c) => c.startsWith(`${name}=`));
        if (!match) return null;
        return decodeURIComponent(match.slice(name.length + 1));
    } catch {
        return null;
    }
}

function trySetCookie(name: string, value: string) {
    try {
        document.cookie = `${name}=${encodeURIComponent(value)}; max-age=31536000; path=/`;
    } catch {
        // noop
    }
}

function generateUuidV4(): string {
    const cryptoObj = globalThis.crypto as Crypto | undefined;
    if (cryptoObj && typeof cryptoObj.randomUUID === "function") {
        return cryptoObj.randomUUID();
    }

    if (cryptoObj && typeof cryptoObj.getRandomValues === "function") {
        const bytes = new Uint8Array(16);
        cryptoObj.getRandomValues(bytes);
        // RFC 4122 v4
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }

    // Last resort fallback (not cryptographically strong, but avoids crashes)
    return `id-${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
}

export function getClientId(): string {
    if (typeof window === "undefined") return "server-side";

    const STORAGE_KEY = "prorenata-client-id";
    let id: string | null = null;

    // Prefer localStorage, fall back to cookie (Safari private mode can throw on localStorage)
    try {
        id = localStorage.getItem(STORAGE_KEY);
    } catch {
        id = null;
    }
    if (!id) {
        id = tryGetCookie(STORAGE_KEY);
    }

    if (!id) {
        id = generateUuidV4();
        try {
            localStorage.setItem(STORAGE_KEY, id);
        } catch {
            // ignore
        }
        trySetCookie(STORAGE_KEY, id);
    }

    return id;
}
