/**
 * GET  /api/provider-credentials             — list provider creds for current user (no secrets)
 * POST /api/provider-credentials             — upsert provider credential
 *
 * Note: the Convex query/mutation handles auth + scrubbing internally.
 */
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import { getConvexAuth, jsonError } from "../_lib/convex-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await getConvexAuth();
  if (auth instanceof Response) return auth;

  try {
    const credentials = await fetchQuery(
      api.providerCredentials.list,
      {},
      { token: auth.token },
    );
    return Response.json({ credentials });
  } catch (err) {
    return jsonError(String((err as Error)?.message ?? err));
  }
}

export async function POST(request: Request) {
  const auth = await getConvexAuth();
  if (auth instanceof Response) return auth;

  let body: {
    provider?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    label?: string;
    metadata?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return jsonError("invalid_json", 400);
  }
  if (!body.provider) return jsonError("provider_required", 400);
  if (typeof body.accessToken !== "string") {
    return jsonError("accessToken_required", 400);
  }

  try {
    await fetchMutation(
      api.providerCredentials.upsert,
      {
        provider: body.provider,
        accessToken: body.accessToken,
        refreshToken: body.refreshToken,
        expiresAt: body.expiresAt,
        label: body.label,
        metadata: body.metadata,
      },
      { token: auth.token },
    );
    return Response.json({ ok: true }, { status: 201 });
  } catch (err) {
    return jsonError(String((err as Error)?.message ?? err));
  }
}
