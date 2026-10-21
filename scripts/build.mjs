// Build script: bundle -> validate manifest -> pack .mcpb -> write SHA-256.
// Usage: node scripts/build.mjs [--bundle-only]
import { build } from "esbuild";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));

if (pkg.version !== manifest.version) {
  console.error(
    `Version mismatch: package.json is ${pkg.version} but manifest.json is ${manifest.version}. ` +
      "Keep them in sync before building."
  );
  process.exit(1);
}

// 1. Bundle everything (including dependencies) into one file, so the extension
//    needs no node_modules at install time.
rmSync("server", { recursive: true, force: true });
await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  target: "node18",
  format: "esm",
  outfile: "server/index.js",
  banner: {
    // Some bundled CommonJS dependencies call require().
    js: "import{createRequire}from'module';const require=createRequire(import.meta.url);",
  },
  logLevel: "info",
});

if (process.argv.includes("--bundle-only")) process.exit(0);

// 2. Validate the manifest and pack the .mcpb with the official CLI.
const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const run = (args) =>
  execFileSync(npx, ["--no-install", "mcpb", ...args], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

run(["validate", "manifest.json"]);

mkdirSync("dist", { recursive: true });
const out = path.join("dist", `${manifest.name}-${manifest.version}.mcpb`);
rmSync(out, { force: true });
run(["pack", ".", out]);

// 3. Checksum for the release page.
const sum = createHash("sha256").update(readFileSync(out)).digest("hex");
writeFileSync(`${out}.sha256`, `${sum}  ${path.basename(out)}\n`);
console.log(`\nBuilt ${out}\nSHA-256 ${sum}`);
