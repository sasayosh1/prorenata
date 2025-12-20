import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";

/**
 * 記事をアップサート（既にあれば更新、なければ追加）
 */
export const upsertArticle = mutation({
    args: {
        url: v.string(),
        slug: v.string(),
        title: v.string(),
        excerpt: v.optional(v.string()),
        keywords: v.array(v.string()),
        tags: v.array(v.string()),
        featured: v.boolean(),
        backlinkCount: v.number(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("articles")
            .withIndex("by_url", (q) => q.eq("url", args.url))
            .unique();

        const data = {
            ...args,
            updatedAt: Date.now(),
        };

        if (existing) {
            await ctx.db.patch(existing._id, data);
            return existing._id;
        } else {
            return await ctx.db.insert("articles", data);
        }
    },
});

/**
 * おすすめ記事フラグのバッチ更新
 */
export const syncFeaturedStatus = mutation({
    args: {
        topSlugs: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        // 全記事のfeaturedを一旦オフにする（必要に応じて調整）
        const all = await ctx.db.query("articles").collect();
        for (const art of all) {
            const isFeatured = args.topSlugs.includes(art.slug);
            if (art.featured !== isFeatured) {
                await ctx.db.patch(art._id, { featured: isFeatured });
            }
        }
    },
});
