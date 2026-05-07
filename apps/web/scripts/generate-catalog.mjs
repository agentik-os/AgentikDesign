// Generates apps/web/lib/catalog-data.ts with the lists of design systems,
// skills, community pets, and prompt templates found under <repo>/. The
// generated file is imported by /api/{design-systems,skills,codex-pets,
// prompt-templates} so Vercel's Node File Tracing bundles the data with
// the function (the raw directories aren't traced into /var/task at
// runtime).
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..", "..");
const OUT_DIR = join(__dirname, "..", "lib");
const OUT_FILE = join(OUT_DIR, "catalog-data.ts");

function readMeta(dir, files) {
  for (const f of files) {
    const p = join(dir, f);
    if (existsSync(p)) {
      try {
        const raw = readFileSync(p, "utf8");
        if (f.endsWith(".json")) return JSON.parse(raw);
        return { _raw: raw };
      } catch {
        return null;
      }
    }
  }
  return null;
}

function listDir(name) {
  const full = join(REPO_ROOT, name);
  if (!existsSync(full)) return [];
  const out = [];
  for (const entry of readdirSync(full)) {
    const p = join(full, entry);
    try {
      if (!statSync(p).isDirectory()) continue;
    } catch {
      continue;
    }
    const meta = readMeta(p, ["design-system.json", "skill.json", "manifest.json"]);
    const description = typeof meta?.description === "string" ? meta.description : undefined;
    const displayName = typeof meta?.name === "string" ? meta.name : entry;
    out.push({ id: entry, slug: entry, name: displayName, description });
  }
  out.sort((a, b) => a.slug.localeCompare(b.slug));
  return out;
}

// Bundled community pets — each <id>/pet.json carries the manifest the
// daemon's codex-pets module expects. We bake the full record at build
// time so the API route can serve the list without filesystem access at
// runtime.
function listCommunityPets() {
  const root = join(REPO_ROOT, "assets", "community-pets");
  if (!existsSync(root)) return [];
  const out = [];
  for (const entry of readdirSync(root)) {
    const dir = join(root, entry);
    try {
      if (!statSync(dir).isDirectory()) continue;
    } catch {
      continue;
    }
    const manifestPath = join(dir, "pet.json");
    let manifest = null;
    if (existsSync(manifestPath)) {
      try {
        manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
      } catch {
        manifest = null;
      }
    }
    const id = entry;
    const displayName =
      typeof manifest?.displayName === "string" && manifest.displayName.trim()
        ? manifest.displayName.trim()
        : entry.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const description =
      typeof manifest?.description === "string" ? manifest.description : "";
    const author = typeof manifest?.author === "string" ? manifest.author : undefined;
    const tags = Array.isArray(manifest?.tags)
      ? manifest.tags.filter((t) => typeof t === "string")
      : [];
    const source = typeof manifest?.source === "string" ? manifest.source : "bundled";
    const sourceUrl =
      typeof manifest?.sourceUrl === "string" ? manifest.sourceUrl : undefined;
    out.push({
      id,
      name: displayName,
      displayName,
      description,
      kind: "bundled",
      author,
      tags,
      source,
      sourceUrl,
      bundled: true,
    });
  }
  out.sort((a, b) => a.id.localeCompare(b.id));
  return out;
}

// Curated prompt templates — bake the full record (same shape the
// daemon's listPromptTemplates returns). Each surface (image|video)
// contributes <id>.json files; light validation matches the daemon's.
function listPromptTemplates() {
  const root = join(REPO_ROOT, "prompt-templates");
  if (!existsSync(root)) return [];
  const out = [];
  for (const surface of ["image", "video"]) {
    const dir = join(root, surface);
    if (!existsSync(dir)) continue;
    let entries;
    try {
      entries = readdirSync(dir);
    } catch {
      continue;
    }
    for (const file of entries) {
      if (!file.endsWith(".json")) continue;
      const filePath = join(dir, file);
      try {
        const raw = JSON.parse(readFileSync(filePath, "utf8"));
        if (!raw || typeof raw !== "object") continue;
        if (typeof raw.id !== "string" || !raw.id) continue;
        if (raw.surface !== surface) continue;
        if (typeof raw.title !== "string" || !raw.title.trim()) continue;
        if (typeof raw.prompt !== "string" || raw.prompt.trim().length < 20) continue;
        const source = raw.source && typeof raw.source === "object" ? raw.source : null;
        if (!source || typeof source.repo !== "string" || typeof source.license !== "string") {
          continue;
        }
        out.push({
          id: raw.id,
          surface: raw.surface,
          title: raw.title.trim(),
          summary: typeof raw.summary === "string" ? raw.summary.trim() : "",
          category: typeof raw.category === "string" ? raw.category : "General",
          tags: Array.isArray(raw.tags)
            ? raw.tags.filter((t) => typeof t === "string")
            : [],
          model: typeof raw.model === "string" ? raw.model : undefined,
          aspect: typeof raw.aspect === "string" ? raw.aspect : undefined,
          prompt: raw.prompt.trim(),
          previewImageUrl:
            typeof raw.previewImageUrl === "string" ? raw.previewImageUrl : undefined,
          previewVideoUrl:
            typeof raw.previewVideoUrl === "string" ? raw.previewVideoUrl : undefined,
          source: {
            repo: source.repo,
            license: source.license,
            author: typeof source.author === "string" ? source.author : undefined,
            url: typeof source.url === "string" ? source.url : undefined,
          },
        });
      } catch {
        // skip invalid files
      }
    }
  }
  out.sort((a, b) => {
    if (a.surface !== b.surface) return a.surface === "image" ? -1 : 1;
    return a.title.localeCompare(b.title);
  });
  return out;
}

const designSystems = listDir("design-systems");
const skills = listDir("skills");
const communityPets = listCommunityPets();
const promptTemplates = listPromptTemplates();

const out = `// Auto-generated by apps/web/scripts/generate-catalog.mjs at build time.
// Do not edit by hand. Regenerated on every \`next build\`.
export interface CatalogEntry {
  id: string;
  slug: string;
  name: string;
  description?: string;
}

export interface CommunityPetEntry {
  id: string;
  name: string;
  displayName: string;
  description: string;
  kind: "bundled";
  author?: string;
  tags: string[];
  source: string;
  sourceUrl?: string;
  bundled: true;
}

export interface PromptTemplateEntry {
  id: string;
  surface: "image" | "video";
  title: string;
  summary: string;
  category: string;
  tags: string[];
  model?: string;
  aspect?: string;
  prompt: string;
  previewImageUrl?: string;
  previewVideoUrl?: string;
  source: {
    repo: string;
    license: string;
    author?: string;
    url?: string;
  };
}

export const designSystems: CatalogEntry[] = ${JSON.stringify(designSystems, null, 2)};

export const skills: CatalogEntry[] = ${JSON.stringify(skills, null, 2)};

export const communityPets: CommunityPetEntry[] = ${JSON.stringify(communityPets, null, 2)};

export const promptTemplates: PromptTemplateEntry[] = ${JSON.stringify(promptTemplates, null, 2)};
`;

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_FILE, out);
console.log(
  `[generate-catalog] wrote ${OUT_FILE}: ${designSystems.length} design systems, ${skills.length} skills, ${communityPets.length} community pets, ${promptTemplates.length} prompt templates`,
);
