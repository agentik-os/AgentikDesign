/**
 * GET    /api/templates/[slug] — fetch a single template by slug
 * DELETE /api/templates/[slug] — delete a template (looked up by slug → id)
 */
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "../../../../../../convex/_generated/api";
import { getConvexAuth, jsonError } from "../../_lib/convex-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await getConvexAuth();
  if (auth instanceof Response) return auth;
  const { slug } = await params;

  try {
    const template = await fetchQuery(
      api.templates.getBySlug,
      { slug },
      { token: auth.token },
    );
    if (!template) return jsonError("not_found", 404);
    return Response.json({ template });
  } catch (err) {
    return jsonError(String((err as Error)?.message ?? err));
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await getConvexAuth();
  if (auth instanceof Response) return auth;
  const { slug } = await params;

  try {
    const template = await fetchQuery(
      api.templates.getBySlug,
      { slug },
      { token: auth.token },
    );
    if (!template) return jsonError("not_found", 404);

    await fetchMutation(
      api.templates.remove,
      { templateId: template._id },
      { token: auth.token },
    );
    return Response.json({ ok: true });
  } catch (err) {
    return jsonError(String((err as Error)?.message ?? err));
  }
}
