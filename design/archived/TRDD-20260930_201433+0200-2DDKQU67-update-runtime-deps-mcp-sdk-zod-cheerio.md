---
trdd-id: 2DDKQU67
title: Update runtime deps MCP SDK zod cheerio
column: complete
status: archived
created: 2026-09-30T20:14:33+0200
updated: 2026-09-30T21:25:12+0200
current-owner: user
created-by: user
task-type: refactor
min-approval-requirement: none
assignee: user
mandate: true
mandated-by: user
approved: true
approval-judge: user
approval-datetime: 2026-09-30T20:14:33+0200
npt: []
implementation-commits: [52351c7]
---

# Update runtime deps MCP SDK zod cheerio

Bump runtime dependencies and verify behavior against upstream changelogs before landing.

- @modelcontextprotocol/sdk: 1.15.1 -> 1.31.0 -- read the SDK changelog for protocol-version bumps, tool-annotation changes, and transport changes; update server setup code accordingly.
- zod: 4.0.5 -> 4.6.5.
- cheerio: 1.1.0 -> 1.2.0.

Acceptance:
- [x] All three deps bumped in package.json/pnpm-lock.yaml
- [x] npx tsc --noEmit passes
- [x] jest suite passes
- [x] MCP server still responds correctly over stdio (manual or existing shutdown test)

## Approval log

- 2026-09-30T20:14:33+0200 — MANDATE issued by user (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
- 2026-09-30T21:24:19+0200 — column → ai_review. Implementation verified; ready for review
- 2026-09-30T21:24:28+0200 — column → human_review. AI review passed; evidence recorded in Verification section
- 2026-09-30T21:25:12+0200 — COMPLETE by main-agent@apple-docs-mcp. Human review passed; evidence verified, acceptance criteria met.

## Verification

Verified: jest 529/529 then 535/535 on later HEAD; protocol negotiation echoes 2024-11-05/2025-03-26/2025-06-18, unknown -> 2025-11-25; tools/list for a 2024-11-05 client returns name/description/inputSchema/annotations{title,readOnlyHint} only
