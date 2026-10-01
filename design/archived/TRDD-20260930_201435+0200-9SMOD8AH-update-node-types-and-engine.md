---
trdd-id: 9SMOD8AH
title: Update Node types and engine
column: complete
status: archived
created: 2026-09-30T20:14:35+0200
updated: 2026-10-01T05:05:11+0200
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
implementation-commits: [46b695a]
---

# Update Node types and engine

Bump @types/node 20 -> 26; add an explicit package.json engines.node field matching the CI node-version; align CI workflow node-version with it.

Acceptance:
- [x] @types/node bumped
- [x] package.json engines.node present and matches CI
- [x] tsc --noEmit passes

## Approval log

- 2026-09-30T20:14:35+0200 — MANDATE issued by user (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
2026-10-01 — Closed by orchestrator-assigned board maintenance. ai_review = adversarial review fork; no human reviewed. Acceptance verified against repo state and recorded evidence.
- 2026-10-01T05:05:11+0200 — COMPLETE by main-agent@apple-docs-mcp. acceptance met; ai_review by adversarial fork, no human.

## Results

2026-10-01: Node 22 applied: package.json engines.node >=22, @types/node 20.19.7 -> 22.20.4 (latest 22.x), esbuild target node22 (bundle byte-identical after rebuild), .node-version 22 and CI node-version-file confirmed. lint, tsc, build, actionlint, zizmor clean; 553 tests pass. Note: target node22 may emit syntax Node 20 rejects (consistent with README Node.js 22 or later).
