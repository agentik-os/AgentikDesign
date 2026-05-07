/**
 * GET  /api/conversations/[id]/messages       — list messages for a conversation
 * POST /api/conversations/[id]/messages       — append a message
 */
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "../../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../../convex/_generated/dataModel";
import { getConvexAuth, jsonError } from "../../../_lib/convex-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const auth = await getConvexAuth();
  if (auth instanceof Response) return auth;
  const { id } = await params;
  const url = new URL(request.url);
  const limitStr = url.searchParams.get("limit");
  const limit = limitStr ? Number(limitStr) : undefined;

  try {
    const messages = await fetchQuery(
      api.messages.list,
      {
        conversationId: id as Id<"conversations">,
        ...(limit ? { limit } : {}),
      },
      { token: auth.token },
    );
    return Response.json({ messages });
  } catch (err) {
    return jsonError(String((err as Error)?.message ?? err));
  }
}

export async function POST(request: Request, { params }: Params) {
  const auth = await getConvexAuth();
  if (auth instanceof Response) return auth;
  const { id } = await params;

  let body: {
    role?: "user" | "assistant" | "system";
    content?: string;
    metadata?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return jsonError("invalid_json", 400);
  }
  if (!body.role) return jsonError("role_required", 400);
  if (typeof body.content !== "string") return jsonError("content_required", 400);

  try {
    const messageId = await fetchMutation(
      api.messages.append,
      {
        conversationId: id as Id<"conversations">,
        role: body.role,
        content: body.content,
        metadata: body.metadata,
      },
      { token: auth.token },
    );
    return Response.json({ messageId }, { status: 201 });
  } catch (err) {
    return jsonError(String((err as Error)?.message ?? err));
  }
}
