/**
 * Public version endpoint. Mirrors daemon `GET /api/version`.
 * Returns minimal AppVersionInfo-shaped payload from the deployed package.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let cachedVersion: string | null = null;

function readVersion(): string {
  if (cachedVersion) return cachedVersion;
  try {
    const raw = readFileSync(join(process.cwd(), "package.json"), "utf8");
    const pkg = JSON.parse(raw) as { version?: string };
    cachedVersion = typeof pkg.version === "string" ? pkg.version : "0.0.0";
  } catch {
    cachedVersion = "0.0.0";
  }
  return cachedVersion;
}

export async function GET() {
  const version = {
    version: readVersion(),
    channel: process.env.NEXT_PUBLIC_APP_CHANNEL ?? "web",
    packaged: false,
    platform: "vercel",
    arch: "n/a",
  };
  return Response.json({ version });
}
