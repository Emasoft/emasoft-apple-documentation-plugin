/**
 * Search result parsing utilities.
 *
 * WHY this no longer uses cheerio/HTML (issues #51, #43): developer.apple.com/search/
 * used to render a `.search-result` list server-side; it is now a client-rendered
 * page that fetches JSON from Apple's internal search API (see ../tools/apple-search-api.ts
 * for the fetch + stream-reconstruction side). This file now parses ONE raw API
 * result item into the same SearchResult shape the rest of the tool already expects,
 * so formatting (search-parser.ts) didn't need to change at all.
 */

export interface SearchResult {
  title: string;
  url: string;
  type: string;
  description: string;
  framework?: string;
  beta?: boolean;
}

/**
 * Metadata shape of one item in the internal search API's "search" response
 * (`value.metadata`). Only the fields we use are typed; the real payload carries
 * more (e.g. platform-specific availability arrays) that we don't need here.
 */
export interface ApiResultMetadata {
  title?: string;
  permalink?: string;
  description?: string;
  hierarchy?: string;
  kind?: string; // 'symbol' | 'article' | 'sampleCode' | 'collectionGroup' | 'tutorial' | ...
}

export interface ApiResultItem {
  excerpt?: string;
  value?: { metadata?: ApiResultMetadata };
}

// Maps the API's `metadata.kind` to the type labels formatSearchResults/getDisplayType
// (search-parser.ts) already know how to group and display.
const KIND_TO_TYPE: Record<string, string> = {
  symbol: 'documentation',
  article: 'documentation-article',
  tutorial: 'documentation-tutorial',
  collectionGroup: 'guide',
  collection: 'guide',
  sampleCode: 'sample-code',
};

/**
 * Parse one raw API result item into a SearchResult, or null to drop it.
 *
 * Two kinds of items are dropped: WWDC video/session entries (they carry a
 * completely different shape with no `metadata.permalink` — search_apple_docs
 * intentionally excludes videos, pointing users at the dedicated WWDC tools
 * instead, see getVideoSuggestion in search-parser.ts), and — when filterType is
 * "documentation" — sample-code entries that leak through the API's own
 * pathPrefix scope (verified live: scoping to "/documentation/" still returns a
 * handful of kind:"sampleCode" items), so we filter them out here instead.
 */
export function parseSearchResult(item: ApiResultItem, filterType: string): SearchResult | null {
  const metadata = item.value?.metadata;
  if (!metadata?.permalink || !metadata.title) {
    return null;
  }

  const kind = metadata.kind ?? 'symbol';
  if (filterType === 'documentation' && kind === 'sampleCode') {
    return null;
  }

  const type = KIND_TO_TYPE[kind] ?? 'documentation';
  const framework = metadata.hierarchy?.split('>')[0]?.trim() || undefined;
  const description = metadata.description ?? item.excerpt ?? '';
  const beta = /\bBeta\b/.test(metadata.title) || /\bBeta\b/.test(description);

  return {
    title: metadata.title,
    url: metadata.permalink,
    type,
    description,
    framework,
    beta,
  };
}
