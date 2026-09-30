/**
 * Regression test for TRDD-IHLAOB2W: offline, the server used to hold the process open for
 * tens of seconds after the client disconnected (stdin EOF), because background cache
 * warm-up/framework preload (src/utils/cache-warmer.ts, src/utils/preloader.ts) kept retrying
 * failed requests through httpClient's exponential backoff (src/utils/http-client.ts) with no
 * way to cancel the sleep. This test simulates "offline" by replacing `fetch` (via a preload
 * script, so the stub is in place before the server module even loads) with one that always
 * rejects like a real network failure, then proves the server still exits fast once the client
 * disconnects.
 */
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import path from 'node:path';
import { STDIN_EOF_BACKSTOP_MS } from '../src/utils/constants.js';

// Generous failsafe: this must NEVER be hit once the fix is in place (exit is asserted
// well under it below), but on the pre-fix code the process took ~57s offline — a short
// failsafe here would just report "timed out" instead of the useful "took Nms" failure.
// WHY backstop + 60s, derived (not a literal): under load the child's unref'd backstop timer
// plus stderr flush can be delayed by more than 10s, so the failsafe needs real margin above
// the backstop, and it must follow the backstop if TIMEOUT ever changes.
const FAILSAFE_MS = STDIN_EOF_BACKSTOP_MS + 60_000;
// WHY failsafe + 30s: the jest timeout must exceed FAILSAFE_MS plus spawn/startup under load.
const TEST_TIMEOUT_MS = FAILSAFE_MS + 30_000;

describe('stdio server shutdown when offline', () => {
  it('exits fast after stdin EOF even when every background fetch fails', async () => {
    const entry = path.join(__dirname, '..', 'src', 'index.ts');
    const offlinePreload = path.join(__dirname, 'fixtures', 'offline-fetch-preload.mjs');

    // Two --import flags: tsx registers the TypeScript loader, then our own preload stubs
    // `fetch` — both run before src/index.ts is evaluated, so warm-up/preload never see a
    // real network.
    const child: ChildProcessWithoutNullStreams = spawn(
      process.execPath,
      ['--import', 'tsx', '--import', offlinePreload, entry],
      {
        env: { ...process.env, NODE_ENV: 'development' },
        stdio: ['pipe', 'pipe', 'pipe'],
      },
    );

    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    try {
      const initRequest = JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'offline-shutdown-test', version: '0.0.0' },
        },
      }) + '\n';

      const exitPromise = new Promise<number | null>((resolve, reject) => {
        const timer = setTimeout(() => {
          child.kill('SIGKILL');
          reject(new Error(`server did not exit within ${FAILSAFE_MS}ms failsafe (offline hang regression)`));
        }, FAILSAFE_MS);
        child.on('exit', (code) => {
          clearTimeout(timer);
          resolve(code);
        });
      });

      child.stdin.write(initRequest);
      child.stdin.end();
      const drainStart = Date.now();

      const exitCode = await exitPromise;
      const drainMs = Date.now() - drainStart;

      expect(exitCode).toBe(0);
      // The fix aborts background warm-up/preload on stdin end instead of letting their retry
      // backoff sleeps run to completion — must exit promptly even fully offline, not after the ~57s seen pre-fix (TRDD-IHLAOB2W).
      // WHY 40s (was 8s): 8s flaked under CPU peaks (tsx startup alone can take many seconds on a
      // loaded machine). 40s is still below the ~57s pre-fix linger and the 120s backstop, so
      // a regression toward the old behavior still fails loudly.
      expect(drainMs).toBeLessThan(40_000);
      expect(stderr).not.toContain('forced exit after grace period');
    } finally {
      if (!child.killed) {
        child.kill();
      }
    }
  }, TEST_TIMEOUT_MS);
});
