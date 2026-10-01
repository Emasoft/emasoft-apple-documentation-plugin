---
trdd-id: BMP1UIS8
title: Improve Jev selection on narrow WWDC queries
column: backburner
status: tasked
created: 2026-10-01T11:14:21+0200
updated: 2026-10-01T11:14:21+0200
current-owner: main-agent@apple-docs-mcp
created-by: main-agent@apple-docs-mcp
task-type: feature
min-approval-requirement: none
assignee: main-agent@apple-docs-mcp
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@apple-docs-mcp
approval-datetime: 2026-10-01T11:14:21+0200
---

# Improve Jev selection on narrow WWDC queries

Follow-up to TRDD-UM1PQWDB. Narrow WWDC queries with no dedicated session (measured: AsyncStream, best score 0.52) return weak, bunched scores; tail rows near 0.29-0.30 pass the 50%-of-top rule only because all scores are low. Scores also vary about 0.01 run to run. Work: A/B-test the WWDC match statement on narrow queries, and/or add an absolute floor for tail rows when the top score is low. Measure with real rows (OPENROUTER_API_KEY available) before changing any threshold.

## Approval log

- 2026-10-01T11:14:21+0200 — MANDATE issued by main-agent@apple-docs-mcp (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
