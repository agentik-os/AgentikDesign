// Drop "type": "module" from apps/web/package.json after Next.js build so that
// Vercel's CommonJS Node launcher (___next_launcher.cjs) can require() the
// compiled route bundles in .next/server/app/api/*/route.js.
//
// Without this, Node walks up from /var/task/apps/web/.next/server/app/api/.../route.js,
// finds apps/web/package.json with "type": "module", and refuses to require()
// the bundle (ERR_REQUIRE_ESM). Source on disk is unchanged — only the deployed
// copy is mutated. The .next bundles are genuine CJS so this is safe.
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const pkgPath = resolve(process.cwd(), "package.json");
const raw = readFileSync(pkgPath, "utf8");
const pkg = JSON.parse(raw);
if (pkg.type === "module") {
  delete pkg.type;
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  console.log("[postbuild-vercel] removed type:module from apps/web/package.json");
} else {
  console.log("[postbuild-vercel] apps/web/package.json already free of type:module");
}
