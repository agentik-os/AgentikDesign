/**
 * GET  /api/active — current active project for the signed-in user.
 * POST /api/active — set the active project for the signed-in user.
 *
 * Auth-gated. Backed by Convex `appConfig.get/set` with key 'active.projectId'.
 * Signed-out callers get 401 — there is no anonymous "active project".
 */
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import { getConvexAuth, jsonError } from "../_lib/convex-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACTIVE_KEY = "active.projectId";

export async function GET() {
  const auth = await getConvexAuth();
  if (auth instanceof Response) return auth;

  try {
    const value = await fetchQuery(
      api.appConfig.get,
      { key: ACTIVE_KEY },
      { token: auth.token },
    );
    // appConfig.get returns the raw value (or null). The UI expects a
    // `{ activeProjectId, lastUpdated }` shape, so we normalise here.
    const activeProjectId =
      value && typeof value === "object" && "projectId" in value
        ? (value as { projectId: string | null }).projectId
        : typeof value === "string"
          ? value
          : null;
    const lastUpdated =
      value && typeof value === "object" && "lastUpdated" in value
        ? (value as { lastUpdated: number }).lastUpdated
        : null;
    return Response.json({ activeProjectId, lastUpdated });
  } catch (err) {
    return jsonError(String((err as Error)?.message ?? err));
  }
}

export async function POST(request: Request) {
  const auth = await getConvexAuth();
  if (auth instanceof Response) return auth;

  let body: { projectId?: string | null };
  try {
    body = await request.json();
  } catch {
    return jsonError("invalid_json", 400);
  }

  if (
    body.projectId !== null &&
    typeof body.projectId !== "string" &&
    typeof body.projectId !== "undefined"
  ) {
    return jsonError("projectId_must_be_string_or_null", 400);
  }

  const projectId = body.projectId ?? null;
  const lastUpdated = Date.now();

  try {
    await fetchMutation(
      api.appConfig.set,
      { key: ACTIVE_KEY, value: { projectId, lastUpdated } },
      { token: auth.token },
    );
    return Response.json({ activeProjectId: projectId, lastUpdated });
  } catch (err) {
    return jsonError(String((err as Error)?.message ?? err));
  }
}
