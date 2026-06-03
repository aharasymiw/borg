// Package built extensions into store-uploadable zips.
//
//   node package.mjs                -> zip both targets (expects build/ to exist)
//   node package.mjs chrome         -> zip only chrome
//
// Produces dist/borg-<target>-<version>.zip with manifest.json at the archive
// root (what the Chrome Web Store and Firefox AMO expect on upload).

import { execFileSync } from "node:child_process";
import { promises as fs, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const { version } = JSON.parse(await fs.readFile(path.join(ROOT, "package.json"), "utf8"));

const requested = process.argv.slice(2).filter((a) => !a.startsWith("-"));
const TARGETS = requested.length ? requested : ["chrome", "firefox"];

await fs.mkdir(path.join(ROOT, "dist"), { recursive: true });

for (const target of TARGETS) {
  const buildDir = path.join(ROOT, "build", target);
  if (!existsSync(path.join(buildDir, "manifest.json"))) {
    console.error(`build/${target} is missing — run "npm run build:${target}" first.`);
    process.exit(1);
  }
  const zipPath = path.join(ROOT, "dist", `borg-${target}-${version}.zip`);
  await fs.rm(zipPath, { force: true });
  // Run zip from inside the build dir so paths in the archive are relative
  // (manifest.json at root, icons/ alongside it) — not build/<target>/...
  execFileSync("zip", ["-r", "-X", "-q", zipPath, "."], { cwd: buildDir, stdio: "inherit" });
  console.log(`✓ ${path.relative(ROOT, zipPath)}`);
}

console.log("done.");
