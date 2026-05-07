/**
 * GET /api/debug/auth — dev-only diagnostic for Clerk → Convex JWT issues.
 *
 * Returns the raw token-acquisition result (token presence + error message
 * if Clerk threw). Disabled in production to avoid leaking implementation
 * details. Intended for local debugging of "auth provider not found" errors
 * coming from Convex when the JWT issuer doesn't match `convex/auth.config.ts`.
 */
import { debugConvexAuth } from "../../_lib/convex-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  const result = await debugConvexAuth();
  return Response.json({
    hasToken: Boolean(result.token),
    tokenPreview: result.token ? `${result.token.slice(0, 12)}…` : null,
    error: result.error ?? null,
    env: {
      CLERK_JWT_ISSUER_DOMAIN: process.env.CLERK_JWT_ISSUER_DOMAIN ?? null,
      NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL ?? null,
    },
  });
}
