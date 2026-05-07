/**
 * 404 catch-all for /api/* paths that don't match any sibling route.
 *
 * Without this file, unknown /api/* requests fall through to the SPA's
 * (app)/[[...slug]] catch-all and get a 200 HTML response, which is wrong
 * for an API surface.
 */
export const runtime = "nodejs";

function notFound() {
  return Response.json({ error: "not_found" }, { status: 404 });
}

export const GET = notFound;
export const POST = notFound;
export const PUT = notFound;
export const PATCH = notFound;
export const DELETE = notFound;
export const OPTIONS = notFound;
