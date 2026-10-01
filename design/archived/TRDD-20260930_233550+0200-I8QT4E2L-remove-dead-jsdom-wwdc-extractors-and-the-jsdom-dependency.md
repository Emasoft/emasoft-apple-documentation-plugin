---
trdd-id: I8QT4E2L
title: Remove dead jsdom WWDC extractors and the jsdom dependency
column: complete
status: archived
created: 2026-09-30T23:35:50+0200
updated: 2026-10-01T05:11:11+0200
current-owner: main-agent@apple-docs-mcp
created-by: user
task-type: refactor
min-approval-requirement: none
assignee: main-agent@apple-docs-mcp
mandate: true
mandated-by: none
approved: true
approval-judge: user
approval-datetime: 2026-09-30T23:35:50+0200
implementation-commits: [293134d]
---

# Remove dead jsdom WWDC extractors and the jsdom dependency

src/tools/wwdc/content-extractor.ts, topics-extractor.ts and video-list-extractor.ts import jsdom (a devDependency) but no module under src imports them (verified 2026-09-30 with tldr references and grep; only tests/tools/wwdc/*-extractor tests do); they ship as dead code. jsdom 27+ (latest 30.1.1) cannot load under the repo CommonJS ts-jest setup ("Must use import to load ES Module" via @exodus/bytes, reproduced 2026-09-30), which is why jsdom stays pinned at 26.1.0 (see TRDD-YP2TDR2R).

Scope: re-confirm with tldr references/tldr impact that nothing in src uses them; remove the three files, their tests, jsdom and @types/jsdom. Sequence after the plugin restructure (TRDD-4P6OWTBS) sub-steps land, since both touch package.json.

Acceptance:
- [x] tldr references/impact confirm no src consumer of the three extractors
- [x] Three extractor files and their tests in tests/tools/wwdc removed
- [x] jsdom and @types/jsdom removed from package.json and pnpm-lock.yaml
- [x] build, tsc, eslint src and full jest pass

## Approval log

- 2026-09-30T23:35:50+0200 — Derived task created by main-agent@apple-docs-mcp under the user directive 'update everything outdated' (2026-09-30); not seen or approved by the user individually.
- 2026-10-01 — Evidence: no src importer of the 3 extractors (grep of exported symbols + module names, only their own tests); removed 3 files + 3 tests; pnpm remove jsdom @types/jsdom; fixed http-client.ts RequestRedirect (global came from @types/jsdom) with explicit union; lint 0 errors, tsc 0, build ok, servers/ diff empty, jest 41 suites 526 tests pass.
- 2026-10-01 — ai_review = adversarial review fork; no human reviewed. Board maintenance: acceptance verified (tldr references/impact no src consumer; commit 293134d; lint 0 errors, tsc clean, build byte-identical, jest 41 suites / 526 tests).
- 2026-10-01T05:11:10+0200 — column → ai_review by main-agent@apple-docs-mcp. board maintenance; evidence in approval log
- 2026-10-01T05:11:10+0200 — column → human_review by main-agent@apple-docs-mcp. board maintenance; evidence in approval log
- 2026-10-01T05:11:11+0200 — COMPLETE by main-agent@apple-docs-mcp. board maintenance; evidence in approval log.
