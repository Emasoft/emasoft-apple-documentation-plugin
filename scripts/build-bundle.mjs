#!/usr/bin/env node
/**
 * Builds the single-file ESM bundle that the plugin actually ships and runs:
 * servers/apple-docs/index.js (launched by .mcp.json), plus the license
 * material for everything inlined into it. Claude Code does not install
 * dependencies for this plugin, so every runtime dependency must be inlined
 * here; node_modules never reaches a user's machine.
 *
 * Why these options:
 * - format 'esm' + no splitting: package.json is "type": "module" and
 *   src/utils/wwdc-data-source-path.ts locates data/ through import.meta.url,
 *   which a CJS bundle would turn into undefined. One file keeps
 *   import.meta.url equal to the bundle's own URL.
 * - createRequire banner: bundled CJS dependencies call require() on Node
 *   builtins; ESM has no require, so esbuild would emit "Dynamic require of X
 *   is not supported" at runtime.
 * - no sourcemap, no minify: output stays reviewable and byte-deterministic
 *   across machines (a sourcemap would embed machine-specific paths). The
 *   bundle is committed, and tests/bundle-freshness.test.ts fails when it is
 *   stale.
 * - raw control characters: esbuild prints a few C0 control characters raw in
 *   string literals (entities' decode tables); the build re-escapes them as
 *   hex escapes after bundling so index.js stays plain text (see below).
 * - license material: legalComments 'external' writes the license comments
 *   found in the sources to index.js.LEGAL.txt, and the esbuild metafile
 *   drives THIRD_PARTY_LICENSES.txt: one entry per bundled package with its
 *   declared license and the full text of its LICENSE file, because MIT/ISC
 *   require the notice to travel with copies of the code.
 * - cheerio is redirected to its load-parse.js module: cheerio's root entry
 *   also re-exports a URL/stream loader that imports undici and
 *   encoding-sniffer (about 1.7 MB bundled) which src never calls (it only
 *   uses cheerio.load). load-parse.js exports the very same `load` (parse5
 *   parser, identical behaviour); cheerio's package "exports" map hides the
 *   file from a plain import, hence the resolve plugin.
 *
 * Usage: node scripts/build-bundle.mjs [--outfile <path>]
 * The license files are written next to the outfile.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const args = process.argv.slice(2);
const outfileFlag = args.indexOf('--outfile');
if (outfileFlag !== -1 && !args[outfileFlag + 1]) {
  throw new Error('--outfile requires a path');
}
const outfile = outfileFlag === -1
  ? path.join(root, 'servers', 'apple-docs', 'index.js')
  : path.resolve(args[outfileFlag + 1]);

const cheerioCoreOnly = {
  name: 'cheerio-core-only',
  setup(pluginBuild) {
    pluginBuild.onResolve({ filter: /^cheerio$/ }, async (resolveArgs) => {
      const manifest = await pluginBuild.resolve('cheerio/package.json', {
        resolveDir: resolveArgs.resolveDir,
        kind: resolveArgs.kind,
      });
      if (manifest.errors.length > 0) {
        return { errors: manifest.errors };
      }
      const loadParse = path.join(path.dirname(manifest.path), 'dist', 'esm', 'load-parse.js');
      // WHY this check: load-parse.js is a cheerio-internal file hidden by its "exports" map, so a
      // cheerio upgrade can move it or stop exporting `load` with no signal from tsc or jest (both
      // see full cheerio). It is a static source check, not an import, so no third-party code runs
      // at build time; it runs at build time only, the bundle never reads this file at runtime.
      const moved = 'cheerio internal load-parse.js moved; re-verify the redirect';
      if (!existsSync(loadParse)) {
        throw new Error(`${moved} (missing: ${loadParse})`);
      }
      if (!/^export\s+(?:const|function)\s+load\b|^export\s*\{[^}]*\bload\b[^}]*\}/m.test(readFileSync(loadParse, 'utf8'))) {
        throw new Error(`${moved} (${loadParse} no longer exports load)`);
      }
      return { path: loadParse };
    });
  },
};

const { metafile } = await build({
  absWorkingDir: root,
  entryPoints: ['src/index.ts'],
  outfile,
  bundle: true,
  metafile: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  legalComments: 'external',
  logLevel: 'warning',
  plugins: [cheerioCoreOnly],
  banner: {
    js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
  },
});

// Re-escape raw control characters in the bundle. esbuild prints a few C0
// control characters raw inside string literals (here 0x0f, 0x12, 0x15, 0x18
// from the entities package's decode tables) even though the dependency's own
// source spells them as hex escapes; raw control bytes make scanners and editors
// treat index.js as binary-ish text (CPV flags it). Outside comments such a
// character can only sit inside a string, template or regex literal, where the
// hex escape is the identical character, so behaviour does not change.
// WHY an allowlist: that equivalence was verified only for the four code points
// below. A different control character (or a new dependency) could sit in a
// context where \xNN is NOT the same character, so anything outside the
// allowlist fails the build and the allowlist must be extended deliberately
// after re-verifying the context. Likewise String.raw / tagged templates keep
// \x literally, so any rewrite alongside String.raw fails the build. A raw
// control character right after a lone backslash would turn into a different
// escape sequence, so that case fails too instead of being rewritten.
// \p{Cc} (Unicode control category) rather than a \x00-\x1f class keeps eslint's
// no-control-regex quiet.
const rawControlChar = /(\\*)(\p{Cc})/gu;
const allowedControlCodes = new Set([0x0f, 0x12, 0x15, 0x18]);
const bundleText = readFileSync(outfile, 'utf8');
let rewritten = 0;
const escapedBundle = bundleText.replace(rawControlChar, (match, backslashes, control) => {
  if (control === '\t' || control === '\n' || control === '\r') {
    return match;
  }
  const code = control.charCodeAt(0);
  const hex = code.toString(16).padStart(2, '0');
  if (!allowedControlCodes.has(code)) {
    throw new Error(`unexpected raw control character 0x${hex} in bundle — re-verify the escape is safe in its context (String.raw/tagged templates keep \\x literally) and extend the allowlist deliberately`);
  }
  if (backslashes.length % 2 === 1) {
    throw new Error(`raw control character 0x${hex} follows a lone backslash in ${outfile}`);
  }
  rewritten += 1;
  return `${backslashes}\\x${hex}`;
});
if (rewritten > 0 && bundleText.includes('String.raw')) {
  throw new Error('bundle contains String.raw next to re-escaped control characters — \\x would stay literal there; re-verify the escape is safe before building');
}
writeFileSync(outfile, escapedBundle);

// Package directory of every bundled third-party input: the path up to the
// LAST node_modules/<name> (or <@scope>/<name>) segment, so pnpm's
// node_modules/.pnpm/<id>/node_modules/<name> layout resolves to the package.
const packageDirs = new Set();
for (const input of Object.keys(metafile.inputs)) {
  const match = /^(.*node_modules\/(?:@[^/]+\/)?[^/]+)\//.exec(input);
  if (match) {
    packageDirs.add(match[1]);
  }
}

const entries = [...packageDirs].map((dir) => {
  const manifest = JSON.parse(readFileSync(path.join(root, dir, 'package.json'), 'utf8'));
  const licenseFile = readdirSync(path.join(root, dir)).find((name) => /^licen[cs]e(\.|$)/i.test(name));
  const licenseText = licenseFile
    ? readFileSync(path.join(root, dir, licenseFile), 'utf8').trim()
    : '(this package ships no license file; see the license field above)';
  return { name: manifest.name, version: manifest.version, license: manifest.license, licenseText };
}).sort((a, b) => `${a.name}@${a.version}`.localeCompare(`${b.name}@${b.version}`));

if (entries.length === 0 || entries.some((entry) => !entry.license)) {
  throw new Error('THIRD_PARTY_LICENSES: a bundled package has no license field (or none were found)');
}

const notice = [
  'Third-party software bundled into index.js. Generated by scripts/build-bundle.mjs; do not edit.',
  '',
  ...entries.flatMap((entry) => [
    '='.repeat(72),
    `${entry.name}@${entry.version} (${entry.license})`,
    '='.repeat(72),
    entry.licenseText,
    '',
  ]),
].join('\n');

const noticePath = path.join(path.dirname(outfile), 'THIRD_PARTY_LICENSES.txt');
writeFileSync(noticePath, notice);
if (!existsSync(noticePath)) {
  throw new Error(`failed to write ${noticePath}`);
}
