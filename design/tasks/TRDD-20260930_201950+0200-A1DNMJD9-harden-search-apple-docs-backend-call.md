---
trdd-id: A1DNMJD9
title: Harden search_apple_docs backend call
column: todo
status: tasked
created: 2026-09-30T20:19:50+0200
updated: 2026-09-30T20:19:50+0200
current-owner: main-agent@apple-docs-mcp
created-by: main-agent@apple-docs-mcp
task-type: bugfix
min-approval-requirement: none
assignee: main-agent@apple-docs-mcp
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@apple-docs-mcp
approval-datetime: 2026-09-30T20:19:50+0200
---

# Harden search_apple_docs backend call

Follow-ups from review of commit e424410 (search_apple_docs backend switch to
the internal JSON API via a raw fetch POST in src/tools/apple-search-api.ts).

(a) Retries/backoff and a browser-like User-Agent: fetchAppleDocsSearch uses a
raw `fetch()` POST instead of routing through httpClient, so it gets none of
httpClient's retry/backoff or UA rotation. Add POST support to httpClient and
switch fetchAppleDocsSearch to use it.

(b) Runtime host discovery: SEARCH_API_URL is hardcoded to
devintserv.msc.sbz.apple.com. The public search page's own client-side JS
reads the real endpoint from window.SEARCH_CONFIG.api at
developer.apple.com/search. Read and cache that value at runtime so a host
rename doesn't silently break search; keep the hardcoded host only as the
documented default/fallback.

(c) Cache search results in searchCache. It exists in src/utils/cache.ts but
is never read or written by search_apple_docs, before or after e424410.

(d) Latency: measured 5-25s, median 9.6s (see
reports/pr-review/20260930_193706+0200-measure-search-stream.md). Add a
latency note to the search_apple_docs tool description in
src/tools/definitions.ts and to the README. Also investigate returning
partial results before the stream's searchFinished marker, since
readJsonlBody currently waits for it before fetchAppleDocsSearch resolves.

Acceptance criteria:
- [ ] (a) httpClient supports POST; fetchAppleDocsSearch uses it; offline test
      covers a retried request succeeding after a transient failure.
- [ ] (b) runtime window.SEARCH_CONFIG.api discovery implemented and cached;
      offline test covers falling back to the hardcoded default when
      discovery fails, and using the discovered host when it succeeds.
- [ ] (c) search results are read from and written to searchCache with a
      sensible TTL/key; offline test covers a cache hit skipping the network
      call.
- [ ] (d) latency note added to the tool description and README; a decision
      recorded on whether streaming partial results is feasible.
- [ ] live check: search_apple_docs still returns real results against the
      live Apple endpoint after these changes.

## Approval log

- 2026-09-30T20:19:50+0200 — MANDATE issued by main-agent@apple-docs-mcp (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
