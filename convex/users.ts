import { mutation, query } from "./_generated/server";

export const current = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return await ctx.db
      .query("users")
      .withIndex("byClerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
  },
});

export const upsert = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const email = typeof identity.email === "string" ? identity.email : undefined;
    const name = typeof identity.name === "string" ? identity.name : undefined;
    const imageUrl =
      typeof identity.pictureUrl === "string" ? identity.pictureUrl : undefined;

    const existing = await ctx.db
      .query("users")
      .withIndex("byClerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: email ?? existing.email,
        name: name ?? existing.name,
        imageUrl: imageUrl ?? existing.imageUrl,
        updatedAt: now,
      });
      return existing._id;
    }
    return await ctx.db.insert("users", {
      clerkId: identity.subject,
      email,
      name,
      imageUrl,
      createdAt: now,
      updatedAt: now,
    });
  },
});
