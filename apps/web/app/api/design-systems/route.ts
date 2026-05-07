/**
 * GET /api/design-systems — list available design systems.
 *
 * Reads from build-time generated apps/web/lib/catalog-data.ts so Vercel's
 * Node File Tracing bundles the data with the function. (Raw design-systems/
 * directories are not traced into /var/task at runtime.)
 *
 * No auth required (public catalog).
 */
import { designSystems } from "../../../lib/catalog-data";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({ designSystems });
}
