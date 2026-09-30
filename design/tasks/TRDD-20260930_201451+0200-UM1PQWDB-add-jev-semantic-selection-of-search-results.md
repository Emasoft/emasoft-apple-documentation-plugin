---
trdd-id: UM1PQWDB
title: Add Jev semantic selection of search results
column: backburner
status: tasked
created: 2026-09-30T20:14:51+0200
updated: 2026-09-30T20:15:20+0200
current-owner: user
created-by: user
task-type: feature
min-approval-requirement: none
assignee: user
mandate: true
mandated-by: user
approved: true
approval-judge: user
approval-datetime: 2026-09-30T20:14:51+0200
npt: []
---

# Add Jev semantic selection of search results

Re-rank / filter search_apple_docs, WWDC search, and design search results by semantic relevance to the user's query, using Jev (the engine behind jgrep).

Constraints:
- Optional, gated by config -- default off.
- When enabled without a required key/credential, fail explicitly with a clear error; no silent fallback to unranked results.
- Tests run offline against recorded Jev responses (fixtures), never a live call in CI.

Research on Jev integration feasibility has not started yet.

Acceptance:
- [ ] Config flag to enable/disable Jev re-ranking
- [ ] Explicit failure (not silent fallback) when enabled without required credentials
- [ ] Offline tests using recorded Jev response fixtures
- [ ] tsc/eslint/jest all pass

## Approval log

- 2026-09-30T20:14:51+0200 — MANDATE issued by user (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
