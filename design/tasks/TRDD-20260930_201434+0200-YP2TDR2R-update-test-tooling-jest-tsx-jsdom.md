---
trdd-id: YP2TDR2R
title: Update test tooling jest tsx jsdom
column: testing
status: tasked
created: 2026-09-30T20:14:34+0200
updated: 2026-09-30T21:31:20+0200
current-owner: user
created-by: user
task-type: refactor
min-approval-requirement: none
assignee: user
mandate: true
mandated-by: user
approved: true
approval-judge: user
approval-datetime: 2026-09-30T20:14:34+0200
npt: []
---

# Update test tooling jest tsx jsdom

Bump test/dev tooling.

- jest / @jest/globals: 30.0.4 -> 30.5.2.
- ts-jest: 29.4.0 -> 29.4.14 -- verify jest 30 compatibility.
- tsx: 4.20.3 -> 4.23.15.
- jsdom: 26 -> 30, @types/jsdom: 21 -> 30.

Acceptance:
- [ ] All bumped in package.json/pnpm-lock.yaml
- [ ] jest suite passes with no new warnings from ts-jest/jsdom

## Approval log

- 2026-09-30T20:14:34+0200 — MANDATE issued by user (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.

## Worker notes

jest 30.0.4->30.5.2, ts-jest 29.4.0->29.4.14, tsx 4.20.3->4.23.15 applied clean. jsdom 26->30 NOT applied: jsdom 27+ ships ESM-only internals (cssstyle5/@asamuzakjp/css-color .ts entry, html-encoding-sniffer6+/@exodus/bytes) incompatible with this repo's CJS jest config; stopped at last-green jsdom 26.1.0 per card's minimal-fix rule. Fixed unrelated blocker: pnpm-workspace.yaml allowBuilds had a placeholder for new transitive dep @parcel/watcher (from jest 30.5 jest-haste-map), set to false (unused, --watch only). Checks: build/tsc pass; eslint fails (182 errors) but pre-existing/unrelated, belongs to TRDD-4RXQ5L25; pnpm test 38/38 suites, 535/535 tests green, no new warnings. package-lock.json exists, untouched. Report: reports/workers/20260930_213108+0200-b2-test-tooling.md
