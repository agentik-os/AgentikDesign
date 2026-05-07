/**
 * POST /api/cli-auth/poll — CLI polls this with its device_code until the
 * user approves. Returns one of:
 *   { status: "pending" }
 *   { status: "approved", token: "ad_..." }
 *   { status: "expired" }
 *   { status: "not_found" }
 *
 * NO auth required — possession of the deviceCode is the proof.
 */
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../../../convex/_generated/api";
import { jsonError } from "../../_lib/convex-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { device_code?: string };
  try {
    body = (await request.json()) as { device_code?: string };
  } catch {
    return jsonError("invalid_json", 400);
  }
  const deviceCode = body.device_code;
  if (!deviceCode || typeof deviceCode !== "string") {
    return jsonError("device_code_required", 400);
  }

  try {
    const result = await fetchQuery(api.cliAuth.pollDeviceRequest, {
      deviceCode,
    });
    return Response.json(result);
  } catch (err) {
    return jsonError(String((err as Error)?.message ?? err));
  }
}
