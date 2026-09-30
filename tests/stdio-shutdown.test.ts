/**
 * Regression test for the stdio transport shutdown bug (fixed in 7fbf8e3):
 * before that fix the server force-exited on stdin 'end'/'close' and
 * transport.onclose, which could drop in-flight JSON-RPC responses that were
 * still being written to stdout when the process was killed.
 *
 * This test proves two things, both required for the fix to be considered
 * correct rather than merely "passes on the happy path":
 *
 * 1. Every in-flight request gets its response flushed before the process
 *    exits, even when many requests are pending at stdin EOF (20 concurrent
 *    calls to a disk-only tool, no network involved so timing is
 *    deterministic in CI).
 * 2. The process exits fast on its own — via the event loop draining once
 *    responses are flushed and the cache/cache-warmer timers are unref'd —
 *    rather than by hitting the 120s "forced exit after grace period"
 *    backstop in src/index.ts. Asserting stderr does NOT contain that
 *    message, and that exit happens well under the grace period, is what
 *    turns this from "the backstop covers it" into "the real drain path
 *    covers it".
 *
 * It asserts exit code 0 on a clean drain; the 45s failsafe kill instead
 * rejects the promise, so a hang fails the test with a clear message rather
 * than a silent timeout.
 */
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import path from 'node:path';

describe('stdio server shutdown', () => {
  it('flushes all 20 in-flight responses then exits fast on its own after stdin EOF', async () => {
    const entry = path.join(__dirname, '..', 'src', 'index.ts');

    // `process.execPath` + `--import tsx` (Node's native loader hook) spawns
    // portably across platforms/package managers, unlike resolving
    // node_modules/.bin/tsx (a symlink on POSIX, a generated .cmd shim on
    // Windows, and not guaranteed executable from a plain spawn() there).
    // tsx is a devDependency (package.json) — fine for a test, not shipped.
    const child: ChildProcessWithoutNullStreams = spawn(
      process.execPath,
      ['--import', 'tsx', entry],
      {
        // NODE_ENV must NOT be 'test' — the entrypoint only runs the server
        // when it isn't.
        env: { ...process.env, NODE_ENV: 'development' },
        stdio: ['pipe', 'pipe', 'pipe'],
      },
    );

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    try {
      const TOOL_CALL_IDS = Array.from({ length: 20 }, (_, i) => i + 2); // 2..21

      const requests = [
        JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'stdio-shutdown-test', version: '0.0.0' },
          },
        }),
        JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),
        // list_wwdc_videos reads bundled JSON from disk (src/utils/wwdc-data-source.ts)
        // and needs no network, so 20 concurrent calls stay fast and
        // deterministic while still being async work genuinely in flight at
        // stdin EOF — the scenario that dropped responses before the fix.
        ...TOOL_CALL_IDS.map((id) =>
          JSON.stringify({
            jsonrpc: '2.0',
            id,
            method: 'tools/call',
            params: { name: 'list_wwdc_videos', arguments: { year: '2024', limit: 5 } },
          }),
        ),
      ].join('\n') + '\n';

      // Race the exit against a failsafe: if the server ever regresses to
      // hanging past this, killing the child here (instead of letting the
      // suite time out) guarantees no orphaned process survives the test run.
      // WHY 45s (was 12s): measured drain is 3-12s on a loaded machine; the failsafe only
      // exists to kill a server that genuinely hangs, so it must sit far above any load-induced
      // slowness yet stay below the 120s forced-exit backstop in src/index.ts.
      const FAILSAFE_MS = 45_000;
      const exitPromise = new Promise<number | null>((resolve, reject) => {
        const timer = setTimeout(() => {
          child.kill('SIGKILL');
          reject(new Error(`server did not exit within ${FAILSAFE_MS}ms failsafe`));
        }, FAILSAFE_MS);
        child.on('exit', (code) => {
          clearTimeout(timer);
          resolve(code);
        });
      });

      child.stdin.write(requests);
      child.stdin.end();
      const drainStart = Date.now();

      const exitCode = await exitPromise;
      const drainMs = Date.now() - drainStart;

      expect(exitCode).toBe(0);

      // Must drain via the real event-loop-empties-naturally path, not the
      // 120s forced-exit backstop in setupProcessErrorHandling() (src/index.ts).
      // WHY 30s (was 6s): typical drain is 3-4s (up to ~12s cold / tsx under load), so 6s flaked
      // under CPU peaks. 30s still fails if the drain stalls toward the backstop or a response
      // is held until the server gives up.
      // No stderr check for the backstop message here: FAILSAFE_MS (45s) is below the server
      // backstop, so it could never fire; the drain bound + exit code are the discriminators
      // (offline-shutdown.test.ts keeps the stderr check, its failsafe exceeds the backstop).
      expect(drainMs).toBeLessThan(30_000);

      const responsesById = new Map<number, unknown>();
      for (const line of stdout.split('\n')) {
        if (!line.trim()) continue;
        try {
          const msg = JSON.parse(line);
          if (typeof msg?.id === 'number') responsesById.set(msg.id, msg);
        } catch {
          // non-JSON log line on stdout; ignore
        }
      }

      for (const id of TOOL_CALL_IDS) {
        expect(responsesById.has(id)).toBe(true);
      }
    } finally {
      if (!child.killed) {
        child.kill();
      }
    }
  }, 120_000); // WHY 120s (was 15s): must exceed FAILSAFE_MS plus spawn/startup under load
});
