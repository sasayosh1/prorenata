import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * セッションの初期化または取得
 */
export const upsertSession = mutation({
    args: {
        clientId: v.string(),
        mode: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("quizSessions")
            .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
            .first();

        const now = Date.now();
        if (existing) {
            await ctx.db.patch(existing._id, {
                updatedAt: now,
                mode: args.mode ?? existing.mode,
            });
            // もし現在選ばれている問題がなければ、初期設定する
            if (!existing.currentQid) {
                const candidates = await getCandidates(ctx, existing);
                if (candidates.length > 0) {
                    const pick = candidates[Math.floor(Math.random() * candidates.length)];
                    await ctx.db.patch(existing._id, { currentQid: pick.qid });
                }
            }
            return existing._id;
        }

        const sessionId = await ctx.db.insert("quizSessions", {
            clientId: args.clientId,
            mode: args.mode ?? "quick",
            recentQids: [],
            createdAt: now,
            updatedAt: now,
        });

        // 最初の問題を選出
        const newSession = await ctx.db.get(sessionId);
        const candidates = await getCandidates(ctx, newSession!);
        if (candidates.length > 0) {
            const pick = candidates[Math.floor(Math.random() * candidates.length)];
            await ctx.db.patch(sessionId, { currentQid: pick.qid });
        }

        return sessionId;
    },
});

/**
 * 候補となる問題リストを取得する内部関数
 */
async function getCandidates(ctx: any, session: any, category?: string, difficulty?: string) {
    const allQuestions = await ctx.db
        .query("quizQuestions")
        .withIndex("by_published", (q: any) => q.eq("isPublished", true))
        .collect();

    if (allQuestions.length === 0) return [];

    let candidates = allQuestions.filter((q: any) => !session.recentQids.includes(q.qid));
    if (category) candidates = candidates.filter((q: any) => q.category === category);
    if (difficulty) candidates = candidates.filter((q: any) => q.difficulty === difficulty);

    if (candidates.length === 0) candidates = allQuestions;
    return candidates;
}

/**
 * 次の問題を取得（安定化のため、session.currentQid を優先）
 */
export const nextQuestion = query({
    args: {
        clientId: v.string(),
        sessionId: v.id("quizSessions"),
        category: v.optional(v.string()),
        difficulty: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const session = await ctx.db.get(args.sessionId);
        if (!session || !session.currentQid) return null;

        // 統計チェック
        const stats = await ctx.db
            .query("quizStats")
            .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
            .first();

        const today = new Date().toISOString().split('T')[0];
        const isLimitReached = stats && stats.lastAnsweredDay === today && (stats.dailyCount ?? 0) >= 10;

        if (isLimitReached) {
            return { status: "limit_reached" };
        }

        const pick = await ctx.db
            .query("quizQuestions")
            .withIndex("by_qid", (q) => q.eq("qid", session.currentQid!))
            .first();

        if (!pick) return null;

        return {
            status: "ok",
            qid: pick.qid,
            prompt: pick.prompt,
            choices: pick.choices,
            category: pick.category,
            difficulty: pick.difficulty,
        };
    },
});

/**
 * 新しい問題を生成して、セッションにセットする
 */
export const prepareNextQuestion = mutation({
    args: {
        sessionId: v.id("quizSessions"),
        category: v.optional(v.string()),
        difficulty: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const session = await ctx.db.get(args.sessionId);
        if (!session) throw new Error("Session not found");

        const candidates = await getCandidates(ctx, session, args.category, args.difficulty);
        if (candidates.length === 0) return null;

        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        await ctx.db.patch(args.sessionId, {
            currentQid: pick.qid,
            updatedAt: Date.now()
        });
        return pick.qid;
    },
});

/**
 * 回答を送信し、結果と統計を更新
 */
export const submitAnswer = mutation({
    args: {
        clientId: v.string(),
        sessionId: v.id("quizSessions"),
        qid: v.string(),
        selectedIndex: v.number(),
    },
    handler: async (ctx, args) => {
        const question = await ctx.db
            .query("quizQuestions")
            .withIndex("by_qid", (q) => q.eq("qid", args.qid))
            .first();

        if (!question) throw new Error("Question not found");

        const session = await ctx.db.get(args.sessionId);
        if (!session) throw new Error("Session not found");

        // 回答が現在の出題中のものと一致するか確認
        if (session.currentQid !== args.qid) {
            throw new Error("Invalid question for this session state");
        }

        const today = new Date().toISOString().split('T')[0];

        // 統計取得および制限チェック
        const stats = await ctx.db
            .query("quizStats")
            .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
            .first();

        if (stats && stats.lastAnsweredDay === today && (stats.dailyCount ?? 0) >= 10) {
            throw new Error("Daily limit reached");
        }

        const isCorrect = question.correctIndex === args.selectedIndex;
        const now = Date.now();

        // 統計更新
        if (stats) {
            const isDifferentDay = stats.lastAnsweredDay !== today;
            const newDailyCount = isDifferentDay ? 1 : (stats.dailyCount ?? 0) + 1;
            const newStreak = isCorrect ? stats.streak + 1 : 0;

            await ctx.db.patch(stats._id, {
                total: stats.total + 1,
                correct: stats.correct + (isCorrect ? 1 : 0),
                streak: newStreak,
                dailyCount: newDailyCount,
                lastAnsweredDay: today,
                lastAnsweredAt: now,
                updatedAt: now,
            });
        } else {
            await ctx.db.insert("quizStats", {
                clientId: args.clientId,
                total: 1,
                correct: isCorrect ? 1 : 0,
                streak: isCorrect ? 1 : 0,
                dailyCount: 1,
                lastAnsweredDay: today,
                lastAnsweredAt: now,
                updatedAt: now,
            });
        }

        // 回答ログ保存
        await ctx.db.insert("quizAnswers", {
            clientId: args.clientId,
            sessionId: args.sessionId,
            qid: args.qid,
            selectedIndex: args.selectedIndex,
            isCorrect,
            answeredAt: now,
            category: question.category,
            difficulty: question.difficulty,
        });

        // セッションの状態更新（履歴追加 ＆ 現在の問題をクリア）
        let recent = [...session.recentQids, args.qid];
        if (recent.length > 30) recent.shift();
        await ctx.db.patch(args.sessionId, {
            recentQids: recent,
            currentQid: undefined, // 回答済みなのでクリア
            updatedAt: now,
        });

        return {
            ok: true,
            isCorrect,
            correctIndex: question.correctIndex,
            explanation: question.explanation,
        };
    },
});

/**
 * 統計取得
 */
export const getMyStats = query({
    args: { clientId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("quizStats")
            .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
            .first();
    },
});
