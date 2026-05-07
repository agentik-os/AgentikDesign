/**
 * GET / PUT  /api/connectors/composio/config
 *
 * Stub for the Composio integration. The legacy daemon used to serve a
 * server-persisted Composio API key (so the same browser shell could read
 * the key from a different machine). The Vercel BYOK build does not ship
 * Composio support — the SPA stores the user's Composio key in
 * localStorage only. Without this route the SPA's eager
 * `fetchComposioConfigFromDaemon` and `syncComposioConfigToDaemon` calls
 * 404, polluting the browser console.
 *
 * The stub returns a "not configured" payload for GET so the SPA falls
 * back to its localStorage copy, and accepts (then discards) PUT bodies
 * so the sync helper completes cleanly. Public — no Clerk gate, since
 * there is no per-user state to read or write.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NOT_CONFIGURED_PAYLOAD = {
  enabled: false,
  configured: false,
  reason: "composio_not_configured",
  apiKeyTail: "",
} as const;

export async function GET() {
  return Response.json(NOT_CONFIGURED_PAYLOAD);
}

export async function PUT() {
  // Discard the body — there's no daemon-side store in the BYOK build.
  // The client retains the user's key in localStorage.
  return Response.json({ ok: true, persisted: false });
}

export async function POST() {
  return Response.json({ ok: true, persisted: false });
}
