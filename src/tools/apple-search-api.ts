/**
 * Fetches search results from Apple's internal search JSON API.
 *
 * WHY (issues #51, #43): developer.apple.com/search/?q=... used to return an
 * HTML page whose body contained `.search-result` nodes; search-parser.ts scraped
 * those with cheerio. That page is now rendered entirely client-side: the raw
 * HTML never contains results, it only loads /search/scripts/search.js, which
 * POSTs the query to the internal endpoint below and streams the response back
 * in (see QUERY_PATH + window.SEARCH_CONFIG.api in that script, captured while
 * fixing this bug). The endpoint takes no auth/cookies — verified with a bare
 * curl POST — so we can call it directly instead of re-scraping non-existent
 * HTML or re-implementing the site's own JS rendering.
 */
import { REQUEST_CONFIG, API_LIMITS } from '../utils/constants.js';
import { handleFetchError } from '../utils/error-handler.js';
import { logger } from '../utils/logger.js';
import type { ApiResultItem, SearchResult } from './search-result-parser.js';
import { parseSearchResult } from './search-result-parser.js';

// Not in utils/constants.ts (APPLE_URLS): this is Apple's internal search
// backend, not a developer.apple.com page URL, and is only ever used here.
// UNDOCUMENTED: this is the endpoint the public search page's own client-side
// JS calls (window.SEARCH_CONFIG.api, see the module comment above) — Apple
// publishes no contract for it, so its response shape can change without
// notice. That's why this module fails loudly instead of degrading quietly:
// see the "none parseable" guard in fetchAppleDocsSearch below, which turns a
// silent 0-results into a thrown error the moment the shape drifts.
const SEARCH_API_URL = 'https://devintserv.msc.sbz.apple.com/api/v1/query';

interface SearchScope {
  kind: string;
  value?: string;
}

// Mirrors getSearchScope() in /search/scripts/search.js. Only "sample" needs a
// server-side scope: scoping "documentation" to the /documentation/ path prefix
// still lets a few sample-code results through (verified live), so "documentation"
// and "all" both request the unscoped set and let parseSearchResult filter it.
function buildSearchScope(filterType: string): SearchScope | undefined {
  if (filterType === 'sample') {
    return { kind: 'documentationRole', value: 'sampleCode' };
  }
  return undefined;
}

interface SearchDiffLine {
  kind: string;
  diff?: { append?: string; removeLast?: number };
}

/**
 * The endpoint streams the growing result JSON as JSONL lines of
 * {kind:"search", diff:{removeLast, append}} — "remove the last N characters of
 * the buffer built so far, then append this text" — rather than one JSON object,
 * so the full body has to be replayed the same way the browser does before it's
 * valid JSON.
 */
function reconstructResults(jsonl: string): ApiResultItem[] {
  let buffer = '';
  for (const rawLine of jsonl.split('\n')) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }
    let parsedLine: SearchDiffLine;
    try {
      parsedLine = JSON.parse(line);
    } catch {
      continue; // a truncated trailing line from an interrupted stream — ignore it
    }
    if (parsedLine.kind !== 'search' || !parsedLine.diff) {
      continue;
    }
    const { append = '', removeLast = 0 } = parsedLine.diff;
    if (removeLast > 0) {
      buffer = buffer.slice(0, -removeLast);
    }
    buffer += append;
  }
  if (!buffer) {
    return [];
  }
  const parsedBuffer = JSON.parse(buffer) as { results?: ApiResultItem[] };
  return parsedBuffer.results ?? [];
}

/**
 * Reads the streamed response body, stopping as soon as the real terminal
 * marker ({"kind":"searchFinished"}, always the last line — measured live,
 * see reports/pr-review/*-measure-search-stream.md) appears on a complete
 * line, instead of always waiting for the connection to close. Today those
 * coincide (response.text() already only resolves at body end), but this
 * guards against a server that starts keeping the connection open past
 * searchFinished (e.g. for a future push) hanging the request instead of
 * returning once the real payload is complete.
 *
 * Falls back to response.text() when there's no readable-stream body (e.g.
 * the plain-object Response mocks the tests use) — same net result, just no
 * early-stop.
 */
async function readJsonlBody(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) {
    return response.text();
  }
  const decoder = new TextDecoder();
  let full = '';
  let lineBuffer = '';
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      const chunk = decoder.decode(value, { stream: true });
      full += chunk;
      lineBuffer += chunk;
      let newlineIndex: number;
      while ((newlineIndex = lineBuffer.indexOf('\n')) !== -1) {
        const line = lineBuffer.slice(0, newlineIndex).trim();
        lineBuffer = lineBuffer.slice(newlineIndex + 1);
        if (!line) {
          continue;
        }
        try {
          if ((JSON.parse(line) as SearchDiffLine).kind === 'searchFinished') {
            await reader.cancel();
            return full;
          }
        } catch {
          // incomplete line straddling a chunk boundary — keep reading
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
  return full;
}

/**
 * Fetch and parse Apple Developer search results for a query.
 * Throws the same AppError shape httpClient throws on failure (handleFetchError),
 * so callers keep the fail-fast error handling they already have — a failed
 * search must surface an error, never silently look like "0 results".
 */
export async function fetchAppleDocsSearch(
  query: string,
  filterType: string,
  searchUrl: string,
): Promise<SearchResult[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_CONFIG.TIMEOUT);

  try {
    const requestBody: Record<string, unknown> = {
      text: query,
      targetResultLocale: 'en-US',
      includedResponses: ['search'],
    };
    const searchScope = buildSearchScope(filterType);
    if (searchScope) {
      requestBody.searchScope = searchScope;
    }

    const response = await fetch(SEARCH_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/jsonl',
        Origin: 'https://developer.apple.com',
        Referer: searchUrl,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Apple search API returned ${response.status}`);
    }

    const jsonl = await readJsonlBody(response);
    const rawResults = reconstructResults(jsonl);

    const results: SearchResult[] = [];
    for (const item of rawResults) {
      const result = parseSearchResult(item, filterType);
      if (result) {
        results.push(result);
      }
      if (results.length >= API_LIMITS.MAX_SEARCH_RESULTS) {
        break;
      }
    }

    // The API is undocumented (see the SEARCH_API_URL comment above): if Apple
    // ever renames/reshapes metadata.permalink or metadata.title, every item
    // parseSearchResult sees becomes unparseable and silently drops out,
    // making a real API change look identical to "no results for this query".
    // A genuinely empty result set (rawResults.length === 0) is a normal
    // no-match and still returns []; raw items that all failed to parse is a
    // format break and must fail loudly instead.
    if (rawResults.length > 0 && results.length === 0) {
      throw new Error(
        `Apple search response format changed: ${rawResults.length} items, none parseable`,
      );
    }

    return results;
  } catch (error) {
    logger.error('Apple search API request failed:', error);
    throw handleFetchError(error, searchUrl);
  } finally {
    clearTimeout(timeoutId);
  }
}
