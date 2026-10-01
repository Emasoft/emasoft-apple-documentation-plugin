---
trdd-id: XVSVD8V3
title: Add a query parameter to search_framework_symbols and select with Jev
column: backburner
status: tasked
created: 2026-10-01T09:44:33+0200
updated: 2026-10-01T09:44:33+0200
current-owner: main-agent@apple-docs-mcp
created-by: main-agent@apple-docs-mcp
task-type: feature
min-approval-requirement: none
assignee: main-agent@apple-docs-mcp
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@apple-docs-mcp
approval-datetime: 2026-10-01T09:44:33+0200
---

# Add a query parameter to search_framework_symbols and select with Jev

search_framework_symbols has no natural-language query (inputs: framework, symbolType, namePattern glob, language, limit), so Jev has nothing to score rows against. Add a query parameter first. Findings from the advisor review of TRDD-UM1PQWDB: findSymbolsRecursive stops at limit in index order (recall is capped before any ranking, so widening recall means bypassing the limit internally); the result is cached as a formatted string keyed with limit (indexCache), so selection needs the cache to hold the symbol list instead; symbol rows carry only title, path and type (no abstract), so Jev's signal is thin. Reuse src/utils/jev-select.ts from TRDD-UM1PQWDB.

## Approval log

- 2026-10-01T09:44:33+0200 — MANDATE issued by main-agent@apple-docs-mcp (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
