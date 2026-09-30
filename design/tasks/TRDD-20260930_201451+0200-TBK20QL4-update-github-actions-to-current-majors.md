---
trdd-id: TBK20QL4
title: Update GitHub Actions to current majors
column: todo
status: tasked
created: 2026-09-30T20:14:51+0200
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
approval-datetime: 2026-09-30T20:14:51+0200
npt: []
---

# Update GitHub Actions to current majors

Bump workflow actions to current majors: actions/checkout@v4, actions/setup-node@v4, pnpm/action-setup@v3, actions/github-script@v7, codecov/codecov-action@v4, softprops/action-gh-release@v1, anthropics/claude-code-action@v1 -- verify each with gh api repos/<owner>/<repo>/releases/latest --jq .tag_name before pinning, do not guess versions.

Also: set least-privilege top-level permissions (start from {} and add only what each job needs); pin third-party (non actions/, non github/) actions to a full commit SHA with pinact, keeping the version tag as a trailing comment.

Acceptance:
- [ ] Every action bumped to a verified latest major
- [ ] permissions: block present and minimal on every workflow
- [ ] third-party actions pinned to commit SHA via pinact

## Approval log

- 2026-09-30T20:14:51+0200 — MANDATE issued by user (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
