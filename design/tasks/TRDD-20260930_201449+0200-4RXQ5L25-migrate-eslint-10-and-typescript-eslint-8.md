---
trdd-id: 4RXQ5L25
title: Migrate ESLint 10 and typescript-eslint 8
column: dev
status: tasked
created: 2026-09-30T20:14:49+0200
updated: 2026-10-01T02:17:50+0200
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
---

# Migrate ESLint 10 and typescript-eslint 8

eslint 8.57 -> 10.11 requires migrating .eslintrc* to a flat eslint.config.js. typescript-eslint 7 -> 8.

Acceptance:
- [ ] eslint.config.js replaces .eslintrc*
- [ ] npx eslint . --quiet passes with zero errors
- [ ] typescript-eslint bumped to 8.x

## Approval log

- 2026-09-30T20:14:49+0200 — MANDATE issued by user (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.

## Dependency note (2026-09-30)

Dependency note (2026-09-30, orchestrator decision, user delegated): removed npt on YP2TDR2R -- no demonstrated dependency between the ESLint 10 / typescript-eslint 8 migration and the jest/tsx/jsdom tooling update; they can land independently.

## Worker result 2026-10-01

eslint10 partial: toolchain+flat config done, 82 lint errors remain (AppError design, tests unbound-method); see reports/workers/20261001_021733+0200-eslint10.md
