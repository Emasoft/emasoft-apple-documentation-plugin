---
trdd-id: YP2TDR2R
title: Update test tooling jest tsx jsdom
column: todo
status: tasked
created: 2026-09-30T20:14:34+0200
updated: 2026-09-30T20:15:18+0200
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
