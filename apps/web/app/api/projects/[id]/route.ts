/**
 * GET    /api/projects/[id] — fetch a project
 * PATCH  /api/projects/[id] — update a project
 * DELETE /api/projects/[id] — soft-delete a project
 */
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import { getConvexAuth, jsonError } from "../../_lib/convex-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await getConvexAuth();
  if (auth instanceof Response) return auth;
  const { id } = await params;

  try {
    const project = await fetchQuery(
      api.projects.get,
      { projectId: id as Id<"projects"> },
      { token: auth.token },
    );
    if (!project) return jsonError("not_found", 404);
    return Response.json({ project });
  } catch (err) {
    return jsonError(String((err as Error)?.message ?? err));
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await getConvexAuth();
  if (auth instanceof Response) return auth;
  const { id } = await params;

  let body: {
    name?: string;
    description?: string;
    designSystemSlug?: string;
    status?: "active" | "archived" | "deleted";
    settings?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return jsonError("invalid_json", 400);
  }

  try {
    await fetchMutation(
      api.projects.update,
      { projectId: id as Id<"projects">, ...body },
      { token: auth.token },
    );
    return Response.json({ ok: true });
  } catch (err) {
    return jsonError(String((err as Error)?.message ?? err));
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await getConvexAuth();
  if (auth instanceof Response) return auth;
  const { id } = await params;

  try {
    await fetchMutation(
      api.projects.remove,
      { projectId: id as Id<"projects"> },
      { token: auth.token },
    );
    return Response.json({ ok: true });
  } catch (err) {
    return jsonError(String((err as Error)?.message ?? err));
  }
}
