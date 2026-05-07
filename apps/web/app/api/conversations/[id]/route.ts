/**
 * GET    /api/conversations/[id] — fetch a conversation
 * PATCH  /api/conversations/[id] — update conversation metadata
 * DELETE /api/conversations/[id] — delete a conversation (cascade messages)
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
    const conversation = await fetchQuery(
      api.conversations.get,
      { conversationId: id as Id<"conversations"> },
      { token: auth.token },
    );
    if (!conversation) return jsonError("not_found", 404);
    return Response.json({ conversation });
  } catch (err) {
    return jsonError(String((err as Error)?.message ?? err));
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await getConvexAuth();
  if (auth instanceof Response) return auth;
  const { id } = await params;

  let body: {
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

  try {
    await fetchMutation(
      api.conversations.update,
      { conversationId: id as Id<"conversations">, ...body },
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
      api.conversations.remove,
      { conversationId: id as Id<"conversations"> },
      { token: auth.token },
    );
    return Response.json({ ok: true });
  } catch (err) {
    return jsonError(String((err as Error)?.message ?? err));
  }
}
