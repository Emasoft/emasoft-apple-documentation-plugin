/**
 * Proves the committed plugin bundle (servers/apple-docs/index.js) is
 * self-contained: it is copied into a temp dir laid out like an installed
 * plugin (servers/apple-docs/index.js + data/), with NO node_modules anywhere
 * up the tree, and driven over stdio with real MCP requests, including a
 * data-backed tool call that needs no network.
 *
 * The child is spawned with an explicit minimal env and a cwd that has no
 * data/ dir. Both are load-bearing: getWWDCDataDirectory() takes its test
 * branch (cwd/data/wwdc) when NODE_ENV=test or JEST_WORKER_ID is set, and a
 * child that inherits those from jest would pass even with a broken
 * production path. Here the only way the tool call can succeed is the
 * bundle-relative ../../data/wwdc resolution.
 */
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import {
  existsSync,
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  unlinkSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const repoRoot = path.resolve(__dirname, '..');
const committedBundle = path.join(repoRoot, 'servers', 'apple-docs', 'index.js');

interface JsonRpcResponse {
  id?: number;
  result?: any;
  error?: unknown;
}

describe('standalone plugin bundle', () => {
  let pluginDir: string;
  let child: ChildProcessWithoutNullStreams;
  const waiting = new Map<number, (response: JsonRpcResponse) => void>();
  let stderr = '';

  function send(message: object): void {
    child.stdin.write(`${JSON.stringify(message)}\n`);
  }

  function request(id: number, method: string, params?: object): Promise<JsonRpcResponse> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`no response to ${method} within 90s. stderr: ${stderr}`));
      }, 90_000); // WHY 90s (was 20s): a CPU peak can stall the child for many seconds; still fails on a hung server
      waiting.set(id, (response) => {
        clearTimeout(timer);
        resolve(response);
      });
      send({ jsonrpc: '2.0', id, method, params });
    });
  }

  beforeAll(() => {
    expect(existsSync(committedBundle)).toBe(true);

    pluginDir = mkdtempSync(path.join(tmpdir(), 'apple-docs-plugin-'));
    // A node_modules anywhere above the plugin dir would let the bundle lean
    // on installed packages and hide a missing inlined dependency.
    for (let dir = pluginDir; ; dir = path.dirname(dir)) {
      expect(existsSync(path.join(dir, 'node_modules'))).toBe(false);
      if (dir === path.dirname(dir)) {
        break;
      }
    }

    mkdirSync(path.join(pluginDir, 'servers', 'apple-docs'), { recursive: true });
    copyFileSync(committedBundle, path.join(pluginDir, 'servers', 'apple-docs', 'index.js'));
    // Symlink instead of copying 39 MB: path arithmetic from the bundle to
    // ../../data is the same either way.
    symlinkSync(path.join(repoRoot, 'data'), path.join(pluginDir, 'data'), 'dir');
    // serverInfo.version is read from the plugin-root package.json at runtime.
    copyFileSync(path.join(repoRoot, 'package.json'), path.join(pluginDir, 'package.json'));
    const cwd = path.join(pluginDir, 'cwd');
    mkdirSync(cwd);

    child = spawn(process.execPath, [path.join(pluginDir, 'servers', 'apple-docs', 'index.js')], {
      cwd,
      env: { PATH: process.env.PATH, HOME: process.env.HOME },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    let buffered = '';
    child.stdout.on('data', (chunk: Buffer) => {
      buffered += chunk.toString();
      const lines = buffered.split('\n');
      buffered = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.trim()) {
          continue;
        }
        const response = JSON.parse(line) as JsonRpcResponse;
        if (typeof response.id === 'number') {
          waiting.get(response.id)?.(response);
        }
      }
    });
  });

  afterAll(() => {
    child?.kill('SIGKILL');
    if (pluginDir) {
      // Remove the symlink first so rmSync can never reach the repo's data/.
      unlinkSync(path.join(pluginDir, 'data'));
      rmSync(pluginDir, { recursive: true, force: true });
    }
  });

  it('answers initialize, tools/list and a data-backed tools/call with no node_modules', async () => {
    const init = await request(1, 'initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'standalone-bundle-test', version: '0.0.0' },
    });

    // serverInfo.version must be the package.json version (the one source).
    const { version } = JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8')) as { version: string };
    expect(init.result?.serverInfo.version).toBe(version);

    expect(init.error).toBeUndefined();
    expect(init.result.serverInfo.name).toBe('apple-docs-mcp');
    send({ jsonrpc: '2.0', method: 'notifications/initialized' });

    const list = await request(2, 'tools/list');
    const toolNames: string[] = list.result.tools.map((tool: { name: string }) => tool.name);
    expect(toolNames).toContain('list_wwdc_videos');

    const call = await request(3, 'tools/call', {
      name: 'list_wwdc_videos',
      arguments: { year: '2024', limit: 3 },
    });
    expect(call.error).toBeUndefined();
    expect(call.result.isError).toBeFalsy();
    const text: string = call.result.content[0].text;
    expect(text).toMatch(/\*\*Found 3 videos\*\*/);
    expect(text).toContain('https://developer.apple.com/videos/play/wwdc2024/');
  }, 240_000); // WHY 240s (was 30s): three sequential requests each allowed up to 90s

  it('does not bundle jsdom (removed from the project; guards against it creeping back into the shipped server)', () => {
    expect(readFileSync(committedBundle, 'utf8')).not.toContain('jsdom');
  });
});
