/**
 * GET /api/design-systems — list available design systems.
 *
 * Filesystem fallback: enumerates subdirectories under `<repo>/design-systems/`.
 * No auth required (public catalog).
 *
 * Once Convex codegen is unblocked, this can be swapped for
 * `fetchQuery(api.catalog.listDesignSystems, ...)`.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface DesignSystemEntry {
  id: string;
  slug: string;
  name: string;
  description?: string;
}

function findRepoRoot(): string {
  // From `apps/web/.next/...` we walk up to find a folder that contains
  // a `design-systems/` directory. Cwd at runtime is the repo root on
  // Vercel (next build), but stay defensive for local dev.
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    if (existsSync(join(dir, "design-systems"))) return dir;
    const parent = join(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }
  return process.cwd();
}

function readDesignSystems(): DesignSystemEntry[] {
  const root = findRepoRoot();
  const dsDir = join(root, "design-systems");
  if (!existsSync(dsDir)) return [];

  const entries = readdirSync(dsDir);
  const out: DesignSystemEntry[] = [];
  for (const name of entries) {
    const full = join(dsDir, name);
    try {
      if (!statSync(full).isDirectory()) continue;
    } catch {
      continue;
    }

    let description: string | undefined;
    const metaPath = join(full, "design-system.json");
    if (existsSync(metaPath)) {
      try {
        const meta = JSON.parse(readFileSync(metaPath, "utf8")) as {
          description?: unknown;
          name?: unknown;
        };
        if (typeof meta.description === "string") description = meta.description;
      } catch {
        // ignore malformed metadata
      }
    }

    out.push({ id: name, slug: name, name, description });
  }

  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

export async function GET() {
  try {
    const designSystems = readDesignSystems();
    return Response.json({ designSystems });
  } catch (err) {
    return Response.json(
      { error: String((err as Error)?.message ?? err) },
      { status: 500 },
    );
  }
}
