/**
 * GET /api/account — current user's account info (identity + plan + usage).
 *
 * Auth via Clerk JWT template "convex". Mirrors the Telegram bot /account
 * command (bot/aisb/account.py).
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
    const account = await fetchQuery(
      api.account.getCurrentUserAccount,
      {},
      { token: auth.token },
    );
    return Response.json({ account });
  } catch (err) {
    return jsonError(String((err as Error)?.message ?? err));
  }
}
