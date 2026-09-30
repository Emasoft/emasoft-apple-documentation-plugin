/**
 * Regression test for the stdio transport shutdown bug: before this fix the
 * server force-exited on stdin 'end'/'close' and transport.onclose, which
 * could drop in-flight JSON-RPC responses. Now the event loop is left to
 * drain on its own (cache timers are unref'd) and the process must still
 * exit by itself, after flushing the response.
 */
import { spawn } from 'node:child_process';
import path from 'node:path';

describe('stdio server shutdown', () => {
  it('flushes in-flight responses then exits 0 on its own after stdin EOF', async () => {
    const entry = path.join(__dirname, '..', 'src', 'index.ts');
    const tsx = path.join(__dirname, '..', 'node_modules', '.bin', 'tsx');

    const child = spawn(tsx, [entry], {
      // NODE_ENV must NOT be 'test' — the entrypoint only runs the server
      // when it isn't.
      env: { ...process.env, NODE_ENV: 'development' },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    try {
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
        JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list' }),
      ].join('\n') + '\n';

      let stdout = '';
      child.stdout.on('data', (chunk) => {
        stdout += chunk.toString();
      });

      const exitPromise = new Promise<number | null>((resolve) => {
        child.on('exit', (code) => resolve(code));
      });

      child.stdin.write(requests);
      child.stdin.end();

      const exitCode = await exitPromise;

      expect(exitCode).toBe(0);
      const responses = stdout
        .split('\n')
        .filter((line) => line.trim().length > 0)
        .map((line) => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter((msg) => msg && msg.id === 2);
      expect(responses.length).toBeGreaterThan(0);
    } finally {
      if (!child.killed) {
        child.kill();
      }
    }
  }, 15000);
});
