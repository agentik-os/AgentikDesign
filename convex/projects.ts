import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("archived"),
        v.literal("deleted"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const userId = identity.subject;

    if (args.status) {
      return await ctx.db
        .query("projects")
        .withIndex("byUserId_status", (q) =>
          q.eq("userId", userId).eq("status", args.status!),
        )
        .order("desc")
        .collect();
    }

    return await ctx.db
      .query("projects")
      .withIndex("byUserId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const project = await ctx.db.get(args.projectId);
    if (!project) return null;
    if (project.userId !== identity.subject) return null;
    return project;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    designSystemSlug: v.optional(v.string()),
    settings: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const now = Date.now();
    return await ctx.db.insert("projects", {
      userId: identity.subject,
      name: args.name,
      description: args.description,
      designSystemSlug: args.designSystemSlug,
      status: "active",
      settings: args.settings,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    designSystemSlug: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("archived"),
        v.literal("deleted"),
      ),
    ),
    settings: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const existing = await ctx.db.get(args.projectId);
    if (!existing) throw new Error("Project not found");
    if (existing.userId !== identity.subject) throw new Error("Forbidden");

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.name !== undefined) patch.name = args.name;
    if (args.description !== undefined) patch.description = args.description;
    if (args.designSystemSlug !== undefined)
      patch.designSystemSlug = args.designSystemSlug;
    if (args.status !== undefined) patch.status = args.status;
    if (args.settings !== undefined) patch.settings = args.settings;

    await ctx.db.patch(args.projectId, patch);
    return args.projectId;
  },
});

export const remove = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const existing = await ctx.db.get(args.projectId);
    if (!existing) return;
    if (existing.userId !== identity.subject) throw new Error("Forbidden");
    await ctx.db.delete(args.projectId);
  },
});
