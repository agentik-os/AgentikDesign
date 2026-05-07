/**
 * Shared helper for Next.js API routes that need an authenticated Convex token.
 *
 * Two helpers:
 *   - `getConvexAuth()`        — strict: returns `{ token }` or a 401 `Response`.
 *                                Use for endpoints that REQUIRE auth.
 *   - `getOptionalConvexAuth()` — lenient: returns `{ token }` on success,
 *                                 `null` when the user is signed-out OR when
 *                                 token retrieval fails for any reason. Use
 *                                 for catalog endpoints that should work for
 *                                 signed-out callers.
 *
 * Both helpers are timeout/throw safe — `getToken({ template: "convex" })`
 * will throw if Clerk has no JWT template named "convex" or if the Clerk
 * SDK can't reach the API. We always catch and surface a typed result so
 * route handlers never bubble a raw 500.
 *
 * Required env (deploy-time):
 *   - CLERK_PUBLISHABLE_KEY / CLERK_SECRET_KEY        — Clerk credentials
 *   - CLERK_JWT_ISSUER_DOMAIN                          — must match the Clerk
 *     Frontend API URL configured in `convex/auth.config.ts` (the issuer
 *     embedded in the minted JWT must equal `applicationID` there).
 *   - Clerk dashboard → JWT Templates → a template literally named "convex"
 *     with the default `subject` claim. Without this template, getToken
 *     throws and every API route that calls getConvexAuth fails.
 *
 * Usage:
 *   const auth = await getConvexAuth();
 *   if (auth instanceof Response) return auth;
 *   const data = await fetchQuery(api.projects.list, {}, { token: auth.token });
 */
import { auth } from "@clerk/nextjs/server";

export type ConvexAuth = { token: string };

async function tryGetToken(): Promise<{ token: string | null; error?: string }> {
  try {
    const { getToken } = await auth();
    const token = await getToken({ template: "convex" });
    return { token: token ?? null };
  } catch (err) {
    return {
      token: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Strict auth: returns `{ token }` on success, or a 401 `Response`.
 * Never throws. Never returns 500 on a missing / failing token.
 */
export async function getConvexAuth(): Promise<ConvexAuth | Response> {
  const { token } = await tryGetToken();
  if (!token) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  return { token };
}

/**
 * Lenient auth: returns `{ token }` if available, or `null` for signed-out
 * users (and for any failure to obtain a token). Never throws.
 */
export async function getOptionalConvexAuth(): Promise<ConvexAuth | null> {
  const { token } = await tryGetToken();
  return token ? { token } : null;
}

/**
 * Dev-only diagnostic: returns the raw token-acquisition result so debugging
 * Clerk JWT template issues doesn't require redeploys. Gated by NODE_ENV at
 * the call site.
 */
export async function debugConvexAuth(): Promise<{
  token: string | null;
  error?: string;
}> {
  return tryGetToken();
}

export function jsonError(message: string, status = 500): Response {
  return Response.json({ error: message }, { status });
}
