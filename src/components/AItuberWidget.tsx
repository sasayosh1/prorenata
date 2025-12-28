"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { PaperAirplaneIcon, XMarkIcon } from "@heroicons/react/24/solid";

interface Message {
    role: "user" | "model";
    text: string;
}

type ChatAnalyticsContext = {
    chat_session_id: string;
    page_path: string;
};

function safeString(value: unknown, maxLen = 120) {
    const s = String(value ?? "");
    return s.length > maxLen ? s.slice(0, maxLen) : s;
}

function getOrCreateChatSessionId() {
    const KEY_ID = "aituber-chat-session-id";
    const KEY_TS = "aituber-chat-last-activity-ts";
    const now = Date.now();
    const idleResetMs = 30 * 60 * 1000; // 30m

    const read = (key: string) => {
        try {
            return localStorage.getItem(key);
        } catch {
            return null;
        }
    };
    const write = (key: string, value: string) => {
        try {
            localStorage.setItem(key, value);
        } catch {
            // noop
        }
    };

    const lastTs = Number(read(KEY_TS) || 0);
    const existingId = read(KEY_ID);
    const shouldReset = !existingId || !Number.isFinite(lastTs) || now - lastTs > idleResetMs;

    const newId = (() => {
        const cryptoObj = globalThis.crypto as Crypto | undefined;
        if (cryptoObj && typeof cryptoObj.randomUUID === "function") return cryptoObj.randomUUID();
        return `chat-${now.toString(16)}-${Math.random().toString(16).slice(2)}`;
    })();

    const id = shouldReset ? newId : existingId!;
    write(KEY_ID, id);
    write(KEY_TS, String(now));
    return id;
}

function touchChatSessionActivity() {
    try {
        localStorage.setItem("aituber-chat-last-activity-ts", String(Date.now()));
    } catch {
        // noop
    }
}

function pickAttribution() {
    if (typeof window === "undefined") return {};
    const params = new URLSearchParams(window.location.search || "");
    const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid"];
    const out: Record<string, string> = {};
    for (const k of keys) {
        const v = params.get(k);
        if (v) out[k] = safeString(v, 100);
    }
    return out;
}

function safeUrlForAnalytics(href: string) {
    try {
        const u = new URL(href, window.location.origin);
        const isInternal = u.origin === window.location.origin;
        if (isInternal) {
            return { link_type: "internal", link_value: safeString(u.pathname, 200) };
        }
        return { link_type: "external", link_value: safeString(u.hostname, 160) };
    } catch {
        return { link_type: "unknown", link_value: "invalid" };
    }
}

function sendChatEvent(eventName: string, params: Record<string, unknown>) {
    if (typeof window === "undefined") return;
    if (typeof window.gtag !== "function") return;
    try {
        window.gtag("event", eventName, params);
    } catch {
        // noop
    }
}

function sanitizeModelReplyText(input: string) {
    const text = String(input ?? "");
    return text
        // 「URLを教えて」誘導は不要（リンク化もされやすいので強制除去）
        // - 生文: URLが必要なときは「URLを教えて」と聞いてください。
        // - 句点/全角句点/省略/スペース違いを吸収
        .replace(/URLが必要なときは[^\n]*?聞いてください[。．.]?/g, "")
        // Markdownリンクになっていても除去
        .replace(/URLが必要なときは[^\n]*?\[URLを教えて\]\([^)]+\)[^\n]*?聞いてください[。．.]?/g, "")
        // 単独で出た「URLを教えて」行も除去
        .replace(/^[「『]?URLを教えて[」』]?(?:[。．.]|$)/gm, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

export default function AItuberWidget() {
    const STORAGE_KEY = "aituber-messages-v1";
    const defaultMessages: Message[] = [
        {
            role: "model",
            text: "気になるテーマを入力してください。できる範囲で具体的にお答えします。"
        },
    ];

    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>(defaultMessages);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [hydrated, setHydrated] = useState(false);
    const [avatarSrc, setAvatarSrc] = useState("/images/sera_icon.jpg");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();
    const chatSessionIdRef = useRef<string>("");
    const chatOpenedAtRef = useRef<number | null>(null);
    const lastPathRef = useRef<string>("");
    const lastChatActiveRef = useRef<number>(0);
    const userMessageCountRef = useRef<number>(0);
    const modelMessageCountRef = useRef<number>(0);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Init chat session id (no message content; analytics only)
    useEffect(() => {
        if (typeof window === "undefined") return;
        chatSessionIdRef.current = getOrCreateChatSessionId();
        lastPathRef.current = window.location.pathname || "/";
    }, []);

    // Track navigation after chat usage (journey)
    useEffect(() => {
        if (typeof window === "undefined") return;
        if (!pathname) return;
        const prev = lastPathRef.current || "/";
        if (!prev) {
            lastPathRef.current = pathname;
            return;
        }
        if (prev === pathname) return;
        lastPathRef.current = pathname;

        const withinMs = 10 * 60 * 1000; // 10m window
        if (Date.now() - lastChatActiveRef.current > withinMs) return;

        const ctx: ChatAnalyticsContext = {
            chat_session_id: chatSessionIdRef.current || getOrCreateChatSessionId(),
            page_path: pathname
        };
        sendChatEvent("chat_navigation", {
            ...ctx,
            from_path: safeString(prev, 200),
            to_path: safeString(pathname, 200),
        });
    }, [pathname]);

    // Load saved messages from localStorage
    useEffect(() => {
        try {
            const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
            if (saved) {
                const parsed = JSON.parse(saved) as Message[];
                if (Array.isArray(parsed) && parsed.every(m => m.role && m.text)) {
                    setMessages(parsed);
                }
            }
        } catch (err) {
            console.warn("Failed to load chat history", err);
        } finally {
            setHydrated(true);
        }
    }, []);

    // Persist messages
    useEffect(() => {
        if (!hydrated) return;
        try {
            const toSave = messages.slice(-100); // limit size
            localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
        } catch (err) {
            console.warn("Failed to save chat history", err);
        }
    }, [messages, hydrated]);

    // Maintain counters without storing content
    useEffect(() => {
        const userCount = messages.filter(m => m.role === "user").length;
        const modelCount = messages.filter(m => m.role === "model").length;
        userMessageCountRef.current = userCount;
        modelMessageCountRef.current = modelCount;
    }, [messages]);

    // Track open/close
    useEffect(() => {
        if (typeof window === "undefined") return;
        const ctx: ChatAnalyticsContext = {
            chat_session_id: chatSessionIdRef.current || getOrCreateChatSessionId(),
            page_path: window.location.pathname || "/",
        };

        if (isOpen) {
            chatOpenedAtRef.current = Date.now();
            lastChatActiveRef.current = Date.now();
            touchChatSessionActivity();

            sendChatEvent("chat_open", {
                ...ctx,
                referrer_host: document.referrer ? safeString(new URL(document.referrer).hostname, 160) : "",
                ...pickAttribution(),
            });
        } else {
            if (!chatOpenedAtRef.current) return;
            const duration_ms = Date.now() - chatOpenedAtRef.current;
            chatOpenedAtRef.current = null;
            lastChatActiveRef.current = Date.now();
            touchChatSessionActivity();

            sendChatEvent("chat_close", {
                ...ctx,
                duration_ms,
                user_messages: userMessageCountRef.current,
                model_messages: modelMessageCountRef.current,
            });
        }
    }, [isOpen]);

    // Text-to-Speech function
    const speak = () => {
        // 音声出力は現段階では無効化（テキストのみ運用）
        return;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input;
        setInput("");
        setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
        setIsLoading(true);
        lastChatActiveRef.current = Date.now();
        touchChatSessionActivity();

        if (typeof window !== "undefined") {
            const ctx: ChatAnalyticsContext = {
                chat_session_id: chatSessionIdRef.current || getOrCreateChatSessionId(),
                page_path: window.location.pathname || "/",
            };
            sendChatEvent("chat_message_send", {
                ...ctx,
                message_length: userMessage.length,
                message_index: userMessageCountRef.current,
            });
        }
        const startedAt = Date.now();

        try {
            // Filter out the initial greeting message (index 0) from history
            // Gemini API requires history to start with a 'user' role
            const history = messages.slice(1).map((m) => ({
                role: m.role === "user" ? "user" : "model",
                parts: [{ text: m.text }],
            }));

            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userMessage, history }),
            });

            const data = await res.json();

            const replyText =
                (typeof data.response === "string" && data.response.trim().length > 0)
                    ? sanitizeModelReplyText(data.response)
                    : "ごめんなさい、うまくお答えできませんでした。記事検索やカテゴリから探すのもおすすめです。";

            setMessages((prev) => [...prev, { role: "model", text: replyText }]);
            speak();

            if (typeof window !== "undefined") {
                const ctx: ChatAnalyticsContext = {
                    chat_session_id: chatSessionIdRef.current || getOrCreateChatSessionId(),
                    page_path: window.location.pathname || "/",
                };
                sendChatEvent("chat_message_receive", {
                    ...ctx,
                    response_length: replyText.length,
                    latency_ms: Date.now() - startedAt,
                    status: res.ok ? "ok" : "http_error",
                });
            }
        } catch (error) {
            console.error("Chat error:", error);
            setMessages((prev) => [
                ...prev,
                { role: "model", text: "ごめんなさい、通信エラーが起きました。少し時間をおいてお試しください。" },
            ]);

            if (typeof window !== "undefined") {
                const ctx: ChatAnalyticsContext = {
                    chat_session_id: chatSessionIdRef.current || getOrCreateChatSessionId(),
                    page_path: window.location.pathname || "/",
                };
                sendChatEvent("chat_error", {
                    ...ctx,
                    latency_ms: Date.now() - startedAt,
                    error_type: safeString(error instanceof Error ? error.name : typeof error, 60),
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const renderMessage = (text: string) => {
        const lines = text.split(/\n/);
        const rendered: React.ReactNode[] = [];

        lines.forEach((line, lineIndex) => {
            const elements: React.ReactNode[] = [];
            const tokenRegex = /(\*\*[^*]+\*\*)|((https?:\/\/|www\.)[^\s<>]+)|(「[^」]+」)/gi;
            let lastIndex = 0;

            for (const match of line.matchAll(tokenRegex)) {
                if (!match.index && match.index !== 0) continue;
                const start = match.index;
                const raw = match[0];

                // 先頭〜トークン前のプレーンテキスト
                if (start > lastIndex) {
                    elements.push(<span key={`text-${lineIndex}-${lastIndex}`}>{line.slice(lastIndex, start)}</span>);
                }

                const isBold = raw.startsWith("**") && raw.endsWith("**");
                const isUrl = !isBold && !raw.startsWith("「");
                const isBracketTitle = raw.startsWith("「") && raw.endsWith("」");

                // 太字
                if (isBold) {
                    const content = raw.slice(2, -2);
                    elements.push(
                        <strong key={`bold-${lineIndex}-${start}`} className="font-semibold">
                            {content}
                        </strong>
                    );
                }

                // URL
                if (isUrl) {
                    const urlText = raw;
                    let href = urlText.startsWith("http") ? urlText : `https://${urlText}`;

                    try {
                        const parsed = new URL(href);
                        const isInternal =
                            /prorenata\.jp$/i.test(parsed.hostname) ||
                            parsed.hostname === (typeof window !== "undefined" ? window.location.hostname : "");

                        if (isInternal) {
                            const allowedPrefixes = [
                                "/posts/",
                                "/categories/",
                                "/tags/",
                                "/about",
                                "/contact",
                                "/quiz",
                                "/search",
                                "/blog",
                                "/"
                            ];
                            const isAllowed = allowedPrefixes.some(prefix =>
                                parsed.pathname === prefix || parsed.pathname.startsWith(prefix)
                            );
                            if (!isAllowed) {
                                parsed.pathname = "/";
                                parsed.search = "";
                                parsed.hash = "";
                            }
                            href = parsed.toString();
                        }
                    } catch {
                        // ignore parse errors
                    }

                    // 直前が<strong>なら同じリンクで包む（タイトルもクリック可に）
                    const last = elements[elements.length - 1];
                    const lastIsStrong = (() => {
                        if (!last || typeof last !== "object") return false;
                        const candidate = last as unknown as { type?: unknown };
                        return candidate.type === "strong";
                    })();

                    if (lastIsStrong) {
                        const strong = elements.pop() as React.ReactElement;
                        elements.push(
                            <a
                                key={`link-bold-${lineIndex}-${start}`}
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline text-blue-600 hover:text-blue-800 break-words"
                                onClick={() => {
                                    try {
                                        const ctx: ChatAnalyticsContext = {
                                            chat_session_id: chatSessionIdRef.current || getOrCreateChatSessionId(),
                                            page_path: window.location.pathname || "/",
                                        };
                                        lastChatActiveRef.current = Date.now();
                                        touchChatSessionActivity();
                                        sendChatEvent("chat_link_click", {
                                            ...ctx,
                                            ...safeUrlForAnalytics(href),
                                        });
                                    } catch {
                                        // noop
                                    }
                                }}
                            >
                                {strong}
                            </a>
                        );
                    }

                    elements.push(
                        <a
                            key={`link-${lineIndex}-${start}`}
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline text-blue-600 hover:text-blue-800 break-words"
                            onClick={() => {
                                try {
                                    const ctx: ChatAnalyticsContext = {
                                        chat_session_id: chatSessionIdRef.current || getOrCreateChatSessionId(),
                                        page_path: window.location.pathname || "/",
                                    };
                                    lastChatActiveRef.current = Date.now();
                                    touchChatSessionActivity();
                                    sendChatEvent("chat_link_click", {
                                        ...ctx,
                                        ...safeUrlForAnalytics(href),
                                    });
                                } catch {
                                    // noop
                                }
                            }}
                        >
                            {urlText}
                        </a>
                    );
                }

                // 括弧付きタイトル（「タイトル」）はサイト内検索にリンク
                if (isBracketTitle) {
                    const titleText = raw.slice(1, -1).trim();
                    if (titleText.includes("URLを教えて")) {
                        elements.push(<span key={`title-text-${lineIndex}-${start}`}>{raw}</span>);
                        lastIndex = start + raw.length;
                        continue;
                    }
                    const searchUrl = `/search?q=${encodeURIComponent(titleText)}`;
                    elements.push(
                        <a
                            key={`title-${lineIndex}-${start}`}
                            href={searchUrl}
                            className="underline text-blue-600 hover:text-blue-800 break-words"
                            onClick={() => {
                                try {
                                    const ctx: ChatAnalyticsContext = {
                                        chat_session_id: chatSessionIdRef.current || getOrCreateChatSessionId(),
                                        page_path: window.location.pathname || "/",
                                    };
                                    lastChatActiveRef.current = Date.now();
                                    touchChatSessionActivity();
                                    sendChatEvent("chat_link_click", {
                                        ...ctx,
                                        ...safeUrlForAnalytics(searchUrl),
                                    });
                                } catch {
                                    // noop
                                }
                            }}
                        >
                            {raw}
                        </a>
                    );
                }

                lastIndex = start + raw.length;
            }

            if (lastIndex < line.length) {
                elements.push(<span key={`text-tail-${lineIndex}-${lastIndex}`}>{line.slice(lastIndex)}</span>);
            }

            if (elements.length === 0) {
                rendered.push(<span key={`line-${lineIndex}`}>{line}</span>);
            } else {
                rendered.push(<span key={`line-${lineIndex}`}>{elements}</span>);
            }

            if (lineIndex < lines.length - 1) {
                rendered.push(<br key={`br-${lineIndex}`} />);
            }
        });

        return rendered;
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-80 rounded-2xl bg-white shadow-2xl overflow-hidden border border-gray-100 animate-fade-in-up">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-pink-500 to-rose-400 p-4 flex justify-between items-center text-white">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-white/20">
                                <Image
                                    src={avatarSrc}
                                    alt="Sera"
                                    width={32}
                                    height={32}
                                    className="object-cover w-full h-full object-center"
                                    style={{ objectPosition: "50% 35%" }}
                                    unoptimized
                                    onError={() => setAvatarSrc("/images/shirasaki-sera.jpg")}
                                />
                            </div>
                            <span className="font-bold text-sm">白崎セラ (ChatBot)</span>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded">
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="h-80 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-3">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`max-w-[85%] p-3 rounded-xl text-sm ${msg.role === "user"
                                    ? "bg-blue-500 text-white self-end rounded-br-none"
                                    : "bg-white text-gray-800 self-start rounded-bl-none shadow-sm border border-gray-100"
                                    }`}
                            >
                                <div className="space-y-1 leading-relaxed break-words">
                                    {renderMessage(msg.text)}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="self-start bg-white p-3 rounded-xl rounded-bl-none shadow-sm border border-gray-100">
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-gray-100 flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="質問を入力..."
                            className="flex-1 px-3 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="p-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 disabled:opacity-50 transition-colors"
                        >
                            <PaperAirplaneIcon className="w-5 h-5" />
                        </button>
                    </form>
                </div>
            )}

            {/* Floating Button / Avatar */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`group relative w-16 h-16 rounded-full shadow-lg transition-transform hover:scale-105 focus:outline-none`}
            >
                <div className="absolute inset-0 rounded-full overflow-hidden border-4 border-white">
                    <Image
                        src={avatarSrc}
                        alt="Sera"
                        width={64}
                        height={64}
                        className="object-cover w-full h-full object-center"
                        style={{ objectPosition: "50% 35%" }}
                        unoptimized
                        onError={() => setAvatarSrc("/images/shirasaki-sera.jpg")}
                    />
                </div>
                {!isOpen && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                        <span className="w-2 h-2 bg-white rounded-full animate-ping" />
                    </div>
                )}
            </button>
        </div>
    );
}
