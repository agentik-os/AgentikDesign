import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // KEEP — managed by users.ts (do not modify)
  users: defineTable({
    clerkId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }).index("byClerkId", ["clerkId"]),

  // 1) Projects — top-level user workspaces
  projects: defineTable({
    userId: v.string(), // clerk subject (identity.subject)
    name: v.string(),
    description: v.optional(v.string()),
    designSystemSlug: v.optional(v.string()),
    status: v.union(
      v.literal("active"),
      v.literal("archived"),
      v.literal("deleted"),
    ),
    settings: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("byUserId", ["userId"])
    .index("byUserId_status", ["userId", "status"]),

  // 2) Conversations — chat threads scoped to a project
  conversations: defineTable({
    userId: v.string(),
    projectId: v.id("projects"),
    title: v.optional(v.string()),
    provider: v.optional(v.string()), // openai | anthropic | google | ...
    model: v.optional(v.string()),
    skillSlug: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("byUserId", ["userId"])
    .index("byProjectId", ["projectId"])
    .index("byUserId_updatedAt", ["userId", "updatedAt"]),

  // 3) Messages — individual messages inside a conversation
  messages: defineTable({
    userId: v.string(),
    conversationId: v.id("conversations"),
    role: v.union(
      v.literal("user"),
      v.literal("assistant"),
      v.literal("system"),
      v.literal("tool"),
    ),
    content: v.string(),
    parts: v.optional(v.any()), // structured parts (tool calls, attachments)
    provider: v.optional(v.string()),
    model: v.optional(v.string()),
    tokensIn: v.optional(v.number()),
    tokensOut: v.optional(v.number()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("byConversationId", ["conversationId"])
    .index("byConversationId_createdAt", ["conversationId", "createdAt"])
    .index("byUserId", ["userId"]),

  // 4) Templates — user-saved prompt/design templates
  templates: defineTable({
    userId: v.string(),
    slug: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    body: v.string(),
    variables: v.optional(v.any()),
    isPublic: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("byUserId", ["userId"])
    .index("byUserId_slug", ["userId", "slug"])
    .index("byCategory", ["category"]),

  // 5) Provider credentials — BYOK encrypted-at-rest tokens
  // accessToken stays server-side; never returned by list query.
  providerCredentials: defineTable({
    userId: v.string(),
    provider: v.string(), // openai | anthropic | google | openrouter | ...
    accessToken: v.string(), // encrypted blob (or raw token; server-only)
    refreshToken: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    label: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("byUserId", ["userId"])
    .index("byUserId_provider", ["userId", "provider"]),

  // 6) App config — per-user feature flags & defaults
  appConfig: defineTable({
    userId: v.string(),
    key: v.string(),
    value: v.any(),
    updatedAt: v.number(),
  })
    .index("byUserId", ["userId"])
    .index("byUserId_key", ["userId", "key"]),

  // 7) Design Systems — global catalog (seeded). Not user-scoped.
  designSystems: defineTable({
    slug: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    version: v.optional(v.string()),
    tokens: v.optional(v.any()),
    components: v.optional(v.any()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("bySlug", ["slug"]),

  // 8) Skills — global catalog (seeded). Not user-scoped.
  skills: defineTable({
    slug: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    systemPrompt: v.optional(v.string()),
    tools: v.optional(v.any()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("bySlug", ["slug"])
    .index("byCategory", ["category"]),
});
