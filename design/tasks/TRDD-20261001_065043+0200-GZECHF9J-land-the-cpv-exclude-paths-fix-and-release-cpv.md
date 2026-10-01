---
trdd-id: GZECHF9J
title: Land the CPV exclude_paths fix and release CPV
column: human_review
status: tasked
created: 2026-10-01T06:50:43+0200
updated: 2026-10-01T06:50:44+0200
current-owner: main-agent@apple-docs-mcp
created-by: main-agent@apple-docs-mcp
task-type: infra
min-approval-requirement: none
assignee: main-agent@apple-docs-mcp
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@apple-docs-mcp
approval-datetime: 2026-10-01T06:50:43+0200
---

# Land the CPV exclude_paths fix and release CPV

CPV 5.22.0 ignores cpv.exclude_paths in its content scanners (Emasoft/claude-plugins-validation#237). Fix PR #238 keeps secret scanning on and protects component dirs; it waits on PR #234 (integrity-gate change), and #238's Validate fails only until #234 lands.

Steps: user reviews and merges #234, then #238 (rebased if needed), then releases CPV; the local CPV install updates.

Acceptance:
- [ ] PR #234 reviewed and merged by the user
- [ ] PR #238 rebased if needed and merged by the user
- [ ] CPV released with the exclude_paths fix
- [ ] Local CPV install updated to the released version

## Approval log

- 2026-10-01T06:50:43+0200 — MANDATE issued by main-agent@apple-docs-mcp (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
- 2026-10-01T06:50:44+0200 — column → human_review by user. user approved board plan
