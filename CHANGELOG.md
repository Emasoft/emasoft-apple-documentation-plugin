# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Bug Fixes

- Exit on stdin close in stdio mode (168ab87)
- Exit after draining in-flight requests on stdin EOF (7fbf8e3)
- Send debug/info logs to stderr, never stdout (ac93bcf)
- Search_apple_docs returned 0 results (upstream #51, #43) (e424410)
- Raise stdin-EOF shutdown backstop from 10s to 60s (5632381)
- Exit promptly after client disconnect when offline (TRDD-IHLAOB2W) (525ea76)
- Make server timeouts and tests resilient to CPU peaks (TRDD-0NSMWBTM) (1ea6f82)

### Documentation

- Sync Korean README with English version ([#35](https://github.com/Emasoft/emasoft-apple-documentation-plugin/issues/35)) (3339f30)
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

### Features

- Add alarmkit support ([#31](https://github.com/Emasoft/emasoft-apple-documentation-plugin/issues/31)) (60c2719)
- Add tool annotations for improved LLM tool understanding ([#34](https://github.com/Emasoft/emasoft-apple-documentation-plugin/issues/34)) (28c06cb)
- Add WWDC 2026 videos (5a72336)
- Ship the MCP server as a committed esbuild bundle (TRDD-4P6OWTBS step a) (4ea418c)
- Rename to the Claude Code plugin emasoft-apple-documentation-plugin 2.0.0 (TRDD-4P6OWTBS step b) (66209c9)

### Miscellaneous Tasks

- Remove dependabot configuration (2670a7d)
- Gitignore local reports and janitor state (2665cd4)
- Gitignore the local _dev folders (6efe2ee)
- Decline esbuild/unrs-resolver build scripts in pnpm-workspace.yaml (8837c29)
- Update MCP SDK 1.31.0, zod 4.6.5, cheerio 1.2.0 (TRDD-2DDKQU67) (52351c7)
- Update jest 30.5.2, ts-jest 29.4.14, tsx 4.23.15 (TRDD-YP2TDR2R) (f5c1fb6)

### Refactor

- Derive stdin-EOF backstop from the request deadline (TRDD-0NSMWBTM) (7296fba)

### Testing

- Make stdio shutdown test discriminate both shutdown bugs (79175dc)
- Mock the new search backend in response-format tests (40755e0)
- Derive shutdown-test failsafes from the backstop (TRDD-0NSMWBTM) (1027a63)

### Build

- Drop cheerio's unused URL loader from the bundle (TRDD-4P6OWTBS step a2) (5ecbcfa)
- Guard the cheerio load-parse redirect (TRDD-4P6OWTBS A16) (1be4970)
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

- Add local clone support to avoid GitHub rate limits ([#3](https://github.com/Emasoft/emasoft-apple-documentation-plugin/issues/3)) (ac0b74d)

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
