/**
 * Public health endpoint. Mirrors daemon `GET /api/health`.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let cachedVersion: string | null = null;

function readVersion(): string {
  if (cachedVersion) return cachedVersion;
  try {
    // process.cwd() at runtime is the app root on Vercel and during `next dev`.
    const raw = readFileSync(join(process.cwd(), "package.json"), "utf8");
    const pkg = JSON.parse(raw) as { version?: string };
    cachedVersion = typeof pkg.version === "string" ? pkg.version : "0.0.0";
  } catch {
    cachedVersion = "0.0.0";
  }
  return cachedVersion;
}

export async function GET() {
  return Response.json({ ok: true, version: readVersion() });
}
