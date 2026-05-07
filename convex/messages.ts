import { v } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";

export const list = query({
  args: {
    conversationId: v.id("conversations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const conv = await ctx.db.get(args.conversationId);
    if (!conv || conv.userId !== identity.subject) return [];

    const limit = args.limit ?? 200;
    return await ctx.db
      .query("messages")
      .withIndex("byConversationId_createdAt", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .order("asc")
      .take(limit);
  },
});

export const append = mutation({
  args: {
    conversationId: v.id("conversations"),
    role: v.union(
      v.literal("user"),
      v.literal("assistant"),
      v.literal("system"),
      v.literal("tool"),
    ),
    content: v.string(),
    parts: v.optional(v.any()),
    provider: v.optional(v.string()),
    model: v.optional(v.string()),
    tokensIn: v.optional(v.number()),
    tokensOut: v.optional(v.number()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const conv = await ctx.db.get(args.conversationId);
    if (!conv) throw new Error("Conversation not found");
    if (conv.userId !== identity.subject) throw new Error("Forbidden");

    const now = Date.now();
    const id = await ctx.db.insert("messages", {
      userId: identity.subject,
      conversationId: args.conversationId,
      role: args.role,
      content: args.content,
      parts: args.parts,
      provider: args.provider,
      model: args.model,
      tokensIn: args.tokensIn,
      tokensOut: args.tokensOut,
      metadata: args.metadata,
      createdAt: now,
    });

    // Bump conversation updatedAt for ordering
    await ctx.db.patch(args.conversationId, { updatedAt: now });

    return id;
  },
});

export const remove = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const existing = await ctx.db.get(args.messageId);
    if (!existing) return;
    if (existing.userId !== identity.subject) throw new Error("Forbidden");
    await ctx.db.delete(args.messageId);
  },
});

// Internal: used by server-side actions (e.g. streaming pipelines) that
// already authenticated the user out-of-band.
export const _listForConversation = internalQuery({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("byConversationId_createdAt", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .order("asc")
      .collect();
  },
});
