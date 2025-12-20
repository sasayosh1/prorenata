import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * チャットボット用のルールベース検索
 */
export const search = query({
    args: {
        query: v.string(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const rawQuery = args.query.trim().toLowerCase();
        if (!rawQuery) return [];

        // 1. 同義語展開
        const rules = await ctx.db
            .query("synonymRules")
            .filter((q) => q.eq(q.field("enabled"), true))
            .collect();

        const searchWords = new Set([rawQuery]);
        for (const rule of rules) {
            if (rawQuery.includes(rule.trigger)) {
                rule.adds.forEach(w => searchWords.add(w.toLowerCase()));
            }
        }

        const words = Array.from(searchWords);

        // 2. 記事取得とスコアリング
        // 大規模になると全体スキャンは重いため、本来はインデックス等を活用するが
        // 無料枠かつ記事数が数百程度なら filter も現実的
        const allArticles = await ctx.db.query("articles").collect();

        const scored = allArticles.map(art => {
            let score = 0;
            const title = art.title.toLowerCase();
            const keywords = art.keywords.map(k => k.toLowerCase());

            for (const word of words) {
                if (title.includes(word)) score += 10;
                if (keywords.includes(word)) score += 5;
                if (art.excerpt?.toLowerCase().includes(word)) score += 2;
            }

            // featured 記事への強力なブースト
            if (art.featured) score *= 1.5;

            // 被リンク数による微調整
            score += Math.log1p(art.backlinkCount);

            return { ...art, score };
        });

        // 3. 上位取得
        const results = scored
            .filter(a => a.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, args.limit || 3);

        // 4. 0ヒット時の救済（Featured 記事の最新を返す）
        if (results.length === 0) {
            const fallback = await ctx.db
                .query("articles")
                .withIndex("by_featured", q => q.eq("featured", true))
                .order("desc")
                .take(1);
            return fallback;
        }

        return results;
    },
});

/**
 * 検索失敗のログ記録
 */
export const logMiss = mutation({
    args: {
        query: v.string(),
    },
    handler: async (ctx, args) => {
        const normalized = args.query.trim().toLowerCase();
        const existing = await ctx.db
            .query("searchMisses")
            .withIndex("by_normalized", q => q.eq("normalized", normalized))
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, {
                count: existing.count + 1,
                lastHappened: Date.now(),
            });
        } else {
            await ctx.db.insert("searchMisses", {
                query: args.query,
                normalized,
                count: 1,
                status: "pending",
                lastHappened: Date.now(),
            });
        }
    },
});
