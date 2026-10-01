# Emasoft Apple Documentation plugin

<!--BADGES-START-->
[![Version](https://img.shields.io/badge/version-2.0.0-blue)](https://github.com/Emasoft/emasoft-apple-documentation-plugin/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
<!--BADGES-END-->

Apple Developer Documentation for Claude Code: search iOS, macOS, watchOS, tvOS and visionOS documentation, frameworks, APIs, SwiftUI, UIKit and WWDC videos, and get Swift/Objective-C code examples, API references and technical guides directly in your Claude Code session. The plugin bundles an MCP (Model Context Protocol) server, so installing the plugin is all it takes.

This plugin (`emasoft-apple-documentation-plugin`) is based on [kimsungwhee/apple-docs-mcp](https://github.com/kimsungwhee/apple-docs-mcp) by kimsungwhee (MIT license). It is an independent fork, repackaged as a Claude Code plugin; it is not published to npm.

**English** | [日本語](README.ja.md) | [한국어](README.ko.md) | [简体中文](README.zh-CN.md)

## Features

- **Smart Search**: Intelligent search across Apple Developer Documentation for SwiftUI, UIKit, Foundation, CoreData, ARKit, and more
- **Complete Documentation Access**: Full access to the Apple JSON API for Swift, Objective-C, and framework documentation
- **Apple Design and HIG Access**: Read Human Interface Guidelines JSON, Apple Design pages, and Design Resources catalog entries
- **Design Resource Previews**: Return Apple-provided HIG images and resource thumbnails as MCP image content blocks
- **Downloadable Design Resources**: Download direct Apple-hosted templates, fonts, tools, and archives into a local MCP resource cache
- **Framework Index**: Browse hierarchical API structures for iOS, macOS, watchOS, tvOS, visionOS frameworks
- **Technology Catalog**: Explore Apple technologies including SwiftUI, UIKit, Metal, Core ML, Vision, and ARKit
- **Documentation Updates**: Track WWDC 2025/2026 announcements, iOS 27, macOS 27, and latest SDK releases
- **Technology Overviews**: Comprehensive guides for Swift, SwiftUI, UIKit, and all Apple development platforms
- **Sample Code Library**: Swift and Objective-C code examples for iOS, macOS, and cross-platform development
- **WWDC Video Library**: Search WWDC 2014-2026 sessions with transcripts, Swift/SwiftUI code examples, and resources, fully offline
- **Related APIs Discovery**: Find SwiftUI views, UIKit controllers, and framework-specific API relationships
- **Platform Compatibility**: iOS 13+, macOS 10.15+, watchOS 6+, tvOS 13+, visionOS compatibility analysis
- **High Performance**: Optimized for Xcode, Swift Playgrounds, and AI-powered development environments
- **Smart UserAgent Pool**: Intelligent UserAgent rotation system with automatic failure recovery and performance monitoring
- **Multi-Platform**: Complete iOS, iPadOS, macOS, watchOS, tvOS, and visionOS documentation support
- **Beta and Status Tracking**: Beta and newly released APIs, deprecated UIKit methods, new SwiftUI features tracking

## Installation

### Requirements

- [Claude Code](https://code.claude.com/docs/en/overview)
- `node` (Node.js 22 or later) on your `PATH`. Claude Code runs the bundled server with `node`, and its native installer does not ship Node.js. Check with `node --version`.
- About 39 MB of disk space per installed plugin version (the WWDC data is bundled for offline use).

### From a Claude Code session

```text
/plugin marketplace add Emasoft/emasoft-plugins
/plugin install emasoft-apple-documentation-plugin@emasoft-plugins
```

### From a terminal

```bash
claude plugin marketplace add Emasoft/emasoft-plugins
claude plugin install emasoft-apple-documentation-plugin@emasoft-plugins --scope user
```

Restart Claude Code (or run `/reload-plugins`) to activate the plugin, then run `/mcp` to check that the `apple-docs` server of this plugin is connected.

### Update and uninstall

```bash
claude plugin update emasoft-apple-documentation-plugin@emasoft-plugins
claude plugin uninstall emasoft-apple-documentation-plugin
```

### Tool names in Claude Code

Claude Code namespaces the tools of a plugin MCP server, so the tool `search_apple_docs` appears as `mcp__plugin_emasoft-apple-documentation-plugin_apple-docs__search_apple_docs`. You never have to type these names: describe what you need and Claude picks the tool.

### Troubleshooting

- **The server fails to start, or `/mcp` shows it as failed?** Claude Code launches the server with the command `node`. GUI apps do not always inherit the `PATH` of your shell: run `which node` in a terminal, and make sure that directory is on the `PATH` of the process that starts Claude Code. The plugin needs Node.js 22 or later.
- **`search_apple_docs` returning nothing, or erroring?** It depends on an undocumented Apple search backend (`devintserv.msc.sbz.apple.com`) that the search page of developer.apple.com uses internally. If Apple changes its response shape, `search_apple_docs` can break until this plugin catches up. `get_apple_doc_content`, `search_framework_symbols` and the WWDC tools do not depend on that endpoint and keep working.
- **`search_apple_docs` feels slow?** Apple streams the full result set, so a search typically takes 5 to 25 seconds (median about 10). Repeating the same query within 10 minutes is answered from a local cache.

## Usage

Ask Claude in plain language; it chooses the right tool. Examples:

### Smart Search

```text
"Search for SwiftUI animations"
"Find withAnimation API documentation"
"Look up async/await patterns in Swift"
"Show me UITableView delegate methods"
"Search Core Data NSPersistentContainer examples"
"Find AVFoundation video playback APIs"
```

### Documentation Access

```text
"Get detailed information about the SwiftUI framework"
"Show me withAnimation API with related APIs"
"Get platform compatibility for SwiftData"
"Access UIViewController documentation with similar APIs"
"Show me NSManagedObjectContext documentation"
"Get URLSession async/await methods"
```

### Apple Design and HIG

```text
"Search Apple Design docs for layout"
"Read the HIG page about color"
"List Apple Design Resources for iOS templates"
"Download the Apple Design resource with this resourceId"
"Show Apple Design examples for the layout HIG page"
```

### Framework Exploration

```text
"Show me SwiftUI framework API index"
"List all UIKit classes and methods"
"Browse ARKit framework structure"
"Get WeatherKit API hierarchy"
"Explore Core ML model loading APIs"
"Show Vision framework image analysis APIs"
```

### API Discovery

```text
"Find APIs related to UIViewController"
"Show me similar APIs to withAnimation"
"Get all references from SwiftData documentation"
"Discover alternatives to Core Data NSManagedObject"
```

### Technology and Platform Analysis

```text
"List all Beta frameworks in the latest iOS"
"Show me Graphics & Games technologies"
"What machine learning frameworks are available?"
"Analyze platform compatibility for Vision framework"
```

### Documentation Updates

```text
"Show me the latest WWDC updates"
"What is new in SwiftUI?"
"Get technology updates for iOS"
"Show me release notes for Xcode"
"Find beta features in the latest updates"
```

### Technology Overviews

```text
"Show me technology overviews for app design and UI"
"Get comprehensive guides for games development"
"Explore AI and machine learning overviews"
"Show me iOS-specific technology guides"
"Get data management technology overviews"
```

### Sample Code Library

```text
"Show SwiftUI sample code projects"
"Find sample code for machine learning"
"Get UIKit example projects"
"Show featured WWDC sample code"
"Find Core Data sample implementations"
"Show only beta sample code projects"
```

### WWDC Video Search

```text
"Search WWDC videos about SwiftUI"
"Find WWDC sessions on machine learning"
"Show me WWDC 2026 videos"
"Search for async/await WWDC talks"
"Find WWDC videos about Swift concurrency"
"Show accessibility-focused WWDC sessions"
```

### WWDC Video Details

```text
"Get details for WWDC session 10176"
"Show me the transcript for WWDC23 session on SwiftData"
"Get code examples from WWDC video 10019"
"Show resources from Vision Pro WWDC session"
"Get transcript for the Meet async/await in Swift session"
```

### WWDC Topics and Years

```text
"List all WWDC topics"
"Show me Swift topic WWDC videos"
"Get WWDC videos about developer tools"
"List WWDC videos from 2023"
"Show all SwiftUI and UI frameworks sessions"
"Get machine learning WWDC content"
```

### Advanced Usage

```text
"Find related APIs for @State with platform analysis"
"Resolve all references from SwiftUI documentation"
"Get platform compatibility analysis for Vision framework"
"Find similar APIs to UIViewController with deep search"
```

## Available Tools

| Tool | Description | Key Features |
|------|-------------|--------------|
| `search_apple_docs` | Search Apple Developer Documentation | Official search API, find specific APIs, classes, methods |
| `get_apple_doc_content` | Get detailed documentation content | JSON API access, optional enhanced analysis (related/similar APIs, platform compatibility) |
| `search_apple_design_docs` | Search Apple Design and HIG content | HIG JSON references, Design pages, Design Resources catalog |
| `get_apple_design_content` | Read Apple Design and HIG pages | HIG JSON rendering, HTML fallback for `/design/` pages |
| `list_apple_design_resources` | List Apple Design Resources | Stable resource IDs, category/platform/format filters, previews and links |
| `download_apple_design_resource` | Download direct Apple Design resources | Local cache, MCP `resource_link` blocks, `resources/read` blob access |
| `get_apple_design_examples` | Return Apple Design visual examples | MCP `image` blocks with base64 data and MIME type |
| `list_technologies` | Browse all Apple technologies | Category filtering, language support, beta status |
| `search_framework_symbols` | Search symbols in specific framework | Classes, structs, protocols, wildcard patterns, type filtering |
| `get_related_apis` | Find related APIs | Inheritance, conformance, "See Also" relationships |
| `resolve_references_batch` | Batch resolve API references | Extract and resolve all references from documentation |
| `get_platform_compatibility` | Platform compatibility analysis | Version support, beta status, deprecation info |
| `find_similar_apis` | Discover similar APIs | Official Apple recommendations, topic groupings |
| `get_documentation_updates` | Track Apple documentation updates | WWDC announcements, technology updates, release notes |
| `get_technology_overviews` | Get technology overviews and guides | Comprehensive guides, hierarchical navigation, platform filtering |
| `get_sample_code` | Browse Apple sample code projects | Framework filtering (with limitations), keyword search, beta status |
| `list_wwdc_videos` | Browse WWDC video sessions | Offline transcripts and code, topic/year filtering |
| `search_wwdc_content` | Full-text search of WWDC transcripts and code | Specific discussions, API mentions, implementation examples |
| `get_wwdc_video` | Get a complete WWDC session | Full transcript, code examples, resources |
| `get_wwdc_code_examples` | Browse code examples from WWDC sessions | Implementation patterns with session context |
| `browse_wwdc_topics` | List WWDC topic categories with their IDs | Topic IDs usable as filters in `list_wwdc_videos` |
| `find_related_wwdc_videos` | Discover sessions related to a video | Prerequisites, follow-up sessions, similar talks |
| `list_wwdc_years` | List all available WWDC years | Conference years with video counts and statistics |

## Technical Architecture

```text
emasoft-apple-documentation-plugin/
├── .claude-plugin/plugin.json        # Claude Code plugin manifest
├── .mcp.json                         # Registers the bundled MCP server (apple-docs)
├── servers/apple-docs/
│   ├── index.js                      # Committed esbuild bundle, the server users run
│   └── THIRD_PARTY_LICENSES.txt      # Licenses of the bundled dependencies
├── data/wwdc/                        # Offline WWDC data (read by the bundle)
├── src/                              # TypeScript sources of the server
│   ├── index.ts                      # MCP server entry point with all tools
│   ├── tools/                        # MCP tool implementations (docs, design, WWDC, ...)
│   └── utils/                        # Cache, HTTP client, UserAgent pool, error handling
├── scripts/                          # build-bundle.mjs and publish.py
├── tests/                            # Jest test suites
└── package.json                      # Development dependencies and scripts (private)
```

### Performance Features

- **Memory-Based Caching**: Custom cache implementation with automatic cleanup and TTL support
- **Smart UserAgent Pool**: Intelligent rotation system with automatic failure recovery and performance monitoring
- **Dynamic Headers**: Realistic browser headers generation (Accept, Accept-Language, User-Agent)
- **Smart Search**: Official Apple search API with enhanced result formatting
- **Enhanced Analysis**: Optional related APIs, platform compatibility, and similarity analysis
- **Error Resilience**: Graceful degradation with comprehensive error handling
- **Type Safety**: Full TypeScript with Zod runtime validation
- **Zero Runtime Dependencies**: The server ships as one bundled file, with no node_modules to install

### Caching Strategy

| Content Type | Cache Duration | Cache Size | Reason |
|--------------|----------------|------------|--------|
| API Documentation | 30 minutes | 500 entries | Frequently accessed, moderate updates |
| Search Results | 10 minutes | 200 entries | Dynamic content, user-specific |
| Framework Indexes | 1 hour | 100 entries | Stable structure, less frequent changes |
| Technologies List | 2 hours | 50 entries | Rarely changes, large content |
| Documentation Updates | 30 minutes | 100 entries | Regular updates, WWDC announcements |
| Apple Design Content | 2 hours | 100 entries | HIG and Design pages are stable during a session |
| Apple Design Resources | 2 hours | 20 entries | Catalog metadata changes less often than page reads |

Downloaded Apple Design files are cached outside the plugin directory: in a temporary directory created per server process, or in the directory named by `APPLE_DOCS_MCP_CACHE_DIR` (see Configuration). They are exposed through MCP `resources/list` and `resources/read`.

## WWDC Data

All WWDC video data (2014-2026) is **bundled directly in the plugin**, providing:

- **Zero network latency**: No API calls needed for WWDC content
- **100% offline access**: Works without internet connection
- **No rate limits**: Unlimited WWDC searches and browsing
- **Instant responses**: All data is locally available

The plugin includes:

- **1,400+ WWDC session videos** with full transcripts
- **19 topic categories** for organized browsing
- **13 years of content** (2014-2026)
- **About 39 MB of optimized JSON data** per installed plugin version

> **Note**: Update the plugin to get the latest WWDC content additions.

## Configuration

The server reads these optional environment variables when it starts. Set them in the environment of the process that starts Claude Code, because a Claude Code launched from the GUI does not see variables exported in a shell profile (observed on Claude Code 2.1.285; not documented by Anthropic). To set them, either start Claude Code from a terminal where they are exported, or, on macOS, run `launchctl setenv NAME value` and then restart Claude Code (launchctl values do not survive a reboot).

| Variable | Description | Default |
|----------|-------------|---------|
| `APPLE_DOCS_MCP_CACHE_DIR` | Directory for downloaded Apple Design files | A temporary directory per server process |
| `APPLE_DOCS_MCP_CACHE_MAX_BYTES` | Size limit of the download cache, in bytes | 1073741824 (1 GiB) |
| `MCP_DEBUG` | Set to `true` to enable debug logging | Off |
| `DEFAULT_ACCEPT_LANGUAGE` | Accept-Language header sent to Apple servers | `en-US,en;q=0.9` |
| `DISABLE_LANGUAGE_ROTATION` | Set to `true` to stop rotating the Accept-Language header | Off |
| `DISABLE_SEC_FETCH` | Set to `true` to drop the Sec-Fetch-* headers | Off |
| `DISABLE_DNT` | Set to `true` to drop the DNT header | Off |
| `SIMPLE_HEADERS_MODE` | Set to `true` to send minimal request headers | Off |
| `APPLE_DOCS_MCP_JEV_RERANK` | Set to `1` to turn on Jev semantic selection by default (see below) | Off |
| `APPLE_DOCS_MCP_JEV_PROVIDER` | Jev provider: `typesafe`, `openrouter` or `gateway`; required when Jev is enabled | None |
| `TYPESAFE_API_KEY` | API key for the `typesafe` provider | None |
| `OPENROUTER_API_KEY` | API key for the `openrouter` provider | None |
| `JEV_GATEWAY_URL`, `JEV_GATEWAY_API_KEY` | URL and API key for the `gateway` provider | None |

The server includes a pool of 12+ pre-configured UserAgent strings (Chrome, Firefox, Safari and Edge on macOS, Windows and Linux) that it rotates with automatic failure recovery.

### Jev semantic selection (optional, paid)

`search_wwdc_content` and `search_apple_docs` can use the Jev relevance-scoring service to narrow their results to the 1-5 that best match the query, each printed with a relevance score. It is off by default. To enable it, set `APPLE_DOCS_MCP_JEV_RERANK=1`, choose a provider with `APPLE_DOCS_MCP_JEV_PROVIDER` and set that provider's key (`TYPESAFE_API_KEY`, `OPENROUTER_API_KEY`, or `JEV_GATEWAY_URL` plus `JEV_GATEWAY_API_KEY`).

- **Parameters:** both tools accept `select` (`true` or `false`; the default follows `APPLE_DOCS_MCP_JEV_RERANK`) and `maxResults` (1-5, default 5, ignored when selection is off). `select: true` while Jev is not enabled is an error. If no result scores above the relevance threshold, the single best result is returned with a "No strong match" warning.
- **`limit` in `search_wwdc_content`:** with selection on, `limit` is the recall width: that many videos, ranked by match count, are scored by Jev (maximum 256). When `limit` is omitted, every candidate up to 256 is scored. With selection off, `limit` keeps its meaning (default 20, maximum 100). When the scan matched more videos than were scored, the header reads "Selected N of M scored (of T matching)".
- **What is sent, and to whom:** with selection on, the query and, for each candidate, its title, summary (Apple documentation results only), URL, topics and, for WWDC, an excerpt of its first match (transcript or code) are sent to the provider you chose: `api.typesafe.ai` for `typesafe`, `openrouter.ai` for `openrouter`, or the URL in `JEV_GATEWAY_URL` for `gateway`, together with your API key. Nothing is sent when selection is off.
- **Cost:** it is a paid service, billed by the provider to your key. Measured order of magnitude: about $0.0001 for about 17 Apple documentation results, about $0.001 for about 90 WWDC candidates, up to about $0.003 at the 256-candidate maximum. A call adds up to about 15 seconds of latency.
- **Fail fast:** when selection is on, any failure (a missing key, an invalid provider, a network or provider error after retries) returns an error instead of unranked results. Pass `select: false` to get the unfiltered results.

The selection design is ported from [jgrep](https://github.com/kyu1204/jgrep) (MIT).

## Development

This section is for maintainers; plugin users never need it. Requirements: Node.js 22 or later and pnpm (the version is pinned by `packageManager` in `package.json`).

```bash
pnpm install --frozen-lockfile   # install the development dependencies
pnpm build                       # regenerate servers/apple-docs/index.js and THIRD_PARTY_LICENSES.txt
pnpm typecheck                   # tsc --noEmit
pnpm lint                        # eslint src
pnpm test                        # Jest test suites
pnpm start                       # run the built stdio server (node servers/apple-docs/index.js)
```

- **The bundle is committed.** `servers/apple-docs/index.js` is what Claude Code runs, with no dependency installation step on the user machine. After changing anything under `src/` or a bundled dependency, run `pnpm build` and commit the result: a freshness test (`tests/bundle-freshness.test.ts`) fails when the committed bundle differs from a fresh build.
- **No npm or bun lockfile.** Claude Code runs `npm ci` in the plugin root when `package.json` sits next to a `package-lock.json`, `npm-shrinkwrap.json`, `bun.lock` or `bun.lockb`, which would install every development dependency on every user machine. This repository uses pnpm, whose lockfile Claude Code ignores. A guard test (`tests/plugin-lockfile-guard.test.ts`) fails if one of those files appears.
- **Dependency updates.** A cheerio upgrade must re-verify the redirect to its `load-parse` entry in `scripts/build-bundle.mjs` (run `pnpm build` and the standalone bundle test).
- **Release.** Releases are cut with the CPV canonical pipeline: `uv run python scripts/publish.py` (lint, validation, tests, version bump in `plugin.json`, `package.json` and `pyproject.toml`, changelog, tag, push and GitHub release). Nothing is published to npm.

## Contributing

Contributions are welcome! Here is how to get started:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes using Conventional Commits (checked by commitlint in CI): `git commit -m "feat: add amazing feature"`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

## License

MIT License, see [LICENSE](LICENSE) for details. The original work is copyright kimsungwhee; additions are copyright Emasoft. The licenses of the dependencies bundled into the server are listed in [servers/apple-docs/THIRD_PARTY_LICENSES.txt](servers/apple-docs/THIRD_PARTY_LICENSES.txt).

## Disclaimer

This project is not affiliated with or endorsed by Apple Inc. It uses publicly available Apple Developer Documentation APIs for educational and development purposes.

---

[Report Issues](https://github.com/Emasoft/emasoft-apple-documentation-plugin/issues) • [Request Features](https://github.com/Emasoft/emasoft-apple-documentation-plugin/issues/new) • [Source](https://github.com/Emasoft/emasoft-apple-documentation-plugin)
