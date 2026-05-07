/**
 * Billing — plan/status read query and a Stripe customer-portal action.
 *
 * Plan info lives in `appConfig.key = "plan"` (same table the bot writes to).
 * The customer-portal action calls Stripe via raw fetch — no SDK dep — and
 * gracefully degrades to `{ url: null, message: "billing not configured" }`
 * when STRIPE_SECRET_KEY is missing (Karpathy: simple fallback, no abstractions).
 */
import { v } from "convex/values";
import { action, query } from "./_generated/server";
import { api } from "./_generated/api";

type PlanRecord = {
  tier?: string;
  status?: string;
  currentPeriodEnd?: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
};

export const getBillingInfo = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const planRow = await ctx.db
      .query("appConfig")
      .withIndex("byUserId_key", (q) =>
        q.eq("userId", identity.subject).eq("key", "plan"),
      )
      .unique();

    const plan = (planRow?.value ?? null) as PlanRecord | null;

    return {
      tier: plan?.tier ?? "free",
      status: plan?.status ?? "active",
      currentPeriodEnd: plan?.currentPeriodEnd ?? null,
      hasStripeCustomer: !!plan?.stripeCustomerId,
      // Note: actual portal URL is short-lived → minted by `createBillingPortalSession`.
      portalUrl: null as string | null,
    };
  },
});

export const createBillingPortalSession = action({
  args: { returnUrl: v.optional(v.string()) },
  handler: async (
    ctx,
    args,
  ): Promise<{ url: string | null; message?: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return { url: null, message: "billing not configured" };
    }

    // Fetch the user's plan record to get their Stripe customer id.
    // appConfig.get returns the raw `value` (or null), not the row.
    const planValue = (await ctx.runQuery(api.appConfig.get, {
      key: "plan",
    })) as PlanRecord | null;
    const customerId = planValue?.stripeCustomerId;
    if (!customerId) {
      return { url: null, message: "no stripe customer for user" };
    }

    const params = new URLSearchParams();
    params.set("customer", customerId);
    if (args.returnUrl) params.set("return_url", args.returnUrl);

    const res = await fetch(
      "https://api.stripe.com/v1/billing_portal/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`stripe error ${res.status}: ${text.slice(0, 200)}`);
    }
    const data = (await res.json()) as { url?: string };
    return { url: data.url ?? null };
  },
});
