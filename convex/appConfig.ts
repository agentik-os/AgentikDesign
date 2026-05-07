import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return await ctx.db
      .query("appConfig")
      .withIndex("byUserId", (q) => q.eq("userId", identity.subject))
      .collect();
  },
});

export const get = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const row = await ctx.db
      .query("appConfig")
      .withIndex("byUserId_key", (q) =>
        q.eq("userId", identity.subject).eq("key", args.key),
      )
      .unique();
    return row?.value ?? null;
  },
});

export const set = mutation({
  args: {
    key: v.string(),
    value: v.any(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const userId = identity.subject;
    const now = Date.now();

    const existing = await ctx.db
      .query("appConfig")
      .withIndex("byUserId_key", (q) =>
        q.eq("userId", userId).eq("key", args.key),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { value: args.value, updatedAt: now });
      return existing._id;
    }
    return await ctx.db.insert("appConfig", {
      userId,
      key: args.key,
      value: args.value,
      updatedAt: now,
    });
  },
});

export const remove = mutation({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const existing = await ctx.db
      .query("appConfig")
      .withIndex("byUserId_key", (q) =>
        q.eq("userId", identity.subject).eq("key", args.key),
      )
      .unique();
    if (existing) await ctx.db.delete(existing._id);
  },
});
