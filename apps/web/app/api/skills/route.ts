/**
 * GET /api/skills — list available skills.
 *
 * Filesystem fallback: enumerates subdirectories under `<repo>/skills/`.
 * No auth required (public catalog).
 *
 * Once Convex codegen is unblocked, this can be swapped for
 * `fetchQuery(api.catalog.listSkills, ...)`.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SkillEntry {
  id: string;
  slug: string;
  name: string;
  description?: string;
}

function findRepoRoot(): string {
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    if (existsSync(join(dir, "skills"))) return dir;
    const parent = join(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }
  return process.cwd();
}

function readSkills(): SkillEntry[] {
  const root = findRepoRoot();
  const skillsDir = join(root, "skills");
  if (!existsSync(skillsDir)) return [];

  const entries = readdirSync(skillsDir);
  const out: SkillEntry[] = [];
  for (const name of entries) {
    const full = join(skillsDir, name);
    try {
      if (!statSync(full).isDirectory()) continue;
    } catch {
      continue;
    }

    let description: string | undefined;
    const metaPath = join(full, "skill.json");
    if (existsSync(metaPath)) {
      try {
        const meta = JSON.parse(readFileSync(metaPath, "utf8")) as {
          description?: unknown;
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
    const skills = readSkills();
    return Response.json({ skills });
  } catch (err) {
    return Response.json(
      { error: String((err as Error)?.message ?? err) },
      { status: 500 },
    );
  }
}
