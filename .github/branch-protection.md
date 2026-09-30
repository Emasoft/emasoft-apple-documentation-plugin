# Branch protection and repository secrets

## Branch ruleset

The `main` branch is protected by a server-side GitHub ruleset, applied with the
release script (not by hand in the web UI):

```bash
uv run python scripts/publish.py --install-branch-rules
```

Run it once after the first push, and only after CI has gone green on `main`: the
ruleset requires the three CI check-runs by their bare names, and a check that has
never reported leaves every pull request pending forever.

Required status checks (produced by `.github/workflows/ci.yml`):

- `Lint` (actionlint, eslint, tsc, Mega-Linter)
- `Validate` (CPV remote validation, `--strict`)
- `Test` (aggregate of the jest matrix on ubuntu and macOS)

Direct pushes to `main` are additionally blocked locally by the `git-hooks/pre-push`
gate: only `scripts/publish.py` may push the default branch or a release tag.

## Repository secrets

| Secret | Used by | Purpose |
|---|---|---|
| `MARKETPLACE_PAT` | `.github/workflows/notify-marketplace.yml` | Personal access token with `repo` scope on the marketplace hub, so a push to `main` can trigger the hub's version sync. Without it the workflow succeeds as a no-op. |

This plugin is **not** published to npm or any other package registry, so there is no
registry token. `GITHUB_TOKEN` (provided by GitHub) covers everything else.
