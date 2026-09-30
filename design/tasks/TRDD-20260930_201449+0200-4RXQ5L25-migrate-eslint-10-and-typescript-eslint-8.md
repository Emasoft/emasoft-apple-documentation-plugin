---
trdd-id: 4RXQ5L25
title: Migrate ESLint 10 and typescript-eslint 8
column: todo
status: tasked
created: 2026-09-30T20:14:49+0200
updated: 2026-09-30T20:15:21+0200
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
npt: [YP2TDR2R]
---

# Migrate ESLint 10 and typescript-eslint 8

eslint 8.57 -> 10.11 requires migrating .eslintrc* to a flat eslint.config.js. typescript-eslint 7 -> 8. Depends on the jest/tsx tooling update (B2) because the flat config and lint scripts interact with the ts-jest/tsx toolchain wiring in package.json scripts, so they should land together to avoid a broken lint+test matrix in between.

Acceptance:
- [ ] eslint.config.js replaces .eslintrc*
- [ ] npx eslint . --quiet passes with zero errors
- [ ] typescript-eslint bumped to 8.x

## Approval log

- 2026-09-30T20:14:49+0200 — MANDATE issued by user (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
