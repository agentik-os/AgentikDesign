/**
 * GET    /api/app-config/[key] — fetch a single config row by key
 * DELETE /api/app-config/[key] — remove a config row
 */
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "../../../../../../convex/_generated/api";
import { getConvexAuth, jsonError } from "../../_lib/convex-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ key: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await getConvexAuth();
  if (auth instanceof Response) return auth;
  const { key } = await params;

  try {
    const row = await fetchQuery(api.appConfig.get, { key }, { token: auth.token });
    if (!row) return jsonError("not_found", 404);
    return Response.json({ config: row });
  } catch (err) {
    return jsonError(String((err as Error)?.message ?? err));
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await getConvexAuth();
  if (auth instanceof Response) return auth;
  const { key } = await params;

  try {
    await fetchMutation(api.appConfig.remove, { key }, { token: auth.token });
    return Response.json({ ok: true });
  } catch (err) {
    return jsonError(String((err as Error)?.message ?? err));
  }
}
