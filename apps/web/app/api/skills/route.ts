/**
 * GET /api/skills — list available skills.
 *
 * Reads from build-time generated apps/web/lib/catalog-data.ts so Vercel's
 * Node File Tracing bundles the data with the function.
 *
 * No auth required (public catalog).
 */
import { skills } from "../../../lib/catalog-data";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({ skills });
}
