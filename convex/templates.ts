import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: { category: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const userId = identity.subject;

    const all = await ctx.db
      .query("templates")
      .withIndex("byUserId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    if (args.category) {
      return all.filter((t) => t.category === args.category);
    }
    return all;
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return await ctx.db
      .query("templates")
      .withIndex("byUserId_slug", (q) =>
        q.eq("userId", identity.subject).eq("slug", args.slug),
      )
      .unique();
  },
});

export const upsert = mutation({
  args: {
    slug: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    body: v.string(),
    variables: v.optional(v.any()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const userId = identity.subject;
    const now = Date.now();

    const existing = await ctx.db
      .query("templates")
      .withIndex("byUserId_slug", (q) =>
        q.eq("userId", userId).eq("slug", args.slug),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        title: args.title,
        description: args.description,
        category: args.category,
        body: args.body,
        variables: args.variables,
        isPublic: args.isPublic,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("templates", {
      userId,
      slug: args.slug,
      title: args.title,
      description: args.description,
      category: args.category,
      body: args.body,
      variables: args.variables,
      isPublic: args.isPublic,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const remove = mutation({
  args: { templateId: v.id("templates") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const existing = await ctx.db.get(args.templateId);
    if (!existing) return;
    if (existing.userId !== identity.subject) throw new Error("Forbidden");
    await ctx.db.delete(args.templateId);
  },
});
