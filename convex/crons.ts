import { cronJobs } from "convex/server";
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * 検索失敗ログの分析と自動改善（プロトグラム）
 */
import { internal } from "./_generated/api";

export const autoOptimizeSynonyms = internalMutation({
    args: {},
    handler: async (ctx) => {
        const misses = await ctx.db
            .query("searchMisses")
            .filter(q => q.eq(q.field("status"), "pending"))
            .collect();

        const highPriority = misses.filter(m => m.count >= 10);

        for (const miss of highPriority) {
            await ctx.db.patch(miss._id, { status: "processed" });
        }
    },
});

const crons = cronJobs();

// 毎日深夜3時に実行 (UTC 18:00 = JST 03:00)
crons.daily(
    "optimize-synonyms",
    { hourUTC: 18, minuteUTC: 0 },
    internal.crons.autoOptimizeSynonyms
);

export default crons;
