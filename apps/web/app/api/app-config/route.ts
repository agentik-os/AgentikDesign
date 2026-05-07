/**
 * GET  /api/app-config         — list all app config rows for the current user
 * POST /api/app-config         — set a single { key, value } pair
 * PUT  /api/app-config         — bulk-set a flat prefs object (one row per
 *                                top-level key). Mirrors `syncConfigToDaemon`
 *                                in `apps/web/src/state/config.ts`, which
 *                                ships the entire `AppConfigPrefs` blob in a
 *                                single request to keep its on-mount
 *                                migration cheap.
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

export async function PUT(request: Request) {
  const auth = await getConvexAuth();
  if (auth instanceof Response) return auth;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError("invalid_json", 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return jsonError("object_body_required", 400);
  }

  // One Convex mutation per top-level key. `appConfig.set` is an upsert,
  // so callers can ship partial prefs without clobbering untouched keys.
  // `undefined` values are dropped because they survive `JSON.stringify`
  // as missing properties anyway, and `null` is preserved as an explicit
  // "clear this preference" signal.
  const entries = Object.entries(body).filter(([, value]) => value !== undefined);
  try {
    await Promise.all(
      entries.map(([key, value]) =>
        fetchMutation(
          api.appConfig.set,
          { key, value },
          { token: auth.token },
        ),
      ),
    );
    return Response.json({ ok: true, written: entries.length });
  } catch (err) {
    return jsonError(String((err as Error)?.message ?? err));
  }
}
