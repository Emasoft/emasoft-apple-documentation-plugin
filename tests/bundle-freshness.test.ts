/**
 * The bundle servers/apple-docs/index.js is what users run, and it is
 * committed. This test rebuilds it into a temp dir and compares bytes with the
 * committed files, so a src change whose bundle was not rebuilt fails here
 * instead of shipping stale code. It never writes to servers/ itself.
 *
 * The temp outfile is also named index.js so the LEGAL file name matches.
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const repoRoot = path.resolve(__dirname, '..');
const bundledFiles = ['index.js', 'THIRD_PARTY_LICENSES.txt'];

describe('committed plugin bundle', () => {
  it('is byte-identical to a fresh build of src/', () => {
    const tmp = mkdtempSync(path.join(tmpdir(), 'apple-docs-bundle-'));
    try {
      const build = spawnSync(
        process.execPath,
        [path.join(repoRoot, 'scripts', 'build-bundle.mjs'), '--outfile', path.join(tmp, 'index.js')],
        { cwd: repoRoot, encoding: 'utf8' },
      );
      if (build.status !== 0) {
        throw new Error(`bundle build failed (exit ${build.status}): ${build.stderr}`);
      }

      const stale = bundledFiles.filter((name) => {
        const fresh = readFileSync(path.join(tmp, name));
        const committed = readFileSync(path.join(repoRoot, 'servers', 'apple-docs', name));
        return !fresh.equals(committed);
      });
      if (stale.length > 0) {
        throw new Error(
          `servers/apple-docs/${stale.join(', ')} differ from a fresh build: run \`pnpm build\` and commit the bundle`,
        );
      }
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  }, 240_000); // WHY 240s (was 60s): a full esbuild bundle build is CPU-bound and slows under load
});
