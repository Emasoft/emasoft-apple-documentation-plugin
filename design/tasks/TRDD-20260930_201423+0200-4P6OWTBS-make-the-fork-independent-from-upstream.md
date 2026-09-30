---
trdd-id: 4P6OWTBS
title: Make the fork independent from upstream
column: todo
status: tasked
created: 2026-09-30T20:14:23+0200
updated: 2026-09-30T23:29:33+0200
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

## User decisions 2026-09-30 (verbatim)

1. "yes, create the new public repository, but change the name of the project. Emasoft/emasoft-apple-documentation-plugin . And it must not be published on npm. but as a claude code plugin. And the mcp must be inside the plugin, as in the anthropic claude code plugins specs. the whole repo must be restructured as a claude code plugin. check the anthropic docs."
2. "i forgot to add that the Emasoft/emasoft-apple-documentation-plugin must be published in the Emasoft/emassoft-plugins marketplaace. Use the cpv plugin agent to setup and publish the plugin and implementing the cpv publishing pipeline canon." (the hub is Emasoft/emasoft-plugins; "emassoft" is a typo)

## Restructure plan (scratch copy docs_dev/20260930-plugin-restructure-brief.md)

- Supersedes the npm-scoped rename in Scope above: plugin name emasoft-apple-documentation-plugin, not published to npm, private package.json.
- Architecture: single committed esbuild bundle servers/apple-docs/index.js plus data/, zero runtime node_modules; root .mcp.json server apple-docs runs node on CLAUDE_PLUGIN_ROOT/servers/apple-docs/index.js; delete stale root package-lock.json so Claude Code does not npm ci devDependencies.
- Marketplace: Layout A (hub-and-spoke), entry in Emasoft/emasoft-plugins hub; CPV canonical pipeline files (cliff.toml, CHANGELOG, commitlint, cspell, node-version, scripts/publish.py, git-hooks/pre-push, ci.yml, release.yml, notify-marketplace.yml).
- Phase 1 = local restructure only (no commit, push, hub edit, release); Phase 2 = first push, hub registration, publish.py release, only after the orchestrator reviews and sends a go.
