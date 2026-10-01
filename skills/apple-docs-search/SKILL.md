---
name: apple-docs-search
description: Search and read Apple documentation through the apple-docs MCP server. Use when the user asks about Apple APIs, frameworks (SwiftUI, UIKit, Foundation, and others), symbols, platform availability, sample code, Human Interface Guidelines or design resources, technology overviews, documentation updates, or WWDC sessions, transcripts and code; and when writing Swift or Objective-C against Apple SDKs and an API detail must be verified.
---

# Apple documentation search

Use the `apple-docs` MCP tools instead of answering Apple API questions from memory. In Claude Code the tools are named `mcp__plugin_emasoft-apple-documentation-plugin_apple-docs__<tool>`. Cite the documentation URL the tools return.

## Routing

| Need | Tool | Key parameters |
|---|---|---|
| Find an API, class, method, guide | `search_apple_docs` | `query`, `type` (`all`/`documentation`/`sample`) |
| Read one documentation page | `get_apple_doc_content` | `url`, `includeRelatedApis`, `includeReferences`, `includeSimilarApis`, `includePlatformAnalysis` |
| Browse frameworks by category | `list_technologies` | `category`, `language` (`swift`/`occ`), `includeBeta`, `limit` |
| Inheritance, conformances, See Also | `get_related_apis` | `apiUrl` |
| Resolve types referenced by a page | `resolve_references_batch` | `sourceUrl`, `maxReferences`, `filterByType` |
| Platform and OS availability | `get_platform_compatibility` | `apiUrl`, `compareMode` (`single`/`framework`) |
| Alternatives or replacements | `find_similar_apis` | `apiUrl`, `searchDepth` |
| What is new, release notes | `get_documentation_updates` | `category`, `technology`, `year`, `searchQuery` |
| Guides and technology overviews | `get_technology_overviews` | `category`, `platform`, `searchQuery` |
| Complete sample projects | `get_sample_code` | `framework`, `searchQuery`, `beta` |
| Human Interface Guidelines, design pages | `search_apple_design_docs` | `query`, `contentType` (`all`/`hig`/`resource`/`page`), `platform` |
| Read a HIG or design URL | `get_apple_design_content` | `url` |
| Design resources catalog | `list_apple_design_resources` | `category`, `platform`, `format`, `searchQuery` |
| Download a design resource | `download_apple_design_resource` | `resourceId` (from the list) or `url` |
| Design example images | `get_apple_design_examples` | `url`, `resourceId`, or `query` |
| Search WWDC transcripts and code | `search_wwdc_content` | `query`, `searchIn` (`transcript`/`code`/`both`), `year`, `language` |
| Browse WWDC sessions | `list_wwdc_videos` | `year`, `topic`, `hasCode` |
| Read one WWDC session | `get_wwdc_video` | `year`, `videoId` (both required) |
| WWDC code examples | `get_wwdc_code_examples` | `framework`, `topic`, `year`, `language` |
| WWDC topic IDs | `browse_wwdc_topics` | `topicId` |
| Sessions related to one session | `find_related_wwdc_videos` | `videoId`, `year` |
| Available WWDC years | `list_wwdc_years` | none |

## Workflows

### API lookup

1. `search_apple_docs` with a specific API or framework name (for example `UIViewController`, `SwiftUI`). Avoid generic phrases such as "how to".
2. Pick the best result and pass its URL (must start with `https://developer.apple.com/documentation/`) to `get_apple_doc_content`.
3. Add `includePlatformAnalysis: true` for availability, or call `get_platform_compatibility` with `apiUrl`.
4. For a deprecated API, `find_similar_apis` with the API URL finds modern replacements.

### Browse a framework

`list_technologies` (optionally filtered by `category`, which is case-sensitive) to find the framework, then `search_apple_docs` or `get_apple_doc_content` on its documentation URL.

### WWDC

1. `search_wwdc_content` for a topic or API mention, or `list_wwdc_videos` (with `year`/`topic`); use `browse_wwdc_topics` to get valid topic IDs.
2. `get_wwdc_video` with `year` and `videoId` for the full transcript and code; set `includeTranscript: false` or `includeCode: false` to shrink the output.
3. `find_related_wwdc_videos` for prerequisites and follow-ups.

### Design and HIG

`search_apple_design_docs` (use `contentType: "hig"` for guidelines), then `get_apple_design_content` on the chosen URL. For templates, fonts and bezels use `list_apple_design_resources`, then `download_apple_design_resource`.

## Notes

- `search_apple_docs` is slow: typically 5-25 seconds (median about 10). Identical queries are cached for 10 minutes, so do not repeat them.
- Optional Jev selection: `search_apple_docs` and `search_wwdc_content` accept `select` and `maxResults` (1-5) to return only the best-scoring results, each with a relevance score. It is off unless `APPLE_DOCS_MCP_JEV_RERANK=1` is set; `select: true` while it is not enabled is an error, and it typically adds under 2 seconds (at most about 15 when the provider is slow).
- WWDC tools download their data (about 11 MB) once, on the first WWDC call; later calls are local.
- `get_sample_code` returns complete projects; `search_apple_docs` with `type: "sample"` returns individual snippets.
