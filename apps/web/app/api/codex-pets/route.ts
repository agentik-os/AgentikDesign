/**
 * GET /api/codex-pets — list community/bundled pets.
 *
 * Reads from build-time generated apps/web/lib/catalog-data.ts so Vercel's
 * Node File Tracing bundles the data with the function. Mirrors the
 * shape returned by apps/daemon/src/codex-pets.ts (bundled subset).
 *
 * No auth required (public catalog).
 */
import { communityPets } from "../../../lib/catalog-data";

export const runtime = "nodejs";

export async function GET() {
  // Mirror the shape `listCodexPets` produces in the daemon, mapping to
  // the same surface fields the UI expects: id, displayName, description,
  // and a `bundled: true` flag. Sprite URLs aren't served from the cloud
  // build (no filesystem at runtime) — clients fall back to the bundled
  // assets shipped with the app, or to a placeholder.
  const pets = communityPets.map((p) => ({
    id: p.id,
    displayName: p.displayName,
    description: p.description,
    bundled: true,
    author: p.author,
    tags: p.tags,
    source: p.source,
    sourceUrl: p.sourceUrl,
  }));
  return Response.json({ pets });
}
