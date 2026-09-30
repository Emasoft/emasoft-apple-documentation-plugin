---
trdd-id: 2DDKQU67
title: Update runtime deps MCP SDK zod cheerio
column: todo
status: tasked
created: 2026-09-30T20:14:33+0200
updated: 2026-09-30T20:15:18+0200
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
---

# Update runtime deps MCP SDK zod cheerio

Bump runtime dependencies and verify behavior against upstream changelogs before landing.

- @modelcontextprotocol/sdk: 1.15.1 -> 1.31.0 -- read the SDK changelog for protocol-version bumps, tool-annotation changes, and transport changes; update server setup code accordingly.
- zod: 4.0.5 -> 4.6.5.
- cheerio: 1.1.0 -> 1.2.0.

Acceptance:
- [ ] All three deps bumped in package.json/pnpm-lock.yaml
- [ ] npx tsc --noEmit passes
- [ ] jest suite passes
- [ ] MCP server still responds correctly over stdio (manual or existing shutdown test)

## Approval log

- 2026-09-30T20:14:33+0200 — MANDATE issued by user (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
