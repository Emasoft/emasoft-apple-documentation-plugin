---
trdd-id: UM1PQWDB
title: Add Jev semantic selection of search results
column: testing
status: tasked
created: 2026-09-30T20:14:51+0200
updated: 2026-10-01T10:08:22+0200
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
- [x] Config flag to enable/disable Jev re-ranking
- [x] Explicit failure (not silent fallback) when enabled without required credentials
- [x] Offline tests using recorded Jev response fixtures
- [x] tsc/eslint/jest all pass

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

## Decisions and findings (2026-09-30)

**Recall strategy — measured, not guessed.** The search backend (`POST https://devintserv.msc.sbz.apple.com/api/v1/query`, body `{text, targetResultLocale, includedResponses:["search"]}`) has **no paging parameters at all**: the live `search.js` client (fetched and grepped) builds the exact same three-field body for every query — no `limit`/`offset`/`page`/`size`/`from`. Measured against the real endpoint: "NavigationStack" → 15 `search` rows in 14.8s, `"async await"` → 8 rows in 8.5s, `"view"` (broad) → 12 rows in 7.5s. The backend itself never approaches 100 items regardless of query breadth — `API_LIMITS.MAX_SEARCH_RESULTS` (50, `src/utils/constants.ts:7`) is a local safety cap that this API never hits in practice. **Conclusion: the 100+-item scenario the user described does not come from `apple-search-api.ts` at all** — it comes from the other two local candidate sources that have no such backend cap: `search_framework_symbols` (the local framework index JSON, which can match 100+ symbol names for a broad term) and WWDC content search (`src/tools/wwdc/wwdc-handlers.ts::handleSearchWWDCContent`, read only — not modified): `results` there is built by scanning every video in every requested year and pushing one entry per video with any transcript/code match, uncapped, sorted, and only THEN sliced to `limit` (default 20) at line 218 — for a broad term across all years this routinely exceeds 100 before the slice. Jev re-ranking therefore targets the **local candidate lists** (framework symbol matches, WWDC video matches), not the Apple search API response, which is already small.
**Selection: top-k by Jev probability, RELATIVE cutoff (not absolute 0.7).** k ≤ 5 (`maxResults`, see below). Drop a candidate if its score is < 50% of the top score, OR if there is a gap > 0.25 between consecutive sorted scores — whichever fires first. Both thresholds (`50%`, `0.25`) are named constants, configurable via env/config, not hardcoded magic numbers. Rationale: an absolute 0.7 floor throws away every result when the whole candidate set is mediocre (e.g. best match 0.55); a relative cutoff keeps the field's *actual* winners even when the absolute scores are low.
**Below-0.3 top score: explicit "no strong match", not a silent fallback.** When the top score is < 0.3, the response text says so outright — e.g. "No strong match (best result scored 0.21) — showing the closest one:" — and returns only that single best result with its score attached. This is a labelled, visible degradation, never a quiet drop-through to "results look normal but aren't."
**Per-call opt-out, not a hidden global.** Each tool call accepts a `select: boolean` parameter (default `true` only when the feature's env opt-in is itself enabled — no behavior change for anyone who hasn't turned it on) and `maxResults: number` (1–5, default 5) — a caller can still get the full unfiltered candidate list by passing `select: false`. Every returned result — selected or not — carries its own score field so the caller (human or downstream agent) can see the actual confidence, not just trust the ranking blindly.
**README disclosure.** The README must state plainly: (1) what is sent to the re-ranking provider when `select` is on — the query text and each candidate's title/snippet/URL, nothing else (no request headers, no user identity); (2) that search **fails**, it does not silently fall back to unranked results, when re-ranking is enabled and the Jev provider is unreachable — fail-fast per CLAUDE.md, not a hidden degrade the caller can't see.
**jgrep/jevgrep license.** The installed binary at `/opt/homebrew/bin/jgrep` is provided by the **`jevgrep`** npm package (v0.6.0, zero dependencies, "Semantic grep … Powered by TypeSafe Jev"), **license: MIT** (confirmed via `npm view jevgrep license`). MIT permits reuse (including adaptation into this MIT-licensed project) with attribution — a `NOTICE`/README credit line naming `jevgrep` (https://github.com/kyu1204/jgrep) and its MIT license is sufficient; no separate license file duplication is required beyond that attribution. (Note: `npm view jgrep` alone resolves to an unrelated older package by a different author — also MIT, but NOT what is actually installed here; the installed binary is `jevgrep`.)
**Reproduce jgrep's per-row instruction text verbatim.** jevgrep's model is tuned against its own exact per-row prompt phrasing. When building the re-ranking prompt for Jev, reuse jevgrep's own instruction sentence **exactly**, character-for-character — "Look only at the row with id …" — rather than paraphrasing it, since the underlying model's behavior was tuned against that precise wording and a paraphrase is an unmeasured behavior change.

## Card corrections (advisor 2026-10-01)

- Installed jgrep is the Emasoft/jgrep fork 0.4.0, not jevgrep 0.6.0; upstream is kyu1204/jgrep 0.6.0 (MIT).
- OpenRouter endpoint is https://openrouter.ai/api/v1/systemone (0.6.0), not /api/alpha/decisions; proven by the live smoke test on 2026-10-01.
- v1 tools are search_wwdc_content and search_apple_docs; search_framework_symbols moved to its own TRDD (it needs a query parameter first).
- Dropped under fail-fast: circuit breaker, worker pool, partial-failure isolation, error taxonomy, rate pacing.
- Row fields are explicit (title, summary, url, topics, evidence); never an id field, it would overwrite the Jev row id.
- Jev stage: at most 256 candidates, batch 16, one wave (Promise.all), 15 s per-batch deadline including retries, 10 s per attempt.
- Phase 1 core (src/utils/jev-select.ts, JEV_CONFIG, jevScoreCache, tests) done 2026-10-01; phase 2 wiring (handlers, schemas, definitions, bundle) and README pending.
