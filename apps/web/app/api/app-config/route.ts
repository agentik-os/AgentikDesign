/**
 * GET  /api/app-config         — list all app config rows for the current user
 * POST /api/app-config         — set a key/value pair
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
    const rows = await fetchQuery(api.appConfig.list, {}, { token: auth.token });
    return Response.json({ config: rows });
  } catch (err) {
    return jsonError(String((err as Error)?.message ?? err));
  }
}

export async function POST(request: Request) {
  const auth = await getConvexAuth();
  if (auth instanceof Response) return auth;

  let body: { key?: string; value?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError("invalid_json", 400);
  }
  if (!body.key) return jsonError("key_required", 400);

  try {
    await fetchMutation(
      api.appConfig.set,
      { key: body.key, value: body.value },
      { token: auth.token },
    );
    return Response.json({ ok: true });
  } catch (err) {
    return jsonError(String((err as Error)?.message ?? err));
  }
}
