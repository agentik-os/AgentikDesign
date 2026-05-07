/**
 * Shared helper for Next.js API routes that need an authenticated Convex token.
 * Returns either a `token` string (success) or a `Response` (401 to short-circuit).
 *
 * Usage:
 *   const auth = await getConvexAuth();
 *   if (auth instanceof Response) return auth;
 *   const data = await fetchQuery(api.projects.list, {}, { token: auth.token });
 */
import { auth } from "@clerk/nextjs/server";

export type ConvexAuth = { token: string };

export async function getConvexAuth(): Promise<ConvexAuth | Response> {
  const { getToken } = await auth();
  const token = await getToken({ template: "convex" });
  if (!token) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  return { token };
}

export function jsonError(message: string, status = 500): Response {
  return Response.json({ error: message }, { status });
}
