/**
 * Claude Code reads .claude-plugin/plugin.json for the plugin name (cache
 * directory, install id) and for update detection, while the MCP server
 * reports package.json's version (src/utils/plugin-version.ts) and CPV compares
 * pyproject.toml's version with plugin.json's. If they diverge, users are told
 * one version by the plugin manager and another by the server, and an update may
 * never be detected. scripts/publish.py bumps all three together; this test fails
 * CI if they are ever edited apart.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(__dirname, '..');

function readJson(relativePath: string): { name?: unknown; version?: unknown } {
  return JSON.parse(readFileSync(path.join(repoRoot, relativePath), 'utf8')) as {
    name?: unknown;
    version?: unknown;
  };
}

describe('plugin manifest consistency', () => {
  const plugin = readJson('.claude-plugin/plugin.json');
  const pkg = readJson('package.json');
  const pyprojectVersion = /^version\s*=\s*"([^"]*)"/m.exec(
    readFileSync(path.join(repoRoot, 'pyproject.toml'), 'utf8'),
  )?.[1];

  it('plugin.json version equals package.json version', () => {
    expect(typeof pkg.version).toBe('string');
    expect(plugin.version).toBe(pkg.version);
  });

  it('plugin.json name equals package.json name', () => {
    expect(typeof pkg.name).toBe('string');
    expect(plugin.name).toBe(pkg.name);
  });

  it('pyproject.toml version equals package.json version', () => {
    expect(pyprojectVersion).toBe(pkg.version);
  });
});
