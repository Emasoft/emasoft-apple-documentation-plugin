# Changelog

All notable changes to this project will be documented in this file.

## [2.1.2] — 2026-10-01

### Bug Fixes

- Install node dependencies in the Release workflow's Validate job (9b43b75)
## [2.1.1] — 2026-10-01

### Bug Fixes

- Make CI green on the release (notify checkout, validate deps, patched transitive deps) (bebf186)

### Miscellaneous Tasks

- Bump version to 2.1.1 (055641c)
## [2.1.0] — 2026-10-01

### Bug Fixes

- Exit on stdin close in stdio mode (168ab87)
- Exit after draining in-flight requests on stdin EOF (7fbf8e3)
- Send debug/info logs to stderr, never stdout (ac93bcf)
- Search_apple_docs returned 0 results (upstream #51, #43) (e424410)
- Raise stdin-EOF shutdown backstop from 10s to 60s (5632381)
- Exit promptly after client disconnect when offline (TRDD-IHLAOB2W) (525ea76)
- Make server timeouts and tests resilient to CPU peaks (TRDD-0NSMWBTM) (1ea6f82)
- **lint:** Finish ESLint 10 migration; AppError is a real Error (TRDD-4RXQ5L25) (367d04f)
- Clear all non-data CPV strict findings (TRDD-4P6OWTBS step e) (1e8640f)
- Let Jev score every WWDC candidate when select is on (TRDD-UM1PQWDB) (aed74a0)
- Clear the CPV strict security findings (command-injection shape, sha1) (b1c3c0a)

### Documentation

- Sync Korean README with English version ([upstream #35](https://github.com/kimsungwhee/apple-docs-mcp/issues/35)) (3339f30)
- Add Autohand Code MCP setup (6eb0675)
- Bring years and OS versions up to WWDC 2026 / iOS 27; add troubleshooting (c6dbfc7)
- Plan fork independence, dependency updates and Jev result selection as TRDDs (4a67ccf)
- TRDD-UM1PQWDB Jev selection design from research and user clarification (a6d2e27)
- TRDD-4RXQ5L25 drop unproven prerequisite on the test-tooling card (a8a33b2)
- Add TRDD-A1DNMJD9 search backend hardening follow-ups (5bca4a7)
- Correct pnpm-workspace.yaml comment (3b71d68)
- TRDD-UM1PQWDB recall findings, relative cutoff, per-call parameter, license (caca799)
- Close TRDD-IHLAOB2W and TRDD-2DDKQU67 as complete (2b3923e)
- Record plugin restructure decisions in TRDD-4P6OWTBS (ef8bc62)
- Record restructure plan amendments; add TRDD-I8QT4E2L (d3c7b76)
- Correct card provenance; disclose TRDD-YP2TDR2R close in d3c7b76 (230aaa0)
- Rewrite the READMEs for the Claude Code plugin (TRDD-4P6OWTBS step d) (98a8bde)
- Close TRDD-4RXQ5L25 and TRDD-9SMOD8AH, supersede TRDD-TBK20QL4 (d7b2e11)
- Close TRDD-I8QT4E2L and TRDD-0NSMWBTM (1929949)
- Close TRDD-A1DNMJD9; record the CPV blocker on TRDD-4P6OWTBS (c456a82)
- Add TRDD-GZECHF9J; park TRDD-4P6OWTBS behind it with a runnable probe (e83c1aa)
- Probe the installed CPV fix, not PR #238 (TRDD-4P6OWTBS) (ea0f086)
- Probe the latest CPV release, not the local cache (TRDD-4P6OWTBS) (ffca8d0)
- Document Jev selection; finish review fixes (TRDD-UM1PQWDB) (d7f8a50)
- Close TRDD-UM1PQWDB; add TRDD-3LSMA9YE and TRDD-BMP1UIS8 (489cdc5)
- State typical Jev latency, not only the worst case (TRDD-UM1PQWDB) (604ea09)
- Move TRDD-Q23MSNKP to backburner (blocked upstream) (63cee8e)
- State typical Jev latency and the on-demand WWDC download in the skill (a406fdd)
- Track the janitor finding cards in design/ (8cef89e)

### Features

- Add alarmkit support ([upstream #31](https://github.com/kimsungwhee/apple-docs-mcp/issues/31)) (60c2719)
- Add tool annotations for improved LLM tool understanding ([upstream #34](https://github.com/kimsungwhee/apple-docs-mcp/issues/34)) (28c06cb)
- Add WWDC 2026 videos (5a72336)
- Ship the MCP server as a committed esbuild bundle (TRDD-4P6OWTBS step a) (4ea418c)
- Rename to the Claude Code plugin emasoft-apple-documentation-plugin 2.0.0 (TRDD-4P6OWTBS step b) (66209c9)
- Route Apple search through httpClient with caching (TRDD-A1DNMJD9) (bfad413)
- Add the Jev semantic selection core (TRDD-UM1PQWDB phase 1) (842295d)
- Wire Jev selection into WWDC and Apple docs search (TRDD-UM1PQWDB phase 2) (13a871b)
- Download WWDC data on demand; add the apple-docs-search skill (9abe2dd)

### Miscellaneous Tasks

- Remove dependabot configuration (2670a7d)
- Gitignore local reports and janitor state (2665cd4)
- Gitignore the local _dev folders (6efe2ee)
- Decline esbuild/unrs-resolver build scripts in pnpm-workspace.yaml (8837c29)
- Update MCP SDK 1.31.0, zod 4.6.5, cheerio 1.2.0 (TRDD-2DDKQU67) (52351c7)
- Update jest 30.5.2, ts-jest 29.4.14, tsx 4.23.15 (TRDD-YP2TDR2R) (f5c1fb6)
- Adopt the CPV canonical publish pipeline, no npm (TRDD-4P6OWTBS step c) (c42c071)
- Bump version to 2.1.0 (b14d230)

### Refactor

- Derive stdin-EOF backstop from the request deadline (TRDD-0NSMWBTM) (7296fba)
- Remove dead jsdom WWDC extractors and jsdom (TRDD-I8QT4E2L) (293134d)

### Testing

- Make stdio shutdown test discriminate both shutdown bugs (79175dc)
- Mock the new search backend in response-format tests (40755e0)
- Derive shutdown-test failsafes from the backstop (TRDD-0NSMWBTM) (1027a63)

### Build

- Drop cheerio's unused URL loader from the bundle (TRDD-4P6OWTBS step a2) (5ecbcfa)
- Guard the cheerio load-parse redirect (TRDD-4P6OWTBS A16) (1be4970)
- **lint:** Migrate to ESLint 10 flat config with typed linting (TRDD-4RXQ5L25, partial) (2328da5)
- Require Node 22; release only from v2+ tags (TRDD-9SMOD8AH) (46b695a)
- Allowlist the bundle control-character re-escape (TRDD-4P6OWTBS) (980694a)
- Pin the control-character rewrite count; write the bundle atomically (TRDD-4P6OWTBS) (0b31bcf)
- Set bundle mode explicitly; ignore build temp; extend dependabot note (TRDD-4P6OWTBS) (35ac9be)
- Enable pnpm supply-chain policy with reviewed exceptions (TRDD-4P6OWTBS) (27736c2)
- Pin pnpm supply-chain exceptions to exact versions (TRDD-4P6OWTBS) (db99b0a)

### Data

- Redact the sample JWS token in WWDC25 session 221 (TRDD-4P6OWTBS) (ecd5d55)
## [1.0.26] — 2025-09-15

### Bug Fixes

- Resolve import.meta.url issue in CI environment (e9e2e2c)
- Better handling of import.meta.url for CI environment (48b0b4a)
- Isolate import.meta.url to separate module for CI compatibility (8f02287)
- Remove unused listWWDCYearsSchema import (589e727)

### Features

- Implement list_wwdc_years tool and fix all tests (44ec96e)

### Miscellaneous Tasks

- Release v1.0.26 - implement list_wwdc_years tool (09a1424)
## [1.0.25] — 2025-09-15

### Features

- Add local clone support to avoid GitHub rate limits ([upstream #3](https://github.com/kimsungwhee/apple-docs-mcp/issues/3)) (ac0b74d)

### Miscellaneous Tasks

- Add comprehensive GitHub Actions workflows (3e02299)
- Release v1.0.25 (3713bef)

### Refactor

- Simplify WWDC data source and fix all tests (e893a86)
## [1.0.23] — 2025-09-03

### Bug Fixes

- Resolve http-headers-generator test failures (af2e496)

### Features

- Complete User-Agent pool implementation (cc24680)

### Miscellaneous Tasks

- Bump version to 1.0.23 (9600107)
## [1.0.22] — 2025-07-21

### Features

- Switch WWDC data source from GitHub raw to jsDelivr CDN (3bb2781)
## [1.0.21] — 2025-07-18

### Documentation

- Update README files (788c498)
- Update to iOS 26 and macOS 26 beta versions (77860f6)

### Features

- Add comprehensive WWDC video tools and documentation (f32982f)

### Miscellaneous Tasks

- Update package description and bump version to 1.0.21 (54e6abe)
## [1.0.20] — 2025-07-18

### Bug Fixes

- Resolve TypeScript compilation error in rate limiter (403e21b)
- Resolve response format issue in searchAppleDocs (0d6a3fa)
- Resolve nested response structure issue in getAppleDocContent (1082557)

### Features

- Enhance error handling and create unified framework mapper (cfdfbd6)
- Add limit parameter to list_technologies tool and remove duplicate tool definitions (135216c)
- Add comprehensive WWDC video tools and documentation (302e97d)

### Refactor

- Major architectural improvements and performance optimization (b884b62)

### Testing

- Add comprehensive response format validation tests (018cc5d)
## [1.0.19] — 2025-07-17

### Features

- Add documentation updates tracking tool (cc5a954)
- Add get_technology_overviews tool for comprehensive technology guides (068d68e)
- Add Apple Sample Code Library browsing tool (1ac4761)
## [1.0.18] — 2025-07-16

### Features

- Add comprehensive test suite and optimize framework search (b7d4d1d)

### Eat

- Implement type filtering, fix URL duplication, remove search cache (b822ac3)
## [1.0.16] — 2025-07-16

### Features

- Streamline MCP tools and update documentation (81d54f2)
## [1.0.14] — 2025-07-15

### Features

- Add bin field and bump version to 1.0.14 (cee9b79)
---
*Generated by [git-cliff](https://git-cliff.org)*
