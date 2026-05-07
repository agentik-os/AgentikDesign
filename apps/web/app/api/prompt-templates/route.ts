/**
 * GET /api/prompt-templates — list curated prompt templates by surface.
 *
 * Reads from build-time generated apps/web/lib/catalog-data.ts so Vercel's
 * Node File Tracing bundles the data with the function. Mirrors the
 * shape produced by apps/daemon/src/prompt-templates.ts.
 *
 * Optional filter: ?surface=image|video.
 *
 * No auth required (public catalog).
 */
import { promptTemplates } from "../../../lib/catalog-data";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const surface = url.searchParams.get("surface");
  const filtered =
    surface === "image" || surface === "video"
      ? promptTemplates.filter((t) => t.surface === surface)
      : promptTemplates;
  return Response.json({ templates: filtered });
}
