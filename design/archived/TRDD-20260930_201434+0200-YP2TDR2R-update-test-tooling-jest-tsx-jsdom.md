---
trdd-id: YP2TDR2R
title: Update test tooling jest tsx jsdom
column: complete
status: archived
created: 2026-09-30T20:14:34+0200
updated: 2026-09-30T23:39:06+0200
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
implementation-commits: [f5c1fb6]
---

# Update test tooling jest tsx jsdom

Bump test/dev tooling.

- jest / @jest/globals: 30.0.4 -> 30.5.2.
- ts-jest: 29.4.0 -> 29.4.14 -- verify jest 30 compatibility.
- tsx: 4.20.3 -> 4.23.15.
- jsdom: 26 -> 30, @types/jsdom: 21 -> 30.

Acceptance:
- [x] jest, @jest/globals, ts-jest, tsx bumped in package.json/pnpm-lock.yaml; jsdom deliberately held at 26.1.0 — 27+ cannot load under the CJS ts-jest setup — and its removal is deferred to TRDD-I8QT4E2L
- [x] jest suite passes with no new warnings from ts-jest/jsdom

## Approval log

- 2026-09-30T20:14:34+0200 — MANDATE issued by user (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
- 2026-09-30 — ai_review was an adversarial review fork (no human reviewed); human_review passed through on that basis, no human reviewed this card.
- 2026-09-30T23:39:03+0200 — column → ai_review by user. verified per reports/workers/20260930_213800+0200-verify-b2.md
- 2026-09-30T23:39:05+0200 — column → human_review by user. verified per reports/workers/20260930_213800+0200-verify-b2.md
- 2026-09-30T23:39:06+0200 — COMPLETE by user. verified per reports/workers/20260930_213800+0200-verify-b2.md.

## Worker notes

jest 30.0.4->30.5.2, ts-jest 29.4.0->29.4.14, tsx 4.20.3->4.23.15 applied clean. jsdom 26->30 NOT applied: jsdom 27+ ships ESM-only internals (cssstyle5/@asamuzakjp/css-color .ts entry, html-encoding-sniffer6+/@exodus/bytes) incompatible with this repo's CJS jest config; stopped at last-green jsdom 26.1.0 per card's minimal-fix rule. Fixed unrelated blocker: pnpm-workspace.yaml allowBuilds had a placeholder for new transitive dep @parcel/watcher (from jest 30.5 jest-haste-map), set to false (unused, --watch only). Checks: build/tsc pass; eslint fails (182 errors) but pre-existing/unrelated, belongs to TRDD-4RXQ5L25; pnpm test 38/38 suites, 535/535 tests green, no new warnings. package-lock.json exists, untouched. Report: reports/workers/20260930_213108+0200-b2-test-tooling.md
Verification (reports/workers/20260930_213800+0200-verify-b2.md): jest 38/38 suites, 535/535 tests passing online and offline.
