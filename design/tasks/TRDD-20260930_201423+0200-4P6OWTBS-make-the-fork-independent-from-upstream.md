---
trdd-id: 4P6OWTBS
title: Make the fork independent from upstream
column: dev
status: tasked
created: 2026-09-30T20:14:23+0200
updated: 2026-09-30T23:40:59+0200
current-owner: user
created-by: user
task-type: infra
min-approval-requirement: none
assignee: user
mandate: true
mandated-by: user
approved: true
approval-judge: user
approval-datetime: 2026-09-30T20:14:23+0200
---

# Make the fork independent from upstream

Detach this fork from upstream kimsungwhee/apple-docs-mcp so it stands as an independent project under Emasoft.

Scope:
- package.json: name -> @emasoft/apple-docs-mcp (confirm npm scope ownership before publish), repository/bugs/homepage -> github.com/Emasoft/apple-docs-mcp, author -> Emasoft.
- LICENSE: keep the original copyright line (MIT requires it) and add the new maintainer line below it.
- README*.md: update badges, npx install command package name, all repo links.
- .github/workflows/*.yml: retarget release/publish/claude/codecov workflows to the new repo, or remove workflows that only make sense upstream (e.g. upstream-only publish targets).
- git remote: rename origin -> upstream, add new origin pointing at Emasoft/apple-docs-mcp. Creating the GitHub repo and pushing needs explicit USER approval -- do not do this unattended.
- Remove any upstream-only files that no longer apply to the fork.

Acceptance:
- [ ] grep -rn kimsungwhee across the repo (excluding LICENSE attribution line and CHANGELOG/git history) returns nothing
- [ ] npx tsc --noEmit passes
- [ ] npx eslint . --quiet passes
- [ ] npm test / jest passes
- [ ] USER has explicitly approved creating the GitHub repo and pushing before that step runs

## Approval log

- 2026-09-30T20:14:23+0200 — MANDATE issued by user (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
- 2026-09-30T23:35:06+0200 — column → dev by user. CPV agent working sub-step a of the plugin restructure
- 2026-09-30 — CORRECTION: the move to dev above was made by main-agent@apple-docs-mcp (a worker, via trddgrep's default actor), not by the user.

## User decisions 2026-09-30 (verbatim)

1. "yes, create the new public repository, but change the name of the project. Emasoft/emasoft-apple-documentation-plugin . And it must not be published on npm. but as a claude code plugin. And the mcp must be inside the plugin, as in the anthropic claude code plugins specs. the whole repo must be restructured as a claude code plugin. check the anthropic docs."
2. "i forgot to add that the Emasoft/emasoft-apple-documentation-plugin must be published in the Emasoft/emassoft-plugins marketplaace. Use the cpv plugin agent to setup and publish the plugin and implementing the cpv publishing pipeline canon." (the hub is Emasoft/emasoft-plugins; "emassoft" is a typo)

## Restructure plan (scratch copy docs_dev/20260930-plugin-restructure-brief.md)

- Supersedes the npm-scoped rename in Scope above: plugin name emasoft-apple-documentation-plugin, not published to npm, private package.json.
- Architecture: single committed esbuild bundle servers/apple-docs/index.js plus data/, zero runtime node_modules; root .mcp.json server apple-docs runs node on CLAUDE_PLUGIN_ROOT/servers/apple-docs/index.js; delete stale root package-lock.json so Claude Code does not npm ci devDependencies.
- Marketplace: Layout A (hub-and-spoke), entry in Emasoft/emasoft-plugins hub; CPV canonical pipeline files (cliff.toml, CHANGELOG, commitlint, cspell, node-version, scripts/publish.py, git-hooks/pre-push, ci.yml, release.yml, notify-marketplace.yml).
- Phase 1 = local restructure only (no commit, push, hub edit, release); Phase 2 = first push, hub registration, publish.py release, only after the orchestrator reviews and sends a go.

## Plan amendments after review (2026-09-30)

A1. Phase 1 is split into sub-steps, one per dispatch, each committed by the orchestrator before the next: (a) bundle + .mcp.json + data resolution + standalone test + lockfile guard; (b) rename (package.json, plugin.json, LICENSE, version 2.0.0); (c) CPV canon files + workflows (list each as keep/remove/replace with reason); (d) READMEs in all four languages + third-party notices doc; (e) full validation pass (CPV strict + claude plugin validate) and fixes.
A2. data/ stays in ONE place, the repo-root data/ (39 MB, 1437 tracked files); never copy or duplicate it. Change src/utils/wwdc-data-source-path.ts so production resolves ../../data/wwdc relative to the bundle servers/apple-docs/index.js, keep the test-env branch, comment the WHY; the build no longer runs cp -r data dist/ for runtime.
A3. Bundle is ESM (package.json type module; import.meta.url is undefined in a CJS bundle). Pin esbuild EXACTLY (no caret), no sourcemap (or none with absolute paths) so the bundle is byte-deterministic across machines, legalComments external or equivalent, and sub-step a must make the build emit license material for a THIRD_PARTY_LICENSES/NOTICE file (doc written in sub-step d).
A4. Standalone jest test in tests/: copy only servers/apple-docs/index.js plus data/ into a temp plugin-shaped dir with no node_modules up the tree, spawn node on the bundle, do MCP initialize, tools/list and one offline data-backed WWDC tool call (e.g. list videos for a year) asserting non-empty real content; assert the bundle text has no jsdom; freshness check that a rebuild is byte-identical (fail with 'run pnpm build and commit the bundle').
A5. Lockfile guard: a test (or CI step) fails if package-lock.json, npm-shrinkwrap.json, bun.lock or bun.lockb exists at repo root, explaining that Claude Code would otherwise npm ci every devDependency on users' machines; also add them to .gitignore.
A6. In sub-step c, confirm scripts/publish.py and CI are pnpm-aware (no npm ci, no cache: npm).
A7. Derived task after Phase 1: re-scope open cards A1DNMJD9, UM1PQWDB, 9SMOD8AH, 4RXQ5L25, Q23MSNKP, TBK20QL4 to the new layout (orchestrator dispatches; do not edit them here).
A8. The report must list every removed path and state explicitly whether each validator actually ran, never skipping silently.
A9. Phase 2 prerequisites: MARKETPLACE_PAT secret on the new repo for notify-marketplace.yml; branch protection baseline-history-protect before the first push, baseline-pr-and-checks only after CI is green.
A10. Sub-step a details: the standalone test spawns the bundle with explicit minimal env { PATH, HOME } (no NODE_ENV, no JEST_WORKER_ID) and a cwd that is a separate empty temp dir with no data/, because getWWDCDataDirectory() takes its test branch (cwd/data/wwdc) under NODE_ENV=test or JEST_WORKER_ID and a child inherits both from jest, which would pass despite a broken production path. tmp/data may symlink to <repo>/data instead of copying 39 MB. esbuild: single output file, no code splitting (import.meta.url must be the bundle's own URL); if CJS deps fail with 'Dynamic require of X is not supported' add banner import { createRequire } from 'module'; const require = createRequire(import.meta.url);. Freshness check builds to a TEMP outfile and compares bytes with the committed bundle and legal-comments file, never rewriting the committed bundle during tests.
A11. Sub-step d: README must state the requirement of node (>= the .node-version major) on the user's PATH because Claude Code's native installer does not ship Node, and the install size (~39 MB WWDC data per installed version).
Supersedes the Restructure plan section above where they conflict (sub-steps, single root data/, ESM bundle).
