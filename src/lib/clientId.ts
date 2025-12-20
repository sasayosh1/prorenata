"use client";

/**
 * ブラウザごとの匿名IDを管理するユーティリティ
 */
export function getClientId(): string {
    if (typeof window === "undefined") return "server-side";

    const STORAGE_KEY = "prorenata-client-id";
    let id = localStorage.getItem(STORAGE_KEY);

    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(STORAGE_KEY, id);
    }

    return id;
}
