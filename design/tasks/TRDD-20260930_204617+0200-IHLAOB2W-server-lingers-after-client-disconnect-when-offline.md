---
trdd-id: IHLAOB2W
title: Server lingers after client disconnect when offline
column: testing
status: tasked
created: 2026-09-30T20:46:17+0200
updated: 2026-09-30T21:02:32+0200
current-owner: main-agent@apple-docs-mcp
created-by: main-agent@apple-docs-mcp
task-type: bugfix
min-approval-requirement: none
assignee: main-agent@apple-docs-mcp
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@apple-docs-mcp
approval-datetime: 2026-09-30T20:46:17+0200
---

# Server lingers after client disconnect when offline

## Evidence

`echo '<initialize line>' | node dist/index.js` closes in ~1s online but ~57s under a
network-denying sandbox (`sandbox-exec -p '(version 1)(allow default)(deny network-outbound
(remote ip))'`). Root cause traced: `run()` (src/index.ts) fires `warmUpCaches()` (cache-warmer.ts)
and `preloadPopularFrameworks()` (preloader.ts) in the background at boot. Offline, every
`httpClient.getJson`/`get` call inside them fails immediately (fetch rejects fast — no 30s
per-attempt timeout involved), but `fetchWithRetry` (http-client.ts) then sleeps through a full
exponential backoff (`retryDelay * 2^attempt`, 1s/2s/4s = 7s per failed URL across the default 3
retries) via `HttpClient.delay()`, which used a bare `setTimeout` with no way to cut it short. Both
warm-up (3 groups x several sequential calls each) and preload (~12 frameworks) issue many such
calls through the same `httpClient` singleton (concurrency-capped at 5 via `executeWithQueue`), so
the cumulative backoff sleeps compound to tens of seconds before `Promise.allSettled` (warm-up) /
`Promise.all` (preload) resolve on their own — well under the 60s stdin-EOF forced-exit backstop,
so the backstop never even fires; the process simply waits for warm-up/preload to finish sleeping.

Separately: `AppleDeveloperDocsMCPServer`'s constructor called `this.setupErrorHandling()`
unconditionally, registering SIGINT/SIGTERM/stdin/unhandledRejection/uncaughtException listeners
per *instance*. Jest constructs many instances across the suite, tripping
`MaxListenersExceeded` warnings.

## Fix

1. `src/utils/http-client.ts`: `RequestOptions.signal` (external `AbortSignal`) is combined with
   the per-attempt `AbortSignal.timeout()` for the in-flight fetch (`AbortSignal.any`), and passed
   alone to `fetchWithRetry`/`delay()` so it also cuts the backoff sleep short (this is the half
   that actually matters offline — the fetch itself already fails fast). `delay()` now clears its
   timer and rejects immediately on abort instead of blocking for the full `ms`.
2. `src/utils/cache-warmer.ts` / `src/utils/preloader.ts`: each exports `abortWarmUp()` /
   `abortPreload()`, backed by a fresh per-run `AbortController` (single-use, so the periodic
   30-minute refresh isn't pre-aborted by a prior cancel). The signal threads through
   `handleListTechnologies` / `handleGetDocumentationUpdates` / `handleGetTechnologyOverviews` /
   `searchFrameworkSymbols` (new trailing optional `signal?: AbortSignal` param, zero-impact on
   existing callers) down to `httpClient.getJson(url, { signal })`.
3. `src/index.ts`: `process.stdin.on('end', ...)` now calls `abortWarmUp()`/`abortPreload()`
   before arming the 60s backstop — background work is cancelled, in-flight CLIENT tool requests
   are untouched (no shared signal reaches them, preserving the #44 dropped-response fix covered
   by tests/stdio-shutdown.test.ts). Each `warmUpTechnologiesCache`/etc. already wraps its work in
   try/catch, so the resulting AbortError is swallowed and logged, not an unhandled rejection.
4. `src/index.ts`: shutdown state (`isShuttingDown`) and process-handler registration moved to
   MODULE level (`shutdown()`, `setupProcessErrorHandling()` free functions, not class
   methods/fields) with an `errorHandlersRegistered` guard so `process.on(...)` runs exactly once
   per process regardless of how many `AppleDeveloperDocsMCPServer` instances are constructed —
   fixes the MaxListenersExceeded warning under jest without changing embedder-visible behavior
   (the constructor still wires everything up on first construction).

## Acceptance

- `npx tsc --noEmit` and `npx eslint . --quiet` clean.
- `npx jest` green, stderr free of MaxListenersExceeded warnings.
- New regression test spawns the built server with global fetch rejecting like an offline network
  error, sends `initialize`, closes stdin, and asserts exit code 0 within ~5s — proven to FAIL on
  HEAD caca799 and PASS with the fix.
- `node dist/index.js` piped one `initialize` line then stdin-closed exits < 5s both online and
  under the `sandbox-exec` network-denying sandbox from the evidence above (was ~57s offline).

## Approval log

- 2026-09-30T20:46:17+0200 — MANDATE issued by main-agent@apple-docs-mcp (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.

## Verification

Implemented and verified: tsc/eslint clean on touched files; full jest 530/530 passing, zero MaxListenersExceeded warnings; offline-shutdown.test.ts proven to FAIL on HEAD caca799 (56.4s, archived via git archive caca799) and PASS on the fix (0.4-0.7s); dist/index.js piped one initialize line then stdin-closed exits ~0.2-0.4s both online and under sandbox-exec (was ~57s offline pre-fix).
