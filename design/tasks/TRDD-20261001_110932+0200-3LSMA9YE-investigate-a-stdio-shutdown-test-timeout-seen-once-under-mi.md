---
trdd-id: 3LSMA9YE
title: Investigate a stdio-shutdown test timeout seen once under mixed load
column: backburner
status: tasked
created: 2026-10-01T11:09:32+0200
updated: 2026-10-01T11:10:44+0200
current-owner: main-agent@apple-docs-mcp
created-by: main-agent@apple-docs-mcp
task-type: bugfix
min-approval-requirement: none
assignee: main-agent@apple-docs-mcp
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@apple-docs-mcp
approval-datetime: 2026-10-01T11:09:32+0200



---

# Investigate a stdio-shutdown test timeout seen once under mixed load

## Approval log

- 2026-10-01T11:09:32+0200 — MANDATE issued by main-agent@apple-docs-mcp (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.

## Evidence

One full pnpm test run during the Jev wiring work (2026-10-01, concurrent builds and live network calls running) timed out in tests/stdio-shutdown.test.ts.
Not reproduced in 10 solo runs and 3 full runs under all-core CPU load (report reports/workers/20261001_102816+0200-stdio-shutdown-load.md).

## Hypothesis

Memory or IO contention under mixed load. Unverified.

## Next step

Reproduce under memory and IO pressure (not CPU load alone).
