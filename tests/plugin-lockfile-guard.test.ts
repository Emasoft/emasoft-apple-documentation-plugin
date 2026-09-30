/**
 * Claude Code runs `npm ci` (or bun) in the cached copy of a plugin when the
 * plugin ROOT has package.json plus an npm/bun lockfile. This plugin ships a
 * self-contained bundle and needs no install, so such a lockfile would make
 * Claude Code download every devDependency (jest, typescript, jsdom, ...) on
 * each user's machine. Development uses pnpm; Claude Code ignores
 * pnpm-lock.yaml.
 */
import { existsSync } from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(__dirname, '..');
const forbiddenLockfiles = ['package-lock.json', 'npm-shrinkwrap.json', 'bun.lock', 'bun.lockb'];

describe('plugin root lockfiles', () => {
  it('has no npm or bun lockfile that would trigger an install on users machines', () => {
    const present = forbiddenLockfiles.filter((name) => existsSync(path.join(repoRoot, name)));
    if (present.length > 0) {
      throw new Error(
        `${present.join(', ')} at the repo root: Claude Code would run npm ci on every user's machine ` +
        'and install all devDependencies. Delete it and use pnpm (pnpm-lock.yaml is ignored by Claude Code).',
      );
    }
  });
});
