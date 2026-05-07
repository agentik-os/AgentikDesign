import { v } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";

/**
 * SAFE list: never returns accessToken or refreshToken bodies.
 * Returns only metadata the UI can show (provider, expiresAt, hasRefreshToken,
 * label, updatedAt).
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const rows = await ctx.db
      .query("providerCredentials")
      .withIndex("byUserId", (q) => q.eq("userId", identity.subject))
      .collect();

    return rows.map((r) => ({
      _id: r._id,
      provider: r.provider,
      label: r.label,
      expiresAt: r.expiresAt,
      hasRefreshToken: !!r.refreshToken,
      updatedAt: r.updatedAt,
    }));
  },
});

export const upsert = mutation({
  args: {
    provider: v.string(),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    label: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const userId = identity.subject;
    const now = Date.now();

    const existing = await ctx.db
      .query("providerCredentials")
      .withIndex("byUserId_provider", (q) =>
        q.eq("userId", userId).eq("provider", args.provider),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        accessToken: args.accessToken,
        refreshToken: args.refreshToken ?? existing.refreshToken,
        expiresAt: args.expiresAt,
        label: args.label ?? existing.label,
        metadata: args.metadata ?? existing.metadata,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("providerCredentials", {
      userId,
      provider: args.provider,
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      expiresAt: args.expiresAt,
      label: args.label,
      metadata: args.metadata,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const remove = mutation({
  args: { provider: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const existing = await ctx.db
      .query("providerCredentials")
      .withIndex("byUserId_provider", (q) =>
        q.eq("userId", identity.subject).eq("provider", args.provider),
      )
      .unique();
    if (existing) await ctx.db.delete(existing._id);
  },
});

/**
 * INTERNAL ONLY — returns the full credential including accessToken.
 * Used by server-side actions that need to call the provider API on the
 * user's behalf. Never expose this to the client.
 */
export const _getForUser = internalQuery({
  args: { userId: v.string(), provider: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("providerCredentials")
      .withIndex("byUserId_provider", (q) =>
        q.eq("userId", args.userId).eq("provider", args.provider),
      )
      .unique();
  },
});
