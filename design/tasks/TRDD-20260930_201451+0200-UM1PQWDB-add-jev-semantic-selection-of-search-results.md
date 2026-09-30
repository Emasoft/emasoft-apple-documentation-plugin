---
trdd-id: UM1PQWDB
title: Add Jev semantic selection of search results
column: todo
status: tasked
created: 2026-09-30T20:14:51+0200
updated: 2026-09-30T20:19:31+0200
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
- 2026-09-30T20:18:54+0200 — column → todo. Research complete: Jev integration approach, revised per user decision to widen recall then narrow to top 1-5 by score.

## Design (from research 2026-09-30)

Jev ships only as the jgrep CLI (npm jevgrep, no importable library). Integrate via a direct HTTP client (~40 lines, fetch) speaking the "System One" protocol: POST {model, state:{rows:[{id,...fields}]}, questions:{"<id>.match":{type:"noul"|"score"|"choice", instructions}}}, header Authorization: Bearer <key>; <=64 row x question pairs per request; response {answers, usage, cost?}.
Providers: typesafe (https://api.typesafe.ai/v1/systemone, TYPESAFE_API_KEY), openrouter (https://openrouter.ai/api/alpha/decisions, model ~typesafe/jev-latest, OPENROUTER_API_KEY), gateway (JEV_GATEWAY_URL + JEV_GATEWAY_API_KEY). All paid; measured ~1-2s and ~$0.0001-0.0002 for 20 rows x 1 question.
Pipeline: after search_apple_docs (and WWDC / design search) fetch 20-30 candidates, score each {title, summary, url} row against the user's query, sort by probability, keep existing formatting/pagination; show the score per result. One shared helper for all three tools.
Opt-in only: APPLE_DOCS_MCP_JEV_RERANK=1 (a key in the environment alone must not enable it). Enabled + no key -> clear error naming the env vars looked at. Enabled + Jev call fails -> surface the error; never silently return unranked order.
Tests: inject a fake fetch (DI seam) returning canned {answers}; offline unit tests always; optional live smoke test gated on an env var.
Optional cache keyed sha1(model, questions, row).
User decision (verbatim, 2026-09-30, overrides prior sort-and-keep-pagination note): "just examine how jgrep works and reproduce it. the difference is that here jev is applied on the results of the already good search system results, relaxing it more. so if the results are 100+ items, jev will be able to rate each one of the results and tell us the most correct result (best reflecting the search query). jev will then produce 1 to 5 results extremely relevant instead of 100+ results."
Revised pipeline: (1) widen recall first -- gather a large candidate set (100+ where the source allows: more Apple search results/pages, WWDC entries, design entries); (2) reproduce jgrep's --rows mechanics in-process: rows batched 16/request, concurrency 16, <=64 row x question pairs per request, noul probability per row, full-jitter retries (4 retries, 500ms-30s, Retry-After), per-batch timeout, circuit breaker after 3 consecutive fatal errors, sha1(model,question,row) cache; (3) output: the top 1-5 rows by probability (drop rows below a relevance threshold, default like jgrep's 0.7, configurable; if none pass, return the best 1 with its score and say so explicitly), each with its score; (4) keep opt-in env, explicit errors, fake-fetch offline tests.
Acceptance (revised): a query returning 100+ candidates yields <=5 results, each with score; tests cover batching (e.g. 120 rows -> 8 requests), threshold, retries, cache hit.
Orchestrator decision (delegated by user, 2026-09-30): Jev failure while enabled returns a clear error to the caller -- fail fast, no unranked fallback (user rule: no fallbacks).
Orchestrator decision: provider is chosen explicitly via APPLE_DOCS_MCP_JEV_PROVIDER (typesafe|openrouter|gateway) plus that provider's own key env var; never auto-pick "first key found", and never read jgrep's ~/.config/jgrep key files.
Orchestrator decision: README must state what is sent to the provider (the query + each candidate's title/abstract/url) and to whom, plus the per-call cost order of magnitude.
Orchestrator decision: ship our own client reproducing jgrep's --rows behaviour; check jgrep/jevgrep's license before porting any of its code. Note: jgrep exporting a scoreRows library entry would be the better long-term fix -- file as a separate proposal, out of scope for this card.
Orchestrator decision: v1 scope is search_apple_docs and the WWDC search (100+ candidates realistic there); design search is deferred to later.
Orchestrator decision: measure token cost with REAL Apple search result rows before claiming any cost figures; the /bin/zsh.0001-0.0002/20-rows figure above is provisional pending that measurement.
