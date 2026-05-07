/**
 * POST /api/cli-auth/start — bootstrap the device-code OAuth flow.
 *
 * NO auth required — the deviceCode is the secret. Authenticated approval
 * happens later at /api/cli-auth/callback?code=USERCODE.
 *
 * Response shape mirrors RFC 8628:
 *   { device_code, user_code, verification_uri, expires_in, interval }
 */
import { fetchMutation } from "convex/nextjs";
import { api } from "../../../../../../convex/_generated/api";
import { jsonError } from "../../_lib/convex-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function siteOrigin(request: Request): string {
  const envOrigin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (envOrigin) return envOrigin;
  try {
    return new URL(request.url).origin;
  } catch {
    return "https://agentik-design.vercel.app";
  }
}

export async function POST(request: Request) {
  try {
    const result = await fetchMutation(api.cliAuth.createDeviceRequest, {});
    const origin = siteOrigin(request);
    const verificationUri = `${origin}/api/cli-auth/callback?code=${encodeURIComponent(result.userCode)}`;

    return Response.json({
      device_code: result.deviceCode,
      user_code: result.userCode,
      verification_uri: verificationUri,
      verification_uri_complete: verificationUri,
      expires_in: result.expiresIn,
      interval: result.interval,
    });
  } catch (err) {
    return jsonError(String((err as Error)?.message ?? err));
  }
}
