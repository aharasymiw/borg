// Build script for the "borg" extension.
// Bundles each entry point into an IIFE with esbuild and assembles a loadable
// extension directory per browser target (build/chrome, build/firefox).
//
//   node build.mjs                -> build both targets
//   node build.mjs chrome         -> build only chrome
//   node build.mjs firefox        -> build only firefox
//   node build.mjs --watch        -> rebuild on change (both targets)

import esbuild from "esbuild";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const watch = args.includes("--watch");
const requested = args.filter((a) => !a.startsWith("--"));
const TARGETS = requested.length ? requested : ["chrome", "firefox"];

// Each entry compiles to <name>.js in the target's root.
const ENTRY_POINTS = {
  background: "src/background/background.js",
  source: "src/source/content-script.js",
  "source-page": "src/source/page-script.js",
  roll20: "src/roll20/content-script.js",
  options: "src/options/options.js",
  popup: "src/options/popup.js",
};

// Static files copied verbatim into each target.
const STATIC_FILES = [
  "src/options/options.html",
  "src/options/options.css",
  "src/options/popup.html",
];

const MANIFESTS = {
  chrome: "manifest.chrome.json",
  firefox: "manifest.firefox.json",
};

async function copyStatic(outdir) {
  for (const rel of STATIC_FILES) {
    const dest = path.join(outdir, path.basename(rel));
    await fs.copyFile(path.join(ROOT, rel), dest).catch((err) => {
      console.warn(`  ! skipped ${rel}: ${err.message}`);
    });
  }
}

// Extension icons referenced by the manifest, copied into <target>/icons/.
const ICON_SIZES = [16, 32, 48, 96, 128];
async function copyIcons(outdir) {
  const dir = path.join(outdir, "icons");
  await fs.mkdir(dir, { recursive: true });
  for (const n of ICON_SIZES) {
    const name = `icon-${n}.png`;
    await fs.copyFile(path.join(ROOT, "assets", "icons", name), path.join(dir, name)).catch((err) => {
      console.warn(`  ! skipped ${name}: ${err.message}`);
    });
  }
}

async function copyManifest(target, outdir) {
  const src = path.join(ROOT, MANIFESTS[target]);
  await fs.copyFile(src, path.join(outdir, "manifest.json"));
}

async function buildTarget(target) {
  const outdir = path.join(ROOT, "build", target);
  await fs.rm(outdir, { recursive: true, force: true });
  await fs.mkdir(outdir, { recursive: true });

  const ctx = await esbuild.context({
    entryPoints: Object.fromEntries(
      Object.entries(ENTRY_POINTS).map(([name, rel]) => [name, path.join(ROOT, rel)])
    ),
    outdir,
    bundle: true,
    format: "iife",
    target: ["chrome110", "firefox115"],
    define: { __BROWSER__: JSON.stringify(target) },
    logLevel: "info",
    sourcemap: watch ? "inline" : false,
  });

  async function finish() {
    await copyStatic(outdir);
    await copyIcons(outdir);
    await copyManifest(target, outdir);
    console.log(`✓ built ${target} -> ${path.relative(ROOT, outdir)}`);
  }

  if (watch) {
    await ctx.watch();
    await finish();
    // Re-copy static/manifest on a light interval so manifest edits propagate too.
    return ctx;
  }
  await ctx.rebuild();
  await finish();
  await ctx.dispose();
}

for (const target of TARGETS) {
  if (!MANIFESTS[target]) {
    console.error(`Unknown target "${target}" (expected: chrome, firefox)`);
    process.exit(1);
  }
}

const contexts = [];
for (const target of TARGETS) {
  contexts.push(await buildTarget(target));
}

if (watch) {
  console.log("watching for changes… (ctrl-c to stop)");
} else {
  console.log("done.");
}
