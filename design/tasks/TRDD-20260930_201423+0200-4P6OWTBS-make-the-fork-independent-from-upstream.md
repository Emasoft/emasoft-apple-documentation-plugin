---
trdd-id: 4P6OWTBS
title: Make the fork independent from upstream
column: todo
status: tasked
created: 2026-09-30T20:14:23+0200
updated: 2026-09-30T20:14:23+0200
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
