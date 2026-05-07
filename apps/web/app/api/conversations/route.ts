/**
 * GET  /api/conversations?projectId=...   — list conversations for a project (or recent)
 * POST /api/conversations                 — create a conversation
 */
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { getConvexAuth, jsonError } from "../_lib/convex-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await getConvexAuth();
  if (auth instanceof Response) return auth;

  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId");
  const limitStr = url.searchParams.get("limit");
  const limit = limitStr ? Number(limitStr) : undefined;

  try {
    if (projectId) {
      const conversations = await fetchQuery(
        api.conversations.listByProject,
        { projectId: projectId as Id<"projects"> },
        { token: auth.token },
      );
      return Response.json({ conversations });
    }
    const conversations = await fetchQuery(
      api.conversations.listRecent,
      limit ? { limit } : {},
      { token: auth.token },
    );
    return Response.json({ conversations });
  } catch (err) {
    return jsonError(String((err as Error)?.message ?? err));
  }
}

export async function POST(request: Request) {
  const auth = await getConvexAuth();
  if (auth instanceof Response) return auth;

  let body: {
    projectId?: string;
    title?: string;
    provider?: string;
    model?: string;
    skillSlug?: string;
  };
  try {
    body = await request.json();
  } catch {
    return jsonError("invalid_json", 400);
  }

  if (!body.projectId) return jsonError("projectId_required", 400);

  try {
    const conversationId = await fetchMutation(
      api.conversations.create,
      {
        projectId: body.projectId as Id<"projects">,
        title: body.title,
        provider: body.provider,
        model: body.model,
        skillSlug: body.skillSlug,
      },
      { token: auth.token },
    );
    return Response.json({ conversationId }, { status: 201 });
  } catch (err) {
    return jsonError(String((err as Error)?.message ?? err));
  }
}
