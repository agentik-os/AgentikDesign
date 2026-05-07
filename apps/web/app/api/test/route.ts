/**
 * GET /api/test — connection test endpoint used by the UI to probe the
 * cloud API. Returns identity (or null) without forcing auth so the UI
 * can render a meaningful "signed-out / signed-in" badge from one call.
 */
import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VERSION = "0.4.1";

export async function GET() {
  let identity: string | null = null;
  try {
    const { userId } = await auth();
    identity = userId ?? null;
  } catch {
    identity = null;
  }
  return Response.json({
    ok: true,
    ts: Date.now(),
    identity,
    version: VERSION,
    message: "Agentik Design API reachable",
  });
}
