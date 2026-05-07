/**
 * Account information for the signed-in user.
 *
 * Mirrors the shape of the Telegram bot's /account command (bot/aisb/account.py
 * `_show_account_status`): identity + plan + lightweight usage stats. Keep it
 * cheap — this query is hit by both the dashboard chip and the CLI.
 */
import { query } from "./_generated/server";

export const getCurrentUserAccount = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("byClerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    // Plan is read from appConfig.key="plan" if set, defaulting to "free".
    // Stripe webhook (TODO) writes this on subscription events.
    const planRow = await ctx.db
      .query("appConfig")
      .withIndex("byUserId_key", (q) =>
        q.eq("userId", identity.subject).eq("key", "plan"),
      )
      .unique();

    type PlanRecord = {
      tier?: string;
      status?: string;
      currentPeriodEnd?: number;
      stripeCustomerId?: string;
      stripeSubscriptionId?: string;
    };
    const planValue = (planRow?.value ?? null) as PlanRecord | null;
    const tier = planValue?.tier ?? "free";
    const planStatus = planValue?.status ?? "active";

    // Usage: count of projects + messages in the last 30 days. Cheap-ish
    // because we have indexes by userId; for a heavy user this is still
    // bounded since `collect` reads only their rows.
    const projectsCount = (
      await ctx.db
        .query("projects")
        .withIndex("byUserId", (q) => q.eq("userId", identity.subject))
        .collect()
    ).length;

    const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentMessages = await ctx.db
      .query("messages")
      .withIndex("byUserId", (q) => q.eq("userId", identity.subject))
      .collect();
    const messages30d = recentMessages.filter((m) => m.createdAt >= since)
      .length;

    return {
      userId: identity.subject,
      email: user?.email ?? identity.email ?? null,
      name: user?.name ?? identity.name ?? null,
      imageUrl: user?.imageUrl ?? null,
      createdAt: user?.createdAt ?? null,
      plan: {
        tier,
        status: planStatus,
        currentPeriodEnd: planValue?.currentPeriodEnd ?? null,
      },
      usage: {
        projects: projectsCount,
        messagesLast30d: messages30d,
      },
    };
  },
});
