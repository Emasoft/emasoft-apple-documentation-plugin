---
trdd-id: Q23MSNKP
title: Evaluate TypeScript 7 adoption
column: backburner
status: tasked
created: 2026-09-30T20:14:50+0200
updated: 2026-10-01T13:19:49+0200
current-owner: user
created-by: user
task-type: spike
min-approval-requirement: none
assignee: user
mandate: true
mandated-by: user
approved: true
approval-judge: user
approval-datetime: 2026-09-30T20:14:50+0200
npt: []
---

# Evaluate TypeScript 7 adoption

TypeScript 5.8.3 -> 7.0.2 (the new native/go compiler) is a major jump. Depends on B2 (jest/ts-jest/tsx bump) because ts-jest and tsx compatibility with TS7 must be checked before switching, and the spike's verdict only means something once the rest of the toolchain is already current.

Scope: check ts-jest, tsx, and typescript-eslint compatibility with TypeScript 7; if any is unready, stay on the latest compatible 5.x or 6.x instead and record why.

Acceptance:
- [ ] Compatibility matrix recorded in this card's body or a follow-up note
- [ ] Decision made: adopt TS7, or pin to latest compatible 5.x/6.x with reason

## Approval log

- 2026-09-30T20:14:50+0200 — MANDATE issued by user (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
- 2026-10-01T13:19:49+0200 — column → backburner. blocked upstream: typescript-eslint 8.71.0 supports typescript <6.1.0, TypeScript latest is 7.0.2

## Blocker

2026-10-01: typescript-eslint 8.71 peer range pins typescript below 6.1, so a TypeScript 7 bump is blocked until typescript-eslint supports it.
2026-10-01: still blocked upstream — typescript-eslint 8.71.0 supports typescript >=4.8.4 <6.1.0; TypeScript latest is 7.0.2. Re-check with `npm view typescript-eslint peerDependencies.typescript`; resume when the range includes 7.
