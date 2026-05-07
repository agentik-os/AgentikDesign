/**
 * GET  /api/projects        — list projects for the current user
 * POST /api/projects        — create a project
 *
 * Convex-backed. Auth via Clerk JWT template "convex".
 */
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import { getConvexAuth, jsonError } from "../_lib/convex-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await getConvexAuth();
  if (auth instanceof Response) return auth;

  const url = new URL(request.url);
  const status = url.searchParams.get("status") as
    | "active"
    | "archived"
    | "deleted"
    | null;

  try {
    const data = await fetchQuery(
      api.projects.list,
      status ? { status } : {},
      { token: auth.token },
    );
    return Response.json({ projects: data });
  } catch (err) {
    return jsonError(String((err as Error)?.message ?? err));
  }
}

export async function POST(request: Request) {
  const auth = await getConvexAuth();
  if (auth instanceof Response) return auth;

  let body: {
    name?: string;
    description?: string;
    designSystemSlug?: string;
    settings?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return jsonError("invalid_json", 400);
  }

  if (!body.name || typeof body.name !== "string") {
    return jsonError("name_required", 400);
  }

  try {
    const projectId = await fetchMutation(
      api.projects.create,
      {
        name: body.name,
        description: body.description,
        designSystemSlug: body.designSystemSlug,
        settings: body.settings,
      },
      { token: auth.token },
    );
    return Response.json({ projectId }, { status: 201 });
  } catch (err) {
    return jsonError(String((err as Error)?.message ?? err));
  }
}
