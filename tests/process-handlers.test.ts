/**
 * Regression test for the listener-growth bug fixed alongside TRDD-IHLAOB2W: constructing the
 * server class used to call setupProcessErrorHandling() unconditionally from the constructor,
 * so every `new AppleDeveloperDocsMCPServer()` (jest constructs one per test) added another
 * full set of SIGINT/SIGTERM/unhandledRejection/uncaughtException/stdin-'end' listeners,
 * eventually tripping Node's MaxListenersExceeded warning. The module-level
 * `errorHandlersRegistered` guard (src/index.ts) makes every registration after the first a
 * no-op. Two constructions register listeners exactly ONCE (delta of 1, from the first
 * construction) — this test fails on the pre-guard code (commit caca799), where two
 * constructions would each add their own set and the delta would be 2.
 */
import AppleDeveloperDocsMCPServer from '../src/index.js';

describe('process-level listener guard', () => {
  it('registers each process-level listener only once across two constructions', () => {
    const before = {
      sigint: process.listenerCount('SIGINT'),
      sigterm: process.listenerCount('SIGTERM'),
      unhandledRejection: process.listenerCount('unhandledRejection'),
      uncaughtException: process.listenerCount('uncaughtException'),
      stdinEnd: process.stdin.listenerCount('end'),
    };

    // eslint-disable-next-line no-new -- constructing for its listener-registration side effect
    new AppleDeveloperDocsMCPServer();
    // eslint-disable-next-line no-new
    new AppleDeveloperDocsMCPServer();

    const after = {
      sigint: process.listenerCount('SIGINT'),
      sigterm: process.listenerCount('SIGTERM'),
      unhandledRejection: process.listenerCount('unhandledRejection'),
      uncaughtException: process.listenerCount('uncaughtException'),
      stdinEnd: process.stdin.listenerCount('end'),
    };

    // A caller that ever needs to remove these listeners must re-import this module (the
    // registration guard is a module-level `let`, not per-instance state), so tearing down
    // listeners mid-process requires a fresh module instance, not an instance method.
    expect(after.sigint - before.sigint).toBe(1);
    expect(after.sigterm - before.sigterm).toBe(1);
    expect(after.unhandledRejection - before.unhandledRejection).toBe(1);
    expect(after.uncaughtException - before.uncaughtException).toBe(1);
    expect(after.stdinEnd - before.stdinEnd).toBe(1);
  });
});
