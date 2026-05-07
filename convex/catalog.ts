import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";

// ─── Public catalog queries ────────────────────────────────────────────────

export const listDesignSystems = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("designSystems").collect();
  },
});

export const getDesignSystemBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("designSystems")
      .withIndex("bySlug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

export const listSkills = query({
  args: { category: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.category) {
      return await ctx.db
        .query("skills")
        .withIndex("byCategory", (q) => q.eq("category", args.category))
        .collect();
    }
    return await ctx.db.query("skills").collect();
  },
});

export const getSkillBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("skills")
      .withIndex("bySlug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

// ─── Seed mutations (internal, idempotent upsert by slug) ─────────────────

const designSystemEntry = v.object({
  slug: v.string(),
  name: v.string(),
  description: v.optional(v.string()),
  version: v.optional(v.string()),
  tokens: v.optional(v.any()),
  components: v.optional(v.any()),
  metadata: v.optional(v.any()),
});

export const seedDesignSystems = internalMutation({
  args: { entries: v.array(designSystemEntry) },
  handler: async (ctx, args) => {
    const now = Date.now();
    const results: Array<{ slug: string; action: "created" | "updated" }> = [];
    for (const entry of args.entries) {
      const existing = await ctx.db
        .query("designSystems")
        .withIndex("bySlug", (q) => q.eq("slug", entry.slug))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, {
          name: entry.name,
          description: entry.description,
          version: entry.version,
          tokens: entry.tokens,
          components: entry.components,
          metadata: entry.metadata,
          updatedAt: now,
        });
        results.push({ slug: entry.slug, action: "updated" });
      } else {
        await ctx.db.insert("designSystems", {
          slug: entry.slug,
          name: entry.name,
          description: entry.description,
          version: entry.version,
          tokens: entry.tokens,
          components: entry.components,
          metadata: entry.metadata,
          createdAt: now,
          updatedAt: now,
        });
        results.push({ slug: entry.slug, action: "created" });
      }
    }
    return results;
  },
});

const skillEntry = v.object({
  slug: v.string(),
  name: v.string(),
  description: v.optional(v.string()),
  category: v.optional(v.string()),
  systemPrompt: v.optional(v.string()),
  tools: v.optional(v.any()),
  metadata: v.optional(v.any()),
});

export const seedSkills = internalMutation({
  args: { entries: v.array(skillEntry) },
  handler: async (ctx, args) => {
    const now = Date.now();
    const results: Array<{ slug: string; action: "created" | "updated" }> = [];
    for (const entry of args.entries) {
      const existing = await ctx.db
        .query("skills")
        .withIndex("bySlug", (q) => q.eq("slug", entry.slug))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, {
          name: entry.name,
          description: entry.description,
          category: entry.category,
          systemPrompt: entry.systemPrompt,
          tools: entry.tools,
          metadata: entry.metadata,
          updatedAt: now,
        });
        results.push({ slug: entry.slug, action: "updated" });
      } else {
        await ctx.db.insert("skills", {
          slug: entry.slug,
          name: entry.name,
          description: entry.description,
          category: entry.category,
          systemPrompt: entry.systemPrompt,
          tools: entry.tools,
          metadata: entry.metadata,
          createdAt: now,
          updatedAt: now,
        });
        results.push({ slug: entry.slug, action: "created" });
      }
    }
    return results;
  },
});
