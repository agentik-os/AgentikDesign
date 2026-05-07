/**
 * DELETE /api/provider-credentials/[provider] — remove credentials for a provider
 */
import { fetchMutation } from "convex/nextjs";
import { api } from "../../../../../../convex/_generated/api";
import { getConvexAuth, jsonError } from "../../_lib/convex-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ provider: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await getConvexAuth();
  if (auth instanceof Response) return auth;
  const { provider } = await params;

  try {
    await fetchMutation(
      api.providerCredentials.remove,
      { provider },
      { token: auth.token },
    );
    return Response.json({ ok: true });
  } catch (err) {
    return jsonError(String((err as Error)?.message ?? err));
  }
}
