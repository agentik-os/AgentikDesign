import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== identity.subject) return [];

    return await ctx.db
      .query("conversations")
      .withIndex("byProjectId", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .collect();
  },
});

export const listRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const userId = identity.subject;
    const limit = args.limit ?? 50;

    return await ctx.db
      .query("conversations")
      .withIndex("byUserId_updatedAt", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);
  },
});

export const get = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const conv = await ctx.db.get(args.conversationId);
    if (!conv) return null;
    if (conv.userId !== identity.subject) return null;
    return conv;
  },
});

export const create = mutation({
  args: {
    projectId: v.id("projects"),
    title: v.optional(v.string()),
    provider: v.optional(v.string()),
    model: v.optional(v.string()),
    skillSlug: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");
    if (project.userId !== identity.subject) throw new Error("Forbidden");

    const now = Date.now();
    return await ctx.db.insert("conversations", {
      userId: identity.subject,
      projectId: args.projectId,
      title: args.title,
      provider: args.provider,
      model: args.model,
      skillSlug: args.skillSlug,
      metadata: args.metadata,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    conversationId: v.id("conversations"),
    title: v.optional(v.string()),
    provider: v.optional(v.string()),
    model: v.optional(v.string()),
    skillSlug: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const existing = await ctx.db.get(args.conversationId);
    if (!existing) throw new Error("Conversation not found");
    if (existing.userId !== identity.subject) throw new Error("Forbidden");

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.title !== undefined) patch.title = args.title;
    if (args.provider !== undefined) patch.provider = args.provider;
    if (args.model !== undefined) patch.model = args.model;
    if (args.skillSlug !== undefined) patch.skillSlug = args.skillSlug;
    if (args.metadata !== undefined) patch.metadata = args.metadata;

    await ctx.db.patch(args.conversationId, patch);
    return args.conversationId;
  },
});

export const remove = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const existing = await ctx.db.get(args.conversationId);
    if (!existing) return;
    if (existing.userId !== identity.subject) throw new Error("Forbidden");

    // Cascade delete messages
    const msgs = await ctx.db
      .query("messages")
      .withIndex("byConversationId", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .collect();
    for (const m of msgs) await ctx.db.delete(m._id);

    await ctx.db.delete(args.conversationId);
  },
});
