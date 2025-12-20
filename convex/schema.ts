import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    // 記事データ管理
    articles: defineTable({
        url: v.string(),            // 記事のフルURLまたはパス
        slug: v.string(),           // スラッグ
        title: v.string(),          // 記事タイトル
        excerpt: v.optional(v.string()), // 抜粋
        keywords: v.array(v.string()),   // 検索用キーワード（自動抽出）
        tags: v.array(v.string()),       // タグ
        featured: v.boolean(),      // おすすめ記事フラグ
        backlinkCount: v.number(),  // 記事内リンク数（重要度指標）
        updatedAt: v.number(),      // 最終更新日時
    })
        .index("by_url", ["url"])
        .index("by_slug", ["slug"])
        .index("by_featured", ["featured"])
        .index("by_backlinks", ["backlinkCount"]),

    // 検索失敗ログ（自己改善用）
    searchMisses: defineTable({
        query: v.string(),          // 生の検索クエリ
        normalized: v.string(),     // 正規化済みクエリ
        count: v.number(),          // 失敗回数
        status: v.string(),         // 'pending' | 'resolved' | 'ignored'
        lastHappened: v.number(),   // 最終発生日時
    })
        .index("by_normalized", ["normalized"])
        .index("by_count", ["count"]),

    // 同義語・類義語展開ルール
    synonymRules: defineTable({
        trigger: v.string(),        // トリガーとなるワード
        adds: v.array(v.string()),  // 追加で検索するワード
        enabled: v.boolean(),       // 有効フラグ
        source: v.string(),         // 'manual' | 'auto' (自動改善による追加)
        updatedAt: v.number(),      // 最終更新日時
    })
        .index("by_trigger", ["trigger"])
        .index("by_enabled", ["enabled"]),

    // メディカルクイズ問（LLM不使用・静的データ）
    quizQuestions: defineTable({
        qid: v.string(),            // 一意のID
        prompt: v.string(),         // 問題文
        choices: v.array(v.string()), // 選択肢
        correctIndex: v.number(),   // 正解のインデックス (0-based)
        explanation: v.optional(v.string()), // 解説文
        category: v.optional(v.string()), // カテゴリ（バイタル、倫理、技術等）
        difficulty: v.optional(v.string()), // 難易度
        tags: v.optional(v.array(v.string())), // タグ
        isPublished: v.boolean(),   // 公開フラグ
        updatedAt: v.number(),      // 更新日時
    })
        .index("by_qid", ["qid"])
        .index("by_published", ["isPublished"])
        .index("by_category", ["category"]),

    // クイズセッション（ユーザーごとの進行管理）
    quizSessions: defineTable({
        clientId: v.string(),       // 匿名クライアントID
        mode: v.string(),           // "quick" | "daily" 等
        recentQids: v.array(v.string()), // 最近出題された問題ID (重複回避用)
        currentQid: v.optional(v.string()), // 現在出題中の問題ID（安定化用）
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_clientId", ["clientId"]),

    // 回答ログ
    quizAnswers: defineTable({
        clientId: v.string(),
        sessionId: v.id("quizSessions"),
        qid: v.string(),
        selectedIndex: v.number(),
        isCorrect: v.boolean(),
        answeredAt: v.number(),
        category: v.optional(v.string()),
        difficulty: v.optional(v.string()),
    })
        .index("by_clientId_answeredAt", ["clientId", "answeredAt"])
        .index("by_sessionId_answeredAt", ["sessionId", "answeredAt"])
        .index("by_qid", ["qid"]),

    // ユーザー統計
    quizStats: defineTable({
        clientId: v.string(),
        total: v.number(),
        correct: v.number(),
        streak: v.number(),
        dailyCount: v.optional(v.number()), // 今日の解答数
        lastAnsweredDay: v.optional(v.string()), // 最後に解答した日 (YYYY-MM-DD)
        lastAnsweredAt: v.optional(v.number()),
        updatedAt: v.number(),
    })
        .index("by_clientId", ["clientId"]),
});
