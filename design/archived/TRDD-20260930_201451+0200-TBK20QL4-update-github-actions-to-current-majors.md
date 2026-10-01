---
trdd-id: TBK20QL4
title: Update GitHub Actions to current majors
column: superseded
status: archived
created: 2026-09-30T20:14:51+0200
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
approval-datetime: 2026-09-30T20:14:51+0200
npt: []
superseded-by: [4P6OWTBS]
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
- 2026-10-01T05:05:11+0200 — SUPERSEDED by main-agent@apple-docs-mcp. Superseded by CPV pipeline commit c42c071 (ci/release/notify-marketplace workflows replaced; actions pinned to SHA at current majors; permissions {} top-level), verified in .github/workflows and 46b695a.
