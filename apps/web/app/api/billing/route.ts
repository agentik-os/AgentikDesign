/**
 * GET /api/billing — billing summary (plan, status, period end, hasStripeCustomer).
 *
 * For minting a Stripe customer-portal URL, see /api/billing/portal (POST).
 */
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import { getConvexAuth, jsonError } from "../_lib/convex-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await getConvexAuth();
  if (auth instanceof Response) return auth;

  try {
    const billing = await fetchQuery(
      api.billing.getBillingInfo,
      {},
      { token: auth.token },
    );
    return Response.json({ billing });
  } catch (err) {
    return jsonError(String((err as Error)?.message ?? err));
  }
}
