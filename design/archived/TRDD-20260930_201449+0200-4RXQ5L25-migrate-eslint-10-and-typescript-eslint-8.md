---
trdd-id: 4RXQ5L25
title: Migrate ESLint 10 and typescript-eslint 8
column: complete
status: archived
created: 2026-09-30T20:14:49+0200
updated: 2026-10-01T05:05:10+0200
current-owner: user
created-by: user
task-type: refactor
min-approval-requirement: none
assignee: user
mandate: true
mandated-by: user
approved: true
approval-judge: user
approval-datetime: 2026-09-30T20:14:49+0200
npt: []
implementation-commits: [2328da5, 367d04f]
---

# Migrate ESLint 10 and typescript-eslint 8

eslint 8.57 -> 10.11 requires migrating .eslintrc* to a flat eslint.config.js. typescript-eslint 7 -> 8.

Acceptance:
- [x] eslint.config.js replaces .eslintrc*
- [x] npx eslint . --quiet passes with zero errors
- [x] typescript-eslint bumped to 8.x

## Approval log

- 2026-09-30T20:14:49+0200 — MANDATE issued by user (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
2026-10-01 — Closed by orchestrator-assigned board maintenance. ai_review = adversarial review fork; no human reviewed. Acceptance verified against repo state and recorded evidence.
- 2026-10-01T05:05:10+0200 — COMPLETE by main-agent@apple-docs-mcp. acceptance met; ai_review by adversarial fork, no human.

## Dependency note (2026-09-30)

Dependency note (2026-09-30, orchestrator decision, user delegated): removed npt on YP2TDR2R -- no demonstrated dependency between the ESLint 10 / typescript-eslint 8 migration and the jest/tsx/jsdom tooling update; they can land independently.

## Worker result 2026-10-01

eslint10 partial: toolchain+flat config done, 82 lint errors remain (AppError design, tests unbound-method); see reports/workers/20261001_021733+0200-eslint10.md
eslint10-finish: pnpm run lint exit 0 (0 errors, 290 warnings); tsc --noEmit 0; pnpm build 0 (servers/apple-docs/index.js regenerated); pnpm test 44 suites / 553 tests pass. AppError is now an Error subclass (isAppError kept structural).
