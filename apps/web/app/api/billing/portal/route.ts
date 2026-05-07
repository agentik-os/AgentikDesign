/**
 * POST /api/billing/portal — mint a short-lived Stripe customer-portal URL.
 *
 * Body: { returnUrl?: string }
 * Returns: { url: string | null, message?: string }
 *
 * Returns `{ url: null, message: "billing not configured" }` when STRIPE_SECRET_KEY
 * is unset — keeps the BYOK install path unblocked.
 */
import { fetchAction } from "convex/nextjs";
import { api } from "../../../../../../convex/_generated/api";
import { getConvexAuth, jsonError } from "../../_lib/convex-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await getConvexAuth();
  if (auth instanceof Response) return auth;

  let body: { returnUrl?: string } = {};
  try {
    body = (await request.json()) as { returnUrl?: string };
  } catch {
    // empty body is fine
  }

  try {
    const result = await fetchAction(
      api.billing.createBillingPortalSession,
      { returnUrl: body.returnUrl },
      { token: auth.token },
    );
    return Response.json(result);
  } catch (err) {
    return jsonError(String((err as Error)?.message ?? err));
  }
}
