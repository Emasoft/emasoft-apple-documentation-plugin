---
trdd-id: 9SMOD8AH
title: Update Node types and engine
column: todo
status: tasked
created: 2026-09-30T20:14:35+0200
updated: 2026-09-30T20:15:19+0200
current-owner: user
created-by: user
task-type: infra
min-approval-requirement: none
assignee: user
mandate: true
mandated-by: user
approved: true
approval-judge: user
approval-datetime: 2026-09-30T20:14:35+0200
npt: []
---

# Update Node types and engine

Bump @types/node 20 -> 26; add an explicit package.json engines.node field matching the CI node-version; align CI workflow node-version with it.

Acceptance:
- [ ] @types/node bumped
- [ ] package.json engines.node present and matches CI
- [ ] tsc --noEmit passes

## Approval log

- 2026-09-30T20:14:35+0200 — MANDATE issued by user (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
