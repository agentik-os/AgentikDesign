/**
 * GET  /api/templates?category=... — list user templates
 * POST /api/templates              — upsert a template (by slug)
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
  const category = url.searchParams.get("category") ?? undefined;

  try {
    const templates = await fetchQuery(
      api.templates.list,
      category ? { category } : {},
      { token: auth.token },
    );
    return Response.json({ templates });
  } catch (err) {
    return jsonError(String((err as Error)?.message ?? err));
  }
}

export async function POST(request: Request) {
  const auth = await getConvexAuth();
  if (auth instanceof Response) return auth;

  let body: {
    slug?: string;
    title?: string;
    description?: string;
    category?: string;
    body?: string;
    tags?: string[];
  };
  try {
    body = await request.json();
  } catch {
    return jsonError("invalid_json", 400);
  }
  if (!body.slug) return jsonError("slug_required", 400);
  if (!body.title) return jsonError("title_required", 400);
  if (typeof body.body !== "string") return jsonError("body_required", 400);

  try {
    const templateId = await fetchMutation(
      api.templates.upsert,
      {
        slug: body.slug,
        title: body.title,
        description: body.description,
        category: body.category,
        body: body.body,
      },
      { token: auth.token },
    );
    return Response.json({ templateId }, { status: 201 });
  } catch (err) {
    return jsonError(String((err as Error)?.message ?? err));
  }
}
